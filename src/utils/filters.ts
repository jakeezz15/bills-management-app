import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { Expense } from "@/types/expense";
import { PaidFilter } from "@/constants/categories";
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

export function filterBillsByPaidStatus(
    bills: Bill[],
    paidFilter: PaidFilter
): Bill[] {
    if (paidFilter === "Paid") {
        return bills.filter((bill) => bill.isPaid);
    }
    if (paidFilter === "Unpaid") {
        return bills.filter((bill) => !bill.isPaid);
    }
    return bills;
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

/**
 * Whether this month's installment is paid for the date you're viewing.
 * Remaining balance can still be > 0 — "paid" means the payment was recorded,
 * not that the whole loan is finished.
 */
export function isDebtInstallmentPaidAsOf(debt: Debt, asOf: Date): boolean {
    if (debt.balance <= 0 || debt.paidOffDate) {
        return true;
    }

    if (!debt.lastPaymentDate) {
        return false;
    }

    const paidOn = parseIsoDate(debt.lastPaymentDate);
    if (!paidOn) {
        return false;
    }

    const asOfDay = startOfDay(asOf);

    return (
        paidOn.getFullYear() === asOfDay.getFullYear() &&
        paidOn.getMonth() === asOfDay.getMonth() &&
        paidOn.getTime() <= asOfDay.getTime()
    );
}

/** Days until due this month; negative means overdue this month. */
export function getBillDueOffset(dueDay: number, today = new Date()): number {
    const day = Math.min(Math.max(dueDay, 1), 31);
    return day - today.getDate();
}

export type BillDueStatus = "paid" | "overdue" | "due-soon" | "upcoming";

export function getBillDueStatus(
    bill: Bill,
    soonWithinDays = 3,
    today = new Date()
): BillDueStatus {
    if (bill.isPaid) {
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

export function formatBillSubtitle(bill: Bill): string {
    const status = getBillDueStatus(bill);
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
