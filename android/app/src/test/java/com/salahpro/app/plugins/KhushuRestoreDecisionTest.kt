package com.salahpro.app.plugins

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class KhushuRestoreDecisionTest {

    @Test
    fun api31Plus_withExactPermission_usesExact() {
        val decision = KhushuRestoreDecision.decideRestoreMethod(sdkInt = 31, canScheduleExact = true)
        assertEquals(RestoreScheduleMethod.EXACT_AND_ALLOW_WHILE_IDLE, decision.method)
        assertTrue(decision.isExact)
    }

    @Test
    fun api31Plus_withoutExactPermission_fallsBackToInexact() {
        val decision = KhushuRestoreDecision.decideRestoreMethod(sdkInt = 34, canScheduleExact = false)
        assertEquals(RestoreScheduleMethod.FALLBACK_INEXACT_ALLOW_WHILE_IDLE, decision.method)
        assertFalse(decision.isExact)
    }

    @Test
    fun api30_usesExactDirectlyWithoutPermissionConstraint() {
        val decision = KhushuRestoreDecision.decideRestoreMethod(sdkInt = 30, canScheduleExact = false)
        assertEquals(RestoreScheduleMethod.EXACT_AND_ALLOW_WHILE_IDLE, decision.method)
        assertTrue(decision.isExact)
    }

    @Test
    fun api24_usesExactDirectly() {
        val decision = KhushuRestoreDecision.decideRestoreMethod(sdkInt = 24, canScheduleExact = false)
        assertEquals(RestoreScheduleMethod.EXACT_AND_ALLOW_WHILE_IDLE, decision.method)
        assertTrue(decision.isExact)
    }
}
