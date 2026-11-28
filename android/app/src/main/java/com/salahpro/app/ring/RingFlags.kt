package com.salahpro.app.ring

import android.content.Context
import android.content.SharedPreferences

/**
 * Pure boolean preference store seam so RingFlags can be unit-tested in plain JVM JUnit
 * without Android Context or Robolectric.
 */
interface RingFlagStore {
    fun getBoolean(key: String, defaultValue: Boolean): Boolean
    fun putBoolean(key: String, value: Boolean)
    fun remove(key: String)
}

class SharedPrefsRingFlagStore(
    private val prefs: SharedPreferences
) : RingFlagStore {
    override fun getBoolean(key: String, defaultValue: Boolean): Boolean =
        prefs.getBoolean(key, defaultValue)

    override fun putBoolean(key: String, value: Boolean) {
        prefs.edit().putBoolean(key, value).apply()
    }

    override fun remove(key: String) {
        prefs.edit().remove(key).apply()
    }
}

/**
 * Single authoritative reader/writer for Task 10 feature flags.
 * Default is strictly false so legacy audio/alarm paths stay untouched until explicitly enabled.
 */
object RingFlags {
    const val PREFS_NAME = "AthanAlarmPrefs"
    const val DEFAULT_RING_COORDINATOR_ENABLED = false

    private fun store(context: Context): RingFlagStore {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return SharedPrefsRingFlagStore(prefs)
    }

    @JvmStatic
    fun isCoordinatorEnabled(store: RingFlagStore): Boolean =
        store.getBoolean(RingConstants.PREF_RING_COORDINATOR_ENABLED, DEFAULT_RING_COORDINATOR_ENABLED)

    @JvmStatic
    fun setCoordinatorEnabled(store: RingFlagStore, enabled: Boolean) {
        store.putBoolean(RingConstants.PREF_RING_COORDINATOR_ENABLED, enabled)
    }

    @JvmStatic
    fun resetCoordinatorEnabled(store: RingFlagStore) {
        store.remove(RingConstants.PREF_RING_COORDINATOR_ENABLED)
    }

    @JvmStatic
    fun isCoordinatorEnabled(context: Context): Boolean =
        isCoordinatorEnabled(store(context))

    @JvmStatic
    fun setCoordinatorEnabled(context: Context, enabled: Boolean) {
        setCoordinatorEnabled(store(context), enabled)
    }

    @JvmStatic
    fun resetCoordinatorEnabled(context: Context) {
        resetCoordinatorEnabled(store(context))
    }
}
