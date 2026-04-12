package com.jarviscore.app

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONArray
import org.json.JSONObject

class AlfredNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) return

    val extras = sbn.notification.extras
    val title = extras?.getString("android.title") ?: ""
    val text = extras?.getCharSequence("android.text")?.toString() ?: ""

    val prefs = getSharedPreferences("alfred_notifications", MODE_PRIVATE)
    val raw = prefs.getString("queue", "[]") ?: "[]"
    val arr = JSONArray(raw)

    val item = JSONObject()
    item.put("packageName", sbn.packageName)
    item.put("title", title)
    item.put("text", text.take(140))
    item.put("timestamp", System.currentTimeMillis())
    arr.put(item)

    while (arr.length() > 100) {
      arr.remove(0)
    }

    prefs.edit().putString("queue", arr.toString()).apply()
  }
}
