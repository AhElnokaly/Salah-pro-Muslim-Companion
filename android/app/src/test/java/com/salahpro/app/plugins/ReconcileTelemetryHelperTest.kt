package com.salahpro.app.plugins

import org.junit.Assert.assertEquals
import org.junit.Test

class ReconcileTelemetryHelperTest {

    @Test
    fun scheduleFailureTracker_countsAllFailures_andCapsSampleAtFive() {
        val tracker = ScheduleFailureTracker(maxSampleSize = 5)

        tracker.recordFailure(4100, IllegalStateException("500 limit"))
        tracker.recordFailure(4101, SecurityException("exact alarm denied"))
        tracker.recordFailure(4102, IllegalStateException("500 limit"))
        tracker.recordFailure(4103, IllegalArgumentException("bad time"))
        tracker.recordFailure(4104, RuntimeException("generic"))
        tracker.recordFailure(4105, IllegalStateException("sixth should not enter sample"))
        tracker.recordFailure(4106, SecurityException("seventh should not enter sample"))

        assertEquals(7, tracker.failedCount)
        val sample = tracker.getSample()
        assertEquals(5, sample.size)
        assertEquals(ScheduleFailureSample(4100, "IllegalStateException"), sample[0])
        assertEquals(ScheduleFailureSample(4101, "SecurityException"), sample[1])
        assertEquals(ScheduleFailureSample(4104, "RuntimeException"), sample[4])
    }

    @Test
    fun computePiMissingBefore_calculatesMissingOverTotal_andZeroZeroOnEmptyLedger() {
        // Boot scenario: ledger was cleared beforehand -> intersection is empty -> 0/0 expected
        assertEquals("0/0", computePiMissingBefore(emptyList()) { true })

        val intersection = listOf(1001, 1002, 1003, 1004)
        val presentSet = setOf(1001, 1003)
        assertEquals("2/4", computePiMissingBefore(intersection) { it in presentSet })

        assertEquals("0/4", computePiMissingBefore(intersection) { true })
        assertEquals("4/4", computePiMissingBefore(intersection) { false })
    }
}
