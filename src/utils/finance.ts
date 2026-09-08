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
    dueDayFallsInRange,
    isIsoInRange,
    rangeThrough,
    startOfYear,
} from "@/utils/date";
import { isBillPaidAsOf } from "@/utils/filters";

export function getTotalIncome(income: Income[]) {
    return income.reduce((sum, item) => sum + item.net, 0);
}

export function getTotalExpenses(expenses: Expense[]) {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalBills(
    bills: Bill[],
    payments: BillPayment[] = [],
    asOf = new Date()
) {
    return bills
        .filter((item) => isBillPaidAsOf(item, payments, asOf))
        .reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalDebtPayments(payments: DebtPayment[]) {
    return payments.reduce((sum, item) => sum + item.amount, 0);
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

    // Fallback until contributions are logged
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
    const through = rangeThrough(range.end);

    const incomeToDate = income.filter((item) =>
        isIsoInRange(item.date, through)
    );
    const expensesToDate = expenses.filter((item) =>
        isIsoInRange(item.date, through)
    );

    const billsToDate = bills.filter(
        (item) =>
            isBillPaidAsOf(item, billPayments, through.end) &&
            dueDayFallsInRange(item.dueDay, through)
    );

    const debtPaymentsToDate = debtPayments.filter((item) =>
        isIsoInRange(item.date, through)
    );

    const incomeTotal = getTotalIncome(incomeToDate);
    const expensesTotal = getTotalExpenses(expensesToDate);
    const billsTotal = billsToDate.reduce((sum, item) => sum + item.amount, 0);
    const debtTotal = getTotalDebtPayments(debtPaymentsToDate);
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
