package com.salahpro.app

import android.os.Bundle
import android.util.Log
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.getcapacitor.BridgeActivity
import com.salahpro.app.plugins.AthanAlarmPlugin
import com.salahpro.app.plugins.KhushuModePlugin
import com.salahpro.app.plugins.ScheduleRenewalWorker
import com.salahpro.app.ring.RingFlags
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicBoolean

class MainActivity : BridgeActivity() {
    companion object {
        private val startupFlagLogged = AtomicBoolean(false)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(AthanAlarmPlugin::class.java)
        registerPlugin(KhushuModePlugin::class.java)
        super.onCreate(savedInstanceState)

        if (savedInstanceState == null && startupFlagLogged.compareAndSet(false, true)) {
            try {
                val enabled = RingFlags.isCoordinatorEnabled(this)
                AthanAlarmPlugin.logRingDiagEvent(
                    context = this,
                    source = "NATIVE",
                    alarmType = "ring_flag",
                    alarmId = "startup",
                    stage = "ring_flag_init",
                    details = "ring_coordinator_enabled=$enabled"
                )
            } catch (t: Throwable) {
                Log.w("MainActivity", "Failed logging ring_coordinator_enabled startup state", t)
            }
        }

        try {
            val renewalWorkRequest = PeriodicWorkRequestBuilder<ScheduleRenewalWorker>(3, TimeUnit.DAYS).build()
            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "AthanScheduleRenewal",
                ExistingPeriodicWorkPolicy.KEEP,
                renewalWorkRequest
            )
            Log.d("MainActivity", "Enqueued AthanScheduleRenewal WorkManager job successfully")
        } catch (t: Throwable) {
            Log.e("MainActivity", "Failed to enqueue AthanScheduleRenewal WorkManager job", t)
        }
    }
}
