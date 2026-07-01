import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

declare const require: (name: string) => NotificationsModule;

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

type NotificationsModule = {
  SchedulableTriggerInputTypes: { DAILY: 'daily' };
  cancelScheduledNotificationAsync: (identifier: string) => Promise<void>;
  getPermissionsAsync: () => Promise<{ granted: boolean }>;
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  scheduleNotificationAsync: (request: {
    content: {
      title: string;
      body: string;
      data: Record<string, string>;
    };
    trigger: {
      type: 'daily';
      hour: number;
      minute: number;
    };
  }) => Promise<string>;
  setNotificationHandler: (handler: {
    handleNotification: () => Promise<{
      shouldShowAlert: boolean;
      shouldShowBanner: boolean;
      shouldShowList: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }) => void;
};

let notifications: NotificationsModule | null | undefined;

function isExpoGoAndroid() {
  return Platform.OS === 'android' && Constants.appOwnership === 'expo';
}

function getNotificationsModule() {
  if (Platform.OS === 'web' || isExpoGoAndroid()) return null;
  if (notifications !== undefined) return notifications;
  try {
    notifications = require('expo-notifications');
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    notifications = null;
  }
  return notifications;
}

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
  const notificationModule = getNotificationsModule();
  if (!notificationModule) return;
  try {
    await notificationModule.cancelScheduledNotificationAsync(notificationId);
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

  const notificationModule = getNotificationsModule();

  if (!notificationModule) {
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
    const existing = await notificationModule.getPermissionsAsync();
    const permission = existing.granted ? existing : await notificationModule.requestPermissionsAsync();
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

    const notificationId = await notificationModule.scheduleNotificationAsync({
      content: {
        title: 'OneDayReco 今日提醒',
        body: '现在可以打开看看，给今天安排一件刚刚好的小事。',
        data: { source: 'daily_reminder' },
      },
      trigger: {
        type: notificationModule.SchedulableTriggerInputTypes.DAILY,
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
