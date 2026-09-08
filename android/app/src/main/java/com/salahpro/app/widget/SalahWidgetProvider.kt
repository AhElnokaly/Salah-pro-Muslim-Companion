package com.salahpro.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.widget.RemoteViews
import com.salahpro.app.MainActivity
import com.salahpro.app.R
import com.salahpro.app.plugins.AthanAlarmPlugin
import com.salahpro.app.plugins.KhushuRestoreReceiver
import org.json.JSONObject

class SalahWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_TOGGLE_KHUSHU = "com.salahpro.app.widget.ACTION_TOGGLE_KHUSHU"
        private const val KHUSHU_TOGGLE_REQUEST_CODE = 1001

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, SalahWidgetProvider::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
            for (widgetId in widgetIds) {
                updateWidget(context, appWidgetManager, widgetId)
            }
        }

        private fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.salah_widget_layout)

            // Open App on widget click
            val intent = Intent(context, MainActivity::class.java)
            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }
            val pendingIntent = PendingIntent.getActivity(context, 0, intent, flags)
            views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            views.setOnClickPendingIntent(R.id.widget_title, pendingIntent)

            // Khushu quick toggle PendingIntent
            val toggleIntent = Intent(context, SalahWidgetProvider::class.java).apply {
                action = ACTION_TOGGLE_KHUSHU
            }
            val togglePendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_TOGGLE_REQUEST_CODE,
                toggleIntent,
                flags
            )
            views.setOnClickPendingIntent(R.id.widget_khushu_btn, togglePendingIntent)

            // Read stored times from SharedPreferences
            val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
            val widgetDataJson = prefs.getString("widget_data_json", null)
            val cityName = prefs.getString("widget_city_name", "مواقيت الصلاة")

            views.setTextViewText(R.id.widget_city, cityName)

            if (widgetDataJson != null) {
                try {
                    val json = JSONObject(widgetDataJson)
                    val fajr = json.optString("fajr", "04:30")
                    val dhuhr = json.optString("dhuhr", "12:15")
                    val asr = json.optString("asr", "15:45")
                    val maghrib = json.optString("maghrib", "19:02")
                    val isha = json.optString("isha", "20:35")
                    val nextPrayerText = json.optString("nextPrayer", "الفجر")

                    views.setTextViewText(R.id.widget_time_fajr, fajr)
                    views.setTextViewText(R.id.widget_time_dhuhr, dhuhr)
                    views.setTextViewText(R.id.widget_time_asr, asr)
                    views.setTextViewText(R.id.widget_time_maghrib, maghrib)
                    views.setTextViewText(R.id.widget_time_isha, isha)
                    views.setTextViewText(R.id.widget_next_prayer, nextPrayerText)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            // Update Khushu Mode state & button text
            val isKhushuActive = KhushuRestoreReceiver.isKhushuActive(context)
            val remainingMin = KhushuRestoreReceiver.getRemainingMinutes(context)
            if (isKhushuActive) {
                views.setTextViewText(R.id.widget_khushu_status, "الخشوع نشط: هدوء وسكون (متبقي $remainingMin د)")
                views.setTextViewText(R.id.widget_khushu_btn, "إنهاء الخشوع 🔔")
                views.setTextColor(R.id.widget_khushu_status, 0xFF34D399.toInt()) // emerald-400
            } else {
                views.setTextViewText(R.id.widget_khushu_status, "وضع الخشوع: هدوء وسكون")
                views.setTextViewText(R.id.widget_khushu_btn, "تفعيل الخشوع 🔕")
                views.setTextColor(R.id.widget_khushu_status, 0xFF94A3B8.toInt()) // slate-400
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == ACTION_TOGGLE_KHUSHU) {
            val isActive = KhushuRestoreReceiver.isKhushuActive(context)
            if (isActive) {
                KhushuRestoreReceiver.restoreOriginalState(context)
            } else {
                KhushuRestoreReceiver.activateKhushuDirectly(context, "silent", 30)
            }
            updateAllWidgets(context)
        } else {
            super.onReceive(context, intent)
        }
    }
}

