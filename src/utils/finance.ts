import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import {
    DateRange,
    countMonthsOverlapping,
    dueDayFallsInRange,
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

export function getTotalBills(bills: Bill[]) {
    return bills
        .filter((item) => item.isPaid)
        .reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalDebtPayments(debts: Debt[]) {
    return debts.reduce((sum, item) => sum + (item.totalPaid ?? 0), 0);
}

export function getTotalSavings(savings: SavingsGoal[]) {
    return savings.reduce((sum, item) => sum + (item.monthlyContribution ?? 0), 0);
}

export function getLeftOver(
    expenses: Expense[],
    bills: Bill[],
    debts: Debt[],
    savings: SavingsGoal[],
    income: Income[]
) {
    return (
        getTotalIncome(income) -
        getTotalExpenses(expenses) -
        getTotalBills(bills) -
        getTotalDebtPayments(debts) -
        getTotalSavings(savings)
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
 *
 * Example: paid on the 15th → still counts when you view the 16th.
 *
 * - Income / expenses: ISO `date` on or before `range.end`
 * - Bills: **paid** only, and due day occurred on or before `range.end`
 * - Debts: sum of `totalPaid` (installment payments recorded so far)
 * - Savings: monthly contribution × months from Jan 1 of that year through `range.end`
 *   (until contribution dates exist)
 */
export function getTotalsForRange(
    range: DateRange,
    expenses: Expense[],
    bills: Bill[],
    debts: Debt[],
    savings: SavingsGoal[],
    income: Income[]
): PeriodTotals {
    const through = rangeThrough(range.end);

    const incomeToDate = income.filter((item) =>
        isIsoInRange(item.date, through)
    );
    const expensesToDate = expenses.filter((item) =>
        isIsoInRange(item.date, through)
    );
    const billsToDate = bills.filter(
        (item) =>
            item.isPaid && dueDayFallsInRange(item.dueDay, through)
    );

    const savingsYearRange: DateRange = {
        start: startOfYear(range.end),
        end: through.end,
    };
    const monthCount = countMonthsOverlapping(savingsYearRange);
    const savingsTotal = savings.reduce(
        (sum, item) => sum + (item.monthlyContribution ?? 0) * monthCount,
        0
    );

    const incomeTotal = getTotalIncome(incomeToDate);
    const expensesTotal = getTotalExpenses(expensesToDate);
    const billsTotal = getTotalBills(billsToDate);
    const debtTotal = getTotalDebtPayments(debts);

    return {
        income: incomeTotal,
        expenses: expensesTotal,
        bills: billsTotal,
        debtPayments: debtTotal,
        savings: savingsTotal,
        leftover:
            incomeTotal - expensesTotal - billsTotal - debtTotal - savingsTotal,
    };
}
