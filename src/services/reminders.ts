import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { formatMoney, getStoredCurrency } from "@/utils/money";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

const ENABLED_KEY = "dueRemindersEnabled";
const CHANNEL_ID = "due-reminders";
const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null | undefined;
let handlerReady = false;

/**
 * Android Expo Go throws on import of expo-notifications (push APIs removed in SDK 53).
 * Local reminders need a development build on Android, or iOS / a custom native build.
 */
export function remindersUnavailableReason(): string | null {
    if (Platform.OS === "web") {
        return "Reminders need the iOS or Android app.";
    }
    if (Platform.OS === "android" && isRunningInExpoGo()) {
        return "Due-day reminders need a development build on Android. Expo Go no longer supports expo-notifications there.";
    }
    return null;
}

export function remindersSupported(): boolean {
    return remindersUnavailableReason() === null;
}

async function loadNotifications(): Promise<NotificationsModule | null> {
    if (!remindersSupported()) {
        return null;
    }
    if (notificationsModule !== undefined) {
        return notificationsModule;
    }

    try {
        const Notifications = await import("expo-notifications");
        if (!handlerReady) {
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowBanner: true,
                    shouldShowList: true,
                    shouldPlaySound: true,
                    shouldSetBadge: false,
                }),
            });
            handlerReady = true;
        }
        notificationsModule = Notifications;
        return Notifications;
    } catch {
        notificationsModule = null;
        return null;
    }
}

export async function areDueRemindersEnabled(): Promise<boolean> {
    const value = await AsyncStorage.getItem(ENABLED_KEY);
    return value === "true";
}

export async function setDueRemindersEnabled(
    enabled: boolean
): Promise<void> {
    await AsyncStorage.setItem(ENABLED_KEY, enabled ? "true" : "false");
}

async function ensureAndroidChannel(
    Notifications: NotificationsModule
): Promise<void> {
    if (Platform.OS !== "android") {
        return;
    }

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: "Due day reminders",
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
    });
}

export async function requestReminderPermission(): Promise<boolean> {
    const Notifications = await loadNotifications();
    if (!Notifications) {
        return false;
    }

    await ensureAndroidChannel(Notifications);

    const current = await Notifications.getPermissionsAsync();
    if (current.granted) {
        return true;
    }

    if (current.status === "denied" && !current.canAskAgain) {
        return false;
    }

    const next = await Notifications.requestPermissionsAsync();
    return next.granted;
}

export type DueReminderPayload = {
    type: "bill" | "debt";
    id: string;
};

export function parseDueReminderData(
    data: unknown
): DueReminderPayload | null {
    if (!data || typeof data !== "object") {
        return null;
    }
    const record = data as Record<string, unknown>;
    const type = record.type;
    const id = record.id;
    if (
        (type === "bill" || type === "debt") &&
        typeof id === "string" &&
        id.length > 0
    ) {
        return { type, id };
    }
    return null;
}

function clampDueDay(dueDay: number): number {
    return Math.min(Math.max(Math.floor(dueDay), 1), 28);
}

async function scheduleMonthly(
    Notifications: NotificationsModule,
    identifier: string,
    title: string,
    body: string,
    dueDay: number,
    data: DueReminderPayload
): Promise<void> {
    await Notifications.scheduleNotificationAsync({
        identifier,
        content: {
            title,
            body,
            data,
            sound: true,
            ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day: clampDueDay(dueDay),
            hour: REMINDER_HOUR,
            minute: REMINDER_MINUTE,
            ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
        },
    });
}

export async function cancelAllDueReminders(): Promise<void> {
    const Notifications = await loadNotifications();
    if (!Notifications) {
        return;
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Rebuild monthly due-day alerts from current bills and debts.
 * Only schedules when the preference is on and permission is granted.
 */
export async function syncDueReminders(
    bills: Bill[],
    debts: Debt[]
): Promise<{ scheduled: number }> {
    if (!remindersSupported()) {
        return { scheduled: 0 };
    }

    const Notifications = await loadNotifications();
    if (!Notifications) {
        return { scheduled: 0 };
    }

    const enabled = await areDueRemindersEnabled();
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!enabled) {
        return { scheduled: 0 };
    }

    const permitted = await requestReminderPermission();
    if (!permitted) {
        await setDueRemindersEnabled(false);
        return { scheduled: 0 };
    }

    await ensureAndroidChannel(Notifications);
    const currency = await getStoredCurrency();
    let scheduled = 0;

    for (const bill of bills) {
        await scheduleMonthly(
            Notifications,
            `bill-${bill.id}`,
            "Bill due today",
            `${bill.name} · ${formatMoney(bill.amount, currency, { compact: true })}`,
            bill.dueDay,
            { type: "bill", id: bill.id }
        );
        scheduled += 1;
    }

    for (const debt of debts) {
        if (debt.balance <= 0 || debt.paidOffDate) {
            continue;
        }
        await scheduleMonthly(
            Notifications,
            `debt-${debt.id}`,
            "Debt payment due",
            `${debt.name} · min ${formatMoney(debt.minimumPayment, currency, { compact: true })}`,
            debt.dueDay,
            { type: "debt", id: debt.id }
        );
        scheduled += 1;
    }

    return { scheduled };
}

export async function enableDueReminders(
    bills: Bill[],
    debts: Debt[]
): Promise<{ ok: boolean; scheduled: number; reason?: string }> {
    const blocked = remindersUnavailableReason();
    if (blocked) {
        return { ok: false, scheduled: 0, reason: blocked };
    }

    const permitted = await requestReminderPermission();
    if (!permitted) {
        return {
            ok: false,
            scheduled: 0,
            reason: "Turn on notifications for On Hand in system Settings.",
        };
    }

    await setDueRemindersEnabled(true);
    const { scheduled } = await syncDueReminders(bills, debts);
    return { ok: true, scheduled };
}

export async function disableDueReminders(): Promise<void> {
    await setDueRemindersEnabled(false);
    await cancelAllDueReminders();
}

/** Fires in a few seconds so you can verify alerts on a device. */
export async function sendTestReminder(): Promise<{
    ok: boolean;
    reason?: string;
}> {
    const blocked = remindersUnavailableReason();
    if (blocked) {
        return { ok: false, reason: blocked };
    }

    const Notifications = await loadNotifications();
    if (!Notifications) {
        return { ok: false, reason: "Notifications could not load on this device." };
    }

    const permitted = await requestReminderPermission();
    if (!permitted) {
        return {
            ok: false,
            reason: "Turn on notifications for On Hand in system Settings.",
        };
    }

    await ensureAndroidChannel(Notifications);
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Test reminder",
            body: "Due-day alerts are working on this device.",
            sound: true,
            ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3,
            ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
        },
    });
    return { ok: true };
}

type NotificationResponseLike = {
    notification: {
        request: {
            identifier: string;
            content: { data?: unknown };
        };
    };
};

/**
 * Cold start + in-app taps on due-day reminders.
 * Test reminders have no payload and are ignored.
 */
export function subscribeToDueReminderTaps(
    onTap: (payload: DueReminderPayload) => void
): () => void {
    if (!remindersSupported()) {
        return () => {};
    }

    let cancelled = false;
    let subscription: { remove: () => void } | undefined;
    let handledKey: string | null = null;

    const handleResponse = (response: NotificationResponseLike) => {
        const key = response.notification.request.identifier;
        if (handledKey === key) {
            return;
        }
        const payload = parseDueReminderData(
            response.notification.request.content.data
        );
        if (!payload) {
            return;
        }
        handledKey = key;
        onTap(payload);
    };

    void loadNotifications().then((Notifications) => {
        if (!Notifications || cancelled) {
            return;
        }

        const last = Notifications.getLastNotificationResponse();
        if (last) {
            handleResponse(last);
            Notifications.clearLastNotificationResponse();
        }

        subscription = Notifications.addNotificationResponseReceivedListener(
            (response) => {
                handleResponse(response);
                Notifications.clearLastNotificationResponse();
            }
        );
    });

    return () => {
        cancelled = true;
        subscription?.remove();
    };
}
