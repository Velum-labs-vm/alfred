import AsyncStorage from '@react-native-async-storage/async-storage';
import {makeAutoObservable, runInAction} from 'mobx';
import {makePersistable} from 'mobx-persist-store';
import {MemoryStore} from '../services/alfred/MemoryStore';

export type AlfredMode = 'LOCAL ONLY' | 'MANOR NETWORK' | 'REMOTE RELAY';
export type PresenceMode = 'NORMAL' | 'TACTICAL' | 'SILENT_WATCH';

class AlfredStore {
  mode: AlfredMode = 'LOCAL ONLY';
  presenceMode: PresenceMode = 'NORMAL';
  soundsEnabled = true;
  ttsEnabled = true;
  wakeWordEnabled = false;
  porcupineAccessKey = '';
  rememberConnectorPreference = false;
  profileName = 'Sir';

  permissionsRequested = false;
  constructor() {
    makeAutoObservable(this);
    makePersistable(this, {
      name: 'AlfredStore',
      properties: [
        'mode',
        'presenceMode',
        'soundsEnabled',
        'ttsEnabled',
        'wakeWordEnabled',
        'porcupineAccessKey',
        'rememberConnectorPreference',
        'profileName',
        'permissionsRequested',
      ],
      storage: AsyncStorage,
    });
  }

  setMode(mode: AlfredMode) {
    runInAction(() => {
      this.mode = mode;
    });
    MemoryStore.setPreference('mode', mode).catch(() => {});
  }

  setPresenceMode(presenceMode: PresenceMode) {
    runInAction(() => {
      this.presenceMode = presenceMode;
    });
    MemoryStore.setPreference('presenceMode', presenceMode).catch(() => {});
  }

  setTtsEnabled(value: boolean) {
    runInAction(() => {
      this.ttsEnabled = value;
    });
    MemoryStore.setPreference('ttsEnabled', String(value)).catch(() => {});
  }

  setPermissionsRequested(value: boolean) {
    this.permissionsRequested = value;
  }
}

export const alfredStore = new AlfredStore();
