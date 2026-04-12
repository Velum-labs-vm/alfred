package com.jarviscore.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import androidx.core.app.NotificationCompat

class OverlayBubbleService : Service() {
  companion object {
    var isRunning: Boolean = false
  }

  private var windowManager: WindowManager? = null
  private var bubbleView: View? = null
  private var params: WindowManager.LayoutParams? = null
  private var transcriptView: TextView? = null
  private var responseView: TextView? = null
  private var panel: LinearLayout? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (!Settings.canDrawOverlays(this)) {
      stopSelf()
      return START_NOT_STICKY
    }

    if (intent?.action == "STOP") {
      stopSelf()
      return START_NOT_STICKY
    }

    val transcript = intent?.getStringExtra("transcript")
    val response = intent?.getStringExtra("response")

    if (!isRunning) {
      startForegroundNotification()
      showBubble()
      isRunning = true
    }

    if (!transcript.isNullOrBlank()) transcriptView?.text = "Last transcript: $transcript"
    if (!response.isNullOrBlank()) responseView?.text = "Last response: $response"

    return START_STICKY
  }

  private fun startForegroundNotification() {
    val channelId = "alfred_overlay"
    val manager = getSystemService(NotificationManager::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.createNotificationChannel(
          NotificationChannel(channelId, "ALFRED Overlay", NotificationManager.IMPORTANCE_MIN),
      )
    }

    val notification: Notification = NotificationCompat.Builder(this, channelId)
        .setContentTitle("ALFRED Overlay")
        .setContentText("Floating Alfred is active")
        .setSmallIcon(R.mipmap.ic_launcher)
        .setOngoing(true)
        .build()

    startForeground(9002, notification)
  }

  private fun showBubble() {
    windowManager = getSystemService(WINDOW_SERVICE) as WindowManager

    val bubble = TextView(this).apply {
      text = "✦"
      textSize = 20f
      setPadding(24, 14, 24, 14)
      setBackgroundColor(0xCC111722.toInt())
      setTextColor(0xFFC5AA6B.toInt())
    }

    transcriptView = TextView(this).apply {
      text = "Last transcript: --"
      setTextColor(0xFFD7DDE8.toInt())
    }
    responseView = TextView(this).apply {
      text = "Last response: --"
      setTextColor(0xFFD7DDE8.toInt())
    }

    val listenButton = Button(this).apply {
      text = "Listen"
      setOnClickListener { sendBroadcast(Intent("com.jarviscore.app.OVERLAY_LISTEN")) }
    }
    val hideButton = Button(this).apply {
      text = "Hide"
      setOnClickListener { panel?.visibility = View.GONE }
    }

    panel = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setPadding(24, 20, 24, 20)
      setBackgroundColor(0xEE0B1018.toInt())
      visibility = View.GONE
      addView(transcriptView)
      addView(responseView)
      addView(listenButton)
      addView(hideButton)
    }

    val wrapper = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      addView(bubble)
      addView(panel)
    }

    val type = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
    } else {
      WindowManager.LayoutParams.TYPE_PHONE
    }

    params = WindowManager.LayoutParams(
        WindowManager.LayoutParams.WRAP_CONTENT,
        WindowManager.LayoutParams.WRAP_CONTENT,
        type,
        WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
        PixelFormat.TRANSLUCENT,
    ).apply {
      gravity = Gravity.TOP or Gravity.START
      x = getSharedPreferences("alfred_overlay", Context.MODE_PRIVATE).getInt("x", 30)
      y = getSharedPreferences("alfred_overlay", Context.MODE_PRIVATE).getInt("y", 220)
    }

    var initialX = 0
    var initialY = 0
    var initialTouchX = 0f
    var initialTouchY = 0f
    var lastTap = 0L

    wrapper.setOnTouchListener { _, event ->
      when (event.action) {
        MotionEvent.ACTION_DOWN -> {
          initialX = params?.x ?: 0
          initialY = params?.y ?: 0
          initialTouchX = event.rawX
          initialTouchY = event.rawY
          true
        }
        MotionEvent.ACTION_MOVE -> {
          params?.x = initialX + (event.rawX - initialTouchX).toInt()
          params?.y = initialY + (event.rawY - initialTouchY).toInt()
          windowManager?.updateViewLayout(wrapper, params)
          true
        }
        MotionEvent.ACTION_UP -> {
          getSharedPreferences("alfred_overlay", Context.MODE_PRIVATE)
              .edit()
              .putInt("x", params?.x ?: 30)
              .putInt("y", params?.y ?: 220)
              .apply()

          val now = System.currentTimeMillis()
          if (now - lastTap < 300) {
            sendBroadcast(Intent("com.jarviscore.app.OVERLAY_LISTEN"))
          } else {
            panel?.visibility = if (panel?.visibility == View.VISIBLE) View.GONE else View.VISIBLE
          }
          lastTap = now
          true
        }
        else -> false
      }
    }

    windowManager?.addView(wrapper, params)
    bubbleView = wrapper
  }

  override fun onDestroy() {
    bubbleView?.let { windowManager?.removeView(it) }
    isRunning = false
    super.onDestroy()
  }
}
