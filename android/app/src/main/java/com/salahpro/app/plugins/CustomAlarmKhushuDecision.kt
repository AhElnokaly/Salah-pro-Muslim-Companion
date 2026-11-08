package com.salahpro.app.plugins

/**
 * Pure decision logic for custom alarm Khushu activation and timing.
 * Free of Android Context dependencies for direct JVM testing and Kotlin static verification.
 *
 * NOTE (Architecture):
 * Unified audio player interface is deferred to Task 10 (RingCoordinator).
 * R12a handles decision logic for the notification-channel estimated delay path without competing players.
 */
object CustomAlarmKhushuDecision {

    data class DecisionInput(
        val autoKhushu: Boolean,
        val soundType: String,
        val notifyMode: String,
        val measuredDurationMs: Long?, // null or <= 0 indicates failure/unmeasured
        val isKhushuAlreadyActive: Boolean = false,
        val alarmManagerExactAllowed: Boolean = true
    )

    data class DecisionResult(
        val shouldScheduleKhushu: Boolean,
        val isImmediate: Boolean,
        val delayMs: Long,
        val isEstimated: Boolean,
        val logEvent: String,
        val reason: String
    )

    const val FALLBACK_ERROR_DELAY_MS = 5000L
    const val SAFETY_MARGIN_MS = 1500L

    fun evaluate(input: DecisionInput): DecisionResult {
        if (!input.autoKhushu) {
            return DecisionResult(
                shouldScheduleKhushu = false,
                isImmediate = false,
                delayMs = 0L,
                isEstimated = false,
                logEvent = "NO_KHUSHU_SCHEDULED",
                reason = "auto_khushu_disabled"
            )
        }

        if (input.isKhushuAlreadyActive) {
            return DecisionResult(
                shouldScheduleKhushu = false,
                isImmediate = false,
                delayMs = 0L,
                isEstimated = false,
                logEvent = "KHUSHU_ALREADY_ACTIVE",
                reason = "already_active_ignore_duplicate"
            )
        }

        val cleanSound = input.soundType.lowercase().trim()
        val isSilentOrVibrate = cleanSound == "silent" || cleanSound == "vibrate"
        val isNotificationOnly = input.notifyMode.lowercase().trim() == "notification"

        if (isSilentOrVibrate || isNotificationOnly) {
            return DecisionResult(
                shouldScheduleKhushu = true,
                isImmediate = true,
                delayMs = 0L,
                isEstimated = false,
                logEvent = "KHUSHU_ACTIVATED",
                reason = if (isSilentOrVibrate) "silent_or_vibrate_sound" else "notification_only_mode"
            )
        }

        // Audible sound path
        val duration = input.measuredDurationMs
        if (duration == null || duration <= 0L) {
            return DecisionResult(
                shouldScheduleKhushu = true,
                isImmediate = false,
                delayMs = FALLBACK_ERROR_DELAY_MS,
                isEstimated = true,
                logEvent = "AUDIO_ERROR",
                reason = "duration_unmeasured_fallback_5s"
            )
        }

        val delay = duration + SAFETY_MARGIN_MS
        return DecisionResult(
            shouldScheduleKhushu = true,
            isImmediate = false,
            delayMs = delay,
            isEstimated = true,
            logEvent = "KHUSHU_DEFERRED",
            reason = "awaiting_sound_completion"
        )
    }

    /**
     * Resolves preemption when a new custom alarm (B) arrives while a previous alarm (A) has a pending deferred Khushu.
     */
    fun resolveOverlap(
        hasPendingDeferredA: Boolean,
        incomingAlarmB: DecisionInput
    ): OverlapResolution {
        if (!hasPendingDeferredA) {
            return OverlapResolution.PROCEED_NORMAL
        }

        if (!incomingAlarmB.autoKhushu) {
            // Incoming alarm B does not touch Khushu; maintain Alarm A's deferred Khushu
            return OverlapResolution.MAINTAIN_PENDING_A
        }

        val cleanSound = incomingAlarmB.soundType.lowercase().trim()
        val isBImmediate = cleanSound == "silent" || cleanSound == "vibrate" || incomingAlarmB.notifyMode.lowercase().trim() == "notification"

        return if (isBImmediate) {
            // Alarm B is immediate: cancel A's pending delay and activate immediately
            OverlapResolution.PREEMPT_IMMEDIATE_B
        } else {
            // Alarm B has its own audio: reschedule deferred delay for Alarm B
            OverlapResolution.RESCHEDULE_FOR_B
        }
    }

    enum class OverlapResolution {
        PROCEED_NORMAL,
        MAINTAIN_PENDING_A,
        PREEMPT_IMMEDIATE_B,
        RESCHEDULE_FOR_B
    }
}
