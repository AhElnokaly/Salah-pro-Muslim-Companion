package com.salahpro.app.plugins

/**
 * Result of attempting to activate Khushu mode.
 * Explicit sealed representation preventing ambiguity between success,
 * idempotent duplicate activation, scheduling failures, and muting failures.
 */
enum class KhushuActivationResult {
    /** Khushu activated successfully, restore alarm scheduled, silence applied. */
    ACTIVATED,

    /** Khushu was already active; request safely ignored without altering existing restore timer or ringer. */
    ALREADY_ACTIVE,

    /** Failed to schedule restore alarm (exact or fallback); ringer was NOT altered (or safely aborted). */
    SCHEDULE_FAILED,

    /** Muting or DND failed fatally and state was rolled back to original values. */
    MUTING_FAILED
}
