package com.salahpro.app.plugins

import android.Manifest
import android.app.AlarmManager
import android.app.DownloadManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.PackageManager
import android.media.MediaMetadataRetriever
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.os.PowerManager
import android.provider.Settings
import android.util.Base64
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.getcapacitor.annotation.Permission
import com.salahpro.app.widget.SalahWidgetProvider
import org.json.JSONArray
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

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
            timeMs: Long = 0L,
            alarmType: String = "",
            durationMinutes: Int = 15,
            khushuMode: String = "silent",
            soundType: String = "reminder",
            notifyMode: String = "both",
            autoKhushu: Boolean = false
        ): Intent {
            val resolvedType = if (alarmType.isNotEmpty()) {
                alarmType
            } else if (prayerKey.startsWith("custom_")) {
                "custom"
            } else if (prayerKey.contains("prealert")) {
                "prealert"
            } else if (prayerKey.contains("postalert") || prayerKey.contains("worship")) {
                "postalert"
            } else if (prayerKey.contains("khushu")) {
                "khushu"
            } else {
                "athan"
            }
            return Intent(context, AthanAlarmReceiver::class.java).apply {
                action = AthanAlarmReceiver.ACTION_ATHAN_ALARM
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_NAME, prayerName)
                putExtra(AthanAlarmReceiver.EXTRA_IS_FAJR, isFajr)
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_KEY, prayerKey)
                putExtra(AthanAlarmReceiver.EXTRA_PRAYER_TIME, timeMs)
                putExtra(AthanAlarmReceiver.EXTRA_ALARM_TYPE, resolvedType)
                putExtra(AthanAlarmReceiver.EXTRA_DURATION_MINUTES, durationMinutes)
                putExtra(AthanAlarmReceiver.EXTRA_KHUSHU_MODE, khushuMode)
                putExtra("soundType", soundType)
                putExtra("notifyMode", notifyMode)
                putExtra("autoKhushu", autoKhushu)
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
                val alarmType = item.optString("alarmType", if (prayerKey.startsWith("custom_")) "custom" else if (prayerKey.contains("prealert")) "prealert" else if (prayerKey.contains("khushu")) "khushu" else "athan")
                val durationMinutes = item.optInt("durationMinutes", 15)
                val khushuMode = item.optString("khushuMode", "silent")
                val soundType = item.optString("soundType", "reminder")
                val notifyMode = item.optString("notifyMode", "both")
                val autoKhushu = item.optBoolean("autoKhushu", false)

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
                            timeMs = timeMs,
                            alarmType = alarmType,
                            durationMinutes = durationMinutes,
                            khushuMode = khushuMode,
                            soundType = soundType,
                            notifyMode = notifyMode,
                            autoKhushu = autoKhushu
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
        val context = context
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
        val areNotificationsEnabled = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            notificationManager?.areNotificationsEnabled() ?: true
        } else {
            true
        }
        val isRuntimeGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true
        }
        val isGranted = areNotificationsEnabled && isRuntimeGranted
        val ret = JSObject()
        ret.put("granted", isGranted)
        ret.put("status", if (isGranted) "granted" else "denied")
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
    fun openNotificationSettings(call: PluginCall) {
        val context = context
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).apply {
                    putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
            }
            context.startActivity(intent)
            val res = JSObject()
            res.put("opened", true)
            call.resolve(res)
        } catch (e: Exception) {
            try {
                val fallbackIntent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(fallbackIntent)
                val res = JSObject()
                res.put("opened", true)
                call.resolve(res)
            } catch (fallbackEx: Exception) {
                Log.e(TAG, "Failed to open notification settings", fallbackEx)
                call.reject("Failed to open notification settings: ${e.message}")
            }
        }
    }

    @PluginMethod
    fun sendNotification(call: PluginCall) {
        val title = call.getString("title", "تطبيق هِمَّتِي") ?: "تطبيق هِمَّتِي"
        val body = call.getString("body", "") ?: ""
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
        if (notificationManager == null) {
            val res = JSObject()
            res.put("success", false)
            call.resolve(res)
            return
        }

        val channelId = "athan_general_notifications"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(
                channelId,
                "إشعارات هِمَّتِي والتنبيهات العامة",
                android.app.NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "إشعارات الأذكار، التذكيرات الإيمانية، والإشعارات الفورية"
                enableVibration(true)
                setShowBadge(true)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, (System.currentTimeMillis() % 10000).toInt(), launchIntent, flags)
        } else null

        val notifBuilder = androidx.core.app.NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(androidx.core.app.NotificationCompat.BigTextStyle().bigText(body))
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setDefaults(androidx.core.app.NotificationCompat.DEFAULT_ALL)

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        val notifId = (System.currentTimeMillis() % 100000).toInt() + 3000
        notificationManager.notify(notifId, notifBuilder.build())

        val res = JSObject()
        res.put("success", true)
        res.put("notificationId", notifId)
        call.resolve(res)
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
    fun updateOngoingPrayerNotification(call: PluginCall) {
        val enabled = call.getBoolean("enabled", true) ?: true
        val title = call.getString("title", "مواقيت الصلاة") ?: "مواقيت الصلاة"
        val body = call.getString("body", "") ?: ""
        val targetTimestamp = call.getDouble("targetTimestamp")?.toLong() ?: 0L

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? android.app.NotificationManager
        if (notificationManager == null) {
            val res = JSObject()
            res.put("success", false)
            call.resolve(res)
            return
        }

        val channelId = "athan_ongoing_prayer_bar"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = android.app.NotificationChannel(
                channelId,
                "شريط الصلاة الحي الدائم",
                android.app.NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "يعرض وقت الصلاة القادمة والعد التنازلي بشكل دائم في ستارة الإشعارات"
                setShowBadge(false)
            }
            notificationManager.createNotificationChannel(channel)
        }

        val notificationId = 888801

        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putBoolean("ongoing_prayer_bar_enabled", enabled).apply()

        if (!enabled) {
            notificationManager.cancel(notificationId)
            val res = JSObject()
            res.put("success", true)
            res.put("cleared", true)
            call.resolve(res)
            return
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
        val pIntent = if (launchIntent != null) {
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            PendingIntent.getActivity(context, 0, launchIntent, flags)
        } else null

        val notifBuilder = androidx.core.app.NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(body)
            .setStyle(androidx.core.app.NotificationCompat.BigTextStyle().bigText(body))
            .setOngoing(true)
            .setPriority(androidx.core.app.NotificationCompat.PRIORITY_LOW)
            .setOnlyAlertOnce(true)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N && targetTimestamp > System.currentTimeMillis()) {
            notifBuilder.setWhen(targetTimestamp)
                .setShowWhen(true)
                .setUsesChronometer(true)
                .setChronometerCountDown(true)
                .setSubText("الوقت المتبقي")
        }

        if (pIntent != null) {
            notifBuilder.setContentIntent(pIntent)
        }

        notificationManager.notify(notificationId, notifBuilder.build())
        val res = JSObject()
        res.put("success", true)
        res.put("posted", true)
        call.resolve(res)
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
            editor.putFloat("lat", call.getDouble("lat", 30.0444)?.toFloat() ?: 30.0444f)
        }
        if (call.hasOption("lng")) {
            editor.putFloat("lng", call.getDouble("lng", 31.2357)?.toFloat() ?: 31.2357f)
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
            editor.putFloat("fajrOffset", call.getDouble("fajrOffset", 0.0)?.toFloat() ?: 0f)
        }
        if (call.hasOption("dhuhrOffset")) {
            editor.putFloat("dhuhrOffset", call.getDouble("dhuhrOffset", 0.0)?.toFloat() ?: 0f)
        }
        if (call.hasOption("asrOffset")) {
            editor.putFloat("asrOffset", call.getDouble("asrOffset", 0.0)?.toFloat() ?: 0f)
        }
        if (call.hasOption("maghribOffset")) {
            editor.putFloat("maghribOffset", call.getDouble("maghribOffset", 0.0)?.toFloat() ?: 0f)
        }
        if (call.hasOption("ishaOffset")) {
            editor.putFloat("ishaOffset", call.getDouble("ishaOffset", 0.0)?.toFloat() ?: 0f)
        }
        if (call.hasOption("prayerPreAlert")) {
            editor.putBoolean("prayerPreAlert", call.getBoolean("prayerPreAlert", false) ?: false)
        }
        if (call.hasOption("preAlertMinutes")) {
            editor.putInt("preAlertMinutes", call.getInt("preAlertMinutes", 15) ?: 15)
        }
        if (call.hasOption("preAlertSound")) {
            editor.putString("preAlertSound", call.getString("preAlertSound", "reminder") ?: "reminder")
        }
        if (call.hasOption("hasBeforeSalahCustom")) {
            editor.putBoolean("hasBeforeSalahCustom", call.getBoolean("hasBeforeSalahCustom", false) ?: false)
        }
        if (call.hasOption("prayerPostAlert")) {
            editor.putBoolean("prayerPostAlert", call.getBoolean("prayerPostAlert", false) ?: false)
        }
        if (call.hasOption("postAlertMinutes")) {
            editor.putInt("postAlertMinutes", call.getInt("postAlertMinutes", 15) ?: 15)
        }
        if (call.hasOption("postAlertSound")) {
            editor.putString("postAlertSound", call.getString("postAlertSound", "reminder") ?: "reminder")
        }
        if (call.hasOption("hasAfterSalahCustom")) {
            editor.putBoolean("hasAfterSalahCustom", call.getBoolean("hasAfterSalahCustom", false) ?: false)
        }
        if (call.hasOption("khushuAutoWithIqama")) {
            editor.putBoolean("khushuAutoWithIqama", call.getBoolean("khushuAutoWithIqama", false) ?: false)
        }
        if (call.hasOption("khushuMode")) {
            editor.putString("khushuMode", call.getString("khushuMode", "silent") ?: "silent")
        }
        val prayers = listOf("Fajr", "Dhuhr", "Asr", "Maghrib", "Isha")
        for (prayer in prayers) {
            val key = "athan_enabled_$prayer"
            if (call.hasOption(key)) {
                editor.putBoolean(key, call.getBoolean(key, true) ?: true)
            } else if (!prefs.contains(key)) {
                editor.putBoolean(key, true)
            }
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

        val context = context
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager

        if (reqCode != null) {
            var success = false
            if (alarmManager != null) {
                success = cancelSingleAlarmStatic(context, alarmManager, reqCode)
            }
            val ret = JSObject()
            ret.put("cancelled", success)
            ret.put("requestCode", reqCode)
            call.resolve(ret)
            return
        }

        if (!alarmId.isNullOrBlank()) {
            var cancelledCount = 0
            if (alarmManager != null) {
                val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                val rawJson = prefs.getString(KEY_SAVED_ALARMS, null)
                if (rawJson != null) {
                    try {
                        val array = JSONArray(rawJson)
                        val remaining = JSONArray()
                        for (i in 0 until array.length()) {
                            val item = array.getJSONObject(i)
                            val pKey = item.optString("prayerKey", "")
                            val aType = item.optString("alarmType", "")
                            val matches = aType.equals(alarmId, ignoreCase = true) ||
                                          pKey.contains(alarmId, ignoreCase = true) ||
                                          (alarmId == "prealert" && (aType == "prealert" || pKey.contains("prealert"))) ||
                                          (alarmId == "postalert" && (aType == "postalert" || pKey.contains("postalert"))) ||
                                          (alarmId == "athan" && (aType.isEmpty() || aType == "athan"))

                            if (matches) {
                                val timeMs = item.optLong("timeMs", 0L)
                                val code = getDeterministicRequestCode(pKey, timeMs)
                                cancelSingleAlarmStatic(context, alarmManager, code)
                                cancelledCount++
                            } else {
                                remaining.put(item)
                            }
                        }
                        prefs.edit().putString(KEY_SAVED_ALARMS, remaining.toString()).apply()
                    } catch (e: Exception) {
                        Log.e(TAG, "Error cancelling alarms for alarmId=$alarmId", e)
                    }
                }
            }
            val ret = JSObject()
            ret.put("cancelled", true)
            ret.put("cancelledCount", cancelledCount)
            ret.put("alarmId", alarmId)
            call.resolve(ret)
            return
        }

        call.reject("Missing alarmId or requestCode parameter")
    }

    @PluginMethod
    fun stopAthan(call: PluginCall) {
        try {
            AthanForegroundService.stopService(context)
            val ret = JSObject()
            ret.put("stopped", true)
            call.resolve(ret)
        } catch (e: Exception) {
            call.reject("Failed to stop athan service", e)
        }
    }

    @PluginMethod
    fun isNativeAthanRunning(call: PluginCall) {
        val ret = JSObject()
        ret.put("isRunning", AthanForegroundService.isServiceRunning)
        call.resolve(ret)
    }

    @PluginMethod
    fun saveAthanFileChunk(call: PluginCall) {
        val muezzinId = call.getString("muezzinId")
        if (muezzinId.isNullOrBlank()) {
            call.reject("Missing muezzinId")
            return
        }
        val idRegex = Regex("^[A-Za-z0-9_-]{1,64}$")
        if (!idRegex.matches(muezzinId)) {
            call.reject("Invalid muezzinId: must match ^[A-Za-z0-9_-]{1,64}$")
            return
        }

        val chunkBase64 = call.getString("chunkBase64")
        if (chunkBase64 == null) {
            call.reject("Missing chunkBase64")
            return
        }

        val index = call.getInt("index", 0) ?: 0
        val isLast = call.getBoolean("isLast", false) ?: false

        val dir = File(context.filesDir, "athan")
        if (!dir.exists()) {
            dir.mkdirs()
        }
        val partFile = File(dir, "$muezzinId.part")
        val audioFile = File(dir, "$muezzinId.audio")

        try {
            val bytes = Base64.decode(chunkBase64, Base64.DEFAULT)
            // index == 0 truncates partFile; index > 0 appends to partFile
            FileOutputStream(partFile, index > 0).use { fos ->
                fos.write(bytes)
                fos.flush()
            }

            if (isLast) {
                val size = partFile.length()
                if (size <= 10 * 1024 || size >= 25 * 1024 * 1024) {
                    partFile.delete()
                    call.reject("Invalid file size: $size bytes (must be > 10KB and < 25MB)")
                    return
                }

                // Verify with MediaMetadataRetriever
                val retriever = MediaMetadataRetriever()
                var durationMs = 0L
                try {
                    retriever.setDataSource(partFile.absolutePath)
                    val durStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                    durationMs = durStr?.toLongOrNull() ?: 0L
                } catch (e: Exception) {
                    Log.e(TAG, "MediaMetadataRetriever failed on ${partFile.absolutePath}", e)
                } finally {
                    try {
                        retriever.release()
                    } catch (_: Exception) {}
                }

                if (durationMs <= 0L) {
                    partFile.delete()
                    call.reject("Corrupt audio file: duration <= 0")
                    return
                }

                // Atomically rename
                if (audioFile.exists()) {
                    audioFile.delete()
                }
                val renamed = partFile.renameTo(audioFile)
                if (!renamed) {
                    partFile.copyTo(audioFile, overwrite = true)
                    partFile.delete()
                }

                val ret = JSObject()
                ret.put("path", audioFile.absolutePath)
                ret.put("saved", true)
                call.resolve(ret)
            } else {
                val ret = JSObject()
                ret.put("saved", true)
                ret.put("chunk", index)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error saving athan file chunk for $muezzinId at index $index", e)
            try {
                if (partFile.exists()) {
                    partFile.delete()
                }
            } catch (_: Exception) {}
            call.reject("Failed to save athan chunk: ${e.message}", e)
        }
    }

    @PluginMethod
    fun saveAthanFile(call: PluginCall) {
        val type = call.getString("type") ?: "general"
        val base64Data = call.getString("base64Data")
        if (base64Data.isNullOrBlank()) {
            call.reject("Missing base64Data")
            return
        }

        val dir = File(context.filesDir, "athan")
        if (!dir.exists()) dir.mkdirs()
        val partFile = File(dir, "$type.part")
        val audioFile = File(dir, "$type.audio")

        try {
            val bytes = Base64.decode(base64Data, Base64.DEFAULT)
            FileOutputStream(partFile, false).use { fos ->
                fos.write(bytes)
                fos.flush()
            }

            val size = partFile.length()
            if (size <= 10 * 1024 || size >= 25 * 1024 * 1024) {
                partFile.delete()
                call.reject("Invalid file size: $size bytes (must be > 10KB and < 25MB)")
                return
            }

            val retriever = MediaMetadataRetriever()
            var durationMs = 0L
            try {
                retriever.setDataSource(partFile.absolutePath)
                val durStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
                durationMs = durStr?.toLongOrNull() ?: 0L
            } catch (e: Exception) {
                Log.e(TAG, "MediaMetadataRetriever failed on ${partFile.absolutePath}", e)
            } finally {
                try {
                    retriever.release()
                } catch (_: Exception) {}
            }

            if (durationMs <= 0L) {
                partFile.delete()
                call.reject("Corrupt audio file: duration <= 0")
                return
            }

            if (audioFile.exists()) audioFile.delete()
            if (!partFile.renameTo(audioFile)) {
                partFile.copyTo(audioFile, overwrite = true)
                partFile.delete()
            }

            val ret = JSObject()
            ret.put("path", audioFile.absolutePath)
            ret.put("saved", true)
            call.resolve(ret)
        } catch (e: Exception) {
            if (partFile.exists()) partFile.delete()
            call.reject("Failed to save athan file: ${e.message}", e)
        }
    }

    @PluginMethod
    fun setNativeAthanFiles(call: PluginCall) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val editor = prefs.edit()
        val keys = listOf("general", "fajr", "dhuhr", "asr", "maghrib", "isha")

        val pathsObj = call.getObject("paths")

        for (k in keys) {
            var path: String? = pathsObj?.getString(k)
            // Backward compatibility with old { generalPath, fajrPath }
            if (path.isNullOrEmpty() && k == "general") {
                path = call.getString("generalPath")
            } else if (path.isNullOrEmpty() && k == "fajr") {
                path = call.getString("fajrPath")
            }

            val prefKey = "athan_file_$k"
            if (!path.isNullOrEmpty()) {
                editor.putString(prefKey, path)
            } else if (pathsObj != null || call.hasOption("${k}Path") || call.hasOption(k)) {
                editor.remove(prefKey)
            }
        }
        editor.apply()

        // Delete files in filesDir/athan/ that are not referenced by any pref
        try {
            val referencedPaths = mutableSetOf<String>()
            for (k in keys) {
                val p = prefs.getString("athan_file_$k", null)
                if (!p.isNullOrEmpty()) {
                    try {
                        referencedPaths.add(File(p).canonicalPath)
                    } catch (_: Exception) {
                        referencedPaths.add(p)
                    }
                }
            }

            val dir = File(context.filesDir, "athan")
            if (dir.exists() && dir.isDirectory) {
                dir.listFiles()?.forEach { f ->
                    try {
                        if (!referencedPaths.contains(f.canonicalPath) && !f.name.endsWith(".part")) {
                            f.delete()
                            Log.d(TAG, "Deleted unreferenced athan file: ${f.name}")
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Error cleaning unreferenced athan file: ${f.name}", e)
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error during unreferenced athan file pruning", e)
        }

        val ret = JSObject()
        ret.put("saved", true)
        call.resolve(ret)
    }

    @PluginMethod
    fun getNativeAthanFiles(call: PluginCall) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val keys = listOf("general", "fajr", "dhuhr", "asr", "maghrib", "isha")
        val ret = JSObject()
        for (k in keys) {
            val path = prefs.getString("athan_file_$k", null)
            val info = JSObject()
            info.put("path", path ?: "")
            if (!path.isNullOrEmpty()) {
                val f = File(path)
                val exists = f.exists()
                info.put("exists", exists)
                info.put("sizeBytes", if (exists) f.length() else 0L)
            } else {
                info.put("exists", false)
                info.put("sizeBytes", 0L)
            }
            ret.put(k, info)
        }
        call.resolve(ret)
    }

    @PluginMethod
    fun canRequestPackageInstalls(call: PluginCall) {
        val context = context
        val canInstall = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.packageManager.canRequestPackageInstalls()
        } else {
            true
        }
        val ret = JSObject()
        ret.put("canInstall", canInstall)
        call.resolve(ret)
    }

    @PluginMethod
    fun openInstallPermissionSettings(call: PluginCall) {
        val context = context
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:${context.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
                val ret = JSObject()
                ret.put("opened", true)
                call.resolve(ret)
            } else {
                val ret = JSObject()
                ret.put("opened", true)
                call.resolve(ret)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Failed to open unknown app sources settings", e)
            call.reject("Could not open install permission settings: ${e.message}")
        }
    }

    @PluginMethod
    fun downloadAndInstallApk(call: PluginCall) {
        val apkUrl = call.getString("url")
        if (apkUrl.isNullOrBlank()) {
            call.reject("Missing APK download URL")
            return
        }

        val context = context

        // Request POST_NOTIFICATIONS on Android 13+ if not granted
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                try {
                    activity?.requestPermissions(arrayOf(Manifest.permission.POST_NOTIFICATIONS), 101)
                } catch (e: Exception) {
                    Log.w(TAG, "Could not request notifications permission", e)
                }
            }
        }

        try {
            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as? DownloadManager
            if (downloadManager == null) {
                call.reject("DownloadManager service not available")
                return
            }

            val destinationDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
            if (destinationDir != null && !destinationDir.exists()) {
                destinationDir.mkdirs()
            }
            val apkFile = File(destinationDir, "hemmaty-update.apk")
            if (apkFile.exists()) {
                apkFile.delete()
            }

            val request = DownloadManager.Request(Uri.parse(apkUrl)).apply {
                setTitle("تحديث تطبيق هِمَّتِي")
                setDescription("جاري تنزيل أحدث إصدار من التطبيق في الخلفية...")
                setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
                setDestinationInExternalFilesDir(context, Environment.DIRECTORY_DOWNLOADS, "hemmaty-update.apk")
                setAllowedOverMetered(true)
                setAllowedOverRoaming(true)
            }

            val downloadId = downloadManager.enqueue(request)
            Log.d(TAG, "Enqueued DownloadManager task: id=$downloadId for $apkUrl")

            // Monitor progress every 1 second while app is open
            val handler = Handler(Looper.getMainLooper())
            var progressRunnable: Runnable? = null
            var downloadReceiver: BroadcastReceiver? = null

            progressRunnable = object : Runnable {
                override fun run() {
                    try {
                        val query = DownloadManager.Query().setFilterById(downloadId)
                        val cursor = downloadManager.query(query)
                        if (cursor != null && cursor.moveToFirst()) {
                            val bytesCol = cursor.getColumnIndex(DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR)
                            val totalCol = cursor.getColumnIndex(DownloadManager.COLUMN_TOTAL_SIZE_BYTES)
                            val statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)

                            val bytesDownloaded = if (bytesCol >= 0) cursor.getLong(bytesCol) else 0L
                            val totalBytes = if (totalCol >= 0) cursor.getLong(totalCol) else 0L
                            val status = if (statusCol >= 0) cursor.getInt(statusCol) else -1
                            cursor.close()

                            if (totalBytes > 0) {
                                val progressPercent = ((bytesDownloaded * 100) / totalBytes).toInt()
                                val progressData = JSObject().apply {
                                    put("progress", progressPercent)
                                    put("downloadedBytes", bytesDownloaded)
                                    put("totalBytes", totalBytes)
                                }
                                notifyListeners("apkDownloadProgress", progressData)
                            }

                            if (status == DownloadManager.STATUS_SUCCESSFUL || status == DownloadManager.STATUS_FAILED) {
                                return // Stop polling
                            }
                        } else {
                            cursor?.close()
                        }
                    } catch (e: Exception) {
                        Log.w(TAG, "Error checking download progress", e)
                    }
                    handler.postDelayed(this, 1000L)
                }
            }
            handler.postDelayed(progressRunnable, 1000L)

            // Register completion BroadcastReceiver
            downloadReceiver = object : BroadcastReceiver() {
                override fun onReceive(recvContext: Context, intent: Intent) {
                    val completedId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
                    if (completedId != downloadId) return

                    handler.removeCallbacksAndMessages(null)
                    try {
                        context.unregisterReceiver(this)
                    } catch (_: Exception) {}

                    try {
                        val query = DownloadManager.Query().setFilterById(downloadId)
                        val cursor = downloadManager.query(query)
                        var status = -1
                        if (cursor != null && cursor.moveToFirst()) {
                            val statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                            if (statusCol >= 0) status = cursor.getInt(statusCol)
                            cursor.close()
                        }

                        if (status == DownloadManager.STATUS_SUCCESSFUL) {
                            if (apkFile.exists() && apkFile.length() > 1024 * 1024L) {
                                Log.d(TAG, "APK download complete and valid (${apkFile.length()} bytes)")

                                val authority = "${context.packageName}.fileprovider"
                                val apkUri = FileProvider.getUriForFile(context, authority, apkFile)

                                val installIntent = Intent(Intent.ACTION_VIEW).apply {
                                    setDataAndType(apkUri, "application/vnd.android.package-archive")
                                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                                }

                                // Show notification "التحديث جاهز، اضغط للتثبيت"
                                val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
                                if (notificationManager != null) {
                                    val updateChannelId = "app_updates_channel"
                                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                        val channel = NotificationChannel(
                                            updateChannelId,
                                            "تحديثات التطبيق",
                                            NotificationManager.IMPORTANCE_HIGH
                                        ).apply {
                                            description = "إشعارات تنزيل وتثبيت تحديثات هِمَّتِي"
                                            setShowBadge(true)
                                        }
                                        notificationManager.createNotificationChannel(channel)
                                    }

                                    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                                    } else {
                                        PendingIntent.FLAG_UPDATE_CURRENT
                                    }
                                    val pendingIntent = PendingIntent.getActivity(context, 99991, installIntent, flags)

                                    val notif = NotificationCompat.Builder(context, updateChannelId)
                                        .setSmallIcon(android.R.drawable.stat_sys_download_done)
                                        .setContentTitle("التحديث جاهز، اضغط للتثبيت 🚀")
                                        .setContentText("تم تنزيل تحديث هِمَّتِي بنجاح. اضغط هنا لبدء التثبيت الآن.")
                                        .setStyle(NotificationCompat.BigTextStyle().bigText("تم تنزيل تحديث هِمَّتِي بنجاح. اضغط هنا لتثبيت الإصدار الجديد فوراً."))
                                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                                        .setAutoCancel(true)
                                        .setContentIntent(pendingIntent)
                                        .build()

                                    notificationManager.notify(99991, notif)
                                }

                                // If app is in foreground, trigger installer directly
                                val isForeground = activity != null && !activity.isFinishing
                                if (isForeground) {
                                    try {
                                        context.startActivity(installIntent)
                                    } catch (e: Exception) {
                                        Log.w(TAG, "Could not open installer directly from foreground", e)
                                    }
                                }

                                val completeData = JSObject().apply {
                                    put("success", true)
                                    put("message", "Package installer ready")
                                }
                                notifyListeners("apkDownloadComplete", completeData)
                                call.resolve(completeData)
                            } else {
                                Log.e(TAG, "APK file missing or invalid: size=${apkFile.length()}")
                                val errorData = JSObject().apply {
                                    put("success", false)
                                    put("error", "ملف التحديث غير مكتمل أو تالف")
                                }
                                notifyListeners("apkDownloadError", errorData)
                                call.reject("ملف التحديث غير مكتمل أو تالف")
                            }
                        } else {
                            Log.e(TAG, "DownloadManager failed with status: $status")
                            val errorData = JSObject().apply {
                                put("success", false)
                                put("error", "فشل تنزيل ملف التحديث")
                            }
                            notifyListeners("apkDownloadError", errorData)
                            call.reject("فشل تنزيل ملف التحديث")
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error handling download complete", e)
                        val errorData = JSObject().apply {
                            put("success", false)
                            put("error", e.message ?: "خطأ أثناء معالجة التحديث")
                        }
                        notifyListeners("apkDownloadError", errorData)
                        call.reject("خطأ أثناء معالجة التحديث: ${e.message}")
                    }
                }
            }

            val filter = IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.registerReceiver(context, downloadReceiver, filter, ContextCompat.RECEIVER_EXPORTED)
            } else {
                context.registerReceiver(downloadReceiver, filter)
            }

        } catch (e: Exception) {
            Log.e(TAG, "Failed to start DownloadManager", e)
            val errorData = JSObject().apply {
                put("success", false)
                put("error", e.message ?: "Failed to start download")
            }
            notifyListeners("apkDownloadError", errorData)
            call.reject("Failed to start download: ${e.message}")
        }
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
