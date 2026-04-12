package com.jarviscore.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class VoiceForegroundService : Service() {
  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val channelId = "alfred_voice_service"
    val manager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
          channelId,
          "ALFRED Listening",
          NotificationManager.IMPORTANCE_LOW,
      )
      manager.createNotificationChannel(channel)
    }

    val notification: Notification = NotificationCompat.Builder(this, channelId)
        .setContentTitle("ALFRED")
        .setContentText("Voice service is ready")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setOngoing(true)
        .build()

    startForeground(9001, notification)
    return START_STICKY
  }
}
