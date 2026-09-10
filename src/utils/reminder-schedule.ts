/**
 * When and how often due-day alerts should fire. Kept free of
 * expo-notifications so the calendar edge cases can be unit-tested.
 */

export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_REMINDER_MINUTE = 0;
export const DEFAULT_REMINDER_LEAD_DAYS = 3;

export const REMINDER_LEAD_OPTIONS = [0, 1, 3, 7] as const;
export const REMINDER_HOUR_OPTIONS = [7, 8, 9, 10, 12, 18, 20] as const;

export type ReminderLeadDays = (typeof REMINDER_LEAD_OPTIONS)[number];
export type ReminderHour = (typeof REMINDER_HOUR_OPTIONS)[number];

/** How many months ahead to plan. ReminderSync rebuilds this on every launch. */
export const REMINDER_HORIZON_MONTHS = 4;
/**
 * iOS allows 64 pending notifications. Leave a few slots for the test ping
 * and anything else the OS is holding.
 */
export const REMINDER_MAX_SCHEDULED = 60;

export type ReminderKind = "lead" | "due";

export type ReminderFire = {
    at: Date;
    kind: ReminderKind;
    /** Calendar month the obligation belongs to (`YYYY-MM`). */
    periodKey: string;
};

export type ReminderScheduleOptions = {
    hour?: number;
    minute?: number;
    leadDays?: number;
    horizon?: number;
};

function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

/** The date this due day lands on in `year`/`month` (month is 0-indexed). */
export function dueDateInMonth(
    dueDay: number,
    year: number,
    month: number,
    hour = DEFAULT_REMINDER_HOUR,
    minute = DEFAULT_REMINDER_MINUTE
): Date {
    const day = Math.min(Math.max(Math.floor(dueDay), 1), daysInMonth(year, month));
    return new Date(year, month, day, hour, minute, 0, 0);
}

export function periodKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${date.getFullYear()}-${month}`;
}

export function formatReminderHour(hour: number): string {
    const period = hour >= 12 ? "PM" : "AM";
    const twelve = hour % 12 === 0 ? 12 : hour % 12;
    return `${twelve}:00 ${period}`;
}

export function formatReminderLead(leadDays: number): string {
    if (leadDays <= 0) {
        return "Due day only";
    }
    if (leadDays === 1) {
        return "1 day before";
    }
    if (leadDays === 7) {
        return "1 week before";
    }
    return `${leadDays} days before`;
}

export function formatReminderScheduleCaption(
    hour: number,
    leadDays: number
): string {
    const time = formatReminderHour(hour);
    if (leadDays <= 0) {
        return `${time} on the due day`;
    }
    return `${time}, ${formatReminderLead(leadDays).toLowerCase()} and on the day`;
}

/** Old records omit the field; treat missing as on. */
export function itemWantsReminder(item: { remind?: boolean }): boolean {
    return item.remind !== false;
}

/**
 * Next `horizon` months of due dates after `from`, plus a lead fire
 * `leadDays` before each — unless that lead is already in the past.
 *
 * Day 31 in February becomes the 28th (or 29th in a leap year). Lead time
 * is computed from that real date, so a 1st-of-month bill warns on the
 * previous month's 29th/28th, not on a fictional day 0.
 */
export function upcomingReminderFires(
    dueDay: number,
    from: Date,
    options: ReminderScheduleOptions = {}
): ReminderFire[] {
    const hour = options.hour ?? DEFAULT_REMINDER_HOUR;
    const minute = options.minute ?? DEFAULT_REMINDER_MINUTE;
    const leadDays = Math.max(0, options.leadDays ?? DEFAULT_REMINDER_LEAD_DAYS);
    const horizon = options.horizon ?? REMINDER_HORIZON_MONTHS;

    const fires: ReminderFire[] = [];
    let year = from.getFullYear();
    let month = from.getMonth();
    let collected = 0;

    while (collected < horizon) {
        const due = dueDateInMonth(dueDay, year, month, hour, minute);
        if (due.getTime() > from.getTime()) {
            const key = periodKey(due);

            if (leadDays > 0) {
                const lead = new Date(due);
                lead.setDate(lead.getDate() - leadDays);
                if (lead.getTime() > from.getTime()) {
                    fires.push({ at: lead, kind: "lead", periodKey: key });
                }
            }

            fires.push({ at: due, kind: "due", periodKey: key });
            collected += 1;
        }

        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }

    return fires;
}

/** Soonest fires first, capped so we stay under the iOS pending-notification limit. */
export function capReminderFires<T extends { at: Date }>(
    fires: T[],
    max = REMINDER_MAX_SCHEDULED
): T[] {
    return [...fires]
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .slice(0, max);
}
