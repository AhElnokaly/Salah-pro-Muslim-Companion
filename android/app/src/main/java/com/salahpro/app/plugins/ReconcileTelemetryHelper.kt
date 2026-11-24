package com.salahpro.app.plugins

/**
 * Pure JVM telemetry helpers for alarm reconciliation.
 * No Android Context or SDK dependencies so CI can unit-test directly via JUnit.
 */
data class ScheduleFailureSample(
    val requestCode: Int,
    val errorType: String
)

class ScheduleFailureTracker(private val maxSampleSize: Int = 5) {
    var failedCount: Int = 0
        private set

    private val sample = mutableListOf<ScheduleFailureSample>()

    fun recordFailure(requestCode: Int, error: Throwable) {
        val simpleName = error.javaClass.simpleName
        recordFailure(requestCode, if (simpleName.isNullOrEmpty()) "Exception" else simpleName)
    }

    fun recordFailure(requestCode: Int, errorType: String) {
        failedCount++
        if (sample.size < maxSampleSize) {
            val normalized = errorType.ifEmpty { "Exception" }
            sample.add(ScheduleFailureSample(requestCode = requestCode, errorType = normalized))
        }
    }

    fun getSample(): List<ScheduleFailureSample> = sample.toList()
}

/**
 * Computes a one-way pre-reconcile PendingIntent loss proxy over (ledger ∩ desired).
 * 'missing' proves the PendingIntent disappeared (e.g., Force Stop);
 * 'present' is inconclusive (only dumpsys alarm proves AlarmManager retention).
 * Expect "0/0" on boot restore because AthanBootReceiver clears KEY_SCHEDULED_IDS beforehand.
 */
fun computePiMissingBefore(
    intersectionIds: Collection<Int>,
    hasPendingIntent: (Int) -> Boolean
): String {
    if (intersectionIds.isEmpty()) return "0/0"
    var missing = 0
    for (reqCode in intersectionIds) {
        if (!hasPendingIntent(reqCode)) {
            missing++
        }
    }
    return "$missing/${intersectionIds.size}"
}
