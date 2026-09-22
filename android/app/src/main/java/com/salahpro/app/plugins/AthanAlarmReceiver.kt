package com.salahpro.app.plugins

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.net.Uri
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

        const val PREALERT_CHANNEL_ID = "athan_prealert_channel_v2"
        const val POSTALERT_CHANNEL_ID = "athan_postalert_channel_v2"
        const val KHUSHU_CHANNEL_ID = "athan_khushu_channel"
        const val CUSTOM_ALARM_CHANNEL_ID = "athan_custom_alarm_channel_v2"
        const val CUSTOM_ALARM_SILENT_CHANNEL_ID = "athan_custom_silent_channel_v2"

        fun getSoundResId(context: Context, soundType: String): Int {
            val clean = soundType.lowercase().trim()
            val rawResName = when {
                clean == "takbeer" -> "takbeer"
                clean.contains("khayr") || clean == "alsalatu-khayr" || clean == "alsalatu_khayr" -> "alsalatu_khayr"
                clean == "hayya" -> "hayya"
                clean == "salawat" -> "salawat"
                clean == "istighfar" -> "istighfar"
                clean == "duaa" -> "duaa"
                clean == "beep" -> "beep"
                clean == "athan" || clean == "adhan" -> "athan_default"
                clean == "fajr" -> "athan_fajr"
                else -> "reminder"
            }
            val resId = context.resources.getIdentifier(rawResName, "raw", context.packageName)
            return if (resId != 0) resId else com.salahpro.app.R.raw.reminder
        }

        fun playAlarmAudio(context: Context, soundType: String) {
            val clean = soundType.lowercase().trim()
            if (clean == "silent") return
            try {
                val resId = getSoundResId(context, soundType)
                val mp = MediaPlayer.create(context, resId)
                mp?.apply {
                    setAudioAttributes(
                        AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .build()
                    )
                    isLooping = false
                    setOnCompletionListener {
                        try { it.release() } catch (_: Exception) {}
                    }
                    start()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to play custom alarm audio: $soundType", e)
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received alarm trigger: ${intent.action}")

        val prayerName = intent.getStringExtra(EXTRA_PRAYER_NAME) ?: "الصلاة"
        val isFajr = intent.getBooleanExtra(EXTRA_IS_FAJR, false)
        val prayerKey = intent.getStringExtra(EXTRA_PRAYER_KEY) ?: ""
        val alarmType = intent.getStringExtra(EXTRA_ALARM_TYPE) ?: if (prayerKey.startsWith("custom_")) "custom" else if (prayerKey.contains("prealert")) "prealert" else if (prayerKey.contains("postalert") || prayerKey.contains("worship")) "postalert" else if (prayerKey.contains("khushu")) "khushu" else "athan"

        if (alarmType == "custom" || prayerKey.startsWith("custom_")) {
            val soundType = intent.getStringExtra("soundType") ?: "takbeer"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            val autoKhushu = intent.getBooleanExtra("autoKhushu", false)
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"

            showCustomAlarmNotification(context, prayerName, prayerKey, soundType, notifyMode)

            if (autoKhushu) {
                KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes)
                showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
            }
            return
        }

        if (alarmType == "prealert" || prayerKey.contains("prealert")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            showPreAlertNotification(context, prayerName, prayerKey, soundType, notifyMode)
            return
        }

        if (alarmType == "postalert" || prayerKey.contains("postalert") || prayerKey.contains("worship")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            showPostAlertNotification(context, prayerName, prayerKey, soundType, notifyMode)
            return
        }

        if (alarmType == "khushu" || prayerKey.contains("khushu")) {
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"
            KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes)
            showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
            return
        }

        val prefs = context.getSharedPreferences("athan_alarm_prefs", Context.MODE_PRIVATE)
        val ongoingBarEnabled = prefs.getBoolean("ongoing_prayer_bar_enabled", false)
        if (ongoingBarEnabled) {
            updateOngoingPrayerNotificationAtPrayerTime(context, prayerName)
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

    private fun showPreAlertNotification(
        context: Context,
        prayerName: String,
        prayerKey: String,
        soundType: String = "reminder",
        notifyMode: String = "both"
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        val isSilent = soundType == "silent" || notifyMode == "notification"
        val soundResId = getSoundResId(context, soundType)
        val soundUri = if (!isSilent) Uri.parse("android.resource://${context.packageName}/$soundResId") else null
        val cleanSound = soundType.lowercase().trim().replace("-", "_")
        val channelId = if (isSilent) "${PREALERT_CHANNEL_ID}_silent" else "${PREALERT_CHANNEL_ID}_$cleanSound"

        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                if (isSilent) "تنبيهات ما قبل الأذان (صامت)" else "تنبيهات ما قبل الأذان ($cleanSound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "إشعارات الاستعداد للصلاة والوضوء قبل حلول وقت الأذان"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
                if (soundUri != null) {
                    setSound(soundUri, audioAttributes)
                } else {
                    setSound(null, null)
                }
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

        val notifBuilder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)

        if (soundUri != null) {
            notifBuilder.setSound(soundUri)
            notifBuilder.setVibrate(longArrayOf(0, 300, 200, 300))
        }

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 5000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Pre-alert notification displayed for $prayerName (id=$notifId)")

        if (!isSilent && notifyMode != "notification") {
            playAlarmAudio(context, soundType)
        }
    }

    private fun showPostAlertNotification(
        context: Context,
        prayerName: String,
        prayerKey: String,
        soundType: String = "reminder",
        notifyMode: String = "both"
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        val isSilent = soundType == "silent" || notifyMode == "notification"
        val soundResId = getSoundResId(context, soundType)
        val soundUri = if (!isSilent) Uri.parse("android.resource://${context.packageName}/$soundResId") else null
        val cleanSound = soundType.lowercase().trim().replace("-", "_")
        val channelId = if (isSilent) "${POSTALERT_CHANNEL_ID}_silent" else "${POSTALERT_CHANNEL_ID}_$cleanSound"

        val audioAttributes = AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build()

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                if (isSilent) "تنبيهات ما بعد الصلاة (صامت)" else "تنبيهات ما بعد الصلاة ($cleanSound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "إشعارات التذكير بأذكار ما بعد الصلاة والنوافل والسنن الرواتب"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 300, 200, 300)
                if (soundUri != null) {
                    setSound(soundUri, audioAttributes)
                } else {
                    setSound(null, null)
                }
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

        val title = "أذكار وسنن صلاة $prayerName 📿"
        val body = "تقبل الله طاعتكم! لا تنسَ أذكار ما بعد صلاة $prayerName والسنن الرواتب."

        val notifBuilder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)

        if (soundUri != null) {
            notifBuilder.setSound(soundUri)
            notifBuilder.setVibrate(longArrayOf(0, 300, 200, 300))
        }

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 6000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Post-alert notification displayed for $prayerName (id=$notifId)")

        if (!isSilent && notifyMode != "notification") {
            playAlarmAudio(context, soundType)
        }
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

        val restoreIntent = Intent(context, KhushuRestoreReceiver::class.java).apply {
            action = KhushuRestoreReceiver.ACTION_RESTORE_KHUSHU
        }
        val restorePendingIntent = PendingIntent.getBroadcast(
            context,
            KhushuRestoreReceiver.KHUSHU_RESTORE_REQUEST_CODE,
            restoreIntent,
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
        )

        val notifBuilder = NotificationCompat.Builder(context, KHUSHU_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_STATUS)
            .setAutoCancel(true)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "إلغاء الكتم واستعادة الصوت", restorePendingIntent)

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = KhushuRestoreReceiver.KHUSHU_NOTIFICATION_ID
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Khushu notification displayed for $prayerName (id=$notifId)")
    }

    private fun showCustomAlarmNotification(
        context: Context,
        alarmTitle: String,
        alarmKey: String,
        soundType: String,
        notifyMode: String
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        val isSilent = soundType == "silent" || notifyMode == "notification"
        val soundResId = getSoundResId(context, soundType)
        val soundUri = if (!isSilent) Uri.parse("android.resource://${context.packageName}/$soundResId") else null
        val cleanSound = soundType.lowercase().trim().replace("-", "_")
        val channelId = if (isSilent) CUSTOM_ALARM_SILENT_CHANNEL_ID else "${CUSTOM_ALARM_CHANNEL_ID}_$cleanSound"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val channel = NotificationChannel(
                channelId,
                if (isSilent) "تنبيهات المنبهات المخصصة (صامت)" else "تنبيهات المنبهات المخصصة ($cleanSound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "إشعارات ومنبهات العبادات المخصصة مثل قيام الليل والسنن"
                enableVibration(true)
                vibrationPattern = longArrayOf(0, 500, 300, 500)
                if (soundUri != null) {
                    setSound(soundUri, audioAttributes)
                } else {
                    setSound(null, null)
                }
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

        val notifBuilder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("⏰ $alarmTitle")
            .setContentText("تذكير منبه العبادة: $alarmTitle")
            .setStyle(NotificationCompat.BigTextStyle().bigText("حان الآن موعد: $alarmTitle"))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)

        if (soundUri != null) {
            notifBuilder.setSound(soundUri)
            notifBuilder.setVibrate(longArrayOf(0, 500, 300, 500))
        }

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (alarmKey.hashCode() and 0x7FFFFFFF) % 10000 + 7000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Custom alarm notification displayed for $alarmTitle (id=$notifId)")

        if (!isSilent && notifyMode != "notification") {
            playAlarmAudio(context, soundType)
        }
    }

    private fun updateOngoingPrayerNotificationAtPrayerTime(context: Context, prayerName: String) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return
        val channelId = "athan_ongoing_prayer_bar"
        val notificationId = 888801

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, 0, launchIntent, flags)
        } else null

        val notifBuilder = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle("🕌 حان الآن موعد أذان صلاة $prayerName")
            .setContentText("حي على الصلاة • حي على الفلاح")
            .setStyle(NotificationCompat.BigTextStyle().bigText("حان الآن موعد أذان $prayerName • تقبل الله طاعتكم"))
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setUsesChronometer(false)

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        notificationManager.notify(notificationId, notifBuilder.build())
        Log.d(TAG, "Updated ongoing prayer notification at prayer time for $prayerName")
    }
}
