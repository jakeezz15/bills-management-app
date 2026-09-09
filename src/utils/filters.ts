import { PaidFilter } from "@/constants/categories";
import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { SavingsContribution } from "@/types/savings-contribution";
import { parseIsoDate, startOfDay, toIsoDate } from "@/utils/date";
import { debtStartDate } from "@/utils/timestamps";

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
        const paid = isBillPaidAsOf(bill, payments, asOf);
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

export function getDebtTotalPaid(
    debtId: string,
    payments: DebtPayment[]
): number {
    return payments
        .filter((payment) => payment.debtId === debtId)
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
        return (
            paidOn.getFullYear() === asOfDay.getFullYear() &&
            paidOn.getMonth() === asOfDay.getMonth() &&
            paidOn.getTime() <= asOfDay.getTime()
        );
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

    return (
        paidOn.getFullYear() === asOfDay.getFullYear() &&
        paidOn.getMonth() === asOfDay.getMonth() &&
        paidOn.getTime() <= asOfDay.getTime()
    );
}

export function isBillPaidAsOf(
    bill: Bill,
    payments: BillPayment[],
    asOf: Date
): boolean {
    const asOfDay = startOfDay(asOf);
    const hasPayment = payments.some((payment) => {
        if (payment.billId !== bill.id) {
            return false;
        }
        const paidOn = parseIsoDate(payment.date);
        if (!paidOn) {
            return false;
        }
        return (
            paidOn.getFullYear() === asOfDay.getFullYear() &&
            paidOn.getMonth() === asOfDay.getMonth() &&
            paidOn.getTime() <= asOfDay.getTime()
        );
    });

    if (hasPayment) {
        return true;
    }

    const billHasHistory = payments.some((p) => p.billId === bill.id);
    return !billHasHistory && bill.isPaid;
}

/** Payment recorded for this bill in `asOf`'s calendar month, if any. */
export function getBillPaymentInMonth(
    billId: string,
    payments: BillPayment[],
    asOf: Date
): BillPayment | undefined {
    const asOfDay = startOfDay(asOf);
    return payments.find((payment) => {
        if (payment.billId !== billId) {
            return false;
        }
        const paidOn = parseIsoDate(payment.date);
        if (!paidOn) {
            return false;
        }
        return (
            paidOn.getFullYear() === asOfDay.getFullYear() &&
            paidOn.getMonth() === asOfDay.getMonth() &&
            paidOn.getTime() <= asOfDay.getTime()
        );
    });
}

/** Latest contribution for a goal in `asOf`'s calendar month. */
export function getLatestSavingsContributionInMonth(
    savingsId: string,
    contributions: SavingsContribution[],
    asOf: Date
): SavingsContribution | undefined {
    const asOfDay = startOfDay(asOf);
    return contributions
        .filter((item) => {
            if (item.savingsId !== savingsId) {
                return false;
            }
            const loggedOn = parseIsoDate(item.date);
            if (!loggedOn) {
                return false;
            }
            return (
                loggedOn.getFullYear() === asOfDay.getFullYear() &&
                loggedOn.getMonth() === asOfDay.getMonth() &&
                loggedOn.getTime() <= asOfDay.getTime()
            );
        })
        .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id))[0];
}

/** Days until due this month; negative means overdue this month. */
export function getBillDueOffset(dueDay: number, today = new Date()): number {
    const daysInMonth = new Date(
        today.getFullYear(),
        today.getMonth() + 1,
        0
    ).getDate();
    const day = Math.min(Math.max(dueDay, 1), daysInMonth);
    return day - today.getDate();
}

/**
 * Date used for Overdue / Due soon cues.
 * Current month → real today (not month-end). Past months → period end.
 * Future months → today so nothing is overdue early.
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

export type BillDueStatus = "paid" | "overdue" | "due-soon" | "upcoming";

export function getBillDueStatus(
    bill: Bill,
    payments: BillPayment[] = [],
    soonWithinDays = 3,
    today = new Date()
): BillDueStatus {
    if (isBillPaidAsOf(bill, payments, today)) {
        return "paid";
    }

    const offset = getBillDueOffset(bill.dueDay, today);
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
