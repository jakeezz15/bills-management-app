import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { isDevToolsBuild } from "@/utils/dev-tools";
import {
    isBillPaidAsOf,
    isBillVisibleAsOf,
    isDebtInstallmentPaidAsOf,
    isDebtVisibleAsOf,
} from "@/utils/filters";
import { formatMoney, getStoredCurrency } from "@/utils/money";
import {
    capReminderFires,
    DEFAULT_REMINDER_HOUR,
    DEFAULT_REMINDER_LEAD_DAYS,
    groupFiresForDigest,
    itemWantsReminder,
    nextCycleDenseFires,
    REMINDER_HOUR_OPTIONS,
    REMINDER_LEAD_OPTIONS,
    type ReminderHour,
    type ReminderKind,
    type ReminderLeadDays,
} from "@/utils/reminder-schedule";
import { billStartDate, debtStartDate } from "@/utils/timestamps";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

const ENABLED_KEY = "dueRemindersEnabled";
const HOUR_KEY = "dueReminderHour";
const LEAD_KEY = "dueReminderLeadDays";
const CHANNEL_ID = "due-reminders";
const ID_PREFIXES = ["bill-", "debt-", "digest-"] as const;

export type ReminderPrefs = {
    hour: ReminderHour;
    leadDays: ReminderLeadDays;
};

function parseHour(raw: string | null): ReminderHour {
    const value = Number(raw);
    return (REMINDER_HOUR_OPTIONS as readonly number[]).includes(value)
        ? (value as ReminderHour)
        : DEFAULT_REMINDER_HOUR;
}

function parseLeadDays(raw: string | null): ReminderLeadDays {
    const value = Number(raw);
    return (REMINDER_LEAD_OPTIONS as readonly number[]).includes(value)
        ? (value as ReminderLeadDays)
        : DEFAULT_REMINDER_LEAD_DAYS;
}

export async function getReminderPrefs(): Promise<ReminderPrefs> {
    const [hourRaw, leadRaw] = await Promise.all([
        AsyncStorage.getItem(HOUR_KEY),
        AsyncStorage.getItem(LEAD_KEY),
    ]);
    return {
        hour: parseHour(hourRaw),
        leadDays: parseLeadDays(leadRaw),
    };
}

export async function setReminderPrefs(
    prefs: ReminderPrefs
): Promise<ReminderPrefs> {
    const next: ReminderPrefs = {
        hour: parseHour(String(prefs.hour)),
        leadDays: parseLeadDays(String(prefs.leadDays)),
    };
    await Promise.all([
        AsyncStorage.setItem(HOUR_KEY, String(next.hour)),
        AsyncStorage.setItem(LEAD_KEY, String(next.leadDays)),
    ]);
    return next;
}

type NotificationsModule = typeof import("expo-notifications");

let notificationsModule: NotificationsModule | null | undefined;
let handlerReady = false;
let syncChain: Promise<unknown> = Promise.resolve();

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

export type DueReminderPayload =
    | { type: "bill" | "debt"; id: string }
    | { type: "digest" };

export function parseDueReminderData(
    data: unknown
): DueReminderPayload | null {
    if (!data || typeof data !== "object") {
        return null;
    }
    const record = data as Record<string, unknown>;
    const type = record.type;
    if (type === "digest") {
        return { type: "digest" };
    }
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

function reminderTitle(
    type: "bill" | "debt",
    kind: ReminderKind,
    leadDays: number
): string {
    if (kind === "due") {
        return type === "bill" ? "Bill due today" : "Debt payment due";
    }
    if (kind === "overdue") {
        return type === "bill" ? "Bill overdue" : "Debt payment overdue";
    }
    const when =
        leadDays === 7
            ? "in 1 week"
            : leadDays === 1
              ? "in 1 day"
              : `in ${leadDays} days`;
    return type === "bill" ? `Bill due ${when}` : `Debt payment due ${when}`;
}

function isOurReminderId(identifier: string): boolean {
    return ID_PREFIXES.some((prefix) => identifier.startsWith(prefix));
}

async function cancelScheduledDueReminders(
    Notifications: NotificationsModule
): Promise<void> {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
        pending
            .filter((item) => isOurReminderId(item.identifier))
            .map((item) =>
                Notifications.cancelScheduledNotificationAsync(item.identifier)
            )
    );
}

export async function cancelAllDueReminders(): Promise<void> {
    const Notifications = await loadNotifications();
    if (!Notifications) {
        return;
    }
    await cancelScheduledDueReminders(Notifications);
}

type ItemFire = {
    at: Date;
    kind: ReminderKind;
    periodKey: string;
    dayKey: string;
    identifier: string;
    type: "bill" | "debt";
    id: string;
    body: string;
};

export type SyncDueRemindersInput = {
    bills: Bill[];
    debts: Debt[];
    billPayments?: BillPayment[];
    debtPayments?: DebtPayment[];
};

/**
 * Rebuild due-day alerts from current bills, debts, and payment ledgers.
 * Schedules the next unpaid dense window per plan (digest when >5 same day).
 */
export async function syncDueReminders(
    billsOrInput: Bill[] | SyncDueRemindersInput,
    debtsArg?: Debt[],
    billPaymentsArg: BillPayment[] = [],
    debtPaymentsArg: DebtPayment[] = []
): Promise<{ scheduled: number }> {
    const run = async (): Promise<{ scheduled: number }> => {
        let bills: Bill[];
        let debts: Debt[];
        let billPayments: BillPayment[];
        let debtPayments: DebtPayment[];

        if (Array.isArray(billsOrInput)) {
            bills = billsOrInput;
            debts = debtsArg ?? [];
            billPayments = billPaymentsArg;
            debtPayments = debtPaymentsArg;
        } else {
            bills = billsOrInput.bills;
            debts = billsOrInput.debts;
            billPayments = billsOrInput.billPayments ?? [];
            debtPayments = billsOrInput.debtPayments ?? [];
        }

        if (!remindersSupported()) {
            return { scheduled: 0 };
        }

        const Notifications = await loadNotifications();
        if (!Notifications) {
            return { scheduled: 0 };
        }

        const enabled = await areDueRemindersEnabled();
        await cancelScheduledDueReminders(Notifications);

        if (!enabled) {
            return { scheduled: 0 };
        }

        const permitted = await requestReminderPermission();
        if (!permitted) {
            // Keep the pref on so Settings can prompt to open system Settings.
            return { scheduled: 0 };
        }

        await ensureAndroidChannel(Notifications);
        const currency = await getStoredCurrency();
        const prefs = await getReminderPrefs();
        const schedule = { hour: prefs.hour, leadDays: prefs.leadDays };
        const now = new Date();
        const planned: ItemFire[] = [];

        for (const bill of bills) {
            if (!itemWantsReminder(bill) || !isBillVisibleAsOf(bill, now)) {
                continue;
            }
            const start = billStartDate(bill);
            const body = bill.amountVaries
                ? `${bill.name} · enter amount`
                : `${bill.name} · ${formatMoney(bill.amount, currency, { compact: true })}`;
            for (const fire of nextCycleDenseFires(
                bill.dueDay,
                now,
                (periodDue) =>
                    isBillPaidAsOf(bill, billPayments, periodDue, {
                        anyDayInMonth: true,
                    }),
                { ...schedule, startDate: start }
            )) {
                planned.push({
                    ...fire,
                    identifier: `bill-${bill.id}-${fire.kind}-${fire.dayKey}`,
                    type: "bill",
                    id: bill.id,
                    body,
                });
            }
        }

        for (const debt of debts) {
            if (
                debt.balance <= 0 ||
                debt.paidOffDate ||
                !itemWantsReminder(debt) ||
                !isDebtVisibleAsOf(debt, now)
            ) {
                continue;
            }
            const body = `${debt.name} · min ${formatMoney(debt.minimumPayment, currency, { compact: true })}`;
            for (const fire of nextCycleDenseFires(
                debt.dueDay,
                now,
                (periodDue) =>
                    isDebtInstallmentPaidAsOf(debt, periodDue, debtPayments),
                { ...schedule, startDate: debtStartDate(debt) }
            )) {
                planned.push({
                    ...fire,
                    identifier: `debt-${debt.id}-${fire.kind}-${fire.dayKey}`,
                    type: "debt",
                    id: debt.id,
                    body,
                });
            }
        }

        const grouped = groupFiresForDigest(planned);
        type Schedulable = {
            at: Date;
            identifier: string;
            title: string;
            body: string;
            data: DueReminderPayload;
        };
        const toBuild: Schedulable[] = [];

        for (const entry of grouped) {
            if (entry.mode === "digest") {
                toBuild.push({
                    at: entry.at,
                    identifier: `digest-${entry.dayKey}`,
                    title: "Payments need attention",
                    body: `You have ${entry.count} payments to review`,
                    data: { type: "digest" },
                });
            } else {
                const fire = entry.fire;
                toBuild.push({
                    at: fire.at,
                    identifier: fire.identifier,
                    title: reminderTitle(fire.type, fire.kind, prefs.leadDays),
                    body: fire.body,
                    data: { type: fire.type, id: fire.id },
                });
            }
        }

        const toSchedule = capReminderFires(toBuild);
        for (const fire of toSchedule) {
            await Notifications.scheduleNotificationAsync({
                identifier: fire.identifier,
                content: {
                    title: fire.title,
                    body: fire.body,
                    data: fire.data,
                    sound: true,
                    ...(Platform.OS === "android"
                        ? { channelId: CHANNEL_ID }
                        : {}),
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: fire.at,
                    ...(Platform.OS === "android"
                        ? { channelId: CHANNEL_ID }
                        : {}),
                },
            });
        }

        return { scheduled: toSchedule.length };
    };

    const result = syncChain.then(run, run);
    syncChain = result.then(
        () => undefined,
        () => undefined
    );
    return result;
}

export async function enableDueReminders(
    bills: Bill[],
    debts: Debt[],
    billPayments: BillPayment[] = [],
    debtPayments: DebtPayment[] = []
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
    const { scheduled } = await syncDueReminders({
        bills,
        debts,
        billPayments,
        debtPayments,
    });
    return { ok: true, scheduled };
}

export async function disableDueReminders(): Promise<void> {
    await setDueRemindersEnabled(false);
    await cancelAllDueReminders();
}

/** After backup/cloud restore: enable or disable and resync the OS queue. */
export async function applyDueReminderPrefsFromBackup(
    enabled: boolean,
    bills: Bill[],
    debts: Debt[],
    billPayments: BillPayment[] = [],
    debtPayments: DebtPayment[] = []
): Promise<void> {
    if (enabled) {
        await enableDueReminders(bills, debts, billPayments, debtPayments);
    } else {
        await disableDueReminders();
    }
}

/** First bill or active debt the test banner can open on tap. */
export function pickTestReminderTarget(
    bills: Bill[],
    debts: Debt[]
): DueReminderPayload | null {
    const bill = bills.find((item) => itemWantsReminder(item));
    if (bill) {
        return { type: "bill", id: bill.id };
    }
    const debt = debts.find(
        (item) =>
            item.balance > 0 && !item.paidOffDate && itemWantsReminder(item)
    );
    if (debt) {
        return { type: "debt", id: debt.id };
    }
    return null;
}

/** Fires in a few seconds so you can verify alerts on a device. */
export async function sendTestReminder(
    payload?: DueReminderPayload | null
): Promise<{ ok: boolean; reason?: string }> {
    if (!isDevToolsBuild()) {
        return {
            ok: false,
            reason: "Test reminders are only available in a development build.",
        };
    }
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
    const data =
        payload && payload.type !== "digest"
            ? payload
            : undefined;
    await Notifications.scheduleNotificationAsync({
        content: {
            title: "Test reminder",
            body: data
                ? "Tap this banner to open Home and log it."
                : "Due-day alerts are working on this device.",
            sound: true,
            ...(data ? { data } : {}),
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
 * A test banner with no payload is ignored; tests that include a bill
 * or debt id follow the same path as a real due-day alert.
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
