# ALFRED Architecture (JarvisCore)

## Layers

1. **Presentation**: React Native screens/components (`AlfredHomeScreen`, settings, model management).
2. **Assistant services**: permissions, sound, privacy guard, voice pipeline.
3. **Skills**: modular packs under `src/skills/*`.
4. **Model runtime**: inherited PocketPal local inference pipeline (on-device).
5. **Android native**: foreground service, notification listener, boot/SMS receivers.

## Modes

- LOCAL ONLY (default)
- MANOR NETWORK (opt-in)
- REMOTE RELAY (opt-in)

## Safety defaults

- App boots local.
- Missing permissions do not block launch.
- Optional capabilities degrade gracefully.
