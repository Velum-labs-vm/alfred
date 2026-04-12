import {alfredStore} from '../../store';

export type AlfredCue =
  | 'boot'
  | 'wakeDetected'
  | 'listeningStart'
  | 'responseReady'
  | 'confirmation'
  | 'error'
  | 'tacticalMode'
  | 'silentWatch';

class SoundEngine {
  private speaking = false;

  setSpeaking(value: boolean) {
    this.speaking = value;
  }

  play(_cue: AlfredCue) {
    if (!alfredStore.soundsEnabled || this.speaking) {
      return;
    }
    // Placeholder no-op tone engine for stable offline builds.
  }
}

export const soundEngine = new SoundEngine();
