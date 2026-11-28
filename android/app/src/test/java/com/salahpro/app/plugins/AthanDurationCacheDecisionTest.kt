package com.salahpro.app.plugins

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * JVM unit tests for Commit 2 pure duration cache decision helpers in AthanAlarmPlugin.
 */
class AthanDurationCacheDecisionTest {

    @Test
    fun durationPrefKeys_useCanonicalPrefix() {
        assertEquals("athan_duration_ms_", AthanAlarmPlugin.KEY_ATHAN_DURATION_PREFIX)
        assertEquals("athan_duration_sig_", AthanAlarmPlugin.KEY_ATHAN_DURATION_SIG_PREFIX)
        assertTrue(AthanAlarmPlugin.fileCacheDurationKey("/data/athan/fajr.audio").startsWith("athan_duration_ms_file_"))
    }

    @Test
    fun shouldRemeasureAthanDuration_cacheMissAndCorruptCachedValues_returnsTrue() {
        val path = "/data/user/0/com.salahpro.app/files/athan/fajr_default.audio"
        val size = 3_950_000L

        assertTrue(AthanAlarmPlugin.shouldRemeasureAthanDuration(path, size, null, null))
        assertTrue(AthanAlarmPlugin.shouldRemeasureAthanDuration(path, size, "", 245_900L))
        assertTrue(AthanAlarmPlugin.shouldRemeasureAthanDuration(path, size, "$size|$path", null))
        assertTrue(AthanAlarmPlugin.shouldRemeasureAthanDuration(path, size, "$size|$path", 0L))
        assertTrue(AthanAlarmPlugin.shouldRemeasureAthanDuration(path, size, "$size|$path", -100L))
    }

    @Test
    fun shouldRemeasureAthanDuration_samePathAndSameSize_returnsFalseCacheHit() {
        val path = "/data/user/0/com.salahpro.app/files/athan/asr.audio"
        val size = 3_210_400L
        val sig = AthanAlarmPlugin.buildDurationCacheSignature(path, size)

        assertFalse(
            "Exact path + size match must hit cache without remeasuring",
            AthanAlarmPlugin.shouldRemeasureAthanDuration(path, size, sig, 201_400L)
        )
    }

    @Test
    fun shouldRemeasureAthanDuration_sameFilenameDifferentSize_orDifferentPath_returnsTrue() {
        val path = "/data/user/0/com.salahpro.app/files/athan/makkah.audio"
        val oldSig = AthanAlarmPlugin.buildDurationCacheSignature(path, 2_400_000L)

        assertTrue(
            "Same path with different file size must trigger remeasurement",
            AthanAlarmPlugin.shouldRemeasureAthanDuration(path, 2_850_000L, oldSig, 153_500L)
        )

        val otherPath = "/data/user/0/com.salahpro.app/files/athan/madinah.audio"
        assertTrue(
            "Different path with identical byte size must trigger remeasurement",
            AthanAlarmPlugin.shouldRemeasureAthanDuration(otherPath, 2_400_000L, oldSig, 153_500L)
        )
    }

    @Test
    fun shouldRemeasureAthanDuration_missingOrEmptyFile_returnsFalse() {
        assertFalse(AthanAlarmPlugin.shouldRemeasureAthanDuration("", 1024L, null, null))
        assertFalse(AthanAlarmPlugin.shouldRemeasureAthanDuration("   ", 1024L, null, null))
        assertFalse(AthanAlarmPlugin.shouldRemeasureAthanDuration("/data/athan/missing.audio", 0L, null, null))
        assertFalse(AthanAlarmPlugin.shouldRemeasureAthanDuration("/data/athan/missing.audio", -1L, null, null))
    }

    @Test
    fun resolveReusableAthanDurationMs_prefersSlotHit_thenFileHit_thenNullOnSizeMismatch() {
        val path = "/data/user/0/com.salahpro.app/files/athan/maghrib.audio"
        val size = 3_300_000L
        val sig = AthanAlarmPlugin.buildDurationCacheSignature(path, size)

        // 1. Slot cache hit
        assertEquals(
            202_800L,
            AthanAlarmPlugin.resolveReusableAthanDurationMs(
                currentPath = path,
                currentSizeBytes = size,
                slotCachedSignature = sig,
                slotCachedDurationMs = 202_800L,
                fileCachedSignature = null,
                fileCachedDurationMs = null
            )
        )

        // 2. Slot changed to new file -> falls back to file cache hit
        assertEquals(
            202_800L,
            AthanAlarmPlugin.resolveReusableAthanDurationMs(
                currentPath = path,
                currentSizeBytes = size,
                slotCachedSignature = "111111|/data/athan/old.audio",
                slotCachedDurationMs = 153_500L,
                fileCachedSignature = sig,
                fileCachedDurationMs = 202_800L
            )
        )

        // 3. File replaced with same name and different size -> returns null (must remeasure)
        assertNull(
            AthanAlarmPlugin.resolveReusableAthanDurationMs(
                currentPath = path,
                currentSizeBytes = size + 512L,
                slotCachedSignature = sig,
                slotCachedDurationMs = 202_800L,
                fileCachedSignature = sig,
                fileCachedDurationMs = 202_800L
            )
        )
    }
}
