import {NativeEventEmitter, NativeModules, Platform} from 'react-native';

const native = NativeModules.AlfredDevice as undefined | {
  startListening: () => Promise<string>;
  speak: (text: string, enabled: boolean) => Promise<boolean>;
  getCalendarEvents: (daysAhead: number) => Promise<any[]>;
  createCalendarEvent: (title: string, startMs: number, endMs: number) => Promise<boolean>;
  searchContacts: (query: string) => Promise<any[]>;
  readSms: (limit: number, filter?: string) => Promise<any[]>;
  sendSms: (number: string, message: string) => Promise<boolean>;
  getCapturedNotifications: () => Promise<string>;
  hasOverlayPermission: () => Promise<boolean>;
  openOverlaySettings: () => void;
  startOverlay: () => void;
  stopOverlay: () => void;
  scheduleDailyAutomation: (id: string, hour: number, minute: number, title: string, text: string) => Promise<boolean>;
  cancelDailyAutomation: (id: string) => void;
  isOverlayRunning: () => Promise<boolean>;
  updateOverlay: (transcript?: string, response?: string) => void;
};

const unavailable = async <T>(fallback: T): Promise<T> => fallback;
const emitter = native ? new NativeEventEmitter(native as any) : null;

export const AlfredNative = {
  startListening: () => (Platform.OS === 'android' && native ? native.startListening() : unavailable('')),
  speak: (text: string, enabled: boolean) => (Platform.OS === 'android' && native ? native.speak(text, enabled) : unavailable(true)),
  getCalendarEvents: (daysAhead: number) => (Platform.OS === 'android' && native ? native.getCalendarEvents(daysAhead) : unavailable([])),
  createCalendarEvent: (title: string, startMs: number, endMs: number) => (Platform.OS === 'android' && native ? native.createCalendarEvent(title, startMs, endMs) : unavailable(false)),
  searchContacts: (query: string) => (Platform.OS === 'android' && native ? native.searchContacts(query) : unavailable([])),
  readSms: (limit: number, filter?: string) => (Platform.OS === 'android' && native ? native.readSms(limit, filter) : unavailable([])),
  sendSms: (number: string, message: string) => (Platform.OS === 'android' && native ? native.sendSms(number, message) : unavailable(false)),
  hasOverlayPermission: () => (Platform.OS === 'android' && native ? native.hasOverlayPermission() : unavailable(false)),
  openOverlaySettings: () => { if (Platform.OS === 'android' && native) native.openOverlaySettings(); },
  startOverlay: () => { if (Platform.OS === 'android' && native) native.startOverlay(); },
  stopOverlay: () => { if (Platform.OS === 'android' && native) native.stopOverlay(); },
  scheduleDailyAutomation: (id: string, hour: number, minute: number, title: string, text: string) =>
    Platform.OS === 'android' && native
      ? native.scheduleDailyAutomation(id, hour, minute, title, text)
      : unavailable(false),
  cancelDailyAutomation: (id: string) => { if (Platform.OS === 'android' && native) native.cancelDailyAutomation(id); },
  isOverlayRunning: () => (Platform.OS === 'android' && native ? native.isOverlayRunning() : unavailable(false)),
  updateOverlay: (transcript?: string, response?: string) => { if (Platform.OS === 'android' && native) native.updateOverlay(transcript, response); },
  onOverlayListen: (handler: () => void) =>
    emitter?.addListener('AlfredOverlayListen', handler),
  getCapturedNotifications: async () => {
    if (!(Platform.OS === 'android' && native)) return [];
    const raw = await native.getCapturedNotifications();
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },
};
