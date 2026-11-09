package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioAttributes
import android.media.AudioManager
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import org.json.JSONArray
import org.json.JSONObject

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

        const val PREALERT_CHANNEL_ID = "athan_prealert_channel_v3"
        const val POSTALERT_CHANNEL_ID = "athan_postalert_channel_v3"
        const val KHUSHU_CHANNEL_ID = "athan_khushu_channel"
        const val CUSTOM_ALARM_CHANNEL_ID = "athan_custom_alarm_channel_v3"
        const val CUSTOM_ALARM_SILENT_CHANNEL_ID = "athan_custom_silent_channel_v3"

        fun logFireEvent(
            context: Context,
            prayerName: String,
            prayerKey: String,
            alarmType: String,
            decision: String,
            reason: String
        ) {
            try {
                val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
                val rawJson = prefs.getString("athan_fire_events", "[]") ?: "[]"
                val existingArray = JSONArray(rawJson)
                val newEvent = JSONObject().apply {
                    put("timestampMs", System.currentTimeMillis())
                    put("prayerName", prayerName)
                    put("prayerKey", prayerKey)
                    put("alarmType", alarmType)
                    put("decision", decision)
                    put("reason", reason)
                }
                val updatedArray = JSONArray()
                updatedArray.put(newEvent)
                val maxEvents = 25
                for (i in 0 until Math.min(existingArray.length(), maxEvents - 1)) {
                    updatedArray.put(existingArray.getJSONObject(i))
                }
                prefs.edit().putString("athan_fire_events", updatedArray.toString()).apply()
            } catch (e: Exception) {
                Log.e(TAG, "Failed to log athan fire event", e)
            }
        }

        fun getRawName(soundType: String): String {
            val clean = soundType.lowercase().trim().replace("-", "_")
            return when {
                clean == "ayat_kursi" || clean == "ayatkursi" || clean.contains("kursi") -> "ayat_kursi"
                clean == "takbeer" -> "takbeer"
                clean.contains("khayr") || clean == "alsalatu_khayr" -> "alsalatu_khayr"
                clean == "hayya" -> "hayya"
                clean == "salawat" -> "salawat"
                clean == "istighfar" -> "istighfar"
                clean == "duaa" -> "duaa"
                clean == "beep" -> "beep"
                clean == "athan" || clean == "adhan" -> "athan_default"
                clean == "fajr" -> "athan_fajr"
                else -> "reminder"
            }
        }

        fun getSoundResId(context: Context, soundType: String): Int {
            val rawName = getRawName(soundType)
            val resId = context.resources.getIdentifier(rawName, "raw", context.packageName)
            return if (resId != 0) resId else com.salahpro.app.R.raw.reminder
        }

        fun getSoundDurationMs(context: Context, soundType: String): Long? {
            val clean = soundType.lowercase().trim()
            if (clean == "silent" || clean == "vibrate") return 0L
            return try {
                val rawName = getRawName(soundType)
                val resId = context.resources.getIdentifier(rawName, "raw", context.packageName)
                if (resId == 0) return null
                val afd = context.resources.openRawResourceFd(resId) ?: return null
                val retriever = MediaMetadataRetriever()
                try {
                    retriever.setDataSource(afd.fileDescriptor, afd.startOffset, afd.length)
                    val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                    durationStr?.toLongOrNull()
                } finally {
                    try { retriever.release() } catch (_: Exception) {}
                    try { afd.close() } catch (_: Exception) {}
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to measure raw audio duration for $soundType", e)
                null
            }
        }

        fun showKhushuActivatedNotification(context: Context, prayerName: String, durationMinutes: Int, prayerKey: String) {
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

        fun showCustomAlarmNotification(
            context: Context,
            alarmTitle: String,
            alarmKey: String,
            soundType: String,
            notifyMode: String,
            isKhushuActive: Boolean = false
        ): Boolean {
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return false

            val policy = AlertDuringKhushuPolicy.evaluate(
                AlertDuringKhushuPolicy.AlertPolicyInput(
                    alarmType = "custom",
                    soundType = soundType,
                    notifyMode = notifyMode,
                    isKhushuActive = isKhushuActive
                )
            )

            val isSilent = policy.effectiveIsSilent
            val rawName = getRawName(soundType)
            val soundUri = if (policy.soundUriRequired) Uri.parse("android.resource://${context.packageName}/raw/$rawName") else null
            val cleanSound = soundType.lowercase().trim().replace("-", "_")
            val channelId = policy.channelId

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                try {
                    notificationManager.deleteNotificationChannel("athan_custom_alarm_channel_v2")
                    notificationManager.deleteNotificationChannel("athan_custom_alarm_channel_v2_$cleanSound")
                    notificationManager.deleteNotificationChannel("athan_custom_silent_channel_v2")
                } catch (_: Exception) {}
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
            }
            notifBuilder.setVibrate(longArrayOf(0, 500, 300, 500))

            if (pIntent != null) {
                notifBuilder.setContentIntent(pIntent)
            }

            val notifId = (alarmKey.hashCode() and 0x7FFFFFFF) % 10000 + 7000
            return try {
                notificationManager.notify(notifId, notifBuilder.build())
                Log.d(TAG, "Custom alarm notification displayed for $alarmTitle (id=$notifId)")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to display custom alarm notification for $alarmTitle", e)
                false
            }
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received alarm trigger: ${intent.action}")

        val prayerName = intent.getStringExtra(EXTRA_PRAYER_NAME) ?: "الصلاة"
        val isFajr = intent.getBooleanExtra(EXTRA_IS_FAJR, false)
        val prayerKey = intent.getStringExtra(EXTRA_PRAYER_KEY) ?: ""
        val alarmType = intent.getStringExtra(EXTRA_ALARM_TYPE) ?: if (prayerKey.startsWith("custom_")) "custom" else if (prayerKey.contains("prealert")) "prealert" else if (prayerKey.contains("postalert") || prayerKey.contains("worship")) "postalert" else if (prayerKey.contains("khushu")) "khushu" else "athan"
        val requestCode = intent.getIntExtra("requestCode", -1)
        val soundType = intent.getStringExtra("soundType") ?: "reminder"
        val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
        val autoKhushu = intent.getBooleanExtra("autoKhushu", false)

        val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
        var currentRingerMode = -1

        var volAlarm = -1
        var maxAlarm = -1
        var volNotif = -1
        var maxNotif = -1
        var volRing = -1
        var maxRing = -1

        var interruptionFilter = -1
        var expectedNotifId = -1
        var hasDuplicateActive = false
        var activeTotal = -1

        var targetChannelId = "unknown"
        var chanImportance = -1
        var chanSoundUri = "unknown"
        var canBypassDnd = false
        var chanExists = false

        try {
            currentRingerMode = audioManager?.ringerMode ?: -1
            volAlarm = audioManager?.getStreamVolume(AudioManager.STREAM_ALARM) ?: -1
            maxAlarm = audioManager?.getStreamMaxVolume(AudioManager.STREAM_ALARM) ?: -1
            volNotif = audioManager?.getStreamVolume(AudioManager.STREAM_NOTIFICATION) ?: -1
            maxNotif = audioManager?.getStreamMaxVolume(AudioManager.STREAM_NOTIFICATION) ?: -1
            volRing = audioManager?.getStreamVolume(AudioManager.STREAM_RING) ?: -1
            maxRing = audioManager?.getStreamMaxVolume(AudioManager.STREAM_RING) ?: -1

            expectedNotifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 7000

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && notificationManager != null) {
                interruptionFilter = notificationManager.currentInterruptionFilter
                try {
                    val activeNotifs = notificationManager.activeNotifications ?: emptyArray()
                    hasDuplicateActive = activeNotifs.any { it.id == expectedNotifId }
                    activeTotal = activeNotifs.size
                } catch (ne: Throwable) {
                    Log.w(TAG, "Failed reading activeNotifications", ne)
                }
            }

            val isKhushuActiveEarly = KhushuRestoreReceiver.isKhushuActive(context)
            val earlyPolicy = AlertDuringKhushuPolicy.evaluate(
                AlertDuringKhushuPolicy.AlertPolicyInput(
                    alarmType = if (prayerKey.startsWith("custom_")) "custom" else alarmType,
                    soundType = soundType,
                    notifyMode = notifyMode,
                    isKhushuActive = isKhushuActiveEarly,
                    autoKhushu = autoKhushu,
                    ringerMode = currentRingerMode
                )
            )
            targetChannelId = earlyPolicy.channelId

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && notificationManager != null) {
                val ch = notificationManager.getNotificationChannel(targetChannelId)
                if (ch != null) {
                    chanExists = true
                    chanImportance = ch.importance
                    chanSoundUri = ch.sound?.toString() ?: "silent"
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                        canBypassDnd = ch.canBypassDnd()
                    }
                } else {
                    chanExists = false
                    chanSoundUri = "not_created"
                }
            }
        } catch (te: Throwable) {
            Log.w(TAG, "Failed gathering telemetry snapshot", te)
        }

        try {
            AthanAlarmPlugin.logNativeEvent(
                context,
                "fire_received",
                "prayerKey=$prayerKey, alarmType=$alarmType, requestCode=$requestCode, soundType=$soundType, notifyMode=$notifyMode, autoKhushu=$autoKhushu, " +
                    "volAlarm=$volAlarm/$maxAlarm, volNotif=$volNotif/$maxNotif, volRing=$volRing/$maxRing, ringerMode=$currentRingerMode, " +
                    "filter=$interruptionFilter, notifId=$expectedNotifId, dupActive=$hasDuplicateActive, activeTotal=$activeTotal, " +
                    "chanId=$targetChannelId, chanExists=$chanExists, chanImp=$chanImportance, chanSound=$chanSoundUri, bypassDnd=$canBypassDnd"
            )
        } catch (e: Exception) {
            Log.w(TAG, "Failed logging fire_received", e)
        }

        if (alarmType == "custom" || prayerKey.startsWith("custom_")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            val autoKhushu = intent.getBooleanExtra("autoKhushu", false)
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"

            val isKhushuActive = KhushuRestoreReceiver.isKhushuActive(context)
            val hasPendingDeferredA = KhushuRestoreReceiver.hasPendingDeferredKhushu(context)
            val durationMs = getSoundDurationMs(context, soundType)

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
            val canScheduleExact = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                alarmManager?.canScheduleExactAlarms() ?: false
            } else true

            val decisionInput = CustomAlarmKhushuDecision.DecisionInput(
                autoKhushu = autoKhushu,
                soundType = soundType,
                notifyMode = notifyMode,
                measuredDurationMs = durationMs,
                isKhushuAlreadyActive = isKhushuActive,
                alarmManagerExactAllowed = canScheduleExact
            )

            // Overlap resolution with pending deferred Alarm A if present
            val overlapResolution = CustomAlarmKhushuDecision.resolveOverlap(
                hasPendingDeferredA = hasPendingDeferredA,
                incomingAlarmB = decisionInput
            )

            var cancelledPendingA = false
            when (overlapResolution) {
                CustomAlarmKhushuDecision.OverlapResolution.MAINTAIN_PENDING_A -> {
                    // Maintain pending deferred alarm A
                }
                CustomAlarmKhushuDecision.OverlapResolution.PREEMPT_IMMEDIATE_B -> {
                    KhushuRestoreReceiver.cancelDeferredKhushu(context)
                    cancelledPendingA = true
                }
                CustomAlarmKhushuDecision.OverlapResolution.RESCHEDULE_FOR_B -> {
                    KhushuRestoreReceiver.cancelDeferredKhushu(context)
                    cancelledPendingA = true
                }
                CustomAlarmKhushuDecision.OverlapResolution.PROCEED_NORMAL -> {
                    // Normal single alarm flow
                }
            }

            // Pure decision logic evaluation
            val decisionResult = CustomAlarmKhushuDecision.evaluate(decisionInput)

            // Post notification for Custom Alarm
            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "AUDIO_START_REQUESTED",
                    "prayerKey=$prayerKey, soundType=$soundType, notifyMode=$notifyMode, overlap=${overlapResolution.name}, cancelledPendingA=$cancelledPendingA, khushuDecision=${decisionResult.reason}"
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging AUDIO_START_REQUESTED", e)
            }

            val customPolicy = AlertDuringKhushuPolicy.evaluate(
                AlertDuringKhushuPolicy.AlertPolicyInput(
                    alarmType = "custom",
                    soundType = soundType,
                    notifyMode = notifyMode,
                    isKhushuActive = isKhushuActive,
                    autoKhushu = autoKhushu,
                    ringerMode = currentRingerMode
                )
            )
            val channelId = customPolicy.channelId

            val notifPosted = showCustomAlarmNotification(context, prayerName, prayerKey, soundType, notifyMode, isKhushuActive)
            if (customPolicy.shouldTriggerDirectVibrate) {
                vibrateDirectlyForKhushu(context)
            }
            if (notifPosted) {
                try {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "NOTIFICATION_POSTED",
                        "prayerKey=$prayerKey, soundType=$soundType, channelId=$channelId"
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed logging NOTIFICATION_POSTED", e)
                }
            } else {
                try {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "AUDIO_ERROR",
                        "prayerKey=$prayerKey, soundType=$soundType, error=notify_failed"
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed logging AUDIO_ERROR", e)
                }

                // If notification posting failed and autoKhushu was requested, activate immediately as safe fallback
                if (autoKhushu && !isKhushuActive) {
                    KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
                    showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_ACTIVATED",
                            "prayerKey=$prayerKey, mode=$khushuMode, durationMinutes=$durationMinutes, reason=fallback_immediate_notify_failed"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_ACTIVATED", e)
                    }
                }
                logFireEvent(context, prayerName, prayerKey, "custom", "failed", "custom_alarm_notification_failed (sound: $soundType)")
                return
            }

            // Execute decision on Khushu activation / deferral
            if (!decisionResult.shouldScheduleKhushu) {
                Log.d(TAG, "No khushu scheduled for $prayerKey: ${decisionResult.reason}")
            } else if (decisionResult.isImmediate) {
                // Immediate activation (silent, vibrate, or notification-only mode)
                KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
                showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
                try {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "KHUSHU_ACTIVATED",
                        "prayerKey=$prayerKey, mode=$khushuMode, durationMinutes=$durationMinutes, immediate=true, reason=${decisionResult.reason}"
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Failed logging KHUSHU_ACTIVATED", e)
                }
            } else {
                // Deferred activation: schedule AlarmManager intent after estimated audio delay
                if (decisionResult.logEvent == "AUDIO_ERROR") {
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "AUDIO_ERROR",
                            "prayerKey=$prayerKey, soundType=$soundType, error=duration_unavailable_fallback_${decisionResult.delayMs}ms"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging AUDIO_ERROR", e)
                    }
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_DEFERRED",
                            "prayerKey=$prayerKey, delayMs=${decisionResult.delayMs}, estimated=true, reason=${decisionResult.reason}"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_DEFERRED", e)
                    }
                } else {
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_DEFERRED",
                            "prayerKey=$prayerKey, delayMs=${decisionResult.delayMs}, estimated=${decisionResult.isEstimated}, reason=${decisionResult.reason}"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_DEFERRED", e)
                    }
                }

                val scheduled = KhushuRestoreReceiver.scheduleDeferredKhushu(
                    context = context,
                    delayMs = decisionResult.delayMs,
                    mode = khushuMode,
                    durationMinutes = durationMinutes,
                    prayerName = prayerName,
                    prayerKey = prayerKey,
                    isEstimated = decisionResult.isEstimated
                )

                if (!scheduled) {
                    // Fallback to immediate activation if scheduling threw an exception or returned null
                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "AUDIO_ERROR",
                            "prayerKey=$prayerKey, error=deferred_scheduling_failed"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging AUDIO_ERROR", e)
                    }

                    KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
                    showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)

                    try {
                        AthanAlarmPlugin.logNativeEvent(
                            context,
                            "KHUSHU_ACTIVATED",
                            "prayerKey=$prayerKey, mode=$khushuMode, durationMinutes=$durationMinutes, reason=fallback_immediate"
                        )
                    } catch (e: Exception) {
                        Log.w(TAG, "Failed logging KHUSHU_ACTIVATED fallback", e)
                    }
                }
            }

            val customVibDesc = if (customPolicy.shouldTriggerDirectVibrate) ", vibration: direct (khushu + ringer silent)" else ""
            val customSoundDesc = if (customPolicy.reason == "muted_for_khushu") "sound muted for khushu$customVibDesc" else "sound: $soundType"
            logFireEvent(context, prayerName, prayerKey, "custom", "played", "custom_alarm_notification ($customSoundDesc)")
            return
        }

        if (alarmType == "prealert" || prayerKey.contains("prealert")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            showPreAlertNotification(context, prayerName, prayerKey, soundType, notifyMode)
            logFireEvent(context, prayerName, prayerKey, "prealert", "played", "prealert_notification (sound: $soundType)")
            return
        }

        if (alarmType == "postalert" || prayerKey.contains("postalert") || prayerKey.contains("worship")) {
            val soundType = intent.getStringExtra("soundType") ?: "reminder"
            val notifyMode = intent.getStringExtra("notifyMode") ?: "both"
            val isKhushuActive = KhushuRestoreReceiver.isKhushuActive(context)
            val postPolicy = AlertDuringKhushuPolicy.evaluate(
                AlertDuringKhushuPolicy.AlertPolicyInput(
                    alarmType = "postalert",
                    soundType = soundType,
                    notifyMode = notifyMode,
                    isKhushuActive = isKhushuActive,
                    ringerMode = currentRingerMode
                )
            )
            showPostAlertNotification(context, prayerName, prayerKey, soundType, notifyMode, isKhushuActive)
            if (postPolicy.shouldTriggerDirectVibrate) {
                vibrateDirectlyForKhushu(context)
            }
            val postVibDesc = if (postPolicy.shouldTriggerDirectVibrate) ", vibration: direct (khushu + ringer silent)" else ""
            val postSoundDesc = if (postPolicy.reason == "muted_for_khushu") "sound muted for khushu$postVibDesc" else "sound: $soundType"
            logFireEvent(context, prayerName, prayerKey, "postalert", "played", "postalert_notification ($postSoundDesc)")
            return
        }

        if (alarmType == "khushu" || prayerKey.contains("khushu")) {
            val durationMinutes = intent.getIntExtra(EXTRA_DURATION_MINUTES, 15)
            val khushuMode = intent.getStringExtra(EXTRA_KHUSHU_MODE) ?: "silent"
            KhushuRestoreReceiver.activateKhushuDirectly(context, khushuMode, durationMinutes, prayerKey)
            showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)
            logFireEvent(context, prayerName, prayerKey, "khushu", "played", "khushu_activated (mode: $khushuMode, duration: ${durationMinutes}m)")
            return
        }

        val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
        val ongoingBarEnabled = prefs.getBoolean("ongoing_prayer_bar_enabled", false)
        if (ongoingBarEnabled) {
            updateOngoingPrayerNotificationAtPrayerTime(context, prayerName)
        }

        // Fire-time guard: verify that athan is enabled for this prayer
        val canonicalPrayer = prayerKey.lowercase().replaceFirstChar { it.uppercase() }
        val isAthanEnabled = prefs.getBoolean("athan_enabled_$canonicalPrayer", true)
        if (!isAthanEnabled) {
            Log.d(TAG, "Athan is disabled for prayer $canonicalPrayer ($prayerKey); skipping AthanForegroundService.")
            logFireEvent(context, prayerName, prayerKey, "athan", "skipped", "athan_disabled_in_prefs (athan_enabled_$canonicalPrayer is false)")
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
            logFireEvent(context, prayerName, prayerKey, "athan", "played", "foreground_service_started")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start AthanForegroundService", e)
            logFireEvent(context, prayerName, prayerKey, "athan", "skipped", "foreground_service_failed: ${e.javaClass.simpleName}: ${e.message}")
        }
    }

    private fun vibrateDirectlyForKhushu(context: Context) {
        try {
            val vibrator = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                val vibratorManager = context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager
                vibratorManager?.defaultVibrator
            } else {
                @Suppress("DEPRECATION")
                context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
            }

            if (vibrator == null || !vibrator.hasVibrator()) {
                Log.d(TAG, "Device has no vibrator hardware available")
                return
            }

            val pattern = longArrayOf(0, 300, 200, 300)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val effect = VibrationEffect.createWaveform(pattern, -1)
                val attributes = AudioAttributes.Builder()
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .setUsage(AudioAttributes.USAGE_ALARM)
                    .build()
                vibrator.vibrate(effect, attributes)
            } else {
                @Suppress("DEPRECATION")
                vibrator.vibrate(pattern, -1)
            }
            Log.d(TAG, "Direct vibration triggered for Khushu under silent ringer")
        } catch (e: Exception) {
            Log.w(TAG, "Failed triggering direct vibration for Khushu", e)
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
        val rawName = getRawName(soundType)
        val soundUri = if (!isSilent) Uri.parse("android.resource://${context.packageName}/raw/$rawName") else null
        val cleanSound = soundType.lowercase().trim().replace("-", "_")
        val channelId = if (isSilent) "athan_prealert_silent_channel_v3" else "${PREALERT_CHANNEL_ID}_$cleanSound"

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                notificationManager.deleteNotificationChannel("athan_prealert_channel_v2")
                notificationManager.deleteNotificationChannel("athan_prealert_channel_v2_$cleanSound")
                notificationManager.deleteNotificationChannel("athan_prealert_silent_channel_v2")
            } catch (_: Exception) {}
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val channel = NotificationChannel(
                channelId,
                if (isSilent) "تنبيهات اقتراب وقت الصلاة (صامت)" else "تنبيهات اقتراب وقت الصلاة ($cleanSound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "تنبيهات تذكيرية بقرب دخول وقت الصلاة"
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

        val title = "اقتراب موعد صلاة $prayerName ⏳"
        val body = "استعد للوضوء وأداء فريضة $prayerName"

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
    }

    private fun showPostAlertNotification(
        context: Context,
        prayerName: String,
        prayerKey: String,
        soundType: String = "reminder",
        notifyMode: String = "both",
        isKhushuActive: Boolean = false
    ) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager ?: return

        val policy = AlertDuringKhushuPolicy.evaluate(
            AlertDuringKhushuPolicy.AlertPolicyInput(
                alarmType = "postalert",
                soundType = soundType,
                notifyMode = notifyMode,
                isKhushuActive = isKhushuActive
            )
        )

        val isSilent = policy.effectiveIsSilent
        val rawName = getRawName(soundType)
        val soundUri = if (policy.soundUriRequired) Uri.parse("android.resource://${context.packageName}/raw/$rawName") else null
        val cleanSound = soundType.lowercase().trim().replace("-", "_")
        val channelId = policy.channelId

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                notificationManager.deleteNotificationChannel("athan_postalert_channel_v2")
                notificationManager.deleteNotificationChannel("athan_postalert_channel_v2_$cleanSound")
                notificationManager.deleteNotificationChannel("athan_postalert_silent_channel_v2")
            } catch (_: Exception) {}
            val audioAttributes = AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build()

            val channel = NotificationChannel(
                channelId,
                if (isSilent) "تنبيهات بعد دخول الوقت والسنن (صامت)" else "تنبيهات بعد دخول الوقت والسنن ($cleanSound)",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "تنبيهات تذكيرية بالسنن البعدية وأذكار الصلاة"
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

        val title = "تذكير بسنن وأذكار صلاة $prayerName 📿"
        val body = "حافظ على السنن الرواتب وأذكار بعد الصلاة لتمام الأجر"

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
        }
        notifBuilder.setVibrate(longArrayOf(0, 300, 200, 300))

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (prayerKey.hashCode() and 0x7FFFFFFF) % 10000 + 6000
        notificationManager.notify(notifId, notifBuilder.build())
        Log.d(TAG, "Post-alert notification displayed for $prayerName (id=$notifId)")
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
