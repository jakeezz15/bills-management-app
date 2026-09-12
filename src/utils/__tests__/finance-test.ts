import { getRangeForPeriod } from "@/utils/date";
import {
    getActivityForRange,
    getCommittedForMonth,
    getCommittedInRange,
    getExpenseSpendByCategory,
    getMonthlyTrend,
    getTotalsForRange,
} from "@/utils/finance";
import {
    makeBill,
    makeBillPayment,
    makeDebt,
    makeDebtPayment,
    makeExpense,
    makeIncome,
    makeSavingsContribution,
    makeSavingsGoal,
} from "./factories";

const february = getRangeForPeriod(new Date(2026, 1, 15), "month");

function totalsFor({
    expenses = [],
    income = [],
    debtPayments = [],
    billPayments = [],
    savingsContributions = [],
    range = february,
}: Partial<{
    expenses: ReturnType<typeof makeExpense>[];
    income: ReturnType<typeof makeIncome>[];
    debtPayments: ReturnType<typeof makeDebtPayment>[];
    billPayments: ReturnType<typeof makeBillPayment>[];
    savingsContributions: ReturnType<typeof makeSavingsContribution>[];
    range: typeof february;
}> = {}) {
    return getTotalsForRange(
        range,
        expenses,
        [],
        [],
        [makeSavingsGoal()],
        income,
        debtPayments,
        billPayments,
        savingsContributions
    );
}

describe("getTotalsForRange", () => {
    it("is a running balance, so it includes money from before the period", () => {
        const totals = totalsFor({
            income: [
                makeIncome({ date: "2026-01-01", net: 4000 }),
                makeIncome({ date: "2026-02-01", net: 4000 }),
            ],
            expenses: [makeExpense({ date: "2026-02-14", amount: 500 })],
        });

        // Viewing February shows what is left overall, not February's own P&L.
        expect(totals.income).toBe(8000);
        expect(totals.leftover).toBe(7500);
    });

    it("excludes anything dated after the period ends", () => {
        const totals = totalsFor({
            income: [
                makeIncome({ date: "2026-02-01", net: 4000 }),
                makeIncome({ date: "2026-03-01", net: 9999 }),
            ],
        });

        expect(totals.income).toBe(4000);
    });

    it("subtracts every outflow from income", () => {
        const totals = totalsFor({
            income: [makeIncome({ date: "2026-02-01", net: 10000 })],
            expenses: [makeExpense({ date: "2026-02-02", amount: 1000 })],
            billPayments: [makeBillPayment({ date: "2026-02-05", amount: 2000 })],
            debtPayments: [makeDebtPayment({ date: "2026-02-10", amount: 500 })],
            savingsContributions: [
                makeSavingsContribution({ date: "2026-02-15", amount: 300 }),
            ],
        });

        expect(totals.expenses).toBe(1000);
        expect(totals.bills).toBe(2000);
        expect(totals.debtPayments).toBe(500);
        expect(totals.savings).toBe(300);
        expect(totals.leftover).toBe(6200);
    });

    it("goes negative when outflows overtake income", () => {
        const totals = totalsFor({
            income: [makeIncome({ date: "2026-02-01", net: 1000 })],
            expenses: [makeExpense({ date: "2026-02-02", amount: 1500 })],
        });

        expect(totals.leftover).toBe(-500);
    });

    it("counts cash out from the payment ledgers, not from the bill list", () => {
        // An unpaid bill must not move the running balance; only a logged
        // payment does. This is what `committed` exists to layer on top of.
        const totals = getTotalsForRange(
            february,
            [],
            [makeBill({ amount: 5000 })],
            [makeDebt({ minimumPayment: 2000 })],
            [],
            [makeIncome({ date: "2026-02-01", net: 4000 })]
        );

        expect(totals.bills).toBe(0);
        expect(totals.leftover).toBe(4000);
    });
});

describe("getActivityForRange", () => {
    it("only counts cash that lands inside the period", () => {
        const activity = getActivityForRange(
            february,
            [makeExpense({ date: "2026-02-14", amount: 500 })],
            [],
            [],
            [makeSavingsGoal()],
            [
                makeIncome({ date: "2026-01-01", net: 4000 }),
                makeIncome({ date: "2026-02-01", net: 4000 }),
            ],
            [],
            [],
            []
        );

        expect(activity.income).toBe(4000);
        expect(activity.expenses).toBe(500);
        expect(activity.leftover).toBe(3500);
    });

    it("ignores earlier savings contributions outside the window", () => {
        const activity = getActivityForRange(
            february,
            [],
            [],
            [],
            [makeSavingsGoal()],
            [makeIncome({ date: "2026-02-01", net: 1000 })],
            [],
            [],
            [
                makeSavingsContribution({ date: "2026-01-15", amount: 200 }),
                makeSavingsContribution({ date: "2026-02-10", amount: 100 }),
            ]
        );

        expect(activity.savings).toBe(100);
        expect(activity.leftover).toBe(900);
    });
});

describe("getCommittedForMonth", () => {
    const asOf = new Date(2026, 1, 20);

    it("adds up unpaid bills and unpaid debt minimums", () => {
        const committed = getCommittedForMonth(
            asOf,
            [makeBill({ amount: 1000 }), makeBill({ amount: 500 })],
            [],
            [makeDebt({ minimumPayment: 2000, balance: 12000 })],
            []
        );

        expect(committed.bills).toBe(1500);
        expect(committed.debts).toBe(2000);
        expect(committed.total).toBe(3500);
        expect(committed.count).toBe(3);
    });

    it("drops a bill once it is paid for the month", () => {
        const bill = makeBill({ amount: 1000 });
        const committed = getCommittedForMonth(
            asOf,
            [bill],
            [makeBillPayment({ billId: bill.id, date: "2026-02-05" })],
            [],
            []
        );

        expect(committed.total).toBe(0);
        expect(committed.count).toBe(0);
    });

    it("owes the bill again the following month", () => {
        const bill = makeBill({ amount: 1000 });
        const payments = [makeBillPayment({ billId: bill.id, date: "2026-02-05" })];

        const march = getCommittedForMonth(
            new Date(2026, 2, 20),
            [bill],
            payments,
            [],
            []
        );

        expect(march.total).toBe(1000);
    });

    it("reports variable bills separately instead of guessing an amount", () => {
        const committed = getCommittedForMonth(
            asOf,
            [
                makeBill({ amount: 1000 }),
                makeBill({ amountVaries: true, amount: 0 }),
            ],
            [],
            [],
            []
        );

        // A guessed amount would be a worse lie than an acknowledged gap.
        expect(committed.total).toBe(1000);
        expect(committed.unknownCount).toBe(1);
        expect(committed.count).toBe(1);
    });

    it("never claims more is owed on a debt than the balance itself", () => {
        const committed = getCommittedForMonth(
            asOf,
            [],
            [],
            [makeDebt({ minimumPayment: 2000, balance: 750 })],
            []
        );

        expect(committed.debts).toBe(750);
    });

    it("drops a debt once this month's instalment is logged", () => {
        const debt = makeDebt({ minimumPayment: 2000 });
        const committed = getCommittedForMonth(
            asOf,
            [],
            [],
            [debt],
            [makeDebtPayment({ debtId: debt.id, date: "2026-02-10" })]
        );

        expect(committed.total).toBe(0);
    });

    it("ignores a debt whose plan has not started yet", () => {
        const committed = getCommittedForMonth(
            asOf,
            [],
            [],
            [makeDebt({ startDate: "2026-06-01", minimumPayment: 2000 })],
            []
        );

        expect(committed.total).toBe(0);
    });

    it("ignores a debt that is already paid off", () => {
        const committed = getCommittedForMonth(
            asOf,
            [],
            [],
            [makeDebt({ balance: 0, paidOffDate: "2026-01-31" })],
            []
        );

        expect(committed.total).toBe(0);
    });

    it("still owes an overdue bill from earlier in the month", () => {
        const committed = getCommittedForMonth(
            asOf,
            [makeBill({ dueDay: 5, amount: 1000 })],
            [],
            [],
            []
        );

        // Being late does not make the money stop being owed.
        expect(committed.total).toBe(1000);
    });

    it("is zero when there is nothing to track", () => {
        const committed = getCommittedForMonth(asOf, [], [], [], []);

        expect(committed.total).toBe(0);
        expect(committed.count).toBe(0);
        expect(committed.unknownCount).toBe(0);
    });
});

describe("getCommittedInRange", () => {
    it("only counts dues that land inside the pay cycle", () => {
        const cycle = {
            start: new Date(2026, 8, 1),
            end: new Date(2026, 8, 14, 23, 59, 59, 999),
        };

        const committed = getCommittedInRange(
            cycle,
            [
                makeBill({ dueDay: 10, amount: 100 }),
                makeBill({ dueDay: 20, amount: 999 }),
            ],
            [],
            [],
            []
        );

        expect(committed.total).toBe(100);
        expect(committed.count).toBe(1);
    });
});

describe("getExpenseSpendByCategory", () => {
    it("groups by category, biggest first", () => {
        const rows = getExpenseSpendByCategory(
            [
                makeExpense({ category: "Food", amount: 300, date: "2026-02-02" }),
                makeExpense({ category: "Food", amount: 200, date: "2026-02-03" }),
                makeExpense({ category: "Transport", amount: 400, date: "2026-02-04" }),
            ],
            february
        );

        expect(rows).toEqual([
            { category: "Food", amount: 500 },
            { category: "Transport", amount: 400 },
        ]);
    });

    it("buckets blank categories as Uncategorized", () => {
        const rows = getExpenseSpendByCategory(
            [
                makeExpense({ category: undefined, amount: 100, date: "2026-02-02" }),
                makeExpense({ category: "   ", amount: 50, date: "2026-02-03" }),
            ],
            february
        );

        expect(rows).toEqual([{ category: "Uncategorized", amount: 150 }]);
    });

    it("only counts spending inside the period", () => {
        const rows = getExpenseSpendByCategory(
            [
                makeExpense({ category: "Food", amount: 300, date: "2026-02-02" }),
                makeExpense({ category: "Food", amount: 999, date: "2026-01-02" }),
            ],
            february
        );

        // Unlike leftover, this chart is period-only.
        expect(rows).toEqual([{ category: "Food", amount: 300 }]);
    });
});

describe("getMonthlyTrend", () => {
    it("returns one point per month, oldest first", () => {
        const points = getMonthlyTrend(
            new Date(2026, 1, 28),
            6,
            [],
            [],
            [],
            [],
            [makeIncome({ date: "2026-01-01", net: 1000 })]
        );

        expect(points).toHaveLength(6);
        expect(points.map((point) => point.label)).toEqual([
            "Sep",
            "Oct",
            "Nov",
            "Dec",
            "Jan",
            "Feb",
        ]);
    });

    it("carries the running balance forward across months", () => {
        const points = getMonthlyTrend(
            new Date(2026, 1, 28),
            2,
            [makeExpense({ date: "2026-02-10", amount: 400 })],
            [],
            [],
            [],
            [makeIncome({ date: "2026-01-05", net: 1000 })]
        );

        // January's income is still counted in February's point.
        expect(points[0].leftover).toBe(1000);
        expect(points[1].leftover).toBe(600);
        expect(points[1].outflow).toBe(400);
    });
});
