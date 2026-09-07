package com.salahpro.app.plugins

import android.Manifest
import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.PowerManager
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
        const val KEY_SCHEDULED_IDS = "scheduled_ids_set"
        const val KEY_SAVED_ALARMS = "saved_alarms_json"

        @JvmStatic
        fun getDeterministicRequestCode(prayerKey: String, timeMs: Long): Int {
            // Generate a stable, positive 31-bit integer hash from prayerKey and minute-level timestamp
            val minuteBucket = timeMs / 60000L
            val identifier = "${prayerKey}_$minuteBucket"
            return (identifier.hashCode() and 0x7FFFFFFF) % 10000000 + 1000
        }

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
        fun getScheduledAlarmsStatic(context: Context): JSONArray {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val rawJson = prefs.getString(KEY_SAVED_ALARMS, null) ?: return JSONArray()
            val now = System.currentTimeMillis()
            val activeArray = JSONArray()
            try {
                val array = JSONArray(rawJson)
                val validIdSet = prefs.getStringSet(KEY_SCHEDULED_IDS, emptySet()) ?: emptySet()
                for (i in 0 until array.length()) {
                    val obj = array.getJSONObject(i)
                    val timeMs = obj.optLong("timeMs", 0L)
                    val prayerKey = obj.optString("prayerKey", "")
                    val reqCode = getDeterministicRequestCode(prayerKey, timeMs)
                    if (timeMs > now && validIdSet.contains(reqCode.toString())) {
                        val activeItem = org.json.JSONObject(obj.toString())
                        activeItem.put("requestCode", reqCode)
                        activeArray.put(activeItem)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error parsing scheduled alarms JSON", e)
            }
            return activeArray
        }

        @JvmStatic
        fun reconcileAlarmsInternalStatic(
            context: Context,
            alarmManager: AlarmManager,
            desiredTimesArray: JSONArray
        ): Map<String, Int> {
            val now = System.currentTimeMillis()
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val currentScheduledIds = (prefs.getStringSet(KEY_SCHEDULED_IDS, emptySet()) ?: emptySet()).toMutableSet()

            // 1. Build desired Map: reqCode -> JSONObject
            val desiredMap = mutableMapOf<Int, org.json.JSONObject>()
            for (i in 0 until desiredTimesArray.length()) {
                try {
                    val item = desiredTimesArray.getJSONObject(i)
                    val timeMs = item.optLong("timeMs", 0L)
                    val prayerKey = item.optString("prayerKey", "")
                    if (timeMs > now) {
                        val reqCode = getDeterministicRequestCode(prayerKey, timeMs)
                        desiredMap[reqCode] = item
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error reading desired alarm at $i", e)
                }
            }

            var addedCount = 0
            var removedCount = 0
            var retainedCount = 0

            // 2. Identify Obsolete: in currentScheduledIds but NOT in desiredMap
            val obsoleteIds = mutableListOf<Int>()
            for (idStr in currentScheduledIds) {
                val reqCode = idStr.toIntOrNull() ?: continue
                if (!desiredMap.containsKey(reqCode)) {
                    obsoleteIds.add(reqCode)
                }
            }

            for (obsoleteCode in obsoleteIds) {
                cancelSingleAlarmStatic(context, alarmManager, obsoleteCode)
                currentScheduledIds.remove(obsoleteCode.toString())
                removedCount++
            }

            // 3. Identify Retained vs Missing
            val newSavedAlarms = JSONArray()
            for ((reqCode, item) in desiredMap) {
                val timeMs = item.optLong("timeMs", 0L)
                val prayerName = item.optString("prayerName", "الصلاة")
                val isFajr = item.optBoolean("isFajr", false)
                val prayerKey = item.optString("prayerKey", "")

                newSavedAlarms.put(item)

                if (currentScheduledIds.contains(reqCode.toString())) {
                    // Already scheduled and unchanged -> Retain! Do NOT touch AlarmManager.
                    retainedCount++
                } else {
                    // Missing -> Schedule newly!
                    try {
                        val intent = createAthanIntent(
                            context = context,
                            prayerName = prayerName,
                            isFajr = isFajr,
                            prayerKey = prayerKey,
                            timeMs = timeMs
                        )
                        val pendingIntent = getAthanPendingIntent(context, reqCode, intent)
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
                        currentScheduledIds.add(reqCode.toString())
                        addedCount++
                        Log.d(TAG, "Reconcile: Added missing alarm for $prayerName at $timeMs (reqCode=$reqCode)")
                    } catch (e: Exception) {
                        Log.e(TAG, "Error scheduling missing alarm reqCode=$reqCode", e)
                    }
                }
            }

            // Save updated state ledger
            prefs.edit()
                .putInt(KEY_SCHEDULED_COUNT, currentScheduledIds.size)
                .putStringSet(KEY_SCHEDULED_IDS, currentScheduledIds)
                .putString(KEY_SAVED_ALARMS, newSavedAlarms.toString())
                .apply()

            Log.d(TAG, "Reconcile completed: added=$addedCount, removed=$removedCount, retained=$retainedCount, total=${currentScheduledIds.size}")
            return mapOf(
                "added" to addedCount,
                "removed" to removedCount,
                "retained" to retainedCount,
                "total" to currentScheduledIds.size
            )
        }

        @JvmStatic
        fun restoreOrScheduleAlarms(context: Context, timesArray: JSONArray): Int {
            val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
                ?: return 0

            val result = reconcileAlarmsInternalStatic(context, alarmManager, timesArray)
            return result["total"] ?: 0
        }

        @JvmStatic
        fun cancelAlarmsInternalStatic(context: Context, alarmManager: AlarmManager) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val savedIds = prefs.getStringSet(KEY_SCHEDULED_IDS, emptySet()) ?: emptySet()

            for (idStr in savedIds) {
                val reqCode = idStr.toIntOrNull() ?: continue
                val intent = createAthanIntent(context)
                val pendingIntent = getAthanPendingIntent(context, reqCode, intent)
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }

            // Fallback sweep for legacy range
            val lastCount = prefs.getInt(KEY_SCHEDULED_COUNT, 150)
            val maxCancel = Math.max(lastCount + 50, 200)
            for (i in 0 until maxCancel) {
                val intent = createAthanIntent(context)
                val requestCode = 2000 + i
                val pendingIntent = getAthanPendingIntent(context, requestCode, intent)
                alarmManager.cancel(pendingIntent)
                pendingIntent.cancel()
            }

            prefs.edit()
                .remove(KEY_SCHEDULED_IDS)
                .putInt(KEY_SCHEDULED_COUNT, 0)
                .apply()
        }

        @JvmStatic
        fun cancelSingleAlarmStatic(context: Context, alarmManager: AlarmManager, reqCode: Int): Boolean {
            val intent = createAthanIntent(context)
            val pendingIntent = getAthanPendingIntent(context, reqCode, intent)
            alarmManager.cancel(pendingIntent)
            pendingIntent.cancel()

            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val savedIds = prefs.getStringSet(KEY_SCHEDULED_IDS, emptySet())?.toMutableSet() ?: mutableSetOf()
            val removed = savedIds.remove(reqCode.toString())
            if (removed) {
                prefs.edit().putStringSet(KEY_SCHEDULED_IDS, savedIds).apply()
            }
            return true
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
    fun checkBatteryOptimization(call: PluginCall) {
        val context = context
        val isIgnored = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
            pm?.isIgnoringBatteryOptimizations(context.packageName) ?: true
        } else {
            true
        }
        val ret = JSObject()
        ret.put("isOptimized", !isIgnored)
        ret.put("isIgnoringBatteryOptimizations", isIgnored)
        call.resolve(ret)
    }

    @PluginMethod
    fun requestIgnoreBatteryOptimization(call: PluginCall) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                val pm = context.getSystemService(Context.POWER_SERVICE) as? PowerManager
                val isAlreadyIgnored = pm?.isIgnoringBatteryOptimizations(context.packageName) ?: false
                if (!isAlreadyIgnored) {
                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                        data = Uri.parse("package:${context.packageName}")
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(intent)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed to launch ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, fallback to settings", e)
                try {
                    val fallbackIntent = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS).apply {
                        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    }
                    context.startActivity(fallbackIntent)
                } catch (fallbackEx: Exception) {
                    Log.e(TAG, "Failed to launch battery settings fallback", fallbackEx)
                }
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
            ret.put("addedCount", 0)
            ret.put("removedCount", 0)
            ret.put("retainedCount", 0)
            ret.put("exactAlarmPermissionMissing", true)
            call.resolve(ret)
            return
        }

        // True State Reconciliation: Diff desired vs current scheduled
        val reconcileResult = reconcileAlarmsInternalStatic(context, alarmManager, timesArray)
        val scheduledCount = reconcileResult["total"] ?: 0

        // Save calculation parameters for offline renewal
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        
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
        ret.put("addedCount", reconcileResult["added"] ?: 0)
        ret.put("removedCount", reconcileResult["removed"] ?: 0)
        ret.put("retainedCount", reconcileResult["retained"] ?: 0)
        ret.put("exactAlarmPermissionMissing", false)
        call.resolve(ret)
    }

    @PluginMethod
    fun getScheduledAlarms(call: PluginCall) {
        val activeAlarms = getScheduledAlarmsStatic(context)
        val ret = JSObject()
        val alarmsJsArray = JSArray()
        for (i in 0 until activeAlarms.length()) {
            alarmsJsArray.put(activeAlarms.getJSONObject(i))
        }
        ret.put("alarms", alarmsJsArray)
        ret.put("count", alarmsJsArray.length())
        call.resolve(ret)
    }

    @PluginMethod
    fun reconcileAthanAlarms(call: PluginCall) {
        val timesArray: JSArray? = call.getArray("times")
        if (timesArray == null) {
            call.reject("Missing 'times' parameter for reconciliation")
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
            ret.put("addedCount", 0)
            ret.put("removedCount", 0)
            ret.put("retainedCount", 0)
            ret.put("exactAlarmPermissionMissing", true)
            call.resolve(ret)
            return
        }

        val result = reconcileAlarmsInternalStatic(context, alarmManager, timesArray)
        val ret = JSObject()
        ret.put("scheduledCount", result["total"] ?: 0)
        ret.put("addedCount", result["added"] ?: 0)
        ret.put("removedCount", result["removed"] ?: 0)
        ret.put("retainedCount", result["retained"] ?: 0)
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

    @PluginMethod
    fun cancelAlarm(call: PluginCall) {
        val alarmId = call.getString("alarmId")
        val reqCode = call.getInt("requestCode") ?: alarmId?.toIntOrNull()

        if (reqCode == null) {
            call.reject("Missing alarmId or requestCode parameter")
            return
        }

        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
        var success = false
        if (alarmManager != null) {
            success = cancelSingleAlarmStatic(context, alarmManager, reqCode)
        }

        val ret = JSObject()
        ret.put("cancelled", success)
        ret.put("requestCode", reqCode)
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
