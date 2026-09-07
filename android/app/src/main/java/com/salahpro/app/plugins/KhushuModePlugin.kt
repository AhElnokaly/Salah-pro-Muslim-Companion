package com.salahpro.app.plugins

import android.app.AlarmManager
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import com.salahpro.app.widget.SalahWidgetProvider

@CapacitorPlugin(name = "KhushuMode")
class KhushuModePlugin : Plugin() {

    companion object {
        const val TAG = "KhushuModePlugin"
    }

    private val prefs by lazy {
        context.getSharedPreferences(KhushuRestoreReceiver.PREFS_NAME, Context.MODE_PRIVATE)
    }

    private val notificationManager by lazy {
        context.getSystemService(NotificationManager::class.java)
    }

    private val audioManager by lazy {
        context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    }

    private val alarmManager by lazy {
        context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager
    }

    // 1. فحص الإذن — هل عندنا ACCESS_NOTIFICATION_POLICY فعليًا ممنوح؟
    @PluginMethod
    fun checkPermission(call: PluginCall) {
        val granted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notificationManager?.isNotificationPolicyAccessGranted == true
        } else {
            true
        }
        val ret = JSObject()
        ret.put("granted", granted)
        call.resolve(ret)
    }

    // 2. طلب الإذن — يفتح شاشة النظام (توجيه يدوي لصفحة سياسة الإشعارات)
    @PluginMethod
    fun requestPermission(call: PluginCall) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                context.startActivity(intent)
            }
            val ret = JSObject()
            ret.put("requested", true)
            call.resolve(ret)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to launch notification policy settings", e)
            call.reject("Could not open notification policy settings: ${e.message}")
        }
    }

    // 3. تفعيل الوضع — بيحفظ الحالة الأصلية قبل التغيير ويجدول منبه استعادة عبر AlarmManager
    @PluginMethod
    fun activate(call: PluginCall) {
        val mode = call.getString("mode") ?: "silent" // "silent" | "dnd"
        val durationMinutes = call.getInt("durationMinutes") ?: 30

        try {
            // Check if already active to avoid overwriting original normal device state
            val alreadyActive = prefs.getBoolean(KhushuRestoreReceiver.KEY_IS_ACTIVE, false)
            if (!alreadyActive) {
                val originalFilter = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    notificationManager?.currentInterruptionFilter ?: NotificationManager.INTERRUPTION_FILTER_ALL
                } else {
                    NotificationManager.INTERRUPTION_FILTER_ALL
                }
                val originalRinger = audioManager?.ringerMode ?: AudioManager.RINGER_MODE_NORMAL

                prefs.edit()
                    .putInt(KhushuRestoreReceiver.KEY_ORIGINAL_FILTER, originalFilter)
                    .putInt(KhushuRestoreReceiver.KEY_ORIGINAL_RINGER, originalRinger)
                    .apply()
                Log.d(TAG, "Saved initial device state - filter: $originalFilter, ringer: $originalRinger")
            }

            // Apply selected Khushu Mode
            when (mode) {
                "dnd" -> {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        if (notificationManager?.isNotificationPolicyAccessGranted == true) {
                            notificationManager?.setInterruptionFilter(NotificationManager.INTERRUPTION_FILTER_NONE)
                            Log.d(TAG, "Set interruption filter to INTERRUPTION_FILTER_NONE")
                        } else {
                            Log.w(TAG, "DND requested but permission not granted, falling back to silent ringer")
                            audioManager?.ringerMode = AudioManager.RINGER_MODE_SILENT
                        }
                    } else {
                        audioManager?.ringerMode = AudioManager.RINGER_MODE_SILENT
                    }
                }
                "silent" -> {
                    audioManager?.ringerMode = AudioManager.RINGER_MODE_SILENT
                    Log.d(TAG, "Set ringer mode to RINGER_MODE_SILENT")
                }
            }

            val now = System.currentTimeMillis()
            prefs.edit()
                .putBoolean(KhushuRestoreReceiver.KEY_IS_ACTIVE, true)
                .putString(KhushuRestoreReceiver.KEY_MODE, mode)
                .putInt(KhushuRestoreReceiver.KEY_DURATION_MINUTES, durationMinutes)
                .putLong(KhushuRestoreReceiver.KEY_ACTIVATED_AT, now)
                .apply()

            // Schedule reliable native restore alarm
            scheduleRestoreAlarm(durationMinutes)

            SalahWidgetProvider.updateAllWidgets(context)

            val ret = JSObject()
            ret.put("active", true)
            ret.put("mode", mode)
            ret.put("durationMinutes", durationMinutes)
            call.resolve(ret)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to activate Khushu mode", e)
            call.reject("Failed to activate Khushu mode: ${e.message}")
        }
    }

    // 4. استعادة يدوية فورية (لو المستخدم قفل الوضع بنفسه قبل انتهاء المدة)
    @PluginMethod
    fun deactivate(call: PluginCall) {
        try {
            restoreOriginalStateNow()
            cancelRestoreAlarm()

            SalahWidgetProvider.updateAllWidgets(context)

            val ret = JSObject()
            ret.put("active", false)
            call.resolve(ret)
        } catch (e: Exception) {
            Log.e(TAG, "Failed to deactivate Khushu mode", e)
            call.reject("Failed to deactivate Khushu mode: ${e.message}")
        }
    }

    // 5. حالة الوضع الحالية (للـUI عشان يعرف يعرض إيه والوقت المتبقي)
    @PluginMethod
    fun getStatus(call: PluginCall) {
        val isActive = prefs.getBoolean(KhushuRestoreReceiver.KEY_IS_ACTIVE, false)
        val mode = prefs.getString(KhushuRestoreReceiver.KEY_MODE, "silent") ?: "silent"
        val durationMinutes = prefs.getInt(KhushuRestoreReceiver.KEY_DURATION_MINUTES, 30)
        val activatedAt = prefs.getLong(KhushuRestoreReceiver.KEY_ACTIVATED_AT, 0L)

        val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            notificationManager?.isNotificationPolicyAccessGranted == true
        } else {
            true
        }

        var remainingSeconds = 0
        if (isActive && activatedAt > 0L) {
            val elapsedMs = System.currentTimeMillis() - activatedAt
            val totalMs = durationMinutes * 60_000L
            val leftMs = totalMs - elapsedMs
            remainingSeconds = if (leftMs > 0L) (leftMs / 1000L).toInt() else 0
            if (leftMs <= 0L) {
                // Time has passed, ensure restored
                restoreOriginalStateNow()
            }
        }

        val ret = JSObject()
        ret.put("active", isActive && remainingSeconds > 0)
        ret.put("mode", mode)
        ret.put("durationMinutes", durationMinutes)
        ret.put("remainingSeconds", remainingSeconds)
        ret.put("hasPermission", hasPermission)
        call.resolve(ret)
    }

    private fun scheduleRestoreAlarm(durationMinutes: Int) {
        val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
            action = KhushuRestoreReceiver.ACTION_RESTORE_KHUSHU
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            KhushuRestoreReceiver.KHUSHU_RESTORE_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        val triggerAt = System.currentTimeMillis() + (durationMinutes * 60_000L)

        if (alarmManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager?.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            } else {
                alarmManager?.setExact(AlarmManager.RTC_WAKEUP, triggerAt, pendingIntent)
            }
            Log.d(TAG, "Scheduled Khushu restore alarm in $durationMinutes minutes with requestCode ${KhushuRestoreReceiver.KHUSHU_RESTORE_REQUEST_CODE}")
        }
    }

    private fun cancelRestoreAlarm() {
        val intent = Intent(context, KhushuRestoreReceiver::class.java).apply {
            action = KhushuRestoreReceiver.ACTION_RESTORE_KHUSHU
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            KhushuRestoreReceiver.KHUSHU_RESTORE_REQUEST_CODE,
            intent,
            PendingIntent.FLAG_NO_CREATE or PendingIntent.FLAG_IMMUTABLE
        )
        if (pendingIntent != null && alarmManager != null) {
            alarmManager?.cancel(pendingIntent)
            pendingIntent.cancel()
            Log.d(TAG, "Cancelled Khushu restore alarm")
        }
    }

    private fun restoreOriginalStateNow() {
        val originalFilter = prefs.getInt(KhushuRestoreReceiver.KEY_ORIGINAL_FILTER, NotificationManager.INTERRUPTION_FILTER_ALL)
        val originalRinger = prefs.getInt(KhushuRestoreReceiver.KEY_ORIGINAL_RINGER, AudioManager.RINGER_MODE_NORMAL)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                if (notificationManager?.isNotificationPolicyAccessGranted == true) {
                    notificationManager?.setInterruptionFilter(originalFilter)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Failed restoring interruption filter in plugin", e)
            }
        }

        try {
            audioManager?.ringerMode = originalRinger
        } catch (e: Exception) {
            Log.e(TAG, "Failed restoring ringer mode in plugin", e)
        }

        prefs.edit()
            .putBoolean(KhushuRestoreReceiver.KEY_IS_ACTIVE, false)
            .putLong(KhushuRestoreReceiver.KEY_ACTIVATED_AT, 0L)
            .putInt(KhushuRestoreReceiver.KEY_DURATION_MINUTES, 0)
            .apply()
    }
}
