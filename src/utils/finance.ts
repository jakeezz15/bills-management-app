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
    endOfMonth,
    firstDueDateInRange,
    getRangeForPeriod,
    isIsoInRange,
    parseIsoDate,
    rangeThrough,
    startOfMonth,
    toIsoDate,
} from "@/utils/date";
import {
    filterBillsVisibleAsOf,
    filterDebtsVisibleAsOf,
    isBillPaidAsOf,
    isDebtInstallmentPaidAsOf,
} from "@/utils/filters";
import { billStartDate, debtStartDate } from "@/utils/timestamps";

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
        .filter(
            (item) =>
                item.skipped !== true && isIsoInRange(item.date, range)
        )
        .reduce((sum, item) => sum + item.amount, 0);
}

export function getTotalDebtPayments(
    payments: DebtPayment[],
    range?: DateRange
) {
    const list = range
        ? payments.filter((item) => isIsoInRange(item.date, range))
        : payments;
    return list
        .filter((item) => item.skipped !== true)
        .reduce((sum, item) => sum + item.amount, 0);
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

/**
 * Period-only cash activity: only rows whose dates fall **inside** `range`
 * (Home “This period” bars). Not a running balance — see `getTotalsForRange`.
 * `leftover` here means net for the period only.
 */
export function getActivityForRange(
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
    void bills;
    void debts;
    void savings;

    const incomeIn = income.filter((item) => isIsoInRange(item.date, range));
    const expensesIn = expenses.filter((item) =>
        isIsoInRange(item.date, range)
    );

    const incomeTotal = getTotalIncome(incomeIn);
    const expensesTotal = getTotalExpenses(expensesIn);
    const billsTotal = getTotalBillPayments(billPayments, range);
    const debtTotal = getTotalDebtPayments(debtPayments, range);
    const savingsTotal = savingsContributions
        .filter((item) => isIsoInRange(item.date, range))
        .reduce((sum, item) => sum + item.amount, 0);

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

export function getCommittedInRange(
    range: DateRange,
    bills: Bill[],
    billPayments: BillPayment[],
    debts: Debt[],
    debtPayments: DebtPayment[],
    visibleAsOf: Date = range.end
): CommittedTotals {
    let billsTotal = 0;
    let count = 0;
    let unknownCount = 0;

    for (const bill of filterBillsVisibleAsOf(bills, visibleAsOf)) {
        const dueOn = firstDueDateInRange(bill.dueDay, range);
        if (!dueOn) {
            continue;
        }
        const start = billStartDate(bill);
        if (start && toIsoDate(dueOn) < start) {
            continue;
        }
        if (isBillPaidAsOf(bill, billPayments, dueOn, { anyDayInMonth: true })) {
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

    for (const debt of filterDebtsVisibleAsOf(debts, visibleAsOf)) {
        const dueOn = firstDueDateInRange(debt.dueDay, range);
        if (!dueOn) {
            continue;
        }
        const start = debtStartDate(debt);
        if (toIsoDate(dueOn) < start) {
            continue;
        }
        if (isDebtInstallmentPaidAsOf(debt, dueOn, debtPayments)) {
            continue;
        }
        count += 1;
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
    return getCommittedInRange(
        { start: startOfMonth(asOf), end: endOfMonth(asOf) },
        bills,
        billPayments,
        debts,
        debtPayments,
        asOf
    );
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

const MONTH_LABELS = [
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
] as const;

function monthKey(d: Date): number {
    return d.getFullYear() * 12 + d.getMonth();
}

function earliestActivityMonth(
    expenses: Expense[],
    income: Income[],
    debtPayments: DebtPayment[],
    billPayments: BillPayment[],
    savingsContributions: SavingsContribution[]
): Date | null {
    const dates: string[] = [
        ...income.map((item) => item.date),
        ...expenses.map((item) => item.date),
        ...billPayments.map((item) => item.date),
        ...debtPayments.map((item) => item.date),
        ...savingsContributions.map((item) => item.date),
    ];
    if (dates.length === 0) return null;
    const minIso = dates.reduce((earliest, date) =>
        date < earliest ? date : earliest
    );
    const parsed = parseIsoDate(minIso);
    if (!parsed) return null;
    return new Date(parsed.getFullYear(), parsed.getMonth(), 1);
}

/**
 * Months from first logged activity through `endAnchor`, oldest → newest
 * (e.g. start in Oct → Oct, Nov, …). Caps at `count` months ending at
 * `endAnchor` when history is longer. Each point is running leftover as of
 * that month’s end. Empty when there is no activity yet.
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
    const firstActivity = earliestActivityMonth(
        expenses,
        income,
        debtPayments,
        billPayments,
        savingsContributions
    );
    if (firstActivity === null) {
        return [];
    }

    const endMonth = new Date(
        endAnchor.getFullYear(),
        endAnchor.getMonth(),
        1
    );
    const windowStart = new Date(
        endMonth.getFullYear(),
        endMonth.getMonth() - (count - 1),
        1
    );
    const startMonth =
        monthKey(firstActivity) > monthKey(windowStart)
            ? firstActivity
            : windowStart;

    if (monthKey(startMonth) > monthKey(endMonth)) {
        return [];
    }

    const points: MonthTrendPoint[] = [];
    for (
        let key = monthKey(startMonth);
        key <= monthKey(endMonth);
        key += 1
    ) {
        const year = Math.floor(key / 12);
        const month = key % 12;
        const monthDate = new Date(year, month, 1);
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
            key: `${year}-${month}`,
            label: MONTH_LABELS[month],
            leftover: totals.leftover,
            income: totals.income,
            outflow,
        });
    }

    return points;
}
