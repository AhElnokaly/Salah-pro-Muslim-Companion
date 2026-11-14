package com.salahpro.app.plugins

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AthanAlarmCancelPrefixTest {

    @Test
    fun matchesAlarmId_exactPrefix_alarmBeforeSalah() {
        // Matches exact prefix for standard prayer relative alarms
        assertTrue(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_before_salah",
                "custom_alarm_before_salah_fajr_1773720000000",
                "custom"
            )
        )

        // Matches exact prefix for snooze alarms of alarm_before_salah
        assertTrue(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_before_salah",
                "custom_snooze_alarm_before_salah_snooze_123_1773720000000",
                "custom"
            )
        )

        // Matches snoozeOf field for legacy snoozes
        assertTrue(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_before_salah",
                "custom_snooze_legacy_1773720000000",
                "custom",
                snoozeOf = "alarm_before_salah"
            )
        )

        // Does NOT match substring in user custom alarm
        assertFalse(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_before_salah",
                "custom_my_alarm_before_salah_test_1773720000000",
                "custom"
            )
        )

        // Does NOT match other alarms
        assertFalse(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_before_salah",
                "custom_alarm_duha_sunrise_1773720000000",
                "custom"
            )
        )
    }

    @Test
    fun matchesAlarmId_exactPrefix_alarmAfterSalah() {
        // Matches exact prefix for standard prayer relative alarms
        assertTrue(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_after_salah",
                "custom_alarm_after_salah_dhuhr_1773720000000",
                "custom"
            )
        )

        // Matches exact prefix for snooze alarms of alarm_after_salah
        assertTrue(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_after_salah",
                "custom_snooze_alarm_after_salah_snooze_456_1773720000000",
                "custom"
            )
        )

        // Matches snoozeOf field for legacy snoozes
        assertTrue(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_after_salah",
                "custom_snooze_legacy_1773720000000",
                "custom",
                snoozeOf = "alarm_after_salah"
            )
        )

        // Does NOT match substring in user custom alarm
        assertFalse(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_after_salah",
                "custom_user_alarm_after_salah_note_1773720000000",
                "custom"
            )
        )

        // Does NOT match other alarms
        assertFalse(
            AthanAlarmPlugin.matchesAlarmId(
                "alarm_after_salah",
                "custom_alarm_evening_adhkar_asr_1773720000000",
                "custom"
            )
        )
    }
}
