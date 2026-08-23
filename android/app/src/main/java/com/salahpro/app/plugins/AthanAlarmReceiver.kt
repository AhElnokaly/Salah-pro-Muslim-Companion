package com.salahpro.app.plugins

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.core.content.ContextCompat

class AthanAlarmReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "AthanAlarmReceiver"
        const val ACTION_ATHAN_ALARM = "com.salahpro.app.ACTION_ATHAN_ALARM"
        const val EXTRA_PRAYER_NAME = "extra_prayer_name"
        const val EXTRA_IS_FAJR = "extra_is_fajr"
        const val EXTRA_PRAYER_KEY = "extra_prayer_key"
        const val EXTRA_PRAYER_TIME = "extra_prayer_time"
    }

    override fun onReceive(context: Context, intent: Intent) {
        Log.d(TAG, "Received alarm trigger: ${intent.action}")

        val prayerName = intent.getStringExtra(EXTRA_PRAYER_NAME) ?: "الصلاة"
        val isFajr = intent.getBooleanExtra(EXTRA_IS_FAJR, false)
        val prayerKey = intent.getStringExtra(EXTRA_PRAYER_KEY) ?: ""

        val serviceIntent = Intent(context, AthanForegroundService::class.java).apply {
            putExtra(EXTRA_PRAYER_NAME, prayerName)
            putExtra(EXTRA_IS_FAJR, isFajr)
            putExtra(EXTRA_PRAYER_KEY, prayerKey)
        }

        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(context, serviceIntent)
            } else {
                context.startService(serviceIntent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to start AthanForegroundService", e)
        }
    }
}
