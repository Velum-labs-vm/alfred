import AsyncStorage from '@react-native-async-storage/async-storage';
import {MemoryStore} from './MemoryStore';

export type AuditEvent = {
  timestamp: string;
  endpoint: string;
  query_length: number;
  context_fields_sent: string[];
  response_length: number;
};

const KEY = 'alfred_audit_log';

export const PrivacyGuard = {
  sanitizeContext(context: Record<string, unknown>) {
    const filtered = {...context};
    delete filtered.full_sms_bodies;
    delete filtered.full_contacts;
    delete filtered.full_calendar;
    return filtered;
  },

  async logExternalRequest(event: AuditEvent) {
    await MemoryStore.logAudit({
      endpoint: event.endpoint,
      queryLength: event.query_length,
      contextFieldsSent: event.context_fields_sent,
      responseLength: event.response_length,
      timestamp: new Date(event.timestamp).getTime(),
    });

    const existing = await this.getAuditLog();
    existing.unshift(event);
    await AsyncStorage.setItem(KEY, JSON.stringify(existing.slice(0, 500)));
  },

  async getAuditLog(): Promise<AuditEvent[]> {
    try {
      const dbLog = await MemoryStore.getAuditLog(100);
      if (dbLog.length) return dbLog as any;
    } catch {}

    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async clearAuditLog() {
    await MemoryStore.clearAuditLog();
    await AsyncStorage.removeItem(KEY);
  },
};
