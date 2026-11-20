package com.salahpro.app.plugins

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class KhushuActivationCoordinatorTest {

    @Test
    fun alreadyActive_returnsAlreadyActive_andTouchesNothing() {
        var scheduleCalled = false
        var mutingCalled = false
        var cancelCalled = false
        var rollbackCalled = false
        var persistCalled = false

        val coordinator = KhushuActivationCoordinator(
            isAlreadyActive = { true },
            scheduleRestore = { _ -> scheduleCalled = true; true },
            cancelRestore = { cancelCalled = true },
            applyMuting = { _ -> mutingCalled = true; true },
            rollbackMuting = { rollbackCalled = true },
            persistState = { _, _ -> persistCalled = true },
            clearState = {}
        )

        val result = coordinator.execute("silent", 15)

        assertEquals(KhushuActivationResult.ALREADY_ACTIVE, result)
        assertFalse("Schedule should NOT be called if already active", scheduleCalled)
        assertFalse("Muting should NOT be called if already active", mutingCalled)
        assertFalse("Cancel restore should NOT be called if already active", cancelCalled)
        assertFalse("Rollback should NOT be called if already active", rollbackCalled)
        assertFalse("Persist should NOT be called if already active", persistCalled)
    }

    @Test
    fun scheduleFails_abortsImmediately_doesNotTouchMuting() {
        var mutingCalled = false
        var cancelCalled = false
        var rollbackCalled = false
        var persistCalled = false

        val coordinator = KhushuActivationCoordinator(
            isAlreadyActive = { false },
            scheduleRestore = { _ -> false }, // Scheduling failed
            cancelRestore = { cancelCalled = true },
            applyMuting = { _ -> mutingCalled = true; true },
            rollbackMuting = { rollbackCalled = true },
            persistState = { _, _ -> persistCalled = true },
            clearState = {}
        )

        val result = coordinator.execute("silent", 15)

        assertEquals(KhushuActivationResult.SCHEDULE_FAILED, result)
        assertFalse("Muting must NOT be touched if scheduling failed", mutingCalled)
        assertFalse("No need to cancel restore if scheduling never succeeded", cancelCalled)
        assertFalse("No rollback needed if muting was never modified", rollbackCalled)
        assertFalse("State should not be persisted", persistCalled)
    }

    @Test
    fun mutingFails_triggersRollback_cancelsAlarmAndRestoresMuting() {
        var cancelCalled = false
        var rollbackCalled = false
        var clearCalled = false
        var persistCalled = false

        val coordinator = KhushuActivationCoordinator(
            isAlreadyActive = { false },
            scheduleRestore = { _ -> true }, // Scheduling succeeded
            cancelRestore = { cancelCalled = true },
            applyMuting = { _ -> false }, // Muting failed
            rollbackMuting = { rollbackCalled = true },
            persistState = { _, _ -> persistCalled = true },
            clearState = { clearCalled = true }
        )

        val result = coordinator.execute("silent", 15)

        assertEquals(KhushuActivationResult.MUTING_FAILED, result)
        assertTrue("Scheduled alarm must be cancelled on muting failure", cancelCalled)
        assertTrue("Rollback muting must be invoked to restore original audio state", rollbackCalled)
        assertTrue("Clear state must be invoked to clean any partial state", clearCalled)
        assertFalse("State must not be persisted on failure", persistCalled)
    }

    @Test
    fun mutingThrows_triggersRollback_cancelsAlarmAndRestoresMuting() {
        var cancelCalled = false
        var rollbackCalled = false
        var clearCalled = false

        val coordinator = KhushuActivationCoordinator(
            isAlreadyActive = { false },
            scheduleRestore = { _ -> true },
            cancelRestore = { cancelCalled = true },
            applyMuting = { _ -> throw SecurityException("Simulated DND failure") },
            rollbackMuting = { rollbackCalled = true },
            persistState = { _, _ -> },
            clearState = { clearCalled = true }
        )

        val result = coordinator.execute("silent", 15)

        assertEquals(KhushuActivationResult.MUTING_FAILED, result)
        assertTrue("Scheduled alarm must be cancelled when muting throws", cancelCalled)
        assertTrue("Rollback muting must be invoked when muting throws", rollbackCalled)
        assertTrue("Clear state must be invoked when muting throws", clearCalled)
    }

    @Test
    fun happyPath_executesInOrder_schedules_mutes_persists() {
        val order = mutableListOf<String>()

        val coordinator = KhushuActivationCoordinator(
            isAlreadyActive = { false },
            scheduleRestore = { _ -> order.add("schedule"); true },
            cancelRestore = { order.add("cancel") },
            applyMuting = { _ -> order.add("mute"); true },
            rollbackMuting = { order.add("rollback") },
            persistState = { _, _ -> order.add("persist") },
            clearState = { order.add("clear") }
        )

        val result = coordinator.execute("silent", 15)

        assertEquals(KhushuActivationResult.ACTIVATED, result)
        assertEquals(listOf("schedule", "mute", "persist"), order)
    }
}
