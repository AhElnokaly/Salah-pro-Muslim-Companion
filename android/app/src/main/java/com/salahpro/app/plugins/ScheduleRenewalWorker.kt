package com.salahpro.app.plugins

import android.app.AlarmManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.work.Worker
import androidx.work.WorkerParameters
import org.json.JSONArray
import org.json.JSONObject
import java.util.Calendar

class ScheduleRenewalWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : Worker(context, workerParams) {

    companion object {
        const val TAG = "ScheduleRenewalWorker"
    }

    override fun doWork(): Result {
        Log.d(TAG, "Starting periodic schedule renewal worker execution...")
        try {
            val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
            val jsonString = prefs.getString(AthanAlarmPlugin.KEY_SAVED_ALARMS, null)

            val lat = prefs.getFloat("lat", 30.0444f).toDouble()
            val lng = prefs.getFloat("lng", 31.2357f).toDouble()
            val calcMethod = prefs.getString("calcMethod", "Egypt") ?: "Egypt"
            val madhab = prefs.getString("madhab", "standard") ?: "standard"
            val timeZoneId = prefs.getString("timeZoneId", null)
            val fajrOffset = prefs.getFloat("fajrOffset", 0f).toDouble()
            val dhuhrOffset = prefs.getFloat("dhuhrOffset", 0f).toDouble()
            val asrOffset = prefs.getFloat("asrOffset", 0f).toDouble()
            val maghribOffset = prefs.getFloat("maghribOffset", 0f).toDouble()
            val ishaOffset = prefs.getFloat("ishaOffset", 0f).toDouble()

            val jsonArray = if (jsonString != null) JSONArray(jsonString) else JSONArray()
            val now = System.currentTimeMillis()

            val isAthanEnabled = mapOf(
                "Fajr" to prefs.getBoolean("athan_enabled_Fajr", true),
                "Dhuhr" to prefs.getBoolean("athan_enabled_Dhuhr", true),
                "Asr" to prefs.getBoolean("athan_enabled_Asr", true),
                "Maghrib" to prefs.getBoolean("athan_enabled_Maghrib", true),
                "Isha" to prefs.getBoolean("athan_enabled_Isha", true)
            )

            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager

            val updatedList = mutableListOf<JSONObject>()
            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                val timeMs = item.optLong("timeMs", 0L)
                if (timeMs > now) {
                    val prayerKey = item.optString("prayerKey", "")
                    val alarmType = item.optString("alarmType", "")
                    val isAthan = (alarmType.isEmpty() || alarmType == "athan") &&
                            !prayerKey.contains("prealert") &&
                            !prayerKey.contains("postalert") &&
                            !prayerKey.contains("worship") &&
                            !prayerKey.contains("khushu") &&
                            !prayerKey.startsWith("custom_")

                    if (isAthan) {
                        val canonicalName = prayerKey.lowercase().replaceFirstChar { it.uppercase() }
                        if (isAthanEnabled[canonicalName] == false) {
                            if (alarmManager != null) {
                                val reqCode = AthanAlarmPlugin.getDeterministicRequestCode(prayerKey, timeMs)
                                AthanAlarmPlugin.cancelSingleAlarmStatic(context, alarmManager, reqCode)
                            }
                            continue
                        }
                    }
                    updatedList.add(item)
                }
            }

            updatedList.sortBy { it.optLong("timeMs", 0L) }
            val newJsonArray = JSONArray()
            for (obj in updatedList) {
                newJsonArray.put(obj)
            }

            // Save clean unexpired buffer back to SharedPreferences
            prefs.edit().putString(AthanAlarmPlugin.KEY_SAVED_ALARMS, newJsonArray.toString()).apply()

            val futureCount = newJsonArray.length()
            Log.d(TAG, "ScheduleRenewalWorker: sliding 14-day window over stored buffer ($futureCount future alarms remaining in buffer)")

            // Slide active 14-day registration window in AlarmManager over stored buffer
            val scheduledCount = AthanAlarmPlugin.restoreOrScheduleAlarms(context, newJsonArray)
            Log.d(TAG, "ScheduleRenewalWorker: successfully refreshed $scheduledCount active 14-day native alarms.")

            if (futureCount < 25) {
                Log.w(TAG, "ScheduleRenewalWorker: remaining unexpired buffer is low ($futureCount alarms remaining). Replenishment recommended upon next app launch.")
            }

            return Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error in ScheduleRenewalWorker", e)
            return Result.retry()
        }
    }
}
