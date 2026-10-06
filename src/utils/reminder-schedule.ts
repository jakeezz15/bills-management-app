/**
 * When and how often due-day alerts should fire. Kept free of
 * expo-notifications so the calendar edge cases can be unit-tested.
 */

export const DEFAULT_REMINDER_HOUR = 9;
export const DEFAULT_REMINDER_MINUTE = 0;
export const DEFAULT_REMINDER_LEAD_DAYS = 3;
/** Keep nagging this many calendar days after the due date while unpaid. */
export const REMINDER_OVERDUE_DAYS = 5;
/** Same-day unpaid plans above this become one digest banner. */
export const REMINDER_DIGEST_THRESHOLD = 5;

export const REMINDER_LEAD_OPTIONS = [0, 1, 3, 7] as const;
export const REMINDER_HOUR_OPTIONS = [7, 8, 9, 10, 12, 18, 20] as const;

export type ReminderLeadDays = (typeof REMINDER_LEAD_OPTIONS)[number];
export type ReminderHour = (typeof REMINDER_HOUR_OPTIONS)[number];

/**
 * iOS allows 64 pending notifications. Leave a few slots for the test ping
 * and anything else the OS is holding.
 */
export const REMINDER_MAX_SCHEDULED = 60;

export type ReminderKind = "lead" | "due" | "overdue";

export type ReminderFire = {
    at: Date;
    kind: ReminderKind;
    /** Calendar month the obligation belongs to (`YYYY-MM`). */
    periodKey: string;
    /** Calendar day key for digest grouping (`YYYY-MM-DD`). */
    dayKey: string;
};

export type ReminderScheduleOptions = {
    hour?: number;
    minute?: number;
    leadDays?: number;
    overdueDays?: number;
    /** ISO `YYYY-MM-DD` — no fires before the plan is active. */
    startDate?: string | null;
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

export function dayKey(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * First monthly due date on or after `start` (start-of-day compare).
 * Mid-month starts with an earlier due day roll to the next month.
 */
export function firstDueOnOrAfter(
    dueDay: number,
    start: Date,
    hour = DEFAULT_REMINDER_HOUR,
    minute = DEFAULT_REMINDER_MINUTE
): Date {
    const startDay = new Date(
        start.getFullYear(),
        start.getMonth(),
        start.getDate(),
        0,
        0,
        0,
        0
    );
    let year = startDay.getFullYear();
    let month = startDay.getMonth();

    for (let i = 0; i < 14; i += 1) {
        const due = dueDateInMonth(dueDay, year, month, hour, minute);
        const dueDayStart = new Date(
            due.getFullYear(),
            due.getMonth(),
            due.getDate(),
            0,
            0,
            0,
            0
        );
        if (dueDayStart.getTime() >= startDay.getTime()) {
            return due;
        }
        month += 1;
        if (month > 11) {
            month = 0;
            year += 1;
        }
    }

    return dueDateInMonth(dueDay, year, month, hour, minute);
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
        return `${time}, daily on the due day and 5 days after while unpaid`;
    }
    return `${time}, daily from ${formatReminderLead(leadDays).toLowerCase()} through due and 5 days after while unpaid`;
}

/** Old records omit the field; treat missing as on. */
export function itemWantsReminder(item: { remind?: boolean }): boolean {
    return item.remind !== false;
}

function parseStartBound(startDate?: string | null): Date | null {
    if (!startDate || startDate.length < 10) {
        return null;
    }
    const year = Number(startDate.slice(0, 4));
    const month = Number(startDate.slice(5, 7)) - 1;
    const day = Number(startDate.slice(8, 10));
    if (
        !Number.isFinite(year) ||
        !Number.isFinite(month) ||
        !Number.isFinite(day)
    ) {
        return null;
    }
    return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Dense daily fires for the next unpaid due cycle: lead → due → +overdue days.
 * Only the next cycle is returned (no multi-month stack).
 *
 * `isPeriodSettled(periodDue)` should return true when that calendar month
 * is already paid or skipped.
 */
export function nextCycleDenseFires(
    dueDay: number,
    from: Date,
    isPeriodSettled: (periodDue: Date) => boolean,
    options: ReminderScheduleOptions = {}
): ReminderFire[] {
    const hour = options.hour ?? DEFAULT_REMINDER_HOUR;
    const minute = options.minute ?? DEFAULT_REMINDER_MINUTE;
    const leadDays = Math.max(0, options.leadDays ?? DEFAULT_REMINDER_LEAD_DAYS);
    const overdueDays = Math.max(
        0,
        options.overdueDays ?? REMINDER_OVERDUE_DAYS
    );
    const startBound = parseStartBound(options.startDate);

    let searchFrom = from;
    if (startBound && startBound.getTime() > from.getTime()) {
        searchFrom = startBound;
    }

    let year = searchFrom.getFullYear();
    let month = searchFrom.getMonth();

    for (let i = 0; i < 14; i += 1) {
        const due = dueDateInMonth(dueDay, year, month, hour, minute);
        const dueDayStart = new Date(
            due.getFullYear(),
            due.getMonth(),
            due.getDate(),
            0,
            0,
            0,
            0
        );

        if (startBound && dueDayStart.getTime() < startBound.getTime()) {
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
            continue;
        }

        // Window still open if we're on/before the last overdue day at reminder hour.
        const windowEnd = new Date(due);
        windowEnd.setDate(windowEnd.getDate() + overdueDays);

        if (windowEnd.getTime() < from.getTime()) {
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
            continue;
        }

        if (isPeriodSettled(due)) {
            month += 1;
            if (month > 11) {
                month = 0;
                year += 1;
            }
            continue;
        }

        const key = periodKey(due);
        const fires: ReminderFire[] = [];
        const windowStart = new Date(due);
        windowStart.setDate(windowStart.getDate() - leadDays);

        for (
            let cursor = new Date(windowStart);
            cursor.getTime() <= windowEnd.getTime();
            cursor.setDate(cursor.getDate() + 1)
        ) {
            const at = new Date(
                cursor.getFullYear(),
                cursor.getMonth(),
                cursor.getDate(),
                hour,
                minute,
                0,
                0
            );
            if (at.getTime() <= from.getTime()) {
                continue;
            }
            if (startBound) {
                const atDay = new Date(
                    at.getFullYear(),
                    at.getMonth(),
                    at.getDate(),
                    0,
                    0,
                    0,
                    0
                );
                if (atDay.getTime() < startBound.getTime()) {
                    continue;
                }
            }

            const dayOffset = Math.round(
                (new Date(
                    at.getFullYear(),
                    at.getMonth(),
                    at.getDate()
                ).getTime() -
                    dueDayStart.getTime()) /
                    86400000
            );
            let kind: ReminderKind = "lead";
            if (dayOffset === 0) {
                kind = "due";
            } else if (dayOffset > 0) {
                kind = "overdue";
            }

            fires.push({
                at,
                kind,
                periodKey: key,
                dayKey: dayKey(at),
            });
        }

        return fires;
    }

    return [];
}

/**
 * Group per-plan fires by calendar day. Days with more than `threshold`
 * distinct plans become a single digest placeholder (one fire, count set).
 */
export type DigestCandidate<T extends { at: Date; dayKey: string; id: string }> =
    | { mode: "item"; fire: T }
    | { mode: "digest"; at: Date; dayKey: string; count: number; fires: T[] };

export function groupFiresForDigest<
    T extends { at: Date; dayKey: string; id: string },
>(fires: T[], threshold = REMINDER_DIGEST_THRESHOLD): DigestCandidate<T>[] {
    const byDay = new Map<string, T[]>();
    for (const fire of fires) {
        const list = byDay.get(fire.dayKey) ?? [];
        list.push(fire);
        byDay.set(fire.dayKey, list);
    }

    const result: DigestCandidate<T>[] = [];
    const dayKeys = [...byDay.keys()].sort();

    for (const key of dayKeys) {
        const list = byDay.get(key) ?? [];
        // One entry per plan id that day (dense window can only fire once/day/plan).
        const unique = new Map<string, T>();
        for (const fire of list) {
            if (!unique.has(fire.id)) {
                unique.set(fire.id, fire);
            }
        }
        const items = [...unique.values()].sort(
            (a, b) => a.at.getTime() - b.at.getTime()
        );
        if (items.length > threshold) {
            const at = items[0]!.at;
            result.push({
                mode: "digest",
                at,
                dayKey: key,
                count: items.length,
                fires: items,
            });
        } else {
            for (const fire of items) {
                result.push({ mode: "item", fire });
            }
        }
    }

    return result;
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

/**
 * @deprecated Prefer `nextCycleDenseFires`. Kept for tests that assert the
 * old lead+due pair shape during migration.
 */
export function upcomingReminderFires(
    dueDay: number,
    from: Date,
    options: ReminderScheduleOptions & { horizon?: number } = {}
): ReminderFire[] {
    const hour = options.hour ?? DEFAULT_REMINDER_HOUR;
    const minute = options.minute ?? DEFAULT_REMINDER_MINUTE;
    const leadDays = Math.max(0, options.leadDays ?? DEFAULT_REMINDER_LEAD_DAYS);
    const horizon = options.horizon ?? 1;

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
                    fires.push({
                        at: lead,
                        kind: "lead",
                        periodKey: key,
                        dayKey: dayKey(lead),
                    });
                }
            }

            fires.push({
                at: due,
                kind: "due",
                periodKey: key,
                dayKey: dayKey(due),
            });
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
