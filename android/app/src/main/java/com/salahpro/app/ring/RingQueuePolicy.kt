package com.salahpro.app.ring

/**
 * Pure queue, preemption, deduplication, and DHIKR expiry decision policy for RingCoordinator.
 * Independent of Android Context for deterministic JVM unit testing.
 */
object RingQueuePolicy {

    val queueComparator: Comparator<RingRequest> = Comparator { a, b ->
        // 1. priority DESC
        val priorityCmp = (b.priority?.rank ?: 0).compareTo(a.priority?.rank ?: 0)
        if (priorityCmp != 0) return@Comparator priorityCmp

        // 2. scheduledMinuteBucket ASC
        val minuteCmp = a.scheduledMinuteBucket.compareTo(b.scheduledMinuteBucket)
        if (minuteCmp != 0) return@Comparator minuteCmp

        // 3. listOrder ASC (user list order in salah_custom_alarms)
        val orderCmp = a.listOrder.compareTo(b.listOrder)
        if (orderCmp != 0) return@Comparator orderCmp

        // 4. createdAtMs ASC
        val createdCmp = a.createdAtMs.compareTo(b.createdAtMs)
        if (createdCmp != 0) return@Comparator createdCmp

        // 5. deterministic tie-breaker
        a.requestId.compareTo(b.requestId)
    }

    data class RingDecisionRecord(
        val request: RingRequest,
        val outcome: RingOutcome,
        val reason: String
    )

    data class IncomingDecision(
        val outcome: RingOutcome,
        val reason: String,
        val activeRequest: RingRequest?,
        val preemptedRequest: RingRequest?,
        val updatedQueue: List<RingRequest>,
        val shouldStopCurrentImmediately: Boolean,
        val shouldStartNewImmediately: Boolean
    )

    data class PopNextResult(
        val nextRequest: RingRequest?,
        val remainingQueue: List<RingRequest>,
        val skippedRequests: List<RingDecisionRecord>
    )

    fun isSilentOrNotificationOnly(request: RingRequest): Boolean {
        val cleanNotify = request.notifyMode.lowercase().trim()
        val cleanSound = request.soundType.lowercase().trim()
        return cleanNotify == "notification" ||
            cleanNotify == "silent" ||
            cleanSound == "silent" ||
            cleanSound == "vibrate" ||
            request.soundSource is RingAudioSource.Silent
    }

    fun decideIncoming(
        currentActive: RingRequest?,
        newRequest: RingRequest,
        queue: List<RingRequest>,
        nowMs: Long,
        completedTriggerIds: Set<String> = emptySet(),
        staleAthanWindowMs: Long = RingConstants.DEFAULT_STALE_ATHAN_WINDOW_MS
    ): IncomingDecision {
        // 0. Reject unknown alarm types explicitly instead of guessing priority
        if (newRequest.priority == null) {
            return IncomingDecision(
                outcome = RingOutcome.ERROR,
                reason = "unknown_alarm_type",
                activeRequest = currentActive,
                preemptedRequest = null,
                updatedQueue = queue.sortedWith(queueComparator),
                shouldStopCurrentImmediately = false,
                shouldStartNewImmediately = false
            )
        }

        // 1. Silent or notification-only requests do not enter audio playback
        if (isSilentOrNotificationOnly(newRequest)) {
            return IncomingDecision(
                outcome = RingOutcome.SKIPPED,
                reason = "silent_or_notification_only",
                activeRequest = currentActive,
                preemptedRequest = null,
                updatedQueue = queue.sortedWith(queueComparator),
                shouldStopCurrentImmediately = false,
                shouldStartNewImmediately = false
            )
        }

        // 2. Deduplicate active, queued, or already completed triggerIds, and drop stale athans
        val isDuplicateTrigger =
            currentActive?.triggerId == newRequest.triggerId ||
                queue.any { it.triggerId == newRequest.triggerId } ||
                newRequest.triggerId in completedTriggerIds

        val isStaleAthan =
            newRequest.priority == RingPriority.ATHAN &&
                newRequest.scheduledTimeMs > 0L &&
                (nowMs - newRequest.scheduledTimeMs) > staleAthanWindowMs

        if (isDuplicateTrigger || isStaleAthan) {
            return IncomingDecision(
                outcome = RingOutcome.SKIPPED,
                reason = if (isStaleAthan) "stale_athan" else "duplicate_or_stale",
                activeRequest = currentActive,
                preemptedRequest = null,
                updatedQueue = queue.sortedWith(queueComparator),
                shouldStopCurrentImmediately = false,
                shouldStartNewImmediately = false
            )
        }

        // 3. Idle: start immediately
        if (currentActive == null) {
            return IncomingDecision(
                outcome = RingOutcome.PLAYED,
                reason = "idle_immediate",
                activeRequest = newRequest,
                preemptedRequest = null,
                updatedQueue = queue.sortedWith(queueComparator),
                shouldStopCurrentImmediately = false,
                shouldStartNewImmediately = true
            )
        }

        // 4. Busy: preempt if strictly higher priority; otherwise defer into sorted queue
        if ((newRequest.priority?.rank ?: 0) > (currentActive.priority?.rank ?: 0)) {
            val reEnqueuedCurrent = currentActive.copy(
                enqueuedAtMs = currentActive.enqueuedAtMs ?: nowMs
            )
            val nextQueue = (queue + reEnqueuedCurrent).sortedWith(queueComparator)
            return IncomingDecision(
                outcome = RingOutcome.PLAYED,
                reason = "preempted_${currentActive.alarmType}",
                activeRequest = newRequest,
                preemptedRequest = reEnqueuedCurrent,
                updatedQueue = nextQueue,
                shouldStopCurrentImmediately = true,
                shouldStartNewImmediately = true
            )
        }

        val deferredRequest = newRequest.copy(enqueuedAtMs = nowMs)
        val nextQueue = (queue + deferredRequest).sortedWith(queueComparator)
        return IncomingDecision(
            outcome = RingOutcome.DEFERRED,
            reason = "queued_behind_${currentActive.alarmType}",
            activeRequest = currentActive,
            preemptedRequest = null,
            updatedQueue = nextQueue,
            shouldStopCurrentImmediately = false,
            shouldStartNewImmediately = false
        )
    }

    fun popNextPlayable(
        queue: List<RingRequest>,
        nowMs: Long
    ): PopNextResult {
        if (queue.isEmpty()) {
            return PopNextResult(
                nextRequest = null,
                remainingQueue = emptyList(),
                skippedRequests = emptyList()
            )
        }

        val sorted = queue.sortedWith(queueComparator)
        val skipped = mutableListOf<RingDecisionRecord>()
        val remaining = mutableListOf<RingRequest>()
        var chosen: RingRequest? = null

        for (candidate in sorted) {
            if (candidate.priority == RingPriority.DHIKR) {
                val enqueueAnchor = candidate.enqueuedAtMs ?: candidate.createdAtMs
                if ((nowMs - enqueueAnchor) > RingConstants.DHIKR_MAX_DEFER_MS) {
                    skipped.add(
                        RingDecisionRecord(
                            request = candidate,
                            outcome = RingOutcome.SKIPPED,
                            reason = "dhikr_defer_expired_10m"
                        )
                    )
                    continue
                }
            }
            if (chosen == null) {
                chosen = candidate.copy(enqueuedAtMs = null)
            } else {
                remaining.add(candidate)
            }
        }

        return PopNextResult(
            nextRequest = chosen,
            remainingQueue = remaining,
            skippedRequests = skipped
        )
    }
}
