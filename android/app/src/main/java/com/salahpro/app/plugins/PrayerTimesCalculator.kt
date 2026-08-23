package com.salahpro.app.plugins

import java.util.Calendar
import java.util.TimeZone
import kotlin.math.*

object PrayerTimesCalculator {

    data class PrayerTimeMs(
        val fajr: Long,
        val dhuhr: Long,
        val asr: Long,
        val maghrib: Long,
        val isha: Long
    )

    private fun dSin(deg: Double) = sin(Math.toRadians(deg))
    private fun dCos(deg: Double) = cos(Math.toRadians(deg))
    private fun dTan(deg: Double) = tan(Math.toRadians(deg))
    private fun dAsin(x: Double) = Math.toDegrees(asin(x))
    private fun dAcos(x: Double) = Math.toDegrees(acos(x))
    private fun dAtan(x: Double) = Math.toDegrees(atan(x))
    private fun dAtan2(y: Double, x: Double) = Math.toDegrees(atan2(y, x))

    fun calculateForDate(
        year: Int,
        month: Int, // 1-12
        day: Int,   // 1-31
        lat: Double,
        lng: Double,
        calcMethod: String = "Egypt",
        madhab: String = "standard",
        fajrOffsetMin: Double = 0.0,
        dhuhrOffsetMin: Double = 0.0,
        asrOffsetMin: Double = 0.0,
        maghribOffsetMin: Double = 0.0,
        ishaOffsetMin: Double = 0.0,
        timeZoneId: String? = null
    ): PrayerTimeMs {
        val targetZone = if (!timeZoneId.isNullOrEmpty()) {
            TimeZone.getTimeZone(timeZoneId)
        } else {
            TimeZone.getDefault()
        }

        val cal = Calendar.getInstance(TimeZone.getTimeZone("UTC")).apply {
            set(year, month - 1, day, 0, 0, 0)
            set(Calendar.MILLISECOND, 0)
        }

        val dayOfYear = cal.get(Calendar.DAY_OF_YEAR).toDouble()
        val g = (357.529 + 0.98560028 * dayOfYear) % 360
        val q = (280.459 + 0.98564736 * dayOfYear) % 360
        val l = (q + 1.915 * dSin(g) + 0.02 * dSin(2 * g)) % 360

        val obliq = 23.439 - 0.00000036 * dayOfYear
        val declination = dAsin(dSin(obliq) * dSin(l))

        var ra = dAtan2(dCos(obliq) * dSin(l), dCos(l)) / 15.0
        if (ra < 0) ra += 24.0
        var eqT = q / 15.0 - ra
        eqT -= 24.0 * floor((eqT + 12.0) / 24.0)

        // Timezone offset in hours
        val localCal = Calendar.getInstance(targetZone).apply {
            set(year, month - 1, day, 12, 0, 0)
        }
        val timezoneOffsetHours = localCal.timeZone.getOffset(localCal.timeInMillis).toDouble() / (1000.0 * 3600.0)

        val midday = 12.0 + timezoneOffsetHours - lng / 15.0 - eqT

        fun hourAngle(angle: Double): Double {
            val num = -dSin(angle) - dSin(lat) * dSin(declination)
            val den = dCos(lat) * dCos(declination)
            val cosH = num / den
            if (cosH > 1.0 || cosH < -1.0) return Double.NaN
            return dAcos(cosH) / 15.0
        }

        var fajrAngle = 19.5
        var ishaAngle = 17.5
        var ishaInterval: Double? = null

        when (calcMethod) {
            "UmmAlQura" -> { fajrAngle = 18.5; ishaInterval = 90.0 }
            "ISNA" -> { fajrAngle = 15.0; ishaAngle = 15.0 }
            "MWL" -> { fajrAngle = 18.0; ishaAngle = 17.0 }
            "Karachi" -> { fajrAngle = 18.0; ishaAngle = 18.0 }
            "Gulf" -> { fajrAngle = 18.2; ishaInterval = 90.0 }
            "Tehran" -> { fajrAngle = 17.7; ishaAngle = 14.0 }
            else -> { fajrAngle = 19.5; ishaAngle = 17.5 } // Egypt
        }

        val hSunrise = hourAngle(0.833)
        val hFajr = hourAngle(fajrAngle)
        val hIsha = if (ishaInterval == null) hourAngle(ishaAngle) else Double.NaN

        val shadowFactor = if (madhab == "hanafi") 2.0 else 1.0
        val gAsr = abs(lat - declination)
        val asrAngle = dAtan(1.0 / (shadowFactor + dTan(gAsr)))
        val hAsr = hourAngle(-asrAngle)

        var fajrDec = midday - hFajr + fajrOffsetMin / 60.0
        var dhuhrDec = midday + dhuhrOffsetMin / 60.0
        var asrDec = midday + hAsr + asrOffsetMin / 60.0
        var maghribDec = midday + hSunrise + maghribOffsetMin / 60.0
        var ishaDec = if (ishaInterval != null) (midday + hSunrise + ishaInterval / 60.0 + ishaOffsetMin / 60.0) else (midday + hIsha + ishaOffsetMin / 60.0)

        fun decToMs(decHour: Double): Long {
            if (decHour.isNaN()) return 0L
            val hour = floor(decHour).toInt()
            val min = round((decHour - hour) * 60.0).toInt()
            val dayCal = Calendar.getInstance(targetZone).apply {
                set(year, month - 1, day, hour, min, 0)
                set(Calendar.MILLISECOND, 0)
            }
            return dayCal.timeInMillis
        }

        return PrayerTimeMs(
            fajr = decToMs(fajrDec),
            dhuhr = decToMs(dhuhrDec),
            asr = decToMs(asrDec),
            maghrib = decToMs(maghribDec),
            isha = decToMs(ishaDec)
        )
    }
}
