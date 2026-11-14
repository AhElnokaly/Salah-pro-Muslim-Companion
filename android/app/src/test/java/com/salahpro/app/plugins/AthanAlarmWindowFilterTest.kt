package com.salahpro.app.plugins

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * JVM unit test for pure window-filtering logic in AthanAlarmPlugin.
 * Tests isAlarmInActiveWindow with plain Long timestamps.
 * No Android SDK stub or org.json dependencies required.
 */
class AthanAlarmWindowFilterTest {

    @Test
    fun isAlarmInActiveWindow_filtersExpiredAndBeyondWindow() {
        val now = 1773720000000L
        val oneDayMs = 86400000L

        // 1. Expired alarm (in the past) -> false
        assertFalse(
            "Alarm in the past must be excluded",
            AthanAlarmPlugin.isAlarmInActiveWindow(now - 1000L, now, 14L)
        )

        // 2. Exact current moment -> false (must be strictly > now)
        assertFalse(
            "Alarm at exact current moment must be excluded",
            AthanAlarmPlugin.isAlarmInActiveWindow(now, now, 14L)
        )

        // 3. Near future (Day 1) -> true
        assertTrue(
            "Alarm at day 1 must be within 14-day window",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + oneDayMs, now, 14L)
        )

        // 4. Day 7 -> true
        assertTrue(
            "Alarm at day 7 must be within 14-day window",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + (7 * oneDayMs), now, 14L)
        )

        // 5. Day 14 (exact boundary) -> true
        assertTrue(
            "Alarm at exact 14-day boundary must be within 14-day window",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + (14 * oneDayMs), now, 14L)
        )

        // 6. Day 14 + 1ms (beyond window) -> false
        assertFalse(
            "Alarm 1ms beyond 14-day boundary must be excluded",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + (14 * oneDayMs) + 1L, now, 14L)
        )

        // 7. Day 15 -> false
        assertFalse(
            "Alarm at day 15 must be excluded from 14-day window",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + (15 * oneDayMs), now, 14L)
        )

        // 8. Day 30 -> false
        assertFalse(
            "Alarm at day 30 must be excluded from 14-day window",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + (30 * oneDayMs), now, 14L)
        )
    }

    @Test
    fun isAlarmInActiveWindow_customWindowDays() {
        val now = 1773720000000L
        val oneDayMs = 86400000L

        // Day 3 inside 7-day window
        assertTrue(
            "Day 3 alarm must be inside 7-day window",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + (3 * oneDayMs), now, 7L)
        )

        // Day 9 outside 7-day window
        assertFalse(
            "Day 9 alarm must be outside 7-day window",
            AthanAlarmPlugin.isAlarmInActiveWindow(now + (9 * oneDayMs), now, 7L)
        )
    }
}
