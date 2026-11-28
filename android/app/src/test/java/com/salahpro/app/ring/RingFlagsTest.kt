package com.salahpro.app.ring

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * JVM unit tests for Commit 3a (RingFlags).
 */
class RingFlagsTest {

    private class InMemoryFlagStore : RingFlagStore {
        val values = mutableMapOf<String, Boolean>()

        override fun getBoolean(key: String, defaultValue: Boolean): Boolean =
            values[key] ?: defaultValue

        override fun putBoolean(key: String, value: Boolean) {
            values[key] = value
        }

        override fun remove(key: String) {
            values.remove(key)
        }
    }

    @Test
    fun coordinatorFlag_defaultsToFalse_whenUnset() {
        val store = InMemoryFlagStore()
        assertEquals("AthanAlarmPrefs", RingFlags.PREFS_NAME)
        assertEquals("ring_coordinator_enabled", RingConstants.PREF_RING_COORDINATOR_ENABLED)
        assertFalse(RingFlags.isCoordinatorEnabled(store))
    }

    @Test
    fun coordinatorFlag_returnsTrueAfterSet_andFalseAfterReset() {
        val store = InMemoryFlagStore()
        assertFalse(RingFlags.isCoordinatorEnabled(store))

        RingFlags.setCoordinatorEnabled(store, true)
        assertTrue(RingFlags.isCoordinatorEnabled(store))
        assertEquals(true, store.values[RingConstants.PREF_RING_COORDINATOR_ENABLED])

        RingFlags.resetCoordinatorEnabled(store)
        assertFalse(RingFlags.isCoordinatorEnabled(store))
        assertFalse(store.values.containsKey(RingConstants.PREF_RING_COORDINATOR_ENABLED))
    }

    @Test
    fun coordinatorFlag_setFalseExplicitly_returnsFalse() {
        val store = InMemoryFlagStore()
        RingFlags.setCoordinatorEnabled(store, true)
        assertTrue(RingFlags.isCoordinatorEnabled(store))

        RingFlags.setCoordinatorEnabled(store, false)
        assertFalse(RingFlags.isCoordinatorEnabled(store))
    }
}
