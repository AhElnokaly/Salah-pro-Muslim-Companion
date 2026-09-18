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
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

class SalahWidgetProvider : AppWidgetProvider() {

    companion object {
        const val ACTION_TOGGLE_KHUSHU = "com.salahpro.app.widget.ACTION_TOGGLE_KHUSHU"
        const val ACTION_INCREMENT_TASBEEH = "com.salahpro.app.widget.ACTION_INCREMENT_TASBEEH"

        private const val KHUSHU_TOGGLE_REQUEST_CODE = 1001
        private const val TASBEEH_REQUEST_CODE = 1002

        fun updateAllWidgets(context: Context) {
            val appWidgetManager = AppWidgetManager.getInstance(context)
            val componentName = ComponentName(context, SalahWidgetProvider::class.java)
            val widgetIds = appWidgetManager.getAppWidgetIds(componentName)
            for (widgetId in widgetIds) {
                updateWidget(context, appWidgetManager, widgetId)
            }
        }

        private fun toArabicDigits(number: Any): String {
            val str = number.toString()
            val arabicDigits = charArrayOf('٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩')
            val sb = StringBuilder()
            for (ch in str) {
                if (ch in '0'..'9') {
                    sb.append(arabicDigits[ch - '0'])
                } else {
                    sb.append(ch)
                }
            }
            return sb.toString()
        }

        private fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val views = RemoteViews(context.packageName, R.layout.salah_widget_layout)

            val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            } else {
                PendingIntent.FLAG_UPDATE_CURRENT
            }

            // 1. Open App on widget root click
            val appIntent = Intent(context, MainActivity::class.java)
            val appPendingIntent = PendingIntent.getActivity(context, 0, appIntent, flags)
            views.setOnClickPendingIntent(R.id.widget_root, appPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_clock_box, appPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_next_prayer_box, appPendingIntent)
            views.setOnClickPendingIntent(R.id.widget_dhikr_text, appPendingIntent)

            // 2. Khushu quick toggle PendingIntent
            val toggleKhushuIntent = Intent(context, SalahWidgetProvider::class.java).apply {
                action = ACTION_TOGGLE_KHUSHU
            }
            val khushuPendingIntent = PendingIntent.getBroadcast(
                context,
                KHUSHU_TOGGLE_REQUEST_CODE,
                toggleKhushuIntent,
                flags
            )
            views.setOnClickPendingIntent(R.id.widget_khushu_btn, khushuPendingIntent)

            // 3. Tasbeeh counter increment PendingIntent
            val tasbeehIntent = Intent(context, SalahWidgetProvider::class.java).apply {
                action = ACTION_INCREMENT_TASBEEH
            }
            val tasbeehPendingIntent = PendingIntent.getBroadcast(
                context,
                TASBEEH_REQUEST_CODE,
                tasbeehIntent,
                flags
            )
            views.setOnClickPendingIntent(R.id.widget_tasbeeh_btn, tasbeehPendingIntent)

            // 4. Read stored data from SharedPreferences
            val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
            val widgetDataJson = prefs.getString("widget_data_json", null)
            val tasbeehCount = prefs.getInt("widget_tasbeeh_count", 0)

            // Default values matching in-app widget appearance
            var hijriDate = "الجمعة • ٨ ربيع الآخر ١٤٤٨"
            var moonPhase = "🌓 التربيع الأول"
            var currentTime = ""
            var nextPrayerTitle = "الصلاة القادمة: صلاة الجمعة"
            var nextPrayerTime = "12:54 م"
            var remainingText = "⏳ متبقي: باقي ١ س و ١٢ د"
            var progressPercent = 80
            var activePrayer = "dhuhr" // fajr, dhuhr, asr, maghrib, isha
            var fajr = "05:18 ص"
            var dhuhr = "12:54 م"
            var asr = "04:23 م"
            var maghrib = "07:02 م"
            var isha = "08:21 م"
            var isJumuah = false
            var dhikrText = "«سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ»"
            var timePeriod = ""

            if (widgetDataJson != null) {
                try {
                    val json = JSONObject(widgetDataJson)
                    hijriDate = json.optString("hijriDate", hijriDate)
                    moonPhase = json.optString("moonPhase", moonPhase)
                    currentTime = json.optString("currentTime", "")
                    nextPrayerTitle = json.optString("nextPrayerTitle", nextPrayerTitle)
                    nextPrayerTime = json.optString("nextPrayerTime", nextPrayerTime)
                    remainingText = json.optString("remainingText", remainingText)
                    progressPercent = json.optInt("progressPercent", progressPercent)
                    activePrayer = json.optString("activePrayer", json.optString("nextPrayer", "dhuhr")).lowercase()
                    fajr = json.optString("fajr", fajr)
                    dhuhr = json.optString("dhuhr", dhuhr)
                    asr = json.optString("asr", asr)
                    maghrib = json.optString("maghrib", maghrib)
                    isha = json.optString("isha", isha)
                    isJumuah = json.optBoolean("isJumuah", false)
                    dhikrText = json.optString("dhikrText", dhikrText)
                    timePeriod = json.optString("timePeriod", "")
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }

            // Dynamic Spiritual Background matching time of day / Hero card
            val cal = Calendar.getInstance()
            val hour = cal.get(Calendar.HOUR_OF_DAY)
            val isDaytime = hour in 6..17

            val bgResId = when {
                timePeriod.equals("friday", ignoreCase = true) || (isJumuah && isDaytime) -> R.drawable.widget_card_bg_friday
                timePeriod.equals("fajr", ignoreCase = true) || activePrayer == "fajr" -> R.drawable.widget_card_bg_fajr
                timePeriod.equals("sunset", ignoreCase = true) || activePrayer == "maghrib" -> R.drawable.widget_card_bg_sunset
                timePeriod.equals("day", ignoreCase = true) || (isDaytime && (activePrayer == "dhuhr" || activePrayer == "asr")) -> R.drawable.widget_card_bg_day
                else -> R.drawable.widget_card_bg_night
            }
            views.setInt(R.id.widget_root, "setBackgroundResource", bgResId)

            // Fallback for current digital time
            if (currentTime.isEmpty()) {
                val timeFormat = SimpleDateFormat("hh:mm:ss a", Locale("ar"))
                currentTime = timeFormat.format(Date())
            }

            // Apply Texts
            views.setTextViewText(R.id.widget_date_text, hijriDate)
            views.setTextViewText(R.id.widget_moon_phase, moonPhase)
            views.setTextViewText(R.id.widget_clock_time, currentTime)
            views.setTextViewText(R.id.widget_clock_label, "التوقيت المحلي")

            views.setTextViewText(R.id.widget_next_prayer_title, nextPrayerTitle)
            views.setTextViewText(R.id.widget_next_prayer_time_badge, nextPrayerTime)
            views.setTextViewText(R.id.widget_remaining_text, remainingText)
            views.setTextViewText(R.id.widget_progress_percent, "(%${toArabicDigits(progressPercent)})")
            views.setProgressBar(R.id.widget_progress_bar, 100, progressPercent.coerceIn(0, 100), false)

            views.setTextViewText(R.id.widget_time_fajr, fajr)
            views.setTextViewText(R.id.widget_time_dhuhr, dhuhr)
            views.setTextViewText(R.id.widget_time_asr, asr)
            views.setTextViewText(R.id.widget_time_maghrib, maghrib)
            views.setTextViewText(R.id.widget_time_isha, isha)

            val dhuhrLabel = if (isJumuah) "الجمعة" else "الظهر"
            views.setTextViewText(R.id.text_dhuhr_name, dhuhrLabel)

            // Highlight Active Prayer Cell in Gold and rest in normal dark
            val prayers = listOf(
                PrayerCellInfo("fajr", R.id.cell_fajr, R.id.text_fajr_name, R.id.widget_time_fajr),
                PrayerCellInfo("dhuhr", R.id.cell_dhuhr, R.id.text_dhuhr_name, R.id.widget_time_dhuhr),
                PrayerCellInfo("asr", R.id.cell_asr, R.id.text_asr_name, R.id.widget_time_asr),
                PrayerCellInfo("maghrib", R.id.cell_maghrib, R.id.text_maghrib_name, R.id.widget_time_maghrib),
                PrayerCellInfo("isha", R.id.cell_isha, R.id.text_isha_name, R.id.widget_time_isha)
            )

            for (cell in prayers) {
                val isActive = cell.key.equals(activePrayer, ignoreCase = true)
                if (isActive) {
                    views.setInt(cell.containerId, "setBackgroundResource", R.drawable.widget_highlight_prayer_bg)
                    views.setTextColor(cell.nameId, 0xFF0F172A.toInt())
                    views.setTextColor(cell.timeId, 0xFF0F172A.toInt())
                } else {
                    views.setInt(cell.containerId, "setBackgroundResource", R.drawable.widget_normal_prayer_bg)
                    views.setTextColor(cell.nameId, 0xFF94A3B8.toInt())
                    views.setTextColor(cell.timeId, 0xFFFFFFFF.toInt())
                }
            }

            // Spiritual Dhikr Quote
            views.setTextViewText(R.id.widget_dhikr_text, dhikrText)

            // Tasbeeh Button
            views.setTextViewText(R.id.widget_tasbeeh_btn, "📿 تسبيح (${toArabicDigits(tasbeehCount)})")

            // Khushu Button State
            val isKhushuActive = KhushuRestoreReceiver.isKhushuActive(context)
            if (isKhushuActive) {
                views.setTextViewText(R.id.widget_khushu_btn, "الخشوع نشط 🔕")
                views.setInt(R.id.widget_khushu_btn, "setBackgroundResource", R.drawable.widget_khushu_active_btn_bg)
                views.setTextColor(R.id.widget_khushu_btn, 0xFF0F172A.toInt())
            } else {
                views.setTextViewText(R.id.widget_khushu_btn, "🔔 وضع الخشوع")
                views.setInt(R.id.widget_khushu_btn, "setBackgroundResource", R.drawable.widget_khushu_btn_bg)
                views.setTextColor(R.id.widget_khushu_btn, 0xFFFFFFFF.toInt())
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }

    private data class PrayerCellInfo(
        val key: String,
        val containerId: Int,
        val nameId: Int,
        val timeId: Int
    )

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
        when (intent.action) {
            ACTION_TOGGLE_KHUSHU -> {
                val isActive = KhushuRestoreReceiver.isKhushuActive(context)
                if (isActive) {
                    KhushuRestoreReceiver.restoreOriginalState(context)
                } else {
                    KhushuRestoreReceiver.activateKhushuDirectly(context, "silent", 30)
                }
                updateAllWidgets(context)
            }
            ACTION_INCREMENT_TASBEEH -> {
                val prefs = context.getSharedPreferences(AthanAlarmPlugin.PREFS_NAME, Context.MODE_PRIVATE)
                val currentCount = prefs.getInt("widget_tasbeeh_count", 0)
                prefs.edit().putInt("widget_tasbeeh_count", currentCount + 1).apply()
                updateAllWidgets(context)
            }
            else -> {
                super.onReceive(context, intent)
            }
        }
    }
}
