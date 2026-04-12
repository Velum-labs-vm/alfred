package com.jarviscore.app

import android.Manifest
import android.app.Activity
import java.util.Calendar
import android.app.PendingIntent
import android.app.AlarmManager
import android.content.Context
import android.content.IntentFilter
import android.content.BroadcastReceiver
import android.content.ContentUris
import android.content.ContentValues
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.CalendarContract
import android.provider.ContactsContract
import android.provider.Telephony
import android.provider.Settings
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.tts.TextToSpeech
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Locale

class AlfredDeviceModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext), ActivityEventListener {

  private var recognitionPromise: Promise? = null
  private var speechRecognizer: SpeechRecognizer? = null
  private var tts: TextToSpeech? = null
  private val overlayListenReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == "com.jarviscore.app.OVERLAY_LISTEN") {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit("AlfredOverlayListen", null)
      }
    }
  }

  init {
    reactContext.addActivityEventListener(this)
    reactContext.registerReceiver(overlayListenReceiver, IntentFilter("com.jarviscore.app.OVERLAY_LISTEN"))
  }

  override fun getName(): String = "AlfredDevice"



  @ReactMethod
  fun addListener(eventName: String) {
    // Required for RN NativeEventEmitter compatibility
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required for RN NativeEventEmitter compatibility
  }

  @ReactMethod
  fun startListening(promise: Promise) {
    val activity: Activity = currentActivity ?: run {
      promise.reject("NO_ACTIVITY", "No current activity available")
      return
    }

    if (!SpeechRecognizer.isRecognitionAvailable(reactContext)) {
      promise.reject("STT_UNAVAILABLE", "Speech recognition unavailable on this device")
      return
    }

    recognitionPromise = promise
    speechRecognizer?.destroy()
    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
    speechRecognizer?.setRecognitionListener(object : RecognitionListener {
      override fun onReadyForSpeech(params: Bundle?) {}
      override fun onBeginningOfSpeech() {}
      override fun onRmsChanged(rmsdB: Float) {}
      override fun onBufferReceived(buffer: ByteArray?) {}
      override fun onEndOfSpeech() {}
      override fun onEvent(eventType: Int, params: Bundle?) {}
      override fun onPartialResults(partialResults: Bundle?) {}

      override fun onError(error: Int) {
        recognitionPromise?.reject("STT_ERROR", "Speech recognition error code: $error")
        recognitionPromise = null
      }

      override fun onResults(results: Bundle?) {
        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
        val text = matches?.firstOrNull().orEmpty()
        recognitionPromise?.resolve(text)
        recognitionPromise = null
      }
    })

    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
      putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
      putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false)
      putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
    }
    speechRecognizer?.startListening(intent)
  }

  @ReactMethod
  fun speak(text: String, enabled: Boolean, promise: Promise) {
    if (!enabled) {
      promise.resolve(true)
      return
    }

    if (tts == null) {
      tts = TextToSpeech(reactContext) { status ->
        if (status == TextToSpeech.SUCCESS) {
          tts?.language = Locale.UK
          tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "alfred_tts")
          promise.resolve(true)
        } else {
          promise.reject("TTS_INIT_FAILED", "Failed to initialize TTS")
        }
      }
    } else {
      tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, "alfred_tts")
      promise.resolve(true)
    }
  }

  @ReactMethod
  fun getCalendarEvents(daysAhead: Int, promise: Promise) {
    if (!hasPermission(Manifest.permission.READ_CALENDAR)) {
      promise.resolve(Arguments.createArray())
      return
    }

    val resolver = reactContext.contentResolver
    val now = System.currentTimeMillis()
    val end = now + daysAhead * 24L * 60L * 60L * 1000L

    val uri = CalendarContract.Instances.CONTENT_URI.buildUpon()
    ContentUris.appendId(uri, now)
    ContentUris.appendId(uri, end)

    val projection = arrayOf(
        CalendarContract.Instances.EVENT_ID,
        CalendarContract.Instances.TITLE,
        CalendarContract.Instances.BEGIN,
        CalendarContract.Instances.END,
    )

    val arr = Arguments.createArray()
    resolver.query(uri.build(), projection, null, null, CalendarContract.Instances.BEGIN + " ASC")?.use { c ->
      val idIdx = c.getColumnIndex(CalendarContract.Instances.EVENT_ID)
      val titleIdx = c.getColumnIndex(CalendarContract.Instances.TITLE)
      val beginIdx = c.getColumnIndex(CalendarContract.Instances.BEGIN)
      val endIdx = c.getColumnIndex(CalendarContract.Instances.END)
      while (c.moveToNext()) {
        val m = Arguments.createMap()
        m.putString("id", c.getLong(idIdx).toString())
        m.putString("title", c.getString(titleIdx) ?: "(untitled)")
        m.putDouble("start", c.getLong(beginIdx).toDouble())
        m.putDouble("end", c.getLong(endIdx).toDouble())
        arr.pushMap(m)
      }
    }
    promise.resolve(arr)
  }

  @ReactMethod
  fun createCalendarEvent(title: String, startMs: Double, endMs: Double, promise: Promise) {
    if (!hasPermission(Manifest.permission.WRITE_CALENDAR)) {
      promise.resolve(false)
      return
    }
    val values = ContentValues().apply {
      put(CalendarContract.Events.CALENDAR_ID, 1)
      put(CalendarContract.Events.TITLE, title)
      put(CalendarContract.Events.DTSTART, startMs.toLong())
      put(CalendarContract.Events.DTEND, endMs.toLong())
      put(CalendarContract.Events.EVENT_TIMEZONE, java.util.TimeZone.getDefault().id)
    }
    val uri = reactContext.contentResolver.insert(CalendarContract.Events.CONTENT_URI, values)
    promise.resolve(uri != null)
  }

  @ReactMethod
  fun searchContacts(query: String, promise: Promise) {
    if (!hasPermission(Manifest.permission.READ_CONTACTS)) {
      promise.resolve(Arguments.createArray())
      return
    }

    val arr = Arguments.createArray()
    val resolver = reactContext.contentResolver
    val cursor = resolver.query(
        ContactsContract.Contacts.CONTENT_URI,
        arrayOf(ContactsContract.Contacts._ID, ContactsContract.Contacts.DISPLAY_NAME),
        "${ContactsContract.Contacts.DISPLAY_NAME} LIKE ?",
        arrayOf("%$query%"),
        ContactsContract.Contacts.DISPLAY_NAME + " ASC"
    )

    cursor?.use { c ->
      while (c.moveToNext()) {
        val id = c.getString(0)
        val name = c.getString(1)
        val m = Arguments.createMap()
        m.putString("id", id)
        m.putString("name", name)
        m.putString("phone", getPrimaryPhone(id))
        m.putString("email", getPrimaryEmail(id))
        arr.pushMap(m)
      }
    }
    promise.resolve(arr)
  }

  @ReactMethod
  fun readSms(limit: Int, filter: String?, promise: Promise) {
    if (!hasPermission(Manifest.permission.READ_SMS)) {
      promise.resolve(Arguments.createArray())
      return
    }
    val arr = Arguments.createArray()
    val cursor = reactContext.contentResolver.query(
      Telephony.Sms.CONTENT_URI,
      arrayOf(Telephony.Sms.ADDRESS, Telephony.Sms.BODY, Telephony.Sms.DATE, Telephony.Sms.TYPE),
      null,
      null,
      Telephony.Sms.DEFAULT_SORT_ORDER
    )
    cursor?.use { c ->
      var count = 0
      while (c.moveToNext() && count < limit) {
        val address = c.getString(0).orEmpty()
        val body = c.getString(1).orEmpty()
        if (!filter.isNullOrBlank() && !address.contains(filter, true) && !body.contains(filter, true)) {
          continue
        }
        val m = Arguments.createMap()
        m.putString("address", address)
        m.putString("snippet", body.take(120))
        m.putDouble("date", c.getLong(2).toDouble())
        m.putInt("type", c.getInt(3))
        arr.pushMap(m)
        count++
      }
    }
    promise.resolve(arr)
  }

  @ReactMethod
  fun sendSms(number: String, message: String, promise: Promise) {
    if (!hasPermission(Manifest.permission.SEND_SMS)) {
      promise.resolve(false)
      return
    }
    try {
      SmsManager.getDefault().sendTextMessage(number, null, message, null, null)
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SMS_FAILED", e)
    }
  }

  @ReactMethod
  fun getCapturedNotifications(promise: Promise) {
    val prefs = reactContext.getSharedPreferences("alfred_notifications", 0)
    val raw = prefs.getString("queue", "[]") ?: "[]"
    promise.resolve(raw)
  }



  @ReactMethod
  fun hasOverlayPermission(promise: Promise) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
      promise.resolve(true)
      return
    }
    promise.resolve(Settings.canDrawOverlays(reactContext))
  }

  @ReactMethod
  fun openOverlaySettings() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:${reactContext.packageName}"),
      )
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      reactContext.startActivity(intent)
    }
  }

  @ReactMethod
  fun startOverlay() {
    val intent = Intent(reactContext, OverlayBubbleService::class.java)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      reactContext.startForegroundService(intent)
    } else {
      reactContext.startService(intent)
    }
  }

  @ReactMethod
  fun stopOverlay() {
    val intent = Intent(reactContext, OverlayBubbleService::class.java).apply { action = "STOP" }
    reactContext.startService(intent)
    reactContext.stopService(Intent(reactContext, OverlayBubbleService::class.java))
  }


  @ReactMethod
  fun isOverlayRunning(promise: Promise) {
    promise.resolve(OverlayBubbleService.isRunning)
  }

  @ReactMethod
  fun updateOverlay(transcript: String?, response: String?) {
    val intent = Intent(reactContext, OverlayBubbleService::class.java)
    if (transcript != null) intent.putExtra("transcript", transcript)
    if (response != null) intent.putExtra("response", response)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      reactContext.startForegroundService(intent)
    } else {
      reactContext.startService(intent)
    }
  }


  @ReactMethod
  fun scheduleDailyAutomation(id: String, hour: Int, minute: Int, title: String, text: String, promise: Promise) {
    try {
      val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(reactContext, AutomationReceiver::class.java).apply {
        putExtra("title", title)
        putExtra("text", text)
      }

      val requestCode = id.hashCode()
      val pendingIntent = PendingIntent.getBroadcast(
          reactContext,
          requestCode,
          intent,
          PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )

      val calendar = Calendar.getInstance().apply {
        set(Calendar.HOUR_OF_DAY, hour)
        set(Calendar.MINUTE, minute)
        set(Calendar.SECOND, 0)
      }
      if (calendar.timeInMillis < System.currentTimeMillis()) {
        calendar.add(Calendar.DAY_OF_YEAR, 1)
      }

      alarmManager.setInexactRepeating(
          AlarmManager.RTC_WAKEUP,
          calendar.timeInMillis,
          AlarmManager.INTERVAL_DAY,
          pendingIntent,
      )
      promise.resolve(true)
    } catch (e: Exception) {
      promise.reject("SCHEDULE_FAILED", e)
    }
  }

  @ReactMethod
  fun cancelDailyAutomation(id: String) {
    val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(reactContext, AutomationReceiver::class.java)
    val pendingIntent = PendingIntent.getBroadcast(
        reactContext,
        id.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    alarmManager.cancel(pendingIntent)
  }

  private fun getPrimaryPhone(contactId: String): String {
    val cursor = reactContext.contentResolver.query(
      ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
      arrayOf(ContactsContract.CommonDataKinds.Phone.NUMBER),
      "${ContactsContract.CommonDataKinds.Phone.CONTACT_ID} = ?",
      arrayOf(contactId),
      null
    )
    cursor?.use { if (it.moveToFirst()) return it.getString(0).orEmpty() }
    return ""
  }

  private fun getPrimaryEmail(contactId: String): String {
    val cursor = reactContext.contentResolver.query(
      ContactsContract.CommonDataKinds.Email.CONTENT_URI,
      arrayOf(ContactsContract.CommonDataKinds.Email.ADDRESS),
      "${ContactsContract.CommonDataKinds.Email.CONTACT_ID} = ?",
      arrayOf(contactId),
      null
    )
    cursor?.use { if (it.moveToFirst()) return it.getString(0).orEmpty() }
    return ""
  }

  private fun hasPermission(permission: String): Boolean {
    return ContextCompat.checkSelfPermission(reactContext, permission) == PackageManager.PERMISSION_GRANTED
  }

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {}
  override fun onNewIntent(intent: Intent?) {}

  override fun invalidate() {
    speechRecognizer?.destroy()
    tts?.shutdown()
    try {
      reactContext.unregisterReceiver(overlayListenReceiver)
    } catch (_: Exception) {}
    super.invalidate()
  }
}
