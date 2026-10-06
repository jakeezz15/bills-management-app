import { getRangeForPeriod } from "@/utils/date";
import {
    buildMonthStatement,
    clampStatementMonth,
    formatStatementText,
    groupStatementLinesByDate,
    isStatementAtCurrentMonth,
    isStatementAtEarliestMonth,
    parseMonthParam,
    statementEarliestMonth,
    toMonthParam,
} from "@/utils/month-statement";
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

const februaryAnchor = new Date(2026, 1, 15);

function money(amount: number, options?: { sign?: "+" | "−" | "" }) {
    const sign = options?.sign ?? "";
    return `${sign}$${amount}`;
}

describe("parseMonthParam / toMonthParam", () => {
    it("round-trips a calendar month", () => {
        const today = new Date(2026, 8, 21); // Sep 2026
        const date = new Date(2026, 1, 1);
        expect(toMonthParam(date)).toBe("2026-02");
        expect(parseMonthParam("2026-02", today, today).getMonth()).toBe(1);
        expect(parseMonthParam("2026-02", today, today).getFullYear()).toBe(
            2026
        );
        expect(parseMonthParam("2026-02", today, today).getDate()).toBe(1);
    });

    it("falls back when the param is missing or invalid", () => {
        const fallback = new Date(2026, 5, 20);
        const today = new Date(2026, 8, 21);
        expect(parseMonthParam(undefined, fallback, today).getMonth()).toBe(5);
        expect(parseMonthParam("nope", fallback, today).getMonth()).toBe(5);
        expect(parseMonthParam("2026-13", fallback, today).getMonth()).toBe(5);
    });

    it("clamps future months to the current calendar month", () => {
        const today = new Date(2026, 8, 21); // Sep 2026
        const clamped = parseMonthParam("2026-12", today, today);
        expect(toMonthParam(clamped)).toBe("2026-09");
        expect(
            clampStatementMonth(new Date(2026, 10, 1), today).getMonth()
        ).toBe(8);
        expect(isStatementAtCurrentMonth(new Date(2026, 8, 1), today)).toBe(
            true
        );
        expect(isStatementAtCurrentMonth(new Date(2026, 7, 1), today)).toBe(
            false
        );
    });

    it("clamps past months to the first paycheck month", () => {
        const today = new Date(2026, 8, 21); // Sep 2026
        const earliest = statementEarliestMonth(
            [
                { date: "2026-08-05" },
                { date: "2026-09-01" },
            ],
            today
        );
        expect(toMonthParam(earliest)).toBe("2026-08");
        expect(
            toMonthParam(
                clampStatementMonth(new Date(2026, 0, 1), today, earliest)
            )
        ).toBe("2026-08");
        expect(
            toMonthParam(parseMonthParam("2026-01", today, today, earliest))
        ).toBe("2026-08");
        expect(isStatementAtEarliestMonth(new Date(2026, 7, 1), earliest)).toBe(
            true
        );
        expect(isStatementAtEarliestMonth(new Date(2026, 8, 1), earliest)).toBe(
            false
        );
    });

    it("with no income, earliest month is the current month", () => {
        const today = new Date(2026, 8, 21);
        expect(toMonthParam(statementEarliestMonth([], today))).toBe("2026-09");
    });
});

describe("buildMonthStatement", () => {
    it("builds chronological in/out lines for the month only", () => {
        const bill = makeBill({ id: "bill-rent", name: "Rent" });
        const debt = makeDebt({ id: "debt-car", name: "Car loan" });
        const goal = makeSavingsGoal({ id: "goal-ef", name: "Emergency" });

        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({
                    id: "in-1",
                    date: "2026-02-01",
                    net: 4000,
                    source: "Salary",
                }),
                makeIncome({
                    id: "in-jan",
                    date: "2026-01-15",
                    net: 4000,
                    source: "Old paycheck",
                }),
            ],
            expenses: [
                makeExpense({
                    id: "ex-1",
                    date: "2026-02-14",
                    name: "Groceries",
                    category: "Food",
                    amount: 120,
                }),
            ],
            bills: [bill],
            debts: [debt],
            savings: [goal],
            billPayments: [
                makeBillPayment({
                    id: "bp-1",
                    billId: "bill-rent",
                    date: "2026-02-05",
                    amount: 1000,
                }),
            ],
            debtPayments: [
                makeDebtPayment({
                    id: "dp-1",
                    debtId: "debt-car",
                    date: "2026-02-10",
                    amount: 200,
                }),
            ],
            savingsContributions: [
                makeSavingsContribution({
                    id: "sc-1",
                    savingsId: "goal-ef",
                    date: "2026-02-20",
                    amount: 300,
                }),
            ],
        });

        expect(statement.label).toBe("Feb 2026");
        expect(statement.lines.map((line) => line.id)).toEqual([
            "in-1",
            "bp-1",
            "dp-1",
            "ex-1",
            "sc-1",
        ]);
        expect(statement.lines[0]).toMatchObject({
            direction: "in",
            label: "Salary",
            amount: 4000,
            kind: "income",
        });
        expect(statement.lines[3]).toMatchObject({
            direction: "out",
            label: "Groceries · Food",
            amount: 120,
            kind: "expense",
        });
        expect(statement.activity).toMatchObject({
            income: 4000,
            expenses: 120,
            bills: 1000,
            debtPayments: 200,
            savings: 300,
            leftover: 4000 - 120 - 1000 - 200 - 300,
        });
    });

    it("computes opening leftover from cash before the month", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({ date: "2026-01-10", net: 1000, source: "Jan" }),
                makeIncome({ date: "2026-02-01", net: 500, source: "Feb" }),
            ],
            expenses: [
                makeExpense({ date: "2026-01-20", amount: 200, name: "Jan spend" }),
            ],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        expect(statement.openingLeftover).toBe(800);
        expect(statement.closingLeftover).toBe(1300);
        expect(statement.lines[0]?.balanceAfter).toBe(1300);
    });

    it("includes skipped bills as settled zero rows", () => {
        const bill = makeBill({ id: "bill-allowance", name: "Allowance" });
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [],
            expenses: [],
            bills: [bill],
            debts: [],
            savings: [],
            billPayments: [
                makeBillPayment({
                    id: "bp-skip",
                    billId: "bill-allowance",
                    date: "2026-02-03",
                    amount: 0,
                    skipped: true,
                }),
            ],
            debtPayments: [],
            savingsContributions: [],
        });

        expect(statement.lines).toHaveLength(1);
        expect(statement.lines[0]).toMatchObject({
            label: "Allowance (skipped)",
            amount: 0,
            skipped: true,
            direction: "out",
        });
        expect(statement.activity.bills).toBe(0);
    });

    it("falls back when parent bill/debt/goal is missing", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [],
            expenses: [],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [
                makeBillPayment({
                    id: "bp-x",
                    billId: "gone",
                    date: "2026-02-02",
                    amount: 50,
                }),
            ],
            debtPayments: [
                makeDebtPayment({
                    id: "dp-x",
                    debtId: "gone",
                    date: "2026-02-02",
                    amount: 25,
                }),
            ],
            savingsContributions: [
                makeSavingsContribution({
                    id: "sc-x",
                    savingsId: "gone",
                    date: "2026-02-02",
                    amount: 10,
                }),
            ],
        });

        expect(statement.lines.map((line) => line.label)).toEqual([
            "Bill",
            "Debt",
            "Savings",
        ]);
    });

    it("returns an empty ledger for a quiet month", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({ date: "2026-01-01", net: 100, source: "Earlier" }),
            ],
            expenses: [],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        expect(statement.lines).toEqual([]);
        expect(statement.openingLeftover).toBe(100);
        expect(statement.closingLeftover).toBe(100);
        expect(statement.range).toEqual(
            getRangeForPeriod(new Date(2026, 1, 1), "month")
        );
    });

    it("sorts same-day rows by kind", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({
                    id: "in-same",
                    date: "2026-02-10",
                    net: 100,
                    source: "Bonus",
                }),
            ],
            expenses: [
                makeExpense({
                    id: "ex-same",
                    date: "2026-02-10",
                    amount: 10,
                    name: "Coffee",
                }),
            ],
            bills: [makeBill({ id: "b1", name: "Rent" })],
            debts: [makeDebt({ id: "d1", name: "Loan" })],
            savings: [makeSavingsGoal({ id: "s1", name: "Trip" })],
            billPayments: [
                makeBillPayment({
                    id: "bp-same",
                    billId: "b1",
                    date: "2026-02-10",
                    amount: 5,
                }),
            ],
            debtPayments: [
                makeDebtPayment({
                    id: "dp-same",
                    debtId: "d1",
                    date: "2026-02-10",
                    amount: 5,
                }),
            ],
            savingsContributions: [
                makeSavingsContribution({
                    id: "sc-same",
                    savingsId: "s1",
                    date: "2026-02-10",
                    amount: 5,
                }),
            ],
        });

        expect(statement.lines.map((line) => line.kind)).toEqual([
            "income",
            "expense",
            "bill",
            "debt",
            "savings",
        ]);
    });

    it("groups sorted lines under one header per day", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({
                    id: "in-1",
                    date: "2026-02-10",
                    net: 100,
                    source: "Bonus",
                }),
            ],
            expenses: [
                makeExpense({
                    id: "ex-1",
                    date: "2026-02-10",
                    amount: 10,
                    name: "Coffee",
                }),
                makeExpense({
                    id: "ex-2",
                    date: "2026-02-11",
                    amount: 20,
                    name: "Lunch",
                }),
            ],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        expect(groupStatementLinesByDate(statement.lines)).toEqual([
            {
                date: "2026-02-10",
                lines: [
                    expect.objectContaining({ id: "in-1" }),
                    expect.objectContaining({ id: "ex-1" }),
                ],
            },
            {
                date: "2026-02-11",
                lines: [expect.objectContaining({ id: "ex-2" })],
            },
        ]);
    });
    it("tracks a running balance after each transaction", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({
                    id: "in-1",
                    date: "2026-02-01",
                    net: 1000,
                    source: "Salary",
                }),
            ],
            expenses: [
                makeExpense({
                    id: "ex-1",
                    date: "2026-02-02",
                    amount: 200,
                    name: "Food",
                }),
                makeExpense({
                    id: "ex-2",
                    date: "2026-02-03",
                    amount: 50,
                    name: "Coffee",
                }),
            ],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        expect(statement.lines.map((line) => line.balanceAfter)).toEqual([
            1000,
            800,
            750,
        ]);
        expect(statement.lines[statement.lines.length - 1]?.balanceAfter).toBe(
            statement.closingLeftover
        );
    });
});

describe("formatStatementText", () => {
    it("renders a readable share body", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [
                makeIncome({
                    date: "2026-02-01",
                    net: 1000,
                    source: "Salary",
                }),
            ],
            expenses: [
                makeExpense({
                    date: "2026-02-03",
                    amount: 50,
                    name: "Lunch",
                }),
            ],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        const text = formatStatementText(statement, money);
        expect(text).toContain("On Hand — Feb 2026");
        expect(text).toContain("Opening balance");
        expect(text).toContain("Balance at month end");
        expect(text).toContain("Feb 1, 2026");
        expect(text).toContain("Salary");
        expect(text).toContain("+$1000");
        expect(text).toContain("Feb 3, 2026");
        expect(text).toContain("Lunch");
        expect(text).toContain("−$50");
        expect(text).toContain("bal ");
        expect(text).toContain("Net this month");
    });

    it("mentions an empty month clearly", () => {
        const statement = buildMonthStatement({
            anchor: februaryAnchor,
            income: [],
            expenses: [],
            bills: [],
            debts: [],
            savings: [],
            billPayments: [],
            debtPayments: [],
            savingsContributions: [],
        });

        expect(formatStatementText(statement, money)).toContain(
            "No money moved this month."
        );
    });
});
