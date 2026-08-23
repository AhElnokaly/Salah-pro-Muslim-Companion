package com.salahpro.app.plugins

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
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
        const val LOW_SCHEDULE_CHANNEL_ID = "salah_low_schedule_channel"
        const val LOW_SCHEDULE_NOTIF_ID = 8801
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

            val updatedList = mutableListOf<JSONObject>()
            for (i in 0 until jsonArray.length()) {
                val item = jsonArray.getJSONObject(i)
                val timeMs = item.optLong("timeMs", 0L)
                if (timeMs > now) {
                    updatedList.add(item)
                }
            }

            // Extend offline 60-day rolling window if remaining future alarms are less than 150 (< 30 days)
            if (updatedList.size < 150) {
                val cal = Calendar.getInstance()
                for (dayOffset in 0 until 60) {
                    cal.timeInMillis = now
                    cal.add(Calendar.DAY_OF_YEAR, dayOffset)
                    val year = cal.get(Calendar.YEAR)
                    val month = cal.get(Calendar.MONTH) + 1
                    val day = cal.get(Calendar.DAY_OF_MONTH)

                    val times = PrayerTimesCalculator.calculateForDate(
                        year, month, day, lat, lng, calcMethod, madhab,
                        fajrOffset, dhuhrOffset, asrOffset, maghribOffset, ishaOffset, timeZoneId
                    )
                    val prayers = listOf(
                        Triple("fajr", "الفجر", times.fajr),
                        Triple("dhuhr", "الظهر", times.dhuhr),
                        Triple("asr", "العصر", times.asr),
                        Triple("maghrib", "المغرب", times.maghrib),
                        Triple("isha", "العشاء", times.isha)
                    )

                    for (p in prayers) {
                        if (p.third > now) {
                            val exists = updatedList.any { Math.abs(it.optLong("timeMs", 0L) - p.third) < 60000L }
                            if (!exists) {
                                val obj = JSONObject()
                                obj.put("prayerKey", "renewed_${dayOffset}_${p.first}")
                                obj.put("prayerName", p.second)
                                obj.put("timeMs", p.third)
                                obj.put("isFajr", p.first == "fajr")
                                updatedList.add(obj)
                            }
                        }
                    }
                }
            }

            updatedList.sortBy { it.optLong("timeMs", 0L) }
            val newJsonArray = JSONArray()
            for (obj in updatedList) {
                newJsonArray.put(obj)
            }

            // Save updated 60-day buffer to SharedPreferences
            prefs.edit().putString(AthanAlarmPlugin.KEY_SAVED_ALARMS, newJsonArray.toString()).apply()

            val futureCount = newJsonArray.length()
            Log.d(TAG, "ScheduleRenewalWorker: updated 60-day rolling schedule buffer ($futureCount future alarms)")

            // Replenish active native AlarmManager exact alarms from the stored 60-day buffer
            val scheduledCount = AthanAlarmPlugin.restoreOrScheduleAlarms(context, newJsonArray)
            Log.d(TAG, "ScheduleRenewalWorker: successfully replenished $scheduledCount active native alarms offline.")

            if (futureCount < 25) {
                sendLowScheduleNotification(context, futureCount)
            }

            return Result.success()
        } catch (e: Exception) {
            Log.e(TAG, "Error in ScheduleRenewalWorker", e)
            return Result.retry()
        }
    }

    private fun sendLowScheduleNotification(context: Context, remainingCount: Int) {
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            ?: return

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                LOW_SCHEDULE_CHANNEL_ID,
                "تحديث مواقيت الصلاة",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }

        val builder = NotificationCompat.Builder(context, LOW_SCHEDULE_CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("تحديث مواقيت الصلاة")
            .setContentText("تبقى $remainingCount تنبيه للأذان. يرجى فتح التطبيق لتحديث جدول المواقيت الشهرية.")
            .setAutoCancel(true)

        notificationManager.notify(LOW_SCHEDULE_NOTIF_ID, builder.build())
    }
}
