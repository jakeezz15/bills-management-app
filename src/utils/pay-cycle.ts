import { Income, PayCadence } from "@/types/income";
import {
    DateRange,
    addDays,
    endOfDay,
    parseIsoDate,
    shiftMonths,
    startOfDay,
} from "@/utils/date";

export type RecurringPayCadence = Exclude<PayCadence, "once">;

export const PAY_CADENCE_CHIPS = [
    "Once",
    "Weekly",
    "Every 2 weeks",
    "Monthly",
] as const;

export type PayCadenceChip = (typeof PAY_CADENCE_CHIPS)[number];

export function payCadenceFromChip(chip: PayCadenceChip): PayCadence {
    if (chip === "Weekly") {
        return "weekly";
    }
    if (chip === "Every 2 weeks") {
        return "biweekly";
    }
    if (chip === "Monthly") {
        return "monthly";
    }
    return "once";
}

export function chipFromPayCadence(cadence: PayCadence | undefined): PayCadenceChip {
    if (cadence === "weekly") {
        return "Weekly";
    }
    if (cadence === "biweekly") {
        return "Every 2 weeks";
    }
    if (cadence === "monthly") {
        return "Monthly";
    }
    return "Once";
}

export function isRecurringPayCadence(
    cadence: PayCadence | undefined
): cadence is RecurringPayCadence {
    return cadence === "weekly" || cadence === "biweekly" || cadence === "monthly";
}

export type PayCycle = {
    start: Date;
    end: Date;
    nextPayday: Date;
    cadence: RecurringPayCadence;
    source: string;
    range: DateRange;
};

export function addPayCadence(
    date: Date,
    cadence: RecurringPayCadence,
    steps = 1
): Date {
    const start = startOfDay(date);
    if (cadence === "weekly") {
        return addDays(start, 7 * steps);
    }
    if (cadence === "biweekly") {
        return addDays(start, 14 * steps);
    }
    return shiftMonths(start, steps);
}

/**
 * Last payday on or before `asOf`, then the next one after that.
 * `fromPayDate` is a known paycheck date on this cadence.
 */
export function cycleFromPayDate(
    fromPayDate: Date,
    cadence: RecurringPayCadence,
    asOf: Date,
    cycleOffset = 0
): Omit<PayCycle, "source"> {
    const asOfDay = startOfDay(asOf);
    let pay = startOfDay(fromPayDate);

    if (pay.getTime() <= asOfDay.getTime()) {
        while (addPayCadence(pay, cadence).getTime() <= asOfDay.getTime()) {
            pay = addPayCadence(pay, cadence);
        }
    } else {
        while (addPayCadence(pay, cadence, -1).getTime() > asOfDay.getTime()) {
            pay = addPayCadence(pay, cadence, -1);
        }
        if (pay.getTime() > asOfDay.getTime()) {
            pay = addPayCadence(pay, cadence, -1);
        }
    }

    if (cycleOffset !== 0) {
        pay = addPayCadence(pay, cadence, cycleOffset);
    }

    const nextPayday = addPayCadence(pay, cadence);
    const start = pay;
    const end = endOfDay(addDays(nextPayday, -1));

    return {
        start,
        end,
        nextPayday,
        cadence,
        range: { start, end },
    };
}

/**
 * Nearest paycheck cycle that covers `asOf`.
 * One-off income is ignored. Tie-break: soonest next payday, then name.
 */
export function resolvePayCycle(
    income: Income[],
    asOf: Date = new Date(),
    cycleOffset = 0
): PayCycle | null {
    const asOfDay = startOfDay(asOf);
    let best: PayCycle | null = null;

    for (const entry of income) {
        if (!isRecurringPayCadence(entry.payCadence)) {
            continue;
        }
        const paidOn = parseIsoDate(entry.date);
        if (!paidOn) {
            continue;
        }
        const cycle = cycleFromPayDate(
            paidOn,
            entry.payCadence,
            asOfDay,
            cycleOffset
        );
        const candidate: PayCycle = {
            ...cycle,
            source: entry.source,
        };
        if (!best) {
            best = candidate;
            continue;
        }
        const sooner =
            candidate.nextPayday.getTime() - best.nextPayday.getTime();
        if (sooner < 0) {
            best = candidate;
            continue;
        }
        if (sooner === 0 && candidate.source.localeCompare(best.source) < 0) {
            best = candidate;
        }
    }

    return best;
}
