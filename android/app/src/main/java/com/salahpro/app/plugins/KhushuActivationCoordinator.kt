package com.salahpro.app.plugins

/**
 * Transactional coordinator for Khushu activation.
 * Enforces safe execution order, idempotency, and clean rollback on partial failures.
 *
 * Execution Order:
 * 1. Check if already active -> Return ALREADY_ACTIVE immediately without altering timers or ringer.
 * 2. Schedule restore alarm FIRST -> If scheduling fails, abort immediately without touching ringer.
 * 3. Apply silence / DND -> If applying muting throws or fails, rollback: cancel alarm & restore original state.
 * 4. Persist active state -> Commit to persistent storage only when all steps succeed.
 */
class KhushuActivationCoordinator(
    private val isAlreadyActive: () -> Boolean,
    private val scheduleRestore: (durationMinutes: Int) -> Boolean,
    private val cancelRestore: () -> Unit,
    private val applyMuting: (mode: String) -> Boolean,
    private val rollbackMuting: () -> Unit,
    private val persistState: (durationMinutes: Int, mode: String) -> Unit,
    private val clearState: () -> Unit
) {
    fun execute(mode: String, durationMinutes: Int): KhushuActivationResult {
        // 1. Idempotency guard: If already active, do not overwrite or cancel existing timer
        if (isAlreadyActive()) {
            return KhushuActivationResult.ALREADY_ACTIVE
        }

        // 2. Schedule restore alarm BEFORE modifying ringer
        val scheduled = try {
            scheduleRestore(durationMinutes)
        } catch (_: Exception) {
            false
        }

        if (!scheduled) {
            // Abort without touching ringer or state
            return KhushuActivationResult.SCHEDULE_FAILED
        }

        // 3. Apply silence / DND
        val mutingApplied = try {
            applyMuting(mode)
        } catch (_: Exception) {
            false
        }

        if (!mutingApplied) {
            // Partial failure rollback: cancel the scheduled alarm, restore audio/filter, wipe state
            try { cancelRestore() } catch (_: Exception) {}
            try { rollbackMuting() } catch (_: Exception) {}
            try { clearState() } catch (_: Exception) {}
            return KhushuActivationResult.MUTING_FAILED
        }

        // 4. Persist state
        try {
            persistState(durationMinutes, mode)
        } catch (_: Exception) {
            // If persistence fails, rollback
            try { cancelRestore() } catch (_: Exception) {}
            try { rollbackMuting() } catch (_: Exception) {}
            try { clearState() } catch (_: Exception) {}
            return KhushuActivationResult.MUTING_FAILED
        }

        return KhushuActivationResult.ACTIVATED
    }
}
