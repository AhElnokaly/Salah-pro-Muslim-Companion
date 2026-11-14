package com.salahpro.app.plugins

import org.junit.Assert.*
import org.junit.Test

/**
 * JVM unit test for pure custom alarm Khushu decision logic.
 * Free of Android dependencies.
 *
 * NOTE (Verification status): KOTLIN_STATIC
 * Validated via Kotlin language semantics and static analysis; local gradle execution is unavailable in this environment.
 */
class CustomAlarmKhushuDecisionTest {

    @Test
    fun autoKhushuFalse_doesNotScheduleKhushu() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = false,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 3000L
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertFalse(res.shouldScheduleKhushu)
        assertEquals(0L, res.delayMs)
    }

    @Test
    fun silentOrVibrate_triggersImmediateActivation() {
        val silentInput = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "silent",
            notifyMode = "both",
            measuredDurationMs = 3000L
        )
        val resSilent = CustomAlarmKhushuDecision.evaluate(silentInput)
        assertTrue(resSilent.shouldScheduleKhushu)
        assertTrue(resSilent.isImmediate)
        assertEquals(0L, resSilent.delayMs)

        val vibrateInput = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "vibrate",
            notifyMode = "both",
            measuredDurationMs = 3000L
        )
        val resVibrate = CustomAlarmKhushuDecision.evaluate(vibrateInput)
        assertTrue(resVibrate.shouldScheduleKhushu)
        assertTrue(resVibrate.isImmediate)
        assertEquals(0L, resVibrate.delayMs)
    }

    @Test
    fun notificationOnlyMode_triggersImmediateActivation() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "reminder",
            notifyMode = "notification",
            measuredDurationMs = 3000L
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertTrue(res.shouldScheduleKhushu)
        assertTrue(res.isImmediate)
        assertEquals(0L, res.delayMs)
    }

    @Test
    fun audibleSound_triggersDeferredKhushuWithSafetyMargin() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 3200L
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertTrue(res.shouldScheduleKhushu)
        assertFalse(res.isImmediate)
        assertTrue(res.isEstimated)
        assertEquals(7200L, res.delayMs) // 3200 + 4000 (AUDIO_BUFFER_MARGIN_MS)
        assertEquals("KHUSHU_DEFERRED", res.logEvent)
    }

    @Test
    fun unmeasuredOrFailedDuration_fallsBackTo5SecondsWithErrorLog() {
        val inputNull = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "unknown_sound",
            notifyMode = "both",
            measuredDurationMs = null
        )
        val resNull = CustomAlarmKhushuDecision.evaluate(inputNull)
        assertTrue(resNull.shouldScheduleKhushu)
        assertFalse(resNull.isImmediate)
        assertEquals(5000L, resNull.delayMs)
        assertEquals("AUDIO_ERROR", resNull.logEvent)

        val inputZero = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "corrupt",
            notifyMode = "both",
            measuredDurationMs = 0L
        )
        val resZero = CustomAlarmKhushuDecision.evaluate(inputZero)
        assertEquals(5000L, resZero.delayMs)
        assertEquals("AUDIO_ERROR", resZero.logEvent)
    }

    @Test
    fun alreadyActiveKhushu_ignoresDuplicateWithoutRescheduling() {
        val input = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 3000L,
            isKhushuAlreadyActive = true
        )
        val res = CustomAlarmKhushuDecision.evaluate(input)
        assertFalse(res.shouldScheduleKhushu)
        assertEquals("KHUSHU_ALREADY_ACTIVE", res.logEvent)
        assertEquals("already_active_ignore_duplicate", res.reason)
    }

    @Test
    fun overlapResolution_alarmBWithoutKhushu_maintainsPendingA() {
        val incomingB = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = false,
            soundType = "reminder",
            notifyMode = "both",
            measuredDurationMs = 2000L
        )
        val res = CustomAlarmKhushuDecision.resolveOverlap(hasPendingDeferredA = true, incomingAlarmB = incomingB)
        assertEquals(CustomAlarmKhushuDecision.OverlapResolution.MAINTAIN_PENDING_A, res)
    }

    @Test
    fun overlapResolution_alarmBImmediateKhushu_preemptsImmediateB() {
        val incomingB = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "silent",
            notifyMode = "both",
            measuredDurationMs = 0L
        )
        val res = CustomAlarmKhushuDecision.resolveOverlap(hasPendingDeferredA = true, incomingAlarmB = incomingB)
        assertEquals(CustomAlarmKhushuDecision.OverlapResolution.PREEMPT_IMMEDIATE_B, res)
    }

    @Test
    fun overlapResolution_alarmBAudibleKhushu_reschedulesForB() {
        val incomingB = CustomAlarmKhushuDecision.DecisionInput(
            autoKhushu = true,
            soundType = "takbeer",
            notifyMode = "both",
            measuredDurationMs = 6000L
        )
        val res = CustomAlarmKhushuDecision.resolveOverlap(hasPendingDeferredA = true, incomingAlarmB = incomingB)
        assertEquals(CustomAlarmKhushuDecision.OverlapResolution.RESCHEDULE_FOR_B, res)
    }
}
