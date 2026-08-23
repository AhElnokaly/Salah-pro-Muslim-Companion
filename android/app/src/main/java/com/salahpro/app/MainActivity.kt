package com.salahpro.app

import android.os.Bundle
import android.util.Log
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import com.getcapacitor.BridgeActivity
import com.salahpro.app.plugins.AthanAlarmPlugin
import com.salahpro.app.plugins.ScheduleRenewalWorker
import java.util.concurrent.TimeUnit

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        registerPlugin(AthanAlarmPlugin::class.java)

        try {
            val renewalWorkRequest = PeriodicWorkRequestBuilder<ScheduleRenewalWorker>(3, TimeUnit.DAYS).build()
            WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "AthanScheduleRenewal",
                ExistingPeriodicWorkPolicy.KEEP,
                renewalWorkRequest
            )
            Log.d("MainActivity", "Enqueued AthanScheduleRenewal WorkManager job successfully")
        } catch (e: Exception) {
            Log.e("MainActivity", "Failed to enqueue AthanScheduleRenewal WorkManager job", e)
        }
    }
}
