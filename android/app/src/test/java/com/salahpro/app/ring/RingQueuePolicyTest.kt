package com.salahpro.app.ring

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * JVM unit tests for Commit 1 (RingModels & RingQueuePolicy).
 */
class RingQueuePolicyTest {

    private fun makeRequest(
        id: String,
        alarmType: String,
        minuteBucket: Long = 1000L,
        listOrder: Int = 0,
        createdAtMs: Long = 60_000_000L,
        notifyMode: String = "both",
        soundType: String = "reminder",
        soundSource: RingAudioSource = RingAudioSource.RawResource("reminder"),
        measuredDurationMs: Long? = null,
        scheduledTimeMs: Long = minuteBucket * 60_000L
    ): RingRequest {
        return RingRequest(
            requestId = "req_$id",
            triggerId = "trig_$id",
            alarmType = alarmType,
            listOrder = listOrder,
            scheduledMinuteBucket = minuteBucket,
            createdAtMs = createdAtMs,
            soundSource = soundSource,
            notifyMode = notifyMode,
            measuredDurationMs = measuredDurationMs,
            title = "Title $id",
            soundType = soundType,
            scheduledTimeMs = scheduledTimeMs
        )
    }

    @Test
    fun approvedConstantsAndFadeInDefaults_matchPlan() {
        assertEquals(2_000L, RingConstants.GAP_AFTER_MS)
        assertEquals(600_000L, RingConstants.DHIKR_MAX_DEFER_MS)
        assertEquals(1_500L, RingConstants.DEFAULT_ATHAN_FADE_IN_MS)
        assertEquals(500L, RingConstants.DEFAULT_CUSTOM_FADE_IN_MS)
        assertEquals(240_000L, RingConstants.DEFAULT_ATHAN_EXPECTED_DURATION_MS)
        assertEquals(30_000L, RingConstants.SAFETY_TIMEOUT_PADDING_MS)
        assertEquals("ring_coordinator_enabled", RingConstants.PREF_RING_COORDINATOR_ENABLED)

        val athan = makeRequest("a", "athan")
        val custom = makeRequest("c", "custom")
        val prealert = makeRequest("p", "prealert")
        val dhikr = makeRequest("d", "dhikr")

        assertEquals(1_500L, athan.fadeInMs)
        assertEquals(500L, custom.fadeInMs)
        assertEquals(500L, prealert.fadeInMs)
        assertEquals(0L, dhikr.fadeInMs)
    }

    @Test
    fun safetyTimeout_usesMeasuredPlus30s_orDefault240sPlus30sForUnmeasuredAthan() {
        val measuredAthan = makeRequest("a1", "athan", measuredDurationMs = 185_000L)
        assertEquals(215_000L, measuredAthan.resolveSafetyTimeoutMs())

        val unmeasuredAthan = makeRequest("a2", "athan", measuredDurationMs = null)
        assertEquals(270_000L, unmeasuredAthan.resolveSafetyTimeoutMs())

        val measuredCustom = makeRequest("c1", "custom", measuredDurationMs = 10_000L)
        assertEquals(40_000L, measuredCustom.resolveSafetyTimeoutMs())

        val unmeasuredCustom = makeRequest("c2", "custom", measuredDurationMs = null)
        assertEquals(90_000L, unmeasuredCustom.resolveSafetyTimeoutMs())
    }

    @Test
    fun customActive_whenAthanArrives_preemptsCustomAndReEnqueuesItDeferred() {
        val t0 = 60_000_000L
        val custom = makeRequest("custom_1", "custom", createdAtMs = t0)
        val athan = makeRequest("asr", "athan", createdAtMs = t0 + 2_000L, scheduledTimeMs = t0 + 2_000L)

        val decision = RingQueuePolicy.decideIncoming(
            currentActive = custom,
            newRequest = athan,
            queue = emptyList(),
            nowMs = t0 + 2_000L
        )

        assertEquals(RingOutcome.PLAYED, decision.outcome)
        assertTrue(decision.shouldStopCurrentImmediately)
        assertTrue(decision.shouldStartNewImmediately)
        assertEquals(athan, decision.activeRequest)
        assertEquals(custom, decision.preemptedRequest)
        assertEquals(1, decision.updatedQueue.size)
        assertEquals(custom.triggerId, decision.updatedQueue.first().triggerId)

        val popped = RingQueuePolicy.popNextPlayable(decision.updatedQueue, nowMs = t0 + 180_000L)
        assertEquals(custom.triggerId, popped.nextRequest?.triggerId)
        assertTrue(popped.remainingQueue.isEmpty())
    }

    @Test
    fun athanActive_whenCustomArrives_defersCustomInQueue() {
        val t0 = 60_000_000L
        val athan = makeRequest("asr", "athan", createdAtMs = t0, scheduledTimeMs = t0)
        val custom = makeRequest("custom_1", "custom", createdAtMs = t0 + 500L)

        val decision = RingQueuePolicy.decideIncoming(
            currentActive = athan,
            newRequest = custom,
            queue = emptyList(),
            nowMs = t0 + 500L
        )

        assertEquals(RingOutcome.DEFERRED, decision.outcome)
        assertFalse(decision.shouldStopCurrentImmediately)
        assertFalse(decision.shouldStartNewImmediately)
        assertEquals(athan, decision.activeRequest)
        assertEquals(1, decision.updatedQueue.size)
        assertEquals(custom.triggerId, decision.updatedQueue.first().triggerId)
    }

    @Test
    fun fourPriorityLevels_andSameMinuteListOrder_areRespectedDeterministically() {
        val baseBucket = 1000L
        val t0 = baseBucket * 60_000L

        val dhikr = makeRequest("dhikr", "dhikr", minuteBucket = baseBucket, listOrder = 0, createdAtMs = t0)
        val prealert = makeRequest("pre", "prealert", minuteBucket = baseBucket, listOrder = 0, createdAtMs = t0 + 10)
        val customB = makeRequest("cB", "custom", minuteBucket = baseBucket, listOrder = 1, createdAtMs = t0 + 5)
        val customA = makeRequest("cA", "custom", minuteBucket = baseBucket, listOrder = 0, createdAtMs = t0 + 20)
        val athan = makeRequest("fajr", "athan", minuteBucket = baseBucket, listOrder = 0, createdAtMs = t0 + 30)

        // Enqueue in reverse / mixed order while another athan is active
        val sorted = listOf(dhikr, prealert, customB, customA, athan).sortedWith(RingQueuePolicy.queueComparator)

        assertEquals(
            listOf("trig_fajr", "trig_cA", "trig_cB", "trig_pre", "trig_dhikr"),
            sorted.map { it.triggerId }
        )
    }

    @Test
    fun dhikrDeferredWithin10MinutesPlays_andOver10MinutesIsSkippedWithNextItemPopped() {
        val t0 = 60_000_000L
        val dhikr = makeRequest("dhikr_1", "dhikr", createdAtMs = t0)
        val postalert = makeRequest("post_1", "postalert", createdAtMs = t0 + 1_000L)

        // Exactly at 600_000ms (not expired yet)
        val atBoundary = RingQueuePolicy.popNextPlayable(listOf(dhikr), nowMs = t0 + 600_000L)
        assertEquals(dhikr.triggerId, atBoundary.nextRequest?.triggerId)
        assertTrue(atBoundary.skippedRequests.isEmpty())

        // Past 600_000ms: expired -> SKIPPED, no next item
        val expiredOnly = RingQueuePolicy.popNextPlayable(listOf(dhikr), nowMs = t0 + 600_001L)
        assertNull(expiredOnly.nextRequest)
        assertEquals(1, expiredOnly.skippedRequests.size)
        assertEquals(RingOutcome.SKIPPED, expiredOnly.skippedRequests.first().outcome)
        assertEquals("dhikr_defer_expired_10m", expiredOnly.skippedRequests.first().reason)

        // Expired dhikr in queue alongside non-expiring postalert -> skips dhikr and pops postalert
        val mixedQueue = listOf(postalert, dhikr)
        val poppedMixed = RingQueuePolicy.popNextPlayable(mixedQueue, nowMs = t0 + 600_001L)
        assertEquals(postalert.triggerId, poppedMixed.nextRequest?.triggerId)
        assertTrue(poppedMixed.remainingQueue.isEmpty())
        assertEquals(1, poppedMixed.skippedRequests.size)
        assertEquals("dhikr_defer_expired_10m", poppedMixed.skippedRequests.first().reason)
        val dhikrFresh = makeRequest("dhikr_2", "dhikr", createdAtMs = t0 + 500_000L)
        val twoDhikr = RingQueuePolicy.popNextPlayable(listOf(dhikr, dhikrFresh), nowMs = t0 + 600_001L)
        assertEquals(dhikrFresh.triggerId, twoDhikr.nextRequest?.triggerId)
        assertEquals(1, twoDhikr.skippedRequests.size)
        assertEquals("dhikr_defer_expired_10m", twoDhikr.skippedRequests.first().reason)
    }

    @Test
    fun silentAndNotificationOnly_andDuplicatesAndStaleAthan_areSkipped() {
        val t0 = 60_000_000L
        val notifOnly = makeRequest("n1", "custom", notifyMode = "notification", createdAtMs = t0)
        val soundSilent = makeRequest("s1", "custom", soundType = "silent", createdAtMs = t0)
        val soundVibrate = makeRequest("v1", "custom", soundType = "vibrate", createdAtMs = t0)
        val sourceSilent = makeRequest("ss1", "custom", soundSource = RingAudioSource.Silent, createdAtMs = t0)

        listOf(notifOnly, soundSilent, soundVibrate, sourceSilent).forEach { req ->
            val res = RingQueuePolicy.decideIncoming(null, req, emptyList(), nowMs = t0)
            assertEquals(RingOutcome.SKIPPED, res.outcome)
            assertFalse(res.shouldStartNewImmediately)
        }

        val activeAthan = makeRequest("asr", "athan", createdAtMs = t0, scheduledTimeMs = t0)
        val dupActive = RingQueuePolicy.decideIncoming(activeAthan, activeAthan.copy(requestId = "req_dup"), emptyList(), nowMs = t0 + 1_000L)
        assertEquals(RingOutcome.SKIPPED, dupActive.outcome)

        val dupCompleted = RingQueuePolicy.decideIncoming(null, activeAthan, emptyList(), nowMs = t0 + 1_000L, completedTriggerIds = setOf(activeAthan.triggerId))
        assertEquals(RingOutcome.SKIPPED, dupCompleted.outcome)

        val staleAthan = makeRequest("dhuhr", "athan", createdAtMs = t0, scheduledTimeMs = t0)
        val staleRes = RingQueuePolicy.decideIncoming(null, staleAthan, emptyList(), nowMs = t0 + RingConstants.DEFAULT_STALE_ATHAN_WINDOW_MS + 1L)
        assertEquals(RingOutcome.SKIPPED, staleRes.outcome)
        assertEquals("stale_athan", staleRes.reason)
    }

    @Test
    fun dhikrActive_preemptedByAthanAt700sAfterCreated_playsWhenPoppedOneSecondLater() {
        val t0 = 60_000_000L
        val dhikr = makeRequest("dhikr_active", "dhikr", createdAtMs = t0)
        assertNull(dhikr.enqueuedAtMs)

        val preemptAt = t0 + 700_000L // 700s after createdAt (> 600_000ms limit from creation)
        val athan = makeRequest("maghrib", "athan", createdAtMs = preemptAt, scheduledTimeMs = preemptAt)

        val preemptDecision = RingQueuePolicy.decideIncoming(
            currentActive = dhikr,
            newRequest = athan,
            queue = emptyList(),
            nowMs = preemptAt
        )

        assertEquals(RingOutcome.PLAYED, preemptDecision.outcome)
        assertTrue(preemptDecision.shouldStopCurrentImmediately)
        assertEquals(preemptAt, preemptDecision.preemptedRequest?.enqueuedAtMs)
        assertEquals(1, preemptDecision.updatedQueue.size)
        assertEquals(preemptAt, preemptDecision.updatedQueue.first().enqueuedAtMs)

        // 1 second after preemption (701s after createdAt): must play, NOT expire
        val popAt = preemptAt + 1_000L
        val popped = RingQueuePolicy.popNextPlayable(preemptDecision.updatedQueue, nowMs = popAt)
        assertEquals(dhikr.triggerId, popped.nextRequest?.triggerId)
        assertTrue(popped.skippedRequests.isEmpty())

        // Expiry is still enforced 600_001ms after deferral timestamp
        val expiredLater = RingQueuePolicy.popNextPlayable(preemptDecision.updatedQueue, nowMs = preemptAt + 600_001L)
        assertNull(expiredLater.nextRequest)
        assertEquals(1, expiredLater.skippedRequests.size)
        assertEquals("dhikr_defer_expired_10m", expiredLater.skippedRequests.first().reason)
    }

    @Test
    fun unknownAlarmType_khushu_returnsErrorWithUnknownAlarmTypeReason() {
        val t0 = 60_000_000L
        assertNull(RingPriority.fromAlarmType("khushu"))

        val khushuReq = makeRequest("khushu_1", "khushu", createdAtMs = t0)
        assertNull(khushuReq.priority)

        val decision = RingQueuePolicy.decideIncoming(
            currentActive = null,
            newRequest = khushuReq,
            queue = emptyList(),
            nowMs = t0
        )

        assertEquals(RingOutcome.ERROR, decision.outcome)
        assertEquals("unknown_alarm_type", decision.reason)
        assertNull(decision.activeRequest)
        assertFalse(decision.shouldStartNewImmediately)
        assertFalse(decision.shouldStopCurrentImmediately)
        assertTrue(decision.updatedQueue.isEmpty())
    }

    @Test
    fun twoCustomAlarms_samePriorityAndMinute_firstTakesTurnAndSecondIsDeferred() {
        val bucket = 1000L
        val t0 = bucket * 60_000L
        val firstCustom = makeRequest("custom_first", "custom", minuteBucket = bucket, listOrder = 0, createdAtMs = t0)
        val secondCustom = makeRequest("custom_second", "custom", minuteBucket = bucket, listOrder = 1, createdAtMs = t0)

        val firstDecision = RingQueuePolicy.decideIncoming(
            currentActive = null,
            newRequest = firstCustom,
            queue = emptyList(),
            nowMs = t0
        )
        assertEquals(RingOutcome.PLAYED, firstDecision.outcome)
        assertTrue(firstDecision.shouldStartNewImmediately)
        assertEquals(firstCustom.triggerId, firstDecision.activeRequest?.triggerId)

        val secondArriveAt = t0 + 100L
        val secondDecision = RingQueuePolicy.decideIncoming(
            currentActive = firstDecision.activeRequest,
            newRequest = secondCustom,
            queue = firstDecision.updatedQueue,
            nowMs = secondArriveAt
        )
        assertEquals(RingOutcome.DEFERRED, secondDecision.outcome)
        assertFalse(secondDecision.shouldStartNewImmediately)
        assertFalse(secondDecision.shouldStopCurrentImmediately)
        assertEquals(firstCustom.triggerId, secondDecision.activeRequest?.triggerId)
        assertEquals(1, secondDecision.updatedQueue.size)
        assertEquals(secondCustom.triggerId, secondDecision.updatedQueue.first().triggerId)
        assertEquals(secondArriveAt, secondDecision.updatedQueue.first().enqueuedAtMs)

        val nextUp = RingQueuePolicy.popNextPlayable(secondDecision.updatedQueue, nowMs = t0 + 5_000L)
        assertEquals(secondCustom.triggerId, nextUp.nextRequest?.triggerId)
        assertTrue(nextUp.remainingQueue.isEmpty())
    }
}
