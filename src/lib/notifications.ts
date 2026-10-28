import { Reminder } from '../types';

export async function requestNotificationPermission(): Promise<'granted' | 'denied' | 'default' | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Error requesting notification permission:', err);
    return Notification.permission || 'denied';
  }
}

export function isNotificationGranted(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
}

export async function dispatchNativeNotification(
  title: string,
  body: string,
  options?: {
    tag?: string;
    data?: any;
    actions?: { action: string; title: string }[];
  }
) {
  if (!isNotificationGranted()) return;

  const notificationOptions: any = {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [150, 80, 150],
    tag: options?.tag || 'switch-reminder',
    renotify: true,
    data: options?.data || { url: '/?tab=rno' }
  };

  if (options?.actions && options.actions.length > 0) {
    notificationOptions.actions = options.actions;
  }

  try {
    // Try via active service worker registration first (optimal for mobile PWAs)
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.showNotification) {
        await reg.showNotification(title, notificationOptions);
        return;
      }
    }
    // Fallback to direct window Notification
    new Notification(title, notificationOptions);
  } catch (err) {
    console.warn('Failed to dispatch native notification:', err);
  }
}

export function shouldTriggerReminder(
  reminder: Reminder,
  currentHHMM: string,
  todayWeekday: string,
  todayDateKey: string
): boolean {
  if (!reminder.enabled) return false;

  const nowMs = Date.now();

  // If snoozed, check if snooze time has elapsed
  if (reminder.snoozedUntilMs) {
    if (nowMs >= reminder.snoozedUntilMs) {
      return true;
    }
    return false;
  }

  // Check if already fired today at the scheduled time
  if (reminder.lastTriggeredDate === todayDateKey) {
    return false;
  }

  // Check day match
  const days = reminder.days || ['Daily'];
  const dayMatches =
    days.includes('Daily') ||
    days.map((d) => d.toLowerCase().slice(0, 3)).includes(todayWeekday.toLowerCase().slice(0, 3));

  if (!dayMatches) return false;

  // Check time match (HH:MM)
  return reminder.timeStr === currentHHMM;
}
