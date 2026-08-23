package com.salahpro.app.plugins

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.os.PowerManager
import android.util.Log
import androidx.core.app.NotificationCompat
import com.salahpro.app.MainActivity

class AthanForegroundService : Service() {

    companion object {
        const val TAG = "AthanForegroundService"
        const val CHANNEL_ID = "athan_alarm_channel_v2"
        const val CHANNEL_NAME = "أذان الصلاة - Salah Athan"
        const val NOTIFICATION_ID = 78601
        const val ACTION_STOP_ATHAN = "com.salahpro.app.ACTION_STOP_ATHAN"
        const val TIMEOUT_MS = 180000L // 3 minutes timeout
    }

    private var mediaPlayer: MediaPlayer? = null
    private var wakeLock: PowerManager.WakeLock? = null
    private val handler = Handler(Looper.getMainLooper())
    private val stopRunnable = Runnable {
        Log.d(TAG, "Athan timeout reached, stopping service")
        stopAthanAndSelf()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == ACTION_STOP_ATHAN) {
            Log.d(TAG, "User requested to stop athan")
            stopAthanAndSelf()
            return START_NOT_STICKY
        }

        val prayerName = intent?.getStringExtra(AthanAlarmReceiver.EXTRA_PRAYER_NAME) ?: "الصلاة"
        val isFajr = intent?.getBooleanExtra(AthanAlarmReceiver.EXTRA_IS_FAJR, false) ?: false

        Log.d(TAG, "Starting AthanForegroundService for $prayerName (isFajr: $isFajr)")

        acquireWakeLock()
        createNotificationChannel()

        val notification = buildNotification(prayerName)
        startForeground(NOTIFICATION_ID, notification)

        playLocalAthanAudio(isFajr)

        // Set safety timeout of 3 minutes
        handler.removeCallbacks(stopRunnable)
        handler.postDelayed(stopRunnable, TIMEOUT_MS)

        return START_NOT_STICKY
    }

    private fun playLocalAthanAudio(isFajr: Boolean) {
        try {
            mediaPlayer?.release()

            val packageName = packageName
            val rawResName = if (isFajr) "athan_fajr" else "athan_default"
            var resId = resources.getIdentifier(rawResName, "raw", packageName)
            
            if (resId == 0) {
                // Fallback to athan_default if fajr resId isn't found
                resId = resources.getIdentifier("athan_default", "raw", packageName)
            }

            if (resId == 0) {
                Log.e(TAG, "Raw audio resource not found in R.raw!")
                return
            }

            mediaPlayer = MediaPlayer.create(this, resId)?.apply {
                setAudioAttributes(
                    AudioAttributes.Builder()
                        .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .build()
                )
                isLooping = false
                setOnCompletionListener {
                    Log.d(TAG, "Athan audio finished playing")
                    stopAthanAndSelf()
                }
                setOnErrorListener { _, what, extra ->
                    Log.e(TAG, "MediaPlayer error: what=$what, extra=$extra")
                    stopAthanAndSelf()
                    true
                }
                start()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error playing athan audio in ForegroundService", e)
        }
    }

    private fun buildNotification(prayerName: String): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP
        }

        val pendingFlags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }

        val openAppPendingIntent = PendingIntent.getActivity(this, 0, openAppIntent, pendingFlags)

        val stopIntent = Intent(this, AthanForegroundService::class.java).apply {
            action = ACTION_STOP_ATHAN
        }
        val stopPendingIntent = PendingIntent.getService(this, 1, stopIntent, pendingFlags)

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("حان الآن وقت صلاة $prayerName")
            .setContentText("الله أكبر - الله أكبر")
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setContentIntent(openAppPendingIntent)
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "إيقاف الأذان",
                stopPendingIntent
            )
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "تنبيهات أذان الصلاة في الوقت المحدد"
                setBypassDnd(true)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
                enableVibration(true)
            }

            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            manager?.createNotificationChannel(channel)
        }
    }

    private fun acquireWakeLock() {
        try {
            val pm = getSystemService(Context.POWER_SERVICE) as? PowerManager
            wakeLock = pm?.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "SalahPro:AthanWakeLock"
            )?.apply {
                acquire(TIMEOUT_MS)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error acquiring WakeLock", e)
        }
    }

    private fun stopAthanAndSelf() {
        handler.removeCallbacks(stopRunnable)
        try {
            if (mediaPlayer?.isPlaying == true) {
                mediaPlayer?.stop()
            }
            mediaPlayer?.release()
            mediaPlayer = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping MediaPlayer", e)
        }

        try {
            if (wakeLock?.isHeld == true) {
                wakeLock?.release()
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error releasing WakeLock", e)
        }

        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onDestroy() {
        stopAthanAndSelf()
        super.onDestroy()
    }
}
