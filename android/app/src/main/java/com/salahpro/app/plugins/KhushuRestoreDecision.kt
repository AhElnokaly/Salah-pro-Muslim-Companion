package com.salahpro.app.plugins

/**
 * Pure decision logic for scheduling Khushu restore alarms across Android versions.
 * Independent of Android framework classes for deterministic JVM unit testing.
 */
enum class RestoreScheduleMethod {
    EXACT_AND_ALLOW_WHILE_IDLE,
    FALLBACK_INEXACT_ALLOW_WHILE_IDLE
}

data class RestoreScheduleDecision(
    val method: RestoreScheduleMethod,
    val isExact: Boolean
)

object KhushuRestoreDecision {
    /**
     * Determine restore alarm method based on SDK version and exact alarm capability.
     * On Android 12+ (API 31+), if exact alarms cannot be scheduled,
     * falls back safely to inexact wake-up alarm to avoid SecurityException.
     */
    fun decideRestoreMethod(sdkInt: Int, canScheduleExact: Boolean): RestoreScheduleDecision {
        return if (sdkInt >= 31) {
            if (canScheduleExact) {
                RestoreScheduleDecision(
                    method = RestoreScheduleMethod.EXACT_AND_ALLOW_WHILE_IDLE,
                    isExact = true
                )
            } else {
                RestoreScheduleDecision(
                    method = RestoreScheduleMethod.FALLBACK_INEXACT_ALLOW_WHILE_IDLE,
                    isExact = false
                )
            }
        } else {
            RestoreScheduleDecision(
                method = RestoreScheduleMethod.EXACT_AND_ALLOW_WHILE_IDLE,
                isExact = true
            )
        }
    }
}
