export type PeriodUnit = "day" | "week" | "month" | "year";

export type DateRange = {
    start: Date;
    end: Date;
};

/** Parse ISO `YYYY-MM-DD` as a local calendar date (no UTC shift). */
export function parseIsoDate(iso: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
    if (!match) {
        return null;
    }

    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) {
        return null;
    }

    return startOfDay(date);
}

export function toIsoDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Local calendar today as `YYYY-MM-DD` (avoids UTC shift from toISOString). */
export function todayIsoDate(): string {
    return toIsoDate(new Date());
}

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameCalendarMonth(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/**
 * When the period picker is on "this month", `range.end` is the 30th/31st.
 * Logging a payment on that future date makes Due now (which uses today)
 * miss it. Stamp today instead when as-of is later in the current month.
 */
export function paymentDateForAsOf(asOf: Date, today = new Date()): Date {
    const asOfDay = startOfDay(asOf);
    const todayDay = startOfDay(today);
    if (
        isSameCalendarMonth(asOfDay, todayDay) &&
        asOfDay.getTime() > todayDay.getTime()
    ) {
        return todayDay;
    }
    return asOfDay;
}

export function endOfDay(date: Date): Date {
    return new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999
    );
}

/** Week starts on Monday. */
export function startOfWeek(date: Date): Date {
    const d = startOfDay(date);
    const day = d.getDay(); // 0 Sun … 6 Sat
    const offset = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + offset);
    return d;
}

export function endOfWeek(date: Date): Date {
    const start = startOfWeek(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return endOfDay(end);
}

export function startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function endOfMonth(date: Date): Date {
    return endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function startOfYear(date: Date): Date {
    return new Date(date.getFullYear(), 0, 1);
}

export function endOfYear(date: Date): Date {
    return endOfDay(new Date(date.getFullYear(), 11, 31));
}

export function getRangeForPeriod(anchor: Date, unit: PeriodUnit): DateRange {
    switch (unit) {
        case "day":
            return { start: startOfDay(anchor), end: endOfDay(anchor) };
        case "week":
            return { start: startOfWeek(anchor), end: endOfWeek(anchor) };
        case "month":
            return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
        case "year":
            return { start: startOfYear(anchor), end: endOfYear(anchor) };
    }
}

/**
 * Month arithmetic that clamps the day instead of overflowing.
 * `setMonth` would turn Jan 31 + 1 month into Mar 3, skipping February.
 */
function shiftMonths(anchor: Date, months: number): Date {
    const year = anchor.getFullYear();
    const month = anchor.getMonth() + months;
    const daysInTarget = new Date(year, month + 1, 0).getDate();
    return startOfDay(
        new Date(year, month, Math.min(anchor.getDate(), daysInTarget))
    );
}

export function shiftAnchor(
    anchor: Date,
    unit: PeriodUnit,
    delta: -1 | 1
): Date {
    switch (unit) {
        case "day": {
            const next = new Date(anchor);
            next.setDate(next.getDate() + delta);
            return startOfDay(next);
        }
        case "week": {
            const next = new Date(anchor);
            next.setDate(next.getDate() + delta * 7);
            return startOfDay(next);
        }
        case "month":
            return shiftMonths(anchor, delta);
        case "year":
            return shiftMonths(anchor, delta * 12);
    }
}

export function isInRange(date: Date, range: DateRange): boolean {
    const t = date.getTime();
    return t >= range.start.getTime() && t <= range.end.getTime();
}

export function isIsoInRange(iso: string, range: DateRange): boolean {
    const parsed = parseIsoDate(iso);
    if (!parsed) {
        return false;
    }
    return isInRange(parsed, range);
}

/**
 * True when a monthly due-day falls on any calendar day inside the range
 * (Option A for bills/debts that only store `dueDay`).
 * Iterates by month (not day) so long "as of" ranges stay cheap.
 */
export function dueDayFallsInRange(
    dueDay: number,
    range: DateRange
): boolean {
    const day = Math.min(Math.max(dueDay, 1), 31);
    const cursor = startOfMonth(range.start);
    const lastMonth = startOfMonth(range.end);

    while (cursor.getTime() <= lastMonth.getTime()) {
        const daysInMonth = new Date(
            cursor.getFullYear(),
            cursor.getMonth() + 1,
            0
        ).getDate();
        const dueDate = startOfDay(
            new Date(
                cursor.getFullYear(),
                cursor.getMonth(),
                Math.min(day, daysInMonth)
            )
        );

        if (isInRange(dueDate, range)) {
            return true;
        }

        cursor.setMonth(cursor.getMonth() + 1);
    }

    return false;
}

/** Cumulative window: beginning of history through `asOf` (inclusive). */
export function rangeThrough(asOf: Date): DateRange {
    return {
        start: new Date(2000, 0, 1),
        end: endOfDay(asOf),
    };
}

/** How many distinct calendar months overlap the range (for savings allocation). */
export function countMonthsOverlapping(range: DateRange): number {
    const start = startOfMonth(range.start);
    const end = startOfMonth(range.end);
    let count = 0;
    const cursor = new Date(start);

    while (cursor.getTime() <= end.getTime()) {
        count += 1;
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return Math.max(count, 1);
}

export function formatDisplayDate(iso: string): string {
    const parsed = parseIsoDate(iso);
    if (!parsed) {
        return iso;
    }
    return parsed.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/** `15` → `15th`. Clamps to 1–31 because due days are calendar days. */
export function ordinalDay(day: number): string {
    const n = Math.min(Math.max(Math.trunc(day), 1), 31);
    const mod100 = n % 100;
    const mod10 = n % 10;
    const suffix =
        mod100 >= 11 && mod100 <= 13
            ? "th"
            : mod10 === 1
              ? "st"
              : mod10 === 2
                ? "nd"
                : mod10 === 3
                  ? "rd"
                  : "th";
    return `${n}${suffix}`;
}

export function formatPeriodLabel(anchor: Date, unit: PeriodUnit): string {
    const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];

    switch (unit) {
        case "day":
            return `${months[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`;
        case "week": {
            const { start, end } = getRangeForPeriod(anchor, "week");
            const sameMonth = start.getMonth() === end.getMonth();
            if (sameMonth) {
                return `${months[start.getMonth()]} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
            }
            return `${months[start.getMonth()]} ${start.getDate()} – ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
        }
        case "month":
            return `${months[anchor.getMonth()]} ${anchor.getFullYear()}`;
        case "year":
            return String(anchor.getFullYear());
    }
}

export const PERIOD_UNITS: PeriodUnit[] = ["day", "week", "month", "year"];

export const PERIOD_UNIT_LABELS: Record<PeriodUnit, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
    year: "Year",
};
