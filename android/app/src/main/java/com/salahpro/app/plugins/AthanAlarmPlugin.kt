package com.salahpro.app.plugins

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import androidx.core.content.ContextCompat
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.salahpro.app.widget.SalahWidgetProvider
import org.json.JSONArray

@CapacitorPlugin(
    name = "AthanAlarm",
    permissions = [
        Permission(
            strings = [Manifest.permission.POST_NOTIFICATIONS],
            alias = "notifications"
        )
    ]
)
class AthanAlarmPlugin : Plugin() {

    companion object {
        const val TAG = "AthanAlarmPlugin"
        const val PREFS_NAME = "AthanAlarmPrefs"
        const val KEY_SCHEDULED_COUNT = "scheduled_count"
        const val KEY_SAVED_ALARMS = "saved_alarms_json"

        @JvmStatic
        fun createAthanIntent(
            context: Context,
            prayerName: String = "الصلاة",
            isFajr: Boolean = false,
            prayerKey: String = "",
            timeMs: Long = 0L
        ): Intent {
            return Intent(context, AthanAlarmReceiver::class.java).apply {
                action = AthanAlarmReceiver.ACTION_ATHAN_ALARM
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_NAME, prayerName)
                putExtra(AthanAlarmReceiver.EXTRA_IS_FAJR, isFajr)
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_KEY, prayerKey)
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_TIME, timeMs)
            }
        }

        @JvmStatic
        fun getAthanPendingIntent(
            context: Context,
            requestCode: Int,
            intent: Intent = createAthanIntent(context)
        ): PendingIntent {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            return PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                flags
            )
        }

        @JvmStatic
        fun restoreOrScheduleAlarms(context: Context, timesArray: JSONArray): Int {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
                ?: return 0

            cancelAlarmsInternalStatic(context, alarmManager)

            var count = 0
            val now = System.currentTimeMillis()

            for (i in 0 until timesArray.length()) {
                try {
                    val item = timesArray.getJSONObject(i)
                    val timeMs = item.optLong("timeMs", 0L)
                    val prayerName = item.optString("prayerName", "الصلاة")
                    val isFajr = item.optBoolean("isFajr", false)
                    val prayerKey = item.optString("prayerKey", "prayer_$i")

                    if (timeMs <= now) {
                        continue
                    }

                    val intent = createAthanIntent(
                        context = context,
                        prayerName = prayerName,
                        isFajr = isFajr,
                        prayerKey = prayerKey,
                        timeMs = timeMs
                    )

                    val requestCode = 2000 + i
                    val pendingIntent = getAthanPendingIntent(context, requestCode, intent)

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        alarmManager.setExactAndAllowWhileIdle(
                            AlarmManager.RTC_WAKEUP,
                            timeMs,
                            pendingIntent
                        )
                    } else {
                        alarmManager.setExact(
                            AlarmManager.RTC_WAKEUP,
                            timeMs,
                            pendingIntent
                        )
                    }

                    count++
                    Log.d(TAG, "Scheduled athan for $prayerName at $timeMs")
                } catch (e: Exception) {
                    Log.e(TAG, "Error scheduling alarm at index $i", e)
                }
            }

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit().putInt(KEY_SCHEDULED_COUNT, count).apply()

            return count
        }

        @JvmStatic
        fun cancelAlarmsInternalStatic(context: Context, alarmManager: AlarmManager) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val lastCount = prefs.getInt(KEY_SCHEDULED_COUNT, 150)
            val maxCancel = Math.max(lastCount + 50, 200)

            for (i in 0 until maxCancel) {
                val intent = createAthanIntent(context)
                val requestCode = 2000 + i
                val pendingIntent = getAthanPendingIntent(context, requestCode, intent)
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }
        }
    }

    @PluginMethod
    fun checkExactAlarmPermission(call: PluginCall) {
        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        val isGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            alarmManager?.canScheduleExactAlarms() ?: false
        } else {
            true
        }
        val ret = JSObject()
        ret.put("granted", isGranted)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestExactAlarmPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch ACTION_REQUEST_SCHEDULE_EXACT_ALARM", e)
            }
        }
        val ret = JSObject()
        ret.put("requested", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun checkNotificationPermission(call: PluginCall) {
        val isGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
        val ret = JSObject()
        ret.put("granted", isGranted)
        ret.put("status", if (isGranted) "granted" else "prompt")
        call.resolve(ret)
    }

    @PluginMethod
    fun requestNotificationPermission(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val isGranted = ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED

            if (isGranted) {
                val ret = JSObject()
                ret.put("granted", true)
                ret.put("status", "granted")
                call.resolve(ret)
                return
            }

            requestPermissionForAlias("notifications", call, "notificationPermsCallback")
        } else {
            val ret = JSObject()
            ret.put("granted", true)
            ret.put("status", "granted")
            call.resolve(ret)
        }
    }

    @com.getcapacitor.annotation.PermissionCallback
    private fun notificationPermsCallback(call: PluginCall) {
        val isGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
        val ret = JSObject()
        ret.put("granted", isGranted)
        ret.put("status", if (isGranted) "granted" else "denied")
        call.resolve(ret)
    }

    @PluginMethod
    fun updateWidgetData(call: PluginCall) {
        val dataObj = call.getObject("data")
        val cityName = call.getString("cityName", "مواقيت الصلاة")
        if (dataObj != null) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            prefs.edit()
                .putString("widget_data_json", dataObj.toString())
                .putString("widget_city_name", cityName)
                .apply()
            
            SalahWidgetProvider.updateAllWidgets(context)
        }
        val ret = JSObject()
        ret.put("updated", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun scheduleAthanAlarms(call: PluginCall) {
        val timesArray: JSArray? = call.getArray("times")
        if (timesArray == null || timesArray.length() == 0) {
            call.reject("No times provided for scheduling")
            return
        }

        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        if (alarmManager == null) {
            call.reject("AlarmManager service not available")
            return
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !alarmManager.canScheduleExactAlarms()) {
            val ret = JSObject()
            ret.put("scheduledCount", 0)
            ret.put("exactAlarmPermissionMissing", true)
            call.resolve(ret)
            return
        }

        // Cancel previous alarms and schedule new ones
        val scheduledCount = restoreOrScheduleAlarms(context, timesArray)

        // Save JSON string and calculation parameters for offline renewal
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit().putString(KEY_SAVED_ALARMS, timesArray.toString())
        
        if (call.hasOption("lat")) {
            editor.putFloat("lat", call.getDouble("lat", 30.0444).toFloat())
        }
        if (call.hasOption("lng")) {
            editor.putFloat("lng", call.getDouble("lng", 31.2357).toFloat())
        }
        if (call.hasOption("calcMethod")) {
            editor.putString("calcMethod", call.getString("calcMethod", "Egypt"))
        }
        if (call.hasOption("madhab")) {
            editor.putString("madhab", call.getString("madhab", "standard"))
        }
        if (call.hasOption("timeZoneId")) {
            editor.putString("timeZoneId", call.getString("timeZoneId"))
        }
        if (call.hasOption("fajrOffset")) {
            editor.putFloat("fajrOffset", call.getDouble("fajrOffset", 0.0).toFloat())
        }
        if (call.hasOption("dhuhrOffset")) {
            editor.putFloat("dhuhrOffset", call.getDouble("dhuhrOffset", 0.0).toFloat())
        }
        if (call.hasOption("asrOffset")) {
            editor.putFloat("asrOffset", call.getDouble("asrOffset", 0.0).toFloat())
        }
        if (call.hasOption("maghribOffset")) {
            editor.putFloat("maghribOffset", call.getDouble("maghribOffset", 0.0).toFloat())
        }
        if (call.hasOption("ishaOffset")) {
            editor.putFloat("ishaOffset", call.getDouble("ishaOffset", 0.0).toFloat())
        }
        editor.apply()

        val ret = JSObject()
        ret.put("scheduledCount", scheduledCount)
        ret.put("exactAlarmPermissionMissing", false)
        call.resolve(ret)
    }

    @PluginMethod
    fun cancelAllAlarms(call: PluginCall) {
        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        if (alarmManager != null) {
            cancelAlarmsInternalStatic(context, alarmManager)
        }
        val ret = JSObject()
        ret.put("cancelled", true)
        call.resolve(ret)
    }

    private fun processAndScheduleTimes(
        context: Context,
        alarmManager: AlarmManager,
        timesArray: JSArray
    ): Int {
        return restoreOrScheduleAlarms(context, timesArray)
    }

    private fun cancelAlarmsInternal(context: Context, alarmManager: AlarmManager) {
        cancelAlarmsInternalStatic(context, alarmManager)
    }
}
