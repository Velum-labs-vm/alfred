package com.jarviscore.app

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat

class AutomationReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val title = intent.getStringExtra("title") ?: "ALFRED Automation"
    val text = intent.getStringExtra("text") ?: "Scheduled briefing ready."

    val channelId = "alfred_automation"
    val manager = context.getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
          NotificationChannel(channelId, "ALFRED Automation", NotificationManager.IMPORTANCE_DEFAULT),
      )
    }

    val openIntent = Intent(context, MainActivity::class.java)
    val pending = PendingIntent.getActivity(
        context,
        7000,
        openIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val notification = NotificationCompat.Builder(context, channelId)
        .setContentTitle(title)
        .setContentText(text)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentIntent(pending)
        .setAutoCancel(true)
        .build()

    manager.notify((System.currentTimeMillis() % Int.MAX_VALUE).toInt(), notification)
  }
}
