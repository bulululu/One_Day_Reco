import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId?: string;
  status: 'idle' | 'scheduled' | 'permission_denied' | 'unsupported' | 'error';
  updatedAt?: string;
};

const REMINDER_KEY = 'onedayreco_daily_reminder';

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 30,
  status: 'idle',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export function formatReminderTime(hour: number, minute: number) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export async function loadReminderSettings(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY);
    if (!raw) return DEFAULT_REMINDER;
    return { ...DEFAULT_REMINDER, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_REMINDER;
  }
}

async function persistReminderSettings(settings: ReminderSettings) {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
}

async function cancelReminder(notificationId?: string) {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // The notification may already have been cleared by the OS.
  }
}

export async function disableDailyReminder(current?: ReminderSettings): Promise<ReminderSettings> {
  await cancelReminder(current?.notificationId);
  const settings: ReminderSettings = {
    ...(current || DEFAULT_REMINDER),
    enabled: false,
    notificationId: undefined,
    status: 'idle',
    updatedAt: new Date().toISOString(),
  };
  await persistReminderSettings(settings);
  return settings;
}

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  current?: ReminderSettings,
): Promise<ReminderSettings> {
  const normalizedHour = Math.max(0, Math.min(23, hour));
  const normalizedMinute = Math.max(0, Math.min(59, minute));
  await cancelReminder(current?.notificationId);

  if (Platform.OS === 'web') {
    const settings: ReminderSettings = {
      enabled: true,
      hour: normalizedHour,
      minute: normalizedMinute,
      status: 'unsupported',
      updatedAt: new Date().toISOString(),
    };
    await persistReminderSettings(settings);
    return settings;
  }

  try {
    const existing = await Notifications.getPermissionsAsync();
    const permission = existing.granted ? existing : await Notifications.requestPermissionsAsync();
    if (!permission.granted) {
      const settings: ReminderSettings = {
        enabled: false,
        hour: normalizedHour,
        minute: normalizedMinute,
        status: 'permission_denied',
        updatedAt: new Date().toISOString(),
      };
      await persistReminderSettings(settings);
      return settings;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'OneDayReco 今日提醒',
        body: '现在可以打开看看，给今天安排一件刚刚好的小事。',
        data: { source: 'daily_reminder' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: normalizedHour,
        minute: normalizedMinute,
      },
    });
    const settings: ReminderSettings = {
      enabled: true,
      hour: normalizedHour,
      minute: normalizedMinute,
      notificationId,
      status: 'scheduled',
      updatedAt: new Date().toISOString(),
    };
    await persistReminderSettings(settings);
    return settings;
  } catch {
    const settings: ReminderSettings = {
      enabled: false,
      hour: normalizedHour,
      minute: normalizedMinute,
      status: 'error',
      updatedAt: new Date().toISOString(),
    };
    await persistReminderSettings(settings);
    return settings;
  }
}
