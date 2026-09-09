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
    countMonthsOverlapping,
    getRangeForPeriod,
    isIsoInRange,
    rangeThrough,
    startOfYear,
} from "@/utils/date";

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

export function getTotalSavings(
    savings: SavingsGoal[],
    contributions: SavingsContribution[],
    range: DateRange
) {
    const through = rangeThrough(range.end);
    const dated = contributions.filter((item) =>
        isIsoInRange(item.date, through)
    );

    if (dated.length > 0) {
        return dated.reduce((sum, item) => sum + item.amount, 0);
    }

    // Fallback until contributions are logged: planned monthly × months YTD
    const savingsYearRange: DateRange = {
        start: startOfYear(range.end),
        end: through.end,
    };
    const monthCount = countMonthsOverlapping(savingsYearRange);
    return savings.reduce(
        (sum, item) => sum + (item.monthlyContribution ?? 0) * monthCount,
        0
    );
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
