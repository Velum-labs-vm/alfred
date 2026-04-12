package com.jarviscore.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.provider.Telephony
import org.json.JSONArray
import org.json.JSONObject

class AlfredSmsReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context?, intent: Intent?) {
    if (context == null || intent == null) return
    if (intent.action != Telephony.Sms.Intents.SMS_RECEIVED_ACTION) return

    val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
    val prefs = context.getSharedPreferences("alfred_sms", Context.MODE_PRIVATE)
    val arr = JSONArray(prefs.getString("queue", "[]") ?: "[]")

    messages.forEach { sms ->
      val item = JSONObject()
      item.put("address", sms.displayOriginatingAddress ?: "")
      item.put("snippet", (sms.messageBody ?: "").take(120))
      item.put("timestamp", sms.timestampMillis)
      arr.put(item)
    }

    while (arr.length() > 200) arr.remove(0)
    prefs.edit().putString("queue", arr.toString()).apply()
  }
}
