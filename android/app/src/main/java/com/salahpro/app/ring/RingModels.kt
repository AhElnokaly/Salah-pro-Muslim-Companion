package com.salahpro.app.ring

/**
 * Pure constants, enums, audio sources, requests, and events for Task 10 (RingCoordinator).
 * Free of Android Context/Framework dependencies so all policy logic runs directly in JVM tests.
 */
object RingConstants {
    const val GAP_AFTER_MS = 2_000L
    const val DHIKR_MAX_DEFER_MS = 600_000L // 10 minutes
    const val DEFAULT_ATHAN_FADE_IN_MS = 1_500L
    const val DEFAULT_CUSTOM_FADE_IN_MS = 500L
    const val DEFAULT_ATHAN_EXPECTED_DURATION_MS = 240_000L // 4 minutes (unmeasured athan only)
    const val DEFAULT_CUSTOM_EXPECTED_DURATION_MS = 60_000L
    const val SAFETY_TIMEOUT_PADDING_MS = 30_000L
    const val COALESCE_WINDOW_MS = 200L
    const val DEFAULT_STALE_ATHAN_WINDOW_MS = 180_000L // 3 minutes
    const val PREF_RING_COORDINATOR_ENABLED = "ring_coordinator_enabled"
}

enum class RingPriority(val rank: Int) {
    ATHAN(4),
    CUSTOM_ALARM(3),
    PRE_POST_ATHAN(2),
    DHIKR(1);

    companion object {
        fun fromAlarmType(alarmType: String): RingPriority? = when (alarmType.lowercase().trim()) {
            "athan" -> ATHAN
            "custom" -> CUSTOM_ALARM
            "prealert", "postalert" -> PRE_POST_ATHAN
            "dhikr" -> DHIKR
            else -> null
        }
    }
}

enum class RingOutcome {
    PLAYED,
    DEFERRED,
    SKIPPED,
    ERROR
}

sealed class RingAudioSource {
    object Silent : RingAudioSource()
    object SystemDefaultAlarm : RingAudioSource()
    data class RawResource(val rawName: String) : RingAudioSource()
    data class LocalFile(val filePath: String) : RingAudioSource()
}

enum class RingEventType {
    AUDIO_STARTED,
    AUDIO_COMPLETED
}

data class RingEvent(
    val type: RingEventType,
    val requestId: String,
    val triggerId: String,
    val alarmType: String,
    val timestampMs: Long,
    val reason: String = ""
)

data class RingRequest(
    val requestId: String,
    val triggerId: String,
    val alarmType: String, // "athan" | "custom" | "prealert" | "postalert" | "dhikr"
    val listOrder: Int = 0,
    val scheduledMinuteBucket: Long,
    val createdAtMs: Long,
    val soundSource: RingAudioSource,
    val notifyMode: String = "both", // "both" | "sound" | "notification" | "silent"
    val fadeInMs: Long = defaultFadeInMs(alarmType),
    val measuredDurationMs: Long? = null,
    val title: String,
    val body: String = "",
    val isFajr: Boolean = false,
    val prayerKey: String = "",
    val soundType: String = "",
    val scheduledTimeMs: Long = scheduledMinuteBucket * 60_000L,
    val enqueuedAtMs: Long? = null
) {
    val priority: RingPriority?
        get() = RingPriority.fromAlarmType(alarmType)

    fun resolveSafetyTimeoutMs(): Long {
        val baseMs = measuredDurationMs ?: if (priority == RingPriority.ATHAN) {
            RingConstants.DEFAULT_ATHAN_EXPECTED_DURATION_MS
        } else {
            RingConstants.DEFAULT_CUSTOM_EXPECTED_DURATION_MS
        }
        return baseMs + RingConstants.SAFETY_TIMEOUT_PADDING_MS
    }

    companion object {
        fun defaultFadeInMs(alarmType: String): Long = when (alarmType.lowercase().trim()) {
            "athan" -> RingConstants.DEFAULT_ATHAN_FADE_IN_MS
            "custom", "prealert", "postalert" -> RingConstants.DEFAULT_CUSTOM_FADE_IN_MS
            else -> 0L
        }
    }
}
