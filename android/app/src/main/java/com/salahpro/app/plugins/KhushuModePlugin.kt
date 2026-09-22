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
            KhushuRestoreReceiver.activateKhushuDirectly(context, mode, durationMinutes)

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
            KhushuRestoreReceiver.restoreOriginalState(context)

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
        val isActive = KhushuRestoreReceiver.isKhushuActive(context)
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
                KhushuRestoreReceiver.restoreOriginalState(context)
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
}
