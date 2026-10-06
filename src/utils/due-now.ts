import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { startOfDay } from "@/utils/date";
import {
    getPlanDueOffset,
    isBillPaidAsOf,
    isBillVisibleAsOf,
    isDebtInstallmentPaidAsOf,
    isDebtVisibleAsOf,
} from "@/utils/filters";
import { billStartDate, debtStartDate } from "@/utils/timestamps";

export type DueNowKind = "bill" | "debt";
export type DueNowUrgency = "overdue" | "due-today" | "due-soon";

export type DueNowItem = {
    kind: DueNowKind;
    id: string;
    name: string;
    amount: number;
    remaining?: number;
    amountVaries?: boolean;
    urgency: DueNowUrgency;
    dueDay: number;
};

const SOON_DAYS = 3;

const URGENCY_RANK: Record<DueNowUrgency, number> = {
    overdue: 0,
    "due-today": 1,
    "due-soon": 2,
};

function urgencyFromOffset(
    offset: number,
    soonWithinDays = SOON_DAYS
): DueNowUrgency | null {
    if (offset < 0) {
        return "overdue";
    }
    if (offset === 0) {
        return "due-today";
    }
    if (offset <= soonWithinDays) {
        return "due-soon";
    }
    return null;
}

/**
 * Unpaid bills and installments that need action as of `today`
 * (overdue, due today, or due within 3 days). Independent of the
 * Home period picker — leftover can be a week/year; due now is always now.
 */
export function getDueNowItems(
    bills: Bill[],
    billPayments: BillPayment[],
    debts: Debt[],
    debtPayments: DebtPayment[],
    today = new Date(),
    soonWithinDays = SOON_DAYS
): DueNowItem[] {
    const asOf = startOfDay(today);
    const items: DueNowItem[] = [];

    for (const bill of bills) {
        if (!isBillVisibleAsOf(bill, asOf)) {
            continue;
        }
        if (isBillPaidAsOf(bill, billPayments, asOf, { anyDayInMonth: true })) {
            continue;
        }
        const offset = getPlanDueOffset(
            bill.dueDay,
            asOf,
            billStartDate(bill)
        );
        if (offset === null) {
            continue;
        }
        const urgency = urgencyFromOffset(offset, soonWithinDays);
        if (!urgency) {
            continue;
        }
        items.push({
            kind: "bill",
            id: bill.id,
            name: bill.name,
            amount: bill.amountVaries ? 0 : bill.amount,
            amountVaries: Boolean(bill.amountVaries),
            urgency,
            dueDay: bill.dueDay,
        });
    }

    for (const debt of debts) {
        if (!isDebtVisibleAsOf(debt, asOf)) {
            continue;
        }
        if (debt.balance <= 0 || debt.paidOffDate) {
            continue;
        }
        if (isDebtInstallmentPaidAsOf(debt, asOf, debtPayments)) {
            continue;
        }
        const offset = getPlanDueOffset(
            debt.dueDay,
            asOf,
            debtStartDate(debt)
        );
        if (offset === null) {
            continue;
        }
        const urgency = urgencyFromOffset(offset, soonWithinDays);
        if (!urgency) {
            continue;
        }
        items.push({
            kind: "debt",
            id: debt.id,
            name: debt.name,
            amount: debt.minimumPayment,
            remaining: Math.max(debt.balance, 0),
            urgency,
            dueDay: debt.dueDay,
        });
    }

    return items.sort((a, b) => {
        const rank = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
        if (rank !== 0) {
            return rank;
        }
        if (a.dueDay !== b.dueDay) {
            return a.dueDay - b.dueDay;
        }
        return a.name.localeCompare(b.name);
    });
}

export function dueNowLabel(item: DueNowItem): string {
    if (item.amountVaries) {
        return "Enter amount";
    }
    if (item.urgency === "overdue") {
        return "Overdue";
    }
    if (item.urgency === "due-today") {
        return "Due today";
    }
    return "Soon";
}

export function dueNowTone(
    item: DueNowItem
): "overdue" | "due-soon" | "default" {
    if (item.urgency === "overdue") {
        return "overdue";
    }
    return "due-soon";
}
