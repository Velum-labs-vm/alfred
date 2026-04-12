import {AlfredNative} from '../../services/alfred';

export async function getNotificationBrief() {
  const notifications = await AlfredNative.getCapturedNotifications();
  return notifications.slice(-10).map((n: any) => ({
    app: n.packageName,
    title: n.title,
    text: n.text,
    timestamp: n.timestamp,
  }));
}
