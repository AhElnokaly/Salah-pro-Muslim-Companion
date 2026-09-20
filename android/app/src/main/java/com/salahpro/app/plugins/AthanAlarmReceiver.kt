package com.salahpro.app.plugins

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

class AthanAlarmReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "AthanAlarmReceiver"
        const val ACTION_ATHAN_ALARM = "com.salahpro.app.ACTION_ATHAN_ALARM"
        const val EXTRA_PRAYER_NAME = "extra_prayer_name"
        const val EXTRA_IS_FAJR = "extra_is_fajr"
        const val EXTRA_PRAYER_KEY = "extra_prayer_key"
        const val EXTRA_PRAYER_TIME = "extra_prayer_time"
        const val EXTRA_ALARM_TYPE = "extra_alarm_type"
        const val EXTRA_DURATION_MINUTES = "extra_duration_minutes"
        const val EXTRA_KHUSHU_MODE = "extra_khushu_mode"

        const val PREALERT_CHANNEL_ID = "athan_prealert_channel"
        const val KHUSHU_CHANNEL_ID = "athan_khushu_channel"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received alarm trigger: ${intent.action}")

        val prayerName = intent.getStringExtra(EXTRA_PRAYER_NAME) ?: "الصلاة"
        val isFajr = intent.getBooleanExtra(EXTRA_IS_FAJR, false)
        val prayerKey = intent.getStringExtra(EXTRA_PRAYER_KEY) ?: ""
        val alarmType = intent.getStringExtra(EXTRA_ALARM_TYPE) ?: if (prayerKey.contains("prealert")) "prealert" else if (prayerKey.contains("khushu")) "khushu" else "athan"

        if (alarmType == "prealert" || prayerKey.contains("prealert")) {
            showPreAlertNotification(context, prayerName, prayerKey)
            return
        }

        if (alarmType == "khushu" || prayerKey.contains("khushu")) {
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"
            KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes)
            showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
            return
        }

        val serviceIntent = Intent(context, AthanForegroundService::class.java).apply {
            putExtra(EXTRA_PRAYER_NAME, prayerName)
            putExtra(EXTRA_IS_FAJR, isFajr)
            putExtra(EXTRA_PRAYER_KEY, prayerKey)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start AthanForegroundService", e)
        }
    }

    private fun showPreAlertNotification(context: Context, prayerName: String, prayerKey: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                PREALERT_CHANNEL_ID,
                "تنبيهات ما قبل الأذان",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "إشعارات الاستعداد للصلاة والوضوء قبل حلول وقت الأذان"
                enableVibration(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, (System.currentTimeMillis() % 10000).toInt(), launchIntent, flags)
        } else null

        val title = "اقتربت صلاة $prayerName ⏳"
        val body = "حان وقت الاستعداد لصلاة $prayerName والوضوء، اقترب موعد الأذان."

        val notifBuilder = NotificationCompat.Builder(context, PREALERT_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setDefaults(NotificationCompat.DEFAULT_ALL)

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 5000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Pre-alert notification displayed for $prayerName (id=$notifId)")
    }

    private fun showKhushuActivatedNotification(context: Context, prayerName: String, durationMinutes: Int, prayerKey: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                KHUSHU_CHANNEL_ID,
                "وضع الخشوع التلقائي",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "إشعارات تفعيل وإلغاء كتم الأصوات أثناء إقامة الصلاة"
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, (System.currentTimeMillis() % 10000).toInt(), launchIntent, flags)
        } else null

        val title = "تم تفعيل وضع الخشوع — صلاة $prayerName 🕌"
        val body = "تم كتم أصوات وإشعارات الجهاز لمدة $durationMinutes دقيقة لأداء الصلاة بسكينة."

        val notifBuilder = NotificationCompat.Builder(context, KHUSHU_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setAutoCancel(true)

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 8000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Khushu notification displayed for $prayerName (id=$notifId)")
    }
}
