import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import {
    DateRange,
    getRangeForPeriod,
    isIsoInRange,
    rangeThrough,
} from "@/utils/date";
import {
    filterDebtsVisibleAsOf,
    isBillPaidAsOf,
    isDebtInstallmentPaidAsOf,
} from "@/utils/filters";

export function getTotalIncome(income: Income[]) {
    return income.reduce((sum, item) => sum + item.net, 0);
}

export function getTotalExpenses(expenses: Expense[]) {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
}

/** Sum bill payment ledger rows whose dates fall in `range`. */
export function getTotalBillPayments(
    payments: BillPayment[],
    range: DateRange
) {
    return payments
        .filter((item) => isIsoInRange(item.date, range))
        .reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalDebtPayments(
    payments: DebtPayment[],
    range?: DateRange
) {
    const list = range
        ? payments.filter((item) => isIsoInRange(item.date, range))
        : payments;
    return list.reduce((sum, item) => sum + item.amount, 0);
}

/** Sum logged savings contributions through the period end (cash model). */
export function getTotalSavings(
    _savings: SavingsGoal[],
    contributions: SavingsContribution[],
    range: DateRange
) {
    const through = rangeThrough(range.end);
    return contributions
        .filter((item) => isIsoInRange(item.date, through))
        .reduce((sum, item) => sum + item.amount, 0);
}

export type PeriodTotals = {
    income: number;
    expenses: number;
    bills: number;
    debtPayments: number;
    savings: number;
    leftover: number;
};

/**
 * Running balance **as of the end** of the selected period (not period-only P&L).
 * Income / expenses / bill payments / debt payments / savings contributions
 * whose dates are on or before `range.end` are included.
 */
export function getTotalsForRange(
    range: DateRange,
    expenses: Expense[],
    bills: Bill[],
    debts: Debt[],
    savings: SavingsGoal[],
    income: Income[],
    debtPayments: DebtPayment[] = [],
    billPayments: BillPayment[] = [],
    savingsContributions: SavingsContribution[] = []
): PeriodTotals {
    // bills/debts kept in the signature for callers; cash-out uses payment ledgers.
    void bills;
    void debts;

    const through = rangeThrough(range.end);

    const incomeToDate = income.filter((item) =>
        isIsoInRange(item.date, through)
    );
    const expensesToDate = expenses.filter((item) =>
        isIsoInRange(item.date, through)
    );

    const incomeTotal = getTotalIncome(incomeToDate);
    const expensesTotal = getTotalExpenses(expensesToDate);
    const billsTotal = getTotalBillPayments(billPayments, through);
    const debtTotal = getTotalDebtPayments(debtPayments, through);
    const savingsTotal = getTotalSavings(
        savings,
        savingsContributions,
        range
    );

    return {
        income: incomeTotal,
        expenses: expensesTotal,
        bills: billsTotal,
        debtPayments: debtTotal,
        savings: savingsTotal,
        leftover:
            incomeTotal -
            expensesTotal -
            billsTotal -
            debtTotal -
            savingsTotal,
    };
}

export type CommittedTotals = {
    bills: number;
    debts: number;
    total: number;
    /** Unpaid obligations included in `total`. */
    count: number;
    /**
     * Unpaid variable bills. Their amount is unknown until logged, so they are
     * excluded from `total` rather than guessed at — callers should disclose
     * this so the remaining figure isn't read as complete.
     */
    unknownCount: number;
};

/**
 * Money still owed for the calendar month containing `asOf`.
 *
 * Scoped to a month rather than to the selected period because "paid" is itself
 * tracked per calendar month: a bill is settled for January or it isn't. That
 * keeps the figure meaningful whichever period the user is viewing.
 */
export function getCommittedForMonth(
    asOf: Date,
    bills: Bill[],
    billPayments: BillPayment[],
    debts: Debt[],
    debtPayments: DebtPayment[]
): CommittedTotals {
    let billsTotal = 0;
    let count = 0;
    let unknownCount = 0;

    for (const bill of bills) {
        if (isBillPaidAsOf(bill, billPayments, asOf)) {
            continue;
        }
        if (bill.amountVaries) {
            unknownCount += 1;
            continue;
        }
        count += 1;
        billsTotal += Math.max(bill.amount, 0);
    }

    let debtsTotal = 0;

    for (const debt of filterDebtsVisibleAsOf(debts, asOf)) {
        if (isDebtInstallmentPaidAsOf(debt, asOf, debtPayments)) {
            continue;
        }
        count += 1;
        // Never claim more is owed than the balance itself.
        debtsTotal += Math.max(Math.min(debt.minimumPayment, debt.balance), 0);
    }

    return {
        bills: billsTotal,
        debts: debtsTotal,
        total: billsTotal + debtsTotal,
        count,
        unknownCount,
    };
}

export type CategorySpend = {
    category: string;
    amount: number;
};

/** Everyday spending in the selected range, grouped by category. */
export function getExpenseSpendByCategory(
    expenses: Expense[],
    range: DateRange
): CategorySpend[] {
    const totals = new Map<string, number>();

    for (const expense of expenses) {
        if (!isIsoInRange(expense.date, range)) {
            continue;
        }
        const category = expense.category?.trim() || "Uncategorized";
        totals.set(category, (totals.get(category) ?? 0) + expense.amount);
    }

    return [...totals.entries()]
        .map(([category, amount]) => ({ category, amount }))
        .sort((a, b) => b.amount - a.amount);
}

export type MonthTrendPoint = {
    key: string;
    label: string;
    leftover: number;
    income: number;
    outflow: number;
};

/**
 * Last `count` calendar months ending at the month of `endAnchor`.
 * Each point is the running leftover as of that month’s end.
 */
export function getMonthlyTrend(
    endAnchor: Date,
    count: number,
    expenses: Expense[],
    bills: Bill[],
    debts: Debt[],
    savings: SavingsGoal[],
    income: Income[],
    debtPayments: DebtPayment[] = [],
    billPayments: BillPayment[] = [],
    savingsContributions: SavingsContribution[] = []
): MonthTrendPoint[] {
    const points: MonthTrendPoint[] = [];
    const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
    ];

    for (let i = count - 1; i >= 0; i -= 1) {
        const monthDate = new Date(
            endAnchor.getFullYear(),
            endAnchor.getMonth() - i,
            1
        );
        const range = getRangeForPeriod(monthDate, "month");
        const totals = getTotalsForRange(
            range,
            expenses,
            bills,
            debts,
            savings,
            income,
            debtPayments,
            billPayments,
            savingsContributions
        );
        const outflow =
            totals.expenses +
            totals.bills +
            totals.debtPayments +
            totals.savings;

        points.push({
            key: `${monthDate.getFullYear()}-${monthDate.getMonth()}`,
            label: months[monthDate.getMonth()],
            leftover: totals.leftover,
            income: totals.income,
            outflow,
        });
    }

    return points;
}
