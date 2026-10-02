package com.salahpro.app.plugins

import android.app.DownloadManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Environment
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.content.FileProvider
import java.io.File

class ApkDownloadReceiver : BroadcastReceiver() {

    companion object {
        const val TAG = "ApkDownloadReceiver"
        const val UPDATE_CHANNEL_ID = "app_updates_channel"
        const val NOTIFICATION_ID = 99991
    }

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action != DownloadManager.ACTION_DOWNLOAD_COMPLETE) return

        val completedId = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1L)
        Log.d(TAG, "ACTION_DOWNLOAD_COMPLETE received for downloadId=$completedId")

        try {
            val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as? DownloadManager ?: return
            val query = DownloadManager.Query().setFilterById(completedId)
            val cursor = downloadManager.query(query)
            var status = -1
            if (cursor != null && cursor.moveToFirst()) {
                val statusCol = cursor.getColumnIndex(DownloadManager.COLUMN_STATUS)
                if (statusCol >= 0) status = cursor.getInt(statusCol)
                cursor.close()
            }

            if (status != DownloadManager.STATUS_SUCCESSFUL) {
                Log.w(TAG, "DownloadManager completed with non-success status: $status")
                return
            }

            val destinationDir = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
            val apkFile = File(destinationDir, "hemmaty-update.apk")

            if (!apkFile.exists() || apkFile.length() <= 1024 * 1024L) {
                Log.w(TAG, "Downloaded APK file missing or incomplete: size=${apkFile.length()}")
                return
            }

            Log.d(TAG, "APK download verified (${apkFile.length()} bytes). Preparing installation notification.")

            val authority = "${context.packageName}.fileprovider"
            val apkUri = FileProvider.getUriForFile(context, authority, apkFile)

            val installIntent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(apkUri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as? NotificationManager
            if (notificationManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    val channel = NotificationChannel(
                        UPDATE_CHANNEL_ID,
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
                val pendingIntent = PendingIntent.getActivity(context, NOTIFICATION_ID, installIntent, flags)

                val notif = NotificationCompat.Builder(context, UPDATE_CHANNEL_ID)
                    .setSmallIcon(android.R.drawable.stat_sys_download_done)
                    .setContentTitle("التحديث جاهز، اضغط للتثبيت 🚀")
                    .setContentText("تم تنزيل تحديث هِمَّتِي بنجاح. اضغط هنا لبدء التثبيت الآن.")
                    .setStyle(NotificationCompat.BigTextStyle().bigText("تم تنزيل تحديث هِمَّتِي بنجاح. اضغط هنا لتثبيت الإصدار الجديد فوراً."))
                    .setPriority(NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent)
                    .build()

                notificationManager.notify(NOTIFICATION_ID, notif)
                Log.d(TAG, "Installation notification posted successfully.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error processing download completion", e)
        }
    }
}
