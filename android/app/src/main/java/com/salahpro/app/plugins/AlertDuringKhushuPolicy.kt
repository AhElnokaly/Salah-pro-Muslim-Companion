package com.salahpro.app.plugins

/**
 * Pure policy decision logic for notifications and alerts during active Khushu mode.
 * Free of Android Context dependencies for direct JVM testing and Kotlin static verification.
 *
 * Enforces:
 * 1. Alerts during active Khushu are silenced (effectiveIsSilent = true, soundUriRequired = false).
 * 2. Dedicated silent notification channels are assigned to prevent audio playback.
 * 3. Alerts during Khushu do not trigger or schedule subsequent Khushu activations.
 * 4. Alerts outside Khushu follow user-configured audio and channel settings.
 */
object AlertDuringKhushuPolicy {

    const val CUSTOM_ALARM_SILENT_CHANNEL_ID = "salah_custom_alarms_silent"
    const val CUSTOM_ALARM_CHANNEL_ID = "salah_custom_alarms"
    const val POSTALERT_SILENT_CHANNEL_ID = "athan_postalert_silent_channel_v3"
    const val POSTALERT_CHANNEL_ID = "athan_postalert_channel_v3"
    const val PREALERT_SILENT_CHANNEL_ID = "athan_prealert_silent_channel_v3"
    const val PREALERT_CHANNEL_ID = "athan_prealert_channel_v3"

    data class AlertPolicyInput(
        val alarmType: String, // "postalert", "custom", "prealert"
        val soundType: String, // "reminder", "silent", "takbeer", etc.
        val notifyMode: String = "both", // "both", "sound", "notification", "silent"
        val isKhushuActive: Boolean,
        val autoKhushu: Boolean = false,
        val ringerMode: Int = 2 // 0 = RINGER_MODE_SILENT, 1 = RINGER_MODE_VIBRATE, 2 = RINGER_MODE_NORMAL
    )

    data class AlertPolicyResult(
        val effectiveIsSilent: Boolean,
        val channelId: String,
        val soundUriRequired: Boolean,
        val shouldScheduleKhushu: Boolean,
        val shouldTriggerDirectVibrate: Boolean,
        val reason: String,
        val logDescription: String
    )

    fun evaluate(input: AlertPolicyInput): AlertPolicyResult {
        val cleanSound = input.soundType.lowercase().trim().replace("-", "_")
        val isOriginallySilent = cleanSound == "silent" || cleanSound == "vibrate" || input.notifyMode.lowercase().trim() == "notification"
        val isOriginallyAudible = !isOriginallySilent

        val effectiveIsSilent = if (input.isKhushuActive) {
            true // During active Khushu, any alert is silenced
        } else {
            isOriginallySilent
        }

        val reason = when {
            input.isKhushuActive && !isOriginallySilent -> "muted_for_khushu"
            isOriginallySilent -> "configured_silent"
            else -> "normal_playback"
        }

        val logDescription = when (reason) {
            "muted_for_khushu" -> "sound muted for khushu"
            "configured_silent" -> "sound configured silent"
            else -> "sound: $cleanSound"
        }

        val channelId = when (input.alarmType) {
            "custom" -> {
                if (effectiveIsSilent) CUSTOM_ALARM_SILENT_CHANNEL_ID else "${CUSTOM_ALARM_CHANNEL_ID}_$cleanSound"
            }
            "postalert" -> {
                if (effectiveIsSilent) POSTALERT_SILENT_CHANNEL_ID else "${POSTALERT_CHANNEL_ID}_$cleanSound"
            }
            "prealert" -> {
                if (effectiveIsSilent) PREALERT_SILENT_CHANNEL_ID else "${PREALERT_CHANNEL_ID}_$cleanSound"
            }
            else -> {
                if (effectiveIsSilent) POSTALERT_SILENT_CHANNEL_ID else "${POSTALERT_CHANNEL_ID}_$cleanSound"
            }
        }

        // Khushu scheduling policy:
        // Never schedule or extend Khushu if Khushu is already active, or if alarmType is not custom with autoKhushu=true
        val shouldScheduleKhushu = if (input.isKhushuActive) {
            false
        } else {
            input.alarmType == "custom" && input.autoKhushu
        }

        // Direct vibration required when:
        // 1. Khushu is active
        // 2. Hardware ringer mode is RINGER_MODE_SILENT (0)
        // 3. Alert was originally audible (not configured as silent, vibrate, or notification-only)
        val shouldTriggerDirectVibrate = input.isKhushuActive && (input.ringerMode == 0) && isOriginallyAudible

        return AlertPolicyResult(
            effectiveIsSilent = effectiveIsSilent,
            channelId = channelId,
            soundUriRequired = !effectiveIsSilent,
            shouldScheduleKhushu = shouldScheduleKhushu,
            shouldTriggerDirectVibrate = shouldTriggerDirectVibrate,
            reason = reason,
            logDescription = logDescription
        )
    }
}
