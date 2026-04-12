import {AlfredNative} from '../../services/alfred';

export async function getTodayEvents() {
  return AlfredNative.getCalendarEvents(1);
}

export async function getNext7DaysEvents() {
  return AlfredNative.getCalendarEvents(7);
}

export async function createEvent(title: string, start: number, end: number) {
  return AlfredNative.createCalendarEvent(title, start, end);
}

export async function getCompactSummary() {
  const events = await AlfredNative.getCalendarEvents(1);
  return events.map((e: any) => ({title: e.title, start: e.start, end: e.end}));
}
