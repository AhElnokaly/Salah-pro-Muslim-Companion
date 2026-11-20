package com.salahpro.app.plugins

import org.junit.Assert.*
import org.junit.Test

/**
 * JVM Unit tests for AlertDuringKhushuPolicy.
 * Verifies alert silencing, channel routing, and Khushu scheduling prevention during active Khushu mode.
 *
 * NOTE (Verification status): KOTLIN_STATIC & JVM_UNIT
 * Validated via Kotlin language semantics and static analysis; local gradle execution is unavailable in this environment.
 */
class AlertDuringKhushuPolicyTest {

    @Test
    fun fridayScenario_postAlertAtPlus10DuringKhushu_isSilencedAndNoKhushuScheduled() {
        // Friday scenario: Athan + Khushu starts at +5 and lasts until +50 (isKhushuActive = true)
        // Postalert arrives at +10 with soundType="reminder" and notifyMode="both"
        val input = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = true,
            autoKhushu = false
        )
        val result = AlertDuringKhushuPolicy.evaluate(input)

        assertTrue("Sound must be silenced during Khushu", result.effectiveIsSilent)
        assertFalse("Sound URI must not be attached", result.soundUriRequired)
        assertEquals("Must route to silent postalert channel", AlertDuringKhushuPolicy.POSTALERT_SILENT_CHANNEL_ID, result.channelId)
        assertFalse("Must never schedule Khushu from postalert", result.shouldScheduleKhushu)
        assertEquals("muted_for_khushu", result.reason)
        assertEquals("sound muted for khushu", result.logDescription)
    }

    @Test
    fun customAlarmAudible_duringKhushu_isSilencedToCustomSilentChannel() {
        // Custom alarm configured with sound while Khushu is active
        val input = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "custom",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = true,
            autoKhushu = true
        )
        val result = AlertDuringKhushuPolicy.evaluate(input)

        assertTrue(result.effectiveIsSilent)
        assertFalse(result.soundUriRequired)
        assertEquals(AlertDuringKhushuPolicy.CUSTOM_ALARM_SILENT_CHANNEL_ID, result.channelId)
        assertFalse("Must not schedule additional Khushu while Khushu is already active", result.shouldScheduleKhushu)
        assertEquals("muted_for_khushu", result.reason)
        assertEquals("sound muted for khushu", result.logDescription)
    }

    @Test
    fun postAlertAudible_duringKhushu_isSilencedToPostAlertSilentChannel() {
        val input = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "takbeer",
            notifyMode = "sound",
            isKhushuActive = true
        )
        val result = AlertDuringKhushuPolicy.evaluate(input)

        assertTrue(result.effectiveIsSilent)
        assertFalse(result.soundUriRequired)
        assertEquals(AlertDuringKhushuPolicy.POSTALERT_SILENT_CHANNEL_ID, result.channelId)
        assertEquals("muted_for_khushu", result.reason)
    }

    @Test
    fun alertOutsideKhushu_followsNormalAudibleConfiguration() {
        // Postalert after Khushu has ended (isKhushuActive = false)
        val postInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = false
        )
        val postResult = AlertDuringKhushuPolicy.evaluate(postInput)

        assertFalse(postResult.effectiveIsSilent)
        assertTrue(postResult.soundUriRequired)
        assertEquals("${AlertDuringKhushuPolicy.POSTALERT_CHANNEL_ID}_reminder", postResult.channelId)
        assertEquals("normal_playback", postResult.reason)
        assertEquals("sound: reminder", postResult.logDescription)

        // Custom alarm outside Khushu with autoKhushu = true
        val customInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "custom",
            soundType = "fajr_short",
            notifyMode = "both",
            isKhushuActive = false,
            autoKhushu = true
        )
        val customResult = AlertDuringKhushuPolicy.evaluate(customInput)

        assertFalse(customResult.effectiveIsSilent)
        assertTrue(customResult.soundUriRequired)
        assertEquals("${AlertDuringKhushuPolicy.CUSTOM_ALARM_CHANNEL_ID}_fajr_short", customResult.channelId)
        assertTrue("Outside Khushu, custom alarm with autoKhushu=true schedules Khushu", customResult.shouldScheduleKhushu)
        assertEquals("normal_playback", customResult.reason)
    }

    @Test
    fun autoKhushuFalse_duringKhushu_neverSchedulesKhushu() {
        val input = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "custom",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = true,
            autoKhushu = false
        )
        val result = AlertDuringKhushuPolicy.evaluate(input)

        assertFalse(result.shouldScheduleKhushu)
        assertTrue(result.effectiveIsSilent)
    }

    @Test
    fun configuredSilentOrNotificationMode_preservesConfiguredSilentReason() {
        // Explicit silent soundType
        val silentInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "silent",
            notifyMode = "both",
            isKhushuActive = true
        )
        val silentResult = AlertDuringKhushuPolicy.evaluate(silentInput)
        assertTrue(silentResult.effectiveIsSilent)
        assertEquals("configured_silent", silentResult.reason)
        assertEquals("sound configured silent", silentResult.logDescription)

        // Explicit notification-only notifyMode
        val notifModeInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "custom",
            soundType = "reminder",
            notifyMode = "notification",
            isKhushuActive = true
        )
        val notifModeResult = AlertDuringKhushuPolicy.evaluate(notifModeInput)
        assertTrue(notifModeResult.effectiveIsSilent)
        assertEquals("configured_silent", notifModeResult.reason)
        assertEquals("sound configured silent", notifModeResult.logDescription)

        // Explicit vibrate soundType
        val vibrateInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "vibrate",
            notifyMode = "both",
            isKhushuActive = true
        )
        val vibrateResult = AlertDuringKhushuPolicy.evaluate(vibrateInput)
        assertTrue(vibrateResult.effectiveIsSilent)
        assertEquals("configured_silent", vibrateResult.reason)
    }

    @Test
    fun directVibrate_activeKhushuAndSilentRingerAndAudibleAlert_triggersDirectVibrate() {
        // Condition (1): Active Khushu + Silent Ringer (0) + Audible Alert ("reminder") -> true
        val input = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = true,
            ringerMode = 0
        )
        val result = AlertDuringKhushuPolicy.evaluate(input)
        assertTrue("Direct vibration must trigger for audible alert under silent ringer during Khushu", result.shouldTriggerDirectVibrate)
        assertTrue(result.effectiveIsSilent)
    }

    @Test
    fun directVibrate_configuredSilentOrVibrateOrNotification_neverTriggersDirectVibrate() {
        // Condition (2): Active Khushu + Silent Ringer (0), but soundType="silent" -> false
        val silentInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "silent",
            notifyMode = "both",
            isKhushuActive = true,
            ringerMode = 0
        )
        val silentResult = AlertDuringKhushuPolicy.evaluate(silentInput)
        assertFalse("Direct vibration must not trigger when soundType is silent", silentResult.shouldTriggerDirectVibrate)

        // soundType="vibrate" -> false
        val vibrateInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "vibrate",
            notifyMode = "both",
            isKhushuActive = true,
            ringerMode = 0
        )
        val vibrateResult = AlertDuringKhushuPolicy.evaluate(vibrateInput)
        assertFalse("Direct vibration must not trigger when soundType is vibrate", vibrateResult.shouldTriggerDirectVibrate)

        // notifyMode="notification" -> false
        val notifModeInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "custom",
            soundType = "reminder",
            notifyMode = "notification",
            isKhushuActive = true,
            ringerMode = 0
        )
        val notifResult = AlertDuringKhushuPolicy.evaluate(notifModeInput)
        assertFalse("Direct vibration must not trigger when notifyMode is notification only", notifResult.shouldTriggerDirectVibrate)
    }

    @Test
    fun directVibrate_unknownOrNonSilentRinger_neverTriggersDirectVibrate() {
        // Condition (3): ringerMode = -1 -> false
        val unknownRingerInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = true,
            ringerMode = -1
        )
        val unknownResult = AlertDuringKhushuPolicy.evaluate(unknownRingerInput)
        assertFalse("Direct vibration must not trigger when ringerMode is -1", unknownResult.shouldTriggerDirectVibrate)

        // ringerMode = 1 (RINGER_MODE_VIBRATE) -> false (channel vibrates natively)
        val vibrateRingerInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = true,
            ringerMode = 1
        )
        val vibrateRingerResult = AlertDuringKhushuPolicy.evaluate(vibrateRingerInput)
        assertFalse("Direct vibration must not trigger when ringerMode is vibrate (channel vibrates natively)", vibrateRingerResult.shouldTriggerDirectVibrate)

        // ringerMode = 2 (RINGER_MODE_NORMAL) -> false
        val normalRingerInput = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = true,
            ringerMode = 2
        )
        val normalResult = AlertDuringKhushuPolicy.evaluate(normalRingerInput)
        assertFalse("Direct vibration must not trigger when ringerMode is normal", normalResult.shouldTriggerDirectVibrate)
    }

    @Test
    fun directVibrate_inactiveKhushu_neverTriggersDirectVibrate() {
        // Khushu inactive -> false
        val input = AlertDuringKhushuPolicy.AlertPolicyInput(
            alarmType = "postalert",
            soundType = "reminder",
            notifyMode = "both",
            isKhushuActive = false,
            ringerMode = 0
        )
        val result = AlertDuringKhushuPolicy.evaluate(input)
        assertFalse("Direct vibration must not trigger when Khushu is inactive", result.shouldTriggerDirectVibrate)
    }
}
