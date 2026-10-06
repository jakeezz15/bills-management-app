import { PaidFilter } from "@/constants/categories";
import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { SavingsContribution } from "@/types/savings-contribution";
import {
    isSameCalendarMonth,
    parseIsoDate,
    startOfDay,
    toIsoDate,
} from "@/utils/date";
import {
    dueDateInMonth,
    firstDueOnOrAfter,
} from "@/utils/reminder-schedule";
import { billStartDate, debtStartDate } from "@/utils/timestamps";

export function filterByCategory<T extends { category?: string }>(
    items: T[],
    category: string | null
): T[] {
    if (!category) {
        return items;
    }
    return items.filter((item) => item.category === category);
}

export function filterBySearch<T extends { name?: string; source?: string }>(
    items: T[],
    query: string
): T[] {
    const q = query.trim().toLowerCase();
    if (!q) {
        return items;
    }
    return items.filter((item) => {
        const name = item.name?.toLowerCase() ?? "";
        const source = item.source?.toLowerCase() ?? "";
        return name.includes(q) || source.includes(q);
    });
}

export function filterBillsByPaidStatus(
    bills: Bill[],
    paidFilter: PaidFilter,
    payments: BillPayment[],
    asOf: Date
): Bill[] {
    if (paidFilter === "All") {
        return bills;
    }

    return bills.filter((bill) => {
        const paid = isBillPaidAsOf(bill, payments, asOf, {
            anyDayInMonth: true,
        });
        return paidFilter === "Paid" ? paid : !paid;
    });
}

export function filterExpensesByCategory(
    expenses: Expense[],
    category: string | null
): Expense[] {
    return filterByCategory(expenses, category);
}

/**
 * Debt visibility for the as-of date:
 * - hidden before startDate (plan hasn't started)
 * - visible from start through payoff day
 * - hidden after paidOffDate
 */
export function isDebtVisibleAsOf(debt: Debt, asOf: Date): boolean {
    const asOfIso = toIsoDate(asOf);
    const start = debtStartDate(debt);

    if (asOfIso < start) {
        return false;
    }

    if (debt.balance > 0 && !debt.paidOffDate) {
        return true;
    }

    if (debt.paidOffDate) {
        return asOfIso <= debt.paidOffDate;
    }

    return false;
}

export function filterDebtsVisibleAsOf(debts: Debt[], asOf: Date): Debt[] {
    return debts.filter((debt) => isDebtVisibleAsOf(debt, asOf));
}

export function isDebtFullyPaidOff(debt: Debt): boolean {
    return debt.balance <= 0 || Boolean(debt.paidOffDate);
}

export function isDebtNotStartedAsOf(debt: Debt, asOf: Date): boolean {
    return toIsoDate(asOf) < debtStartDate(debt);
}

/** Bill visibility: hidden before optional startDate. */
export function isBillVisibleAsOf(bill: Bill, asOf: Date): boolean {
    const start = billStartDate(bill);
    if (!start) {
        return true;
    }
    return toIsoDate(asOf) >= start;
}

export function isBillNotStartedAsOf(bill: Bill, asOf: Date): boolean {
    const start = billStartDate(bill);
    if (!start) {
        return false;
    }
    return toIsoDate(asOf) < start;
}

export function filterBillsVisibleAsOf(bills: Bill[], asOf: Date): Bill[] {
    return bills.filter((bill) => isBillVisibleAsOf(bill, asOf));
}

/**
 * Days until/after the effective due for this plan as of `asOf`.
 * Returns null when the plan has not started yet.
 * Mid-month starts with an earlier due day use the first due on/after start.
 */
export function getPlanDueOffset(
    dueDay: number,
    asOf: Date,
    startIso?: string | null
): number | null {
    const asOfDay = startOfDay(asOf);
    if (startIso && toIsoDate(asOfDay) < startIso) {
        return null;
    }

    const dueThisMonth = startOfDay(
        dueDateInMonth(dueDay, asOfDay.getFullYear(), asOfDay.getMonth())
    );
    const dueIso = toIsoDate(dueThisMonth);

    if (startIso && dueIso < startIso) {
        const start = parseIsoDate(startIso);
        if (!start) {
            return getBillDueOffset(dueDay, asOfDay, asOfDay);
        }
        const first = startOfDay(firstDueOnOrAfter(dueDay, start));
        return Math.round(
            (first.getTime() - asOfDay.getTime()) / 86400000
        );
    }

    return Math.round(
        (dueThisMonth.getTime() - asOfDay.getTime()) / 86400000
    );
}

/** Payment recorded for this debt in `asOf`'s calendar month, if any. */
export function getDebtPaymentInMonth(
    debtId: string,
    payments: DebtPayment[],
    asOf: Date
): DebtPayment | undefined {
    const asOfDay = startOfDay(asOf);
    return payments.find((payment) => {
        if (payment.debtId !== debtId) {
            return false;
        }
        const paidOn = parseIsoDate(payment.date);
        if (!paidOn) {
            return false;
        }
        return isSameCalendarMonth(paidOn, asOfDay);
    });
}

export function isDebtSkippedInMonth(
    debtId: string,
    payments: DebtPayment[],
    asOf: Date
): boolean {
    return getDebtPaymentInMonth(debtId, payments, asOf)?.skipped === true;
}

export function getDebtTotalPaid(
    debtId: string,
    payments: DebtPayment[]
): number {
    return payments
        .filter(
            (payment) => payment.debtId === debtId && payment.skipped !== true
        )
        .reduce((sum, payment) => sum + payment.amount, 0);
}

/**
 * Whether this month's installment is paid for the date you're viewing.
 */
export function isDebtInstallmentPaidAsOf(
    debt: Debt,
    asOf: Date,
    payments: DebtPayment[] = []
): boolean {
    if (debt.balance <= 0 || debt.paidOffDate) {
        return true;
    }

    const asOfDay = startOfDay(asOf);
    const monthPayments = payments.filter((payment) => {
        if (payment.debtId !== debt.id) {
            return false;
        }
        const paidOn = parseIsoDate(payment.date);
        if (!paidOn) {
            return false;
        }
        // One installment per calendar month. Do not require the payment
        // date to be on or before `asOf`: the Debts screen stamps the
        // period end (e.g. Sep 30) while Due now checks today (Sep 10).
        return isSameCalendarMonth(paidOn, asOfDay);
    });

    if (monthPayments.length > 0) {
        return true;
    }

    if (!debt.lastPaymentDate) {
        return false;
    }

    const paidOn = parseIsoDate(debt.lastPaymentDate);
    if (!paidOn) {
        return false;
    }

    return isSameCalendarMonth(paidOn, asOfDay);
}

export function isBillPaidAsOf(
    bill: Bill,
    payments: BillPayment[],
    asOf: Date,
    options?: { anyDayInMonth?: boolean }
): boolean {
    const asOfDay = startOfDay(asOf);
    const anyDayInMonth = options?.anyDayInMonth === true;
    const hasPayment = payments.some((payment) => {
        if (payment.billId !== bill.id) {
            return false;
        }
        const paidOn = parseIsoDate(payment.date);
        if (!paidOn) {
            return false;
        }
        if (!isSameCalendarMonth(paidOn, asOfDay)) {
            return false;
        }
        if (anyDayInMonth) {
            return true;
        }
        return paidOn.getTime() <= asOfDay.getTime();
    });

    if (hasPayment) {
        return true;
    }

    const billHasHistory = payments.some((p) => p.billId === bill.id);
    return !billHasHistory && bill.isPaid;
}

export function getBillTotalPaid(
    billId: string,
    payments: BillPayment[]
): number {
    return payments
        .filter((payment) => payment.billId === billId)
        .reduce((sum, payment) => sum + payment.amount, 0);
}

/** Most recent ledger row for this bill (by date, then id). */
export function getLastBillPayment(
    billId: string,
    payments: BillPayment[],
    options?: { includeSkipped?: boolean }
): BillPayment | null {
    const includeSkipped = options?.includeSkipped === true;
    let latest: BillPayment | null = null;
    for (const payment of payments) {
        if (payment.billId !== billId) {
            continue;
        }
        if (!includeSkipped && payment.skipped) {
            continue;
        }
        if (
            !latest ||
            payment.date > latest.date ||
            (payment.date === latest.date && payment.id > latest.id)
        ) {
            latest = payment;
        }
    }
    return latest;
}

/** Payment recorded for this bill in `asOf`'s calendar month, if any. */
export function getBillPaymentInMonth(
    billId: string,
    payments: BillPayment[],
    asOf: Date,
    options?: { anyDayInMonth?: boolean }
): BillPayment | undefined {
    const asOfDay = startOfDay(asOf);
    const anyDayInMonth = options?.anyDayInMonth === true;
    return payments.find((payment) => {
        if (payment.billId !== billId) {
            return false;
        }
        const paidOn = parseIsoDate(payment.date);
        if (!paidOn) {
            return false;
        }
        if (!isSameCalendarMonth(paidOn, asOfDay)) {
            return false;
        }
        if (anyDayInMonth) {
            return true;
        }
        return paidOn.getTime() <= asOfDay.getTime();
    });
}

/** True when this month’s ledger row is an intentional skip. */
export function isBillSkippedAsOf(
    billId: string,
    payments: BillPayment[],
    asOf: Date,
    options?: { anyDayInMonth?: boolean }
): boolean {
    const payment = getBillPaymentInMonth(billId, payments, asOf, options);
    return payment?.skipped === true;
}

/** Latest contribution for a goal in `asOf`'s calendar month. */
export function getLatestSavingsContributionInMonth(
    savingsId: string,
    contributions: SavingsContribution[],
    asOf: Date,
    options?: { anyDayInMonth?: boolean }
): SavingsContribution | undefined {
    const asOfDay = startOfDay(asOf);
    const anyDayInMonth = options?.anyDayInMonth === true;
    return contributions
        .filter((item) => {
            if (item.savingsId !== savingsId) {
                return false;
            }
            const loggedOn = parseIsoDate(item.date);
            if (!loggedOn) {
                return false;
            }
            if (!isSameCalendarMonth(loggedOn, asOfDay)) {
                return false;
            }
            if (anyDayInMonth) {
                return true;
            }
            return loggedOn.getTime() <= asOfDay.getTime();
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
}

/**
 * Calendar days from `from` to this due day in `inMonth`'s month.
 * Negative means that due date is already past `from`.
 */
export function getBillDueOffset(
    dueDay: number,
    inMonth: Date,
    from: Date = new Date()
): number {
    const daysInMonth = new Date(
        inMonth.getFullYear(),
        inMonth.getMonth() + 1,
        0
    ).getDate();
    const day = Math.min(Math.max(dueDay, 1), daysInMonth);
    const due = startOfDay(
        new Date(inMonth.getFullYear(), inMonth.getMonth(), day)
    );
    const start = startOfDay(from);
    return Math.round((due.getTime() - start.getTime()) / 86400000);
}

/**
 * Date used for Overdue / Due soon cues.
 * Current month → real today (not month-end). Past months → period end.
 * Future months → today. getBillDueOffset then builds the due date in
 * the viewed month, so a due day that already passed this month is not
 * treated as overdue in a later month.
 */
export function billDueStatusReference(
    periodAsOf: Date,
    today = new Date()
): Date {
    const now = startOfDay(today);
    const asOf = startOfDay(periodAsOf);

    if (
        asOf.getFullYear() === now.getFullYear() &&
        asOf.getMonth() === now.getMonth()
    ) {
        return now;
    }

    if (asOf.getTime() < now.getTime()) {
        return asOf;
    }

    return now;
}

export type BillDueStatus =
    | "paid"
    | "skipped"
    | "overdue"
    | "due-soon"
    | "upcoming";

/**
 * This-month due state vs today. Catalogs use this for the row accent:
 * paid / skipped / overdue / soon / upcoming — not a second paid flag.
 */
export function dueCatalogStatus(
    dueDay: number,
    paid: boolean,
    asOf: Date = new Date(),
    soonWithinDays = 3,
    skipped = false
): BillDueStatus {
    if (paid && skipped) {
        return "skipped";
    }
    if (paid) {
        return "paid";
    }

    const offset = getBillDueOffset(dueDay, asOf, asOf);
    if (offset < 0) {
        return "overdue";
    }
    if (offset <= soonWithinDays) {
        return "due-soon";
    }
    return "upcoming";
}

/** Short cue for catalog meta. Upcoming stays unlabeled so the due day can lead. */
export function dueCatalogLabel(status: BillDueStatus): string | null {
    if (status === "paid") {
        return "Paid";
    }
    if (status === "skipped") {
        return "Skipped";
    }
    if (status === "overdue") {
        return "Overdue";
    }
    if (status === "due-soon") {
        return "Soon";
    }
    return null;
}

export function getBillDueStatus(
    bill: Bill,
    payments: BillPayment[] = [],
    soonWithinDays = 3,
    inMonth: Date = new Date(),
    from: Date = new Date()
): BillDueStatus {
    if (isBillPaidAsOf(bill, payments, inMonth)) {
        return "paid";
    }

    const offset = getBillDueOffset(bill.dueDay, inMonth, from);
    if (offset < 0) {
        return "overdue";
    }
    if (offset <= soonWithinDays) {
        return "due-soon";
    }
    return "upcoming";
}

export function formatBillSubtitle(
    bill: Bill,
    payments: BillPayment[] = []
): string {
    const status = getBillDueStatus(bill, payments);
    const categoryPart = bill.category ? `${bill.category} · ` : "";

    switch (status) {
        case "paid":
            return `${categoryPart}Due day ${bill.dueDay} · Paid`;
        case "overdue":
            return `${categoryPart}Due day ${bill.dueDay} · Overdue`;
        case "due-soon":
            return `${categoryPart}Due day ${bill.dueDay} · Due soon`;
        default:
            return `${categoryPart}Due day ${bill.dueDay} · Unpaid`;
    }
}
