import dayjs from 'dayjs';
import {alfredStore} from '../../store';
import {getTodayEvents, getNext7DaysEvents} from '../../skills/calendar/handlers';
import {getNotificationBrief} from '../../skills/notifications/handlers';
import {MemoryStore} from './MemoryStore';
import {AlfredNative} from './AlfredNative';

function eventTimeLabel(ms?: number) {
  if (!ms) return '';
  return dayjs(ms).format('h:mm A');
}

export const AutomationEngine = {
  async morningBrief() {
    const today = dayjs().format('dddd, MMM D');
    const events = await getTodayEvents();
    const notifications = await getNotificationBrief();
    const first = events[0];
    const firstLine = first
      ? `First event: ${first.title} at ${eventTimeLabel(first.start)}.`
      : 'No events scheduled.';

    return `Good morning. Today is ${today}. You have ${events.length} events. ${firstLine} ${notifications.length} recent notifications are queued.`;
  },

  async meetingReminder() {
    const events = await getTodayEvents();
    if (!events.length) return 'No meeting reminders right now.';
    const next = events[0];
    return `Meeting reminder: ${next.title} at ${eventTimeLabel(next.start)}.`;
  },

  async taskReminder() {
    const tasks = await MemoryStore.getTasks(50);
    const open = tasks.filter(t => t.status === 'open');
    if (!open.length) return 'No pending tasks.';
    return `Task reminder. ${open.length} tasks remain. Next: ${open[0].title}.`;
  },

  async eveningSummary() {
    const tasks = await MemoryStore.getTasks(50);
    const open = tasks.filter(t => t.status === 'open').length;
    const upcoming = await getNext7DaysEvents();
    const firstTomorrow = upcoming.find((e: any) => dayjs(e.start).isAfter(dayjs().endOf('day')));
    const tomorrowLine = firstTomorrow
      ? `Tomorrow begins with ${firstTomorrow.title} at ${eventTimeLabel(firstTomorrow.start)}.`
      : 'No early event tomorrow.';

    return `Good evening. ${open} tasks remain. ${tomorrowLine}`;
  },

  async notificationSummary() {
    const notifications = await getNotificationBrief();
    if (!notifications.length) return 'No notification summary available.';
    const top = notifications
      .slice(0, 5)
      .map((n: any) => `${n.title || n.app}`)
      .join(', ');
    return `Notification summary: ${top}.`;
  },

  async scheduleDefaults() {
    await AlfredNative.scheduleDailyAutomation(
      'morning_brief',
      7,
      30,
      'ALFRED Morning Brief',
      await this.morningBrief(),
    );
    await AlfredNative.scheduleDailyAutomation(
      'evening_summary',
      20,
      0,
      'ALFRED Evening Summary',
      await this.eveningSummary(),
    );
  },

  shouldSpeak() {
    if (alfredStore.presenceMode === 'SILENT_WATCH') return false;
    if (!alfredStore.ttsEnabled) return false;
    return true;
  },
};
