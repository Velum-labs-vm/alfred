# ALFRED (JarvisCore)

At your service, sir.

ALFRED is a private, local-first Android assistant built on PocketPal’s on-device model runtime.

## 1) What works now

- Alfred home voice flow with calm ambient UI states.
- Tap-to-talk loop: listen → transcript → local response → speak.
- Native Android bridge for STT/TTS, calendar, contacts, SMS, notifications.
- SQLite-backed memory via WatermelonDB for:
  - conversations
  - preferences
  - audit log
  - tasks
  - reminders
  - command timeline
- Diagnostics data in settings (recent conversations/tasks/reminders/timeline/audit).
- Privacy-first connector baseline:
  - LOCAL ONLY default
  - optional MANOR/RELAY modes
  - outbound context sanitization + audit logging.
- Overlay permission flow + baseline cross-app overlay service.
- Daily automation scheduling baseline (morning/evening) via AlarmManager bridge.

## 2) What is partial

- Full Porcupine wake-word runtime remains optional/partial; tap mode is guaranteed fallback.
- Overlay UX is functional baseline but not fully polished across all OEM variations.
- Automation logic is dependable baseline, not a full dynamic scheduling engine yet.
- APK build verification in this runner is blocked by external Maven access (HTTP 403).

## 3) Local-first privacy model

- Local on-device inference is default behavior.
- External connector mode is explicit opt-in.
- Sensitive full datasets are not sent by default.
- Outbound metadata is recorded in local `audit_log`.

## 4) Build prerequisites

- **JDK 17** (recommended for RN/Android toolchain compatibility).
- Android SDK + platform/build tools matching project (`compileSdk 36`, Build Tools `36.0.0`).
- Android NDK `27.3.13750724`.
- Android emulator or physical device (API 24+).
- Network access to `google()` and `mavenCentral()` repositories.

## 5) Build commands

```bash
yarn install --frozen-lockfile
yarn -s typecheck
cd android && ./gradlew clean
cd android && ./gradlew assembleDebug
```

## 6) Expected APK output path

`android/app/build/outputs/apk/debug/app-debug.apk`


## Verified build path

On a normal developer machine (JDK 17 + Android SDK/NDK installed + access to `google()` and `mavenCentral()`), the expected path is:

1. `yarn install --frozen-lockfile`
2. `yarn -s typecheck`
3. `cd android && ./gradlew clean`
4. `cd android && ./gradlew assembleDebug`

Output APK should be located at:
`android/app/build/outputs/apk/debug/app-debug.apk`

## 7) Known limitations

- If Maven Central access is blocked, Gradle cannot resolve dependencies and APK build will fail.
- Overlay behavior may differ across OEM ROM restrictions.
- Wake-word feature currently remains fallback-first unless full runtime integration is configured.

## 8) Setup steps

### Local model usage
1. Open Models screen.
2. Download/import a supported local model.
3. Return to Alfred Home and use tap-to-talk.

### Permissions
1. Grant microphone, notifications, and optional connector permissions.
2. For calendar/contacts/SMS skills, grant respective Android permissions.

### Overlay
1. In Settings → ALFRED Protocols, open overlay settings.
2. Grant overlay permission.
3. Start overlay service.

### Wake word
1. In Settings → ALFRED Protocols, enable wake word if desired.
2. Add Porcupine AccessKey.
3. If unavailable, UI shows: **Wake word unavailable, tap mode active**.

### Connector mode
1. Keep LOCAL ONLY for full local privacy.
2. Switch to MANOR/RELAY only if endpoint is intentionally configured.

## 9) Troubleshooting

- **JDK mismatch**: ensure `java -version` is JDK 17.
- **Gradle dependency resolution**: verify Maven/Google repo access and proxy settings.
- **Maven 403/network issues**: retry from unrestricted network or set proper corporate proxy.
- **Overlay not appearing**: verify SYSTEM_ALERT_WINDOW permission and service start state.
- **Notification summaries empty**: enable Android notification listener access for ALFRED.
