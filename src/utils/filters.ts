import { Bill } from "@/types/bill";
import { Expense } from "@/types/expense";
import { PaidFilter } from "@/constants/categories";

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
