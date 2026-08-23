package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import org.json.JSONArray

class AthanBootReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "AthanBootReceiver"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        Log.d(TAG, "Received boot/package intent: $action")

        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON") {

            restoreAlarms(context)
        }
    }

    private fun restoreAlarms(context: Context) {
        try {
            val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
            val jsonString = prefs.getString(AthanAlarmPlugin.KEY_SAVED_ALARMS, null) ?: return

            val jsonArray = JSONArray(jsonString)
            val restoredCount = AthanAlarmPlugin.restoreOrScheduleAlarms(context, jsonArray)

            Log.d(TAG, "Restored $restoredCount exact athan alarms after boot")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to restore athan alarms on boot", e)
        }
    }
}
