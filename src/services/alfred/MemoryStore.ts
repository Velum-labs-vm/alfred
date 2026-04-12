import {Q} from '@nozbe/watermelondb';
import {database} from '../../database';

export type CommandStage =
  | 'HEARD'
  | 'PARSED'
  | 'CONTEXT'
  | 'GENERATED'
  | 'SPOKE'
  | 'ACTION';

export const MemoryStore = {
  async saveConversationTurn(input: {
    transcript: string;
    response: string;
    mode: string;
    timestamp?: number;
  }) {
    await database.write(async () => {
      const col: any = database.get('conversations');
      await col.create((r: any) => {
        r.transcript = input.transcript;
        r.response = input.response;
        r.mode = input.mode;
        r.timestamp = input.timestamp ?? Date.now();
      });
    });
  },

  async getRecentConversations(limit = 10) {
    const col: any = database.get('conversations');
    const rows = await col
      .query(Q.sortBy('timestamp', Q.desc), Q.take(limit))
      .fetch();

    return rows.map((r: any) => ({
      transcript: r.transcript,
      response: r.response,
      mode: r.mode,
      timestamp: r.timestamp,
    }));
  },

  async setPreference(key: string, value: string) {
    const col: any = database.get('preferences');
    await database.write(async () => {
      const existing = await col.query(Q.where('key', key), Q.take(1)).fetch();
      if (existing[0]) {
        await existing[0].update((r: any) => {
          r.value = value;
          r.updatedAt = Date.now();
        });
      } else {
        await col.create((r: any) => {
          r.key = key;
          r.value = value;
          r.updatedAt = Date.now();
        });
      }
    });
  },

  async getPreference(key: string) {
    const col: any = database.get('preferences');
    const rows = await col.query(Q.where('key', key), Q.take(1)).fetch();
    return rows[0]?.value;
  },



  async clearConversations() {
    const col: any = database.get('conversations');
    const rows = await col.query().fetch();
    await database.write(async () => {
      await Promise.all(rows.map((r: any) => r.destroyPermanently()));
    });
  },

  async markTaskDone(id: string) {
    const col: any = database.get('tasks');
    let target: any;
    try {
      target = await col.find(id);
    } catch {
      target = null;
    }
    if (!target) return false;
    await database.write(async () => {
      await target.update((r: any) => {
        r.status = 'done';
      });
    });
    return true;
  },

  async snoozeReminder(title: string, minutes = 15) {
    const col: any = database.get('reminders');
    const rows = await col.query(Q.where('title', title), Q.sortBy('created_at', Q.desc), Q.take(1)).fetch();
    const target = rows[0];
    if (!target) return false;
    await database.write(async () => {
      await target.update((r: any) => {
        r.remindAt = Date.now() + minutes * 60 * 1000;
        r.status = 'scheduled';
      });
    });
    return true;
  },

  async addTask(title: string, dueAt?: number) {
    const col: any = database.get('tasks');
    await database.write(async () => {
      await col.create((r: any) => {
        r.title = title;
        r.status = 'open';
        r.createdAt = Date.now();
        if (dueAt) r.dueAt = dueAt;
      });
    });
  },

  async getTasks(limit = 50) {
    const col: any = database.get('tasks');
    const rows = await col.query(Q.sortBy('created_at', Q.desc), Q.take(limit)).fetch();
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      status: r.status,
      createdAt: r.createdAt,
      dueAt: r.dueAt,
    }));
  },

  async addReminder(title: string, remindAt: number) {
    const col: any = database.get('reminders');
    await database.write(async () => {
      await col.create((r: any) => {
        r.title = title;
        r.remindAt = remindAt;
        r.status = 'scheduled';
        r.createdAt = Date.now();
      });
    });
  },

  async getReminders(limit = 50) {
    const col: any = database.get('reminders');
    const rows = await col.query(Q.sortBy('remind_at', Q.asc), Q.take(limit)).fetch();
    return rows.map((r: any) => ({
      title: r.title,
      remindAt: r.remindAt,
      status: r.status,
    }));
  },

  async logAudit(entry: {
    endpoint: string;
    queryLength: number;
    contextFieldsSent: string[];
    responseLength: number;
    timestamp?: number;
  }) {
    const col: any = database.get('audit_log');
    await database.write(async () => {
      await col.create((r: any) => {
        r.endpoint = entry.endpoint;
        r.queryLength = entry.queryLength;
        r.contextFieldsSent = JSON.stringify(entry.contextFieldsSent);
        r.responseLength = entry.responseLength;
        r.timestamp = entry.timestamp ?? Date.now();
      });
    });
  },

  async getAuditLog(limit = 100) {
    const col: any = database.get('audit_log');
    const rows = await col.query(Q.sortBy('timestamp', Q.desc), Q.take(limit)).fetch();
    return rows.map((r: any) => ({
      endpoint: r.endpoint,
      query_length: r.queryLength,
      context_fields_sent: JSON.parse(r.contextFieldsSent || '[]'),
      response_length: r.responseLength,
      timestamp: r.timestamp,
    }));
  },

  async clearAuditLog() {
    const col: any = database.get('audit_log');
    const rows = await col.query().fetch();
    await database.write(async () => {
      await Promise.all(rows.map((r: any) => r.destroyPermanently()));
    });
  },

  async logTimeline(stage: CommandStage, detail: string, success = true) {
    const col: any = database.get('command_timeline');
    await database.write(async () => {
      await col.create((r: any) => {
        r.stage = stage;
        r.detail = detail;
        r.success = success;
        r.timestamp = Date.now();
      });
    });
  },

  async getTimeline(limit = 50) {
    const col: any = database.get('command_timeline');
    const rows = await col.query(Q.sortBy('timestamp', Q.desc), Q.take(limit)).fetch();
    return rows.map((r: any) => ({
      stage: r.stage,
      detail: r.detail,
      success: r.success,
      timestamp: r.timestamp,
    }));
  },

  extractTaskIntent(query: string): string | null {
    const patterns = [/^remember to\s+(.+)/i, /^add task\s+(.+)/i, /^remind me to\s+(.+)/i];
    for (const p of patterns) {
      const m = query.match(p);
      if (m?.[1]) return m[1].trim();
    }
    return null;
  },
};
