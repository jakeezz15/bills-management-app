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
    return debts.reduce((sum, item) => sum + item.minimumPayment, 0);
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
 * Totals for a selected period.
 * - Expenses / income: ISO `date` must fall in range.
 * - Bills: only **paid** bills whose `dueDay` falls in the range (unpaid = reminder only).
 * - Debts: `dueDay` must fall on a day inside the range.
 * - Savings: monthly contribution × months overlapping the range
 *   (until contribution dates exist).
 */
export function getTotalsForRange(
    range: DateRange,
    expenses: Expense[],
    bills: Bill[],
    debts: Debt[],
    savings: SavingsGoal[],
    income: Income[]
): PeriodTotals {
    const incomeInRange = income.filter((item) =>
        isIsoInRange(item.date, range)
    );
    const expensesInRange = expenses.filter((item) =>
        isIsoInRange(item.date, range)
    );
    const billsInRange = bills.filter(
        (item) =>
            item.isPaid && dueDayFallsInRange(item.dueDay, range)
    );
    const debtsInRange = debts.filter((item) =>
        dueDayFallsInRange(item.dueDay, range)
    );

    const monthCount = countMonthsOverlapping(range);
    const savingsTotal = savings.reduce(
        (sum, item) => sum + (item.monthlyContribution ?? 0) * monthCount,
        0
    );

    const incomeTotal = getTotalIncome(incomeInRange);
    const expensesTotal = getTotalExpenses(expensesInRange);
    const billsTotal = getTotalBills(billsInRange);
    const debtTotal = getTotalDebtPayments(debtsInRange);

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
