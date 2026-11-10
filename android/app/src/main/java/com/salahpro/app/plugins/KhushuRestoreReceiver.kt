package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.util.Log
import com.salahpro.app.widget.SalahWidgetProvider

/**
 * KhushuRestoreReceiver:
 * BroadcastReceiver triggered by AlarmManager to reliably restore original
 * audio and notification interruption filter even if the application process was killed.
 */
class KhushuRestoreReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "KhushuRestoreReceiver"
        const val ACTION_RESTORE_KHUSHU = "com.salahpro.app.ACTION_RESTORE_KHUSHU"
        const val ACTION_ACTIVATE_KHUSHU_DEFERRED = "com.salahpro.app.ACTION_ACTIVATE_KHUSHU_DEFERRED"
        const val PREFS_NAME = "KhushuModePrefs"
        const val KEY_IS_ACTIVE = "khushu_is_active"
        const val KEY_ORIGINAL_FILTER = "khushu_original_filter"
        const val KEY_ORIGINAL_RINGER = "khushu_original_ringer"
        const val KEY_ACTIVATED_AT = "khushu_activated_at"
        const val KEY_DURATION_MINUTES = "khushu_duration_minutes"
        const val KEY_MODE = "khushu_mode"
        const val KHUSHU_RESTORE_REQUEST_CODE = 998877 // Constant, deterministic request code (No index collision)
        const val CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE = 998878 // Dedicated request code for deferred custom alarm Khushu
        const val KHUSHU_NOTIFICATION_ID = 8888 // Fixed notification ID for Khushu status

        const val EXTRA_DEFERRED_KHUSHU_MODE = "extra_deferred_khushu_mode"
        const val EXTRA_DEFERRED_DURATION_MINUTES = "extra_deferred_duration_minutes"
        const val EXTRA_DEFERRED_PRAYER_NAME = "extra_deferred_prayer_name"
        const val EXTRA_DEFERRED_PRAYER_KEY = "extra_deferred_prayer_key"
        const val EXTRA_DEFERRED_DELAY_MS = "extra_deferred_delay_ms"
        const val EXTRA_DEFERRED_IS_ESTIMATED = "extra_deferred_is_estimated"

        const val KEY_HAS_PENDING_DEFERRED = "khushu_has_pending_deferred"
        const val KEY_PENDING_DEFERRED_KEY = "khushu_pending_deferred_key"
        const val KEY_PENDING_DEFERRED_TRIGGER_AT = "khushu_pending_deferred_trigger_at"

        fun hasPendingDeferredKhushu(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val hasPending = prefs.getBoolean(KEY_HAS_PENDING_DEFERRED, false)
            if (!hasPending) return false

            // Cross-verify with AlarmManager token using FLAG_NO_CREATE (returns null if cancelled or device rebooted)
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_ACTIVATE_KHUSHU_DEFERRED
            }
            val flags = PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE,
                intent,
                flags
            )
            if (pendingIntent == null) {
                markDeferredKhushuInactive(context)
                return false
            }

            val triggerAt = prefs.getLong(KEY_PENDING_DEFERRED_TRIGGER_AT, 0L)
            // If triggerAt passed by more than 30 seconds without receiver trigger, treat as expired
            if (triggerAt > 0L && System.currentTimeMillis() > triggerAt + 30_000L) {
                markDeferredKhushuInactive(context)
                return false
            }
            return true
        }

        fun markDeferredKhushuInactive(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putBoolean(KEY_HAS_PENDING_DEFERRED, false)
                .remove(KEY_PENDING_DEFERRED_KEY)
                .remove(KEY_PENDING_DEFERRED_TRIGGER_AT)
                .apply()
        }

        fun scheduleDeferredKhushu(
            context: Context,
            delayMs: Long,
            mode: String,
            durationMinutes: Int,
            prayerName: String,
            prayerKey: String,
            isEstimated: Boolean = true
        ): Boolean {
            return try {
                val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return false
                val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                    action = ACTION_ACTIVATE_KHUSHU_DEFERRED
                    putExtra(EXTRA_DEFERRED_KHUSHU_MODE, mode)
                    putExtra(EXTRA_DEFERRED_DURATION_MINUTES, durationMinutes)
                    putExtra(EXTRA_DEFERRED_PRAYER_NAME, prayerName)
                    putExtra(EXTRA_DEFERRED_PRAYER_KEY, prayerKey)
                    putExtra(EXTRA_DEFERRED_DELAY_MS, delayMs)
                    putExtra(EXTRA_DEFERRED_IS_ESTIMATED, isEstimated)
                }
                val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
                val pendingIntent = PendingIntent.getBroadcast(
                    context,
                    CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE,
                    intent,
                    flags
                ) ?: return false

                val triggerAt = System.currentTimeMillis() + delayMs

                // API 31+ exact alarm permission check
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    if (alarmManager.canScheduleExactAlarms()) {
                        alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                    } else {
                        // setAndAllowWhileIdle fallback when exact alarm permission is absent (note: may experience system Doze batching delays)
                        alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                    }
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                } else {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
                }

                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                prefs.edit()
                    .putBoolean(KEY_HAS_PENDING_DEFERRED, true)
                    .putString(KEY_PENDING_DEFERRED_KEY, prayerKey)
                    .putLong(KEY_PENDING_DEFERRED_TRIGGER_AT, triggerAt)
                    .apply()

                Log.d(TAG, "Scheduled deferred Khushu in ${delayMs}ms with requestCode $CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE")
                true
            } catch (e: Exception) {
                Log.e(TAG, "Failed to schedule deferred Khushu", e)
                false
            }
        }

        fun cancelDeferredKhushu(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_ACTIVATE_KHUSHU_DEFERRED
            }
            val flags = PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                CUSTOM_ALARM_DEFERRED_KHUSHU_REQUEST_CODE,
                intent,
                flags
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
                Log.d(TAG, "Cancelled deferred Khushu alarm")
            }
            markDeferredKhushuInactive(context)
        }

        fun isKhushuActive(context: Context): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) return false
            val activatedAt = prefs.getLong(KEY_ACTIVATED_AT, 0L)
            val durationMinutes = prefs.getInt(KEY_DURATION_MINUTES, 30)
            if (activatedAt > 0L) {
                val elapsedMs = System.currentTimeMillis() - activatedAt
                val totalMs = durationMinutes * 60_000L
                if (elapsedMs >= totalMs) {
                    restoreOriginalState(context)
                    return false
                }
            }
            return true
        }

        fun getRemainingMinutes(context: Context): Int {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) return 0
            val activatedAt = prefs.getLong(KEY_ACTIVATED_AT, 0L)
            val durationMinutes = prefs.getInt(KEY_DURATION_MINUTES, 30)
            if (activatedAt > 0L) {
                val elapsedMs = System.currentTimeMillis() - activatedAt
                val totalMs = durationMinutes * 60_000L
                val leftMs = totalMs - elapsedMs
                return if (leftMs > 0L) Math.ceil(leftMs / 60_000.0).toInt() else 0
            }
            return durationMinutes
        }

        fun scheduleRestoreAlarm(context: Context, durationMinutes: Int) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_RESTORE_KHUSHU
            }
            val flags = PendingIntent.FLAG_UPDATE_CURRENT or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_RESTORE_REQUEST_CODE,
                intent,
                flags
            )
            val triggerAt = System.currentTimeMillis() + (durationMinutes * 60_000L)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
            Log.d(TAG, "Scheduled restore alarm in $durationMinutes minutes with requestCode $KHUSHU_RESTORE_REQUEST_CODE")
        }

        fun cancelRestoreAlarm(context: Context) {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
            val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
                action = ACTION_RESTORE_KHUSHU
            }
            val flags = PendingIntent.FLAG_NO_CREATE or (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
            val pendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_RESTORE_REQUEST_CODE,
                intent,
                flags
            )
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
                Log.d(TAG, "Cancelled restore alarm")
            }
        }

        fun activateKhushuDirectly(context: Context, mode: String = "silent", durationMinutes: Int = 30, sourceKey: String = ""): Boolean {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager

            val initialRinger = audioManager?.ringerMode ?: -1
            val initialFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.currentInterruptionFilter ?: -1
            } else -1

            val hasDndPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.isNotificationPolicyAccessGranted == true
            } else {
                true
            }

            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_attempt",
                    "mode=$mode, durationMinutes=$durationMinutes, sourceKey=$sourceKey, initialRinger=$initialRinger, initialFilter=$initialFilter, hasDndPermission=$hasDndPermission"
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_attempt", e)
            }

            // 1. Snapshot current state if not already active
            if (!prefs.getBoolean(KEY_IS_ACTIVE, false)) {
                val currentFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.currentInterruptionFilter ?: NotificationManager.INTERRUPTION_FILTER_ALL
                } else {
                    NotificationManager.INTERRUPTION_FILTER_ALL
                }
                val currentRinger = audioManager?.ringerMode ?: AudioManager.RINGER_MODE_NORMAL
                prefs.edit()
                    .putInt(KEY_ORIGINAL_FILTER, currentFilter)
                    .putInt(KEY_ORIGINAL_RINGER, currentRinger)
                    .apply()
            }

            // 2. Apply silence / DND with graceful fallbacks
            if (mode == "dnd" && hasDndPermission) {
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        notificationManager?.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                        Log.d(TAG, "DND interruption filter set to NONE")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Error setting DND interruption filter", e)
                }
            }

            var ringerError: Throwable? = null
            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_audio_state_before",
                    "sourceKey=$sourceKey, " + captureAudioStateLog(audioManager, notificationManager)
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_audio_state_before", e)
            }

            // Always silence ringer, falling back to Vibrate if Android throws SecurityException
            try {
                audioManager?.ringerMode = AudioManager.RINGER_MODE_SILENT
                Log.d(TAG, "Ringer mode set to RINGER_MODE_SILENT")
            } catch (se: SecurityException) {
                ringerError = se
                Log.w(TAG, "RINGER_MODE_SILENT requires DND access. Falling back to RINGER_MODE_VIBRATE", se)
                try {
                    audioManager?.ringerMode = AudioManager.RINGER_MODE_VIBRATE
                } catch (ve: Exception) {
                    Log.e(TAG, "Failed setting ringer mode to vibrate", ve)
                }
            } catch (e: Exception) {
                ringerError = e
                Log.e(TAG, "Error setting silent ringer mode", e)
            }

            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "khushu_audio_state_after",
                    "sourceKey=$sourceKey, " + captureAudioStateLog(audioManager, notificationManager)
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_audio_state_after", e)
            }

            // 3. Save active state
            val now = System.currentTimeMillis()
            prefs.edit()
                .putBoolean(KEY_IS_ACTIVE, true)
                .putString(KEY_MODE, mode)
                .putInt(KEY_DURATION_MINUTES, durationMinutes)
                .putLong(KEY_ACTIVATED_AT, now)
                .apply()

            // 4. Schedule Alarm
            scheduleRestoreAlarm(context, durationMinutes)

            // 5. Update Widgets
            SalahWidgetProvider.updateAllWidgets(context)

            val appliedRinger = audioManager?.ringerMode ?: -1
            val appliedFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                notificationManager?.currentInterruptionFilter ?: -1
            } else -1

            try {
                if (ringerError != null) {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "khushu_result",
                        "mode=$mode, sourceKey=$sourceKey, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, fallback_vibrate=true",
                        ringerError
                    )
                } else {
                    AthanAlarmPlugin.logNativeEvent(
                        context,
                        "khushu_result",
                        "mode=$mode, durationMinutes=$durationMinutes, sourceKey=$sourceKey, appliedRinger=$appliedRinger, appliedFilter=$appliedFilter, hasDndPermission=$hasDndPermission, status=success"
                    )
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging khushu_result", e)
            }
            return true
        }

        private fun captureAudioStateLog(
            audioManager: AudioManager?,
            notificationManager: NotificationManager?
        ): String {
            return try {
                val ringerMode = audioManager?.ringerMode ?: -1
                val alarmVol = audioManager?.getStreamVolume(AudioManager.STREAM_ALARM) ?: -1
                val notifVol = audioManager?.getStreamVolume(AudioManager.STREAM_NOTIFICATION) ?: -1
                val ringVol = audioManager?.getStreamVolume(AudioManager.STREAM_RING) ?: -1

                val alarmMuted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    audioManager?.isStreamMute(AudioManager.STREAM_ALARM) ?: false
                } else false
                val notifMuted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    audioManager?.isStreamMute(AudioManager.STREAM_NOTIFICATION) ?: false
                } else false
                val ringMuted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    audioManager?.isStreamMute(AudioManager.STREAM_RING) ?: false
                } else false

                val dndGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.isNotificationPolicyAccessGranted ?: false
                } else true

                val filter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.currentInterruptionFilter ?: -1
                } else -1

                val customChannelUsage = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val channel = notificationManager?.getNotificationChannel("salah_custom_alarms")
                    channel?.audioAttributes?.usage ?: -1
                } else -1

                "ringerMode=$ringerMode, volAlarm=$alarmVol, muteAlarm=$alarmMuted, volNotif=$notifVol, muteNotif=$notifMuted, volRing=$ringVol, muteRing=$ringMuted, dndGranted=$dndGranted, filter=$filter, customChannelUsage=$customChannelUsage"
            } catch (e: Exception) {
                "audioStateUnavailable=${e.javaClass.simpleName}"
            }
        }

        fun restoreOriginalState(context: Context) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val isActive = prefs.getBoolean(KEY_IS_ACTIVE, false)
            if (!isActive) {
                Log.d(TAG, "Khushu mode was already inactive, skipping duplicate restore")
                SalahWidgetProvider.updateAllWidgets(context)
                return
            }

            val originalFilter = prefs.getInt(KEY_ORIGINAL_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL)
            val originalRinger = prefs.getInt(KEY_ORIGINAL_RINGER, AudioManager.RINGER_MODE_NORMAL)

            // 1. Restore Do Not Disturb (DND) filter if permitted
            val nm = context.getSystemService(NotificationManager::class.java)
            if (nm != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                try {
                    if (nm.isNotificationPolicyAccessGranted) {
                        nm.setInterruptionFilter(originalFilter)
                        Log.d(TAG, "Restored interruption filter to: $originalFilter")
                    } else {
                        Log.w(TAG, "Notification policy access not granted during restore")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to restore interruption filter", e)
                }
            }

            // 2. Restore AudioManager ringer mode
            val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
            if (audioManager != null) {
                try {
                    audioManager.ringerMode = originalRinger
                    Log.d(TAG, "Restored audio ringer mode to: $originalRinger")
                } catch (e: Exception) {
                    Log.e(TAG, "Failed to restore audio ringer mode", e)
                }
            }

            // 3. Mark inactive in prefs
            prefs.edit()
                .putBoolean(KEY_IS_ACTIVE, false)
                .putLong(KEY_ACTIVATED_AT, 0L)
                .putInt(KEY_DURATION_MINUTES, 0)
                .apply()

            cancelRestoreAlarm(context)
            Log.d(TAG, "Khushu mode successfully deactivated and marked inactive")

            // 4. Dismiss Khushu status notification
            try {
                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                notificationManager?.cancel(KHUSHU_NOTIFICATION_ID)
            } catch (e: Exception) {
                Log.w(TAG, "Failed cancelling Khushu notification", e)
            }

            // 5. Update Widgets
            SalahWidgetProvider.updateAllWidgets(context)
        }
    }

    override fun onReceive(context: Context, intent: Intent?) {
        val action = intent?.action
        Log.d(TAG, "KhushuRestoreReceiver triggered: action=$action")

        if (action == ACTION_ACTIVATE_KHUSHU_DEFERRED) {
            val mode = intent.getStringExtra(EXTRA_DEFERRED_KHUSHU_MODE) ?: "silent"
            val durationMinutes = intent.getIntExtra(EXTRA_DEFERRED_DURATION_MINUTES, 15)
            val prayerName = intent.getStringExtra(EXTRA_DEFERRED_PRAYER_NAME) ?: "منبه العبادة"
            val prayerKey = intent.getStringExtra(EXTRA_DEFERRED_PRAYER_KEY) ?: ""

            markDeferredKhushuInactive(context)

            // Idempotency guard: If Khushu is already active, ignore duplicate without resetting timer
            if (isKhushuActive(context)) {
                Log.d(TAG, "Khushu is already active, ignoring duplicate deferred activation")
                return
            }

            val activatedAtMs = System.currentTimeMillis()
            activateKhushuDirectly(context, mode, durationMinutes, prayerKey)
            AthanAlarmReceiver.showKhushuActivatedNotification(context, prayerName, durationMinutes, prayerKey)

            try {
                AthanAlarmPlugin.logNativeEvent(
                    context,
                    "KHUSHU_ACTIVATED",
                    "prayerKey=$prayerKey, mode=$mode, durationMinutes=$durationMinutes, activatedAtMs=$activatedAtMs, source=deferred_custom_alarm"
                )
            } catch (e: Exception) {
                Log.w(TAG, "Failed logging KHUSHU_ACTIVATED", e)
            }
            return
        }

        // Default or ACTION_RESTORE_KHUSHU: restore original device state
        restoreOriginalState(context)
    }
}
