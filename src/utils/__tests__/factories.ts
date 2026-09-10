import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";

/**
 * Entity builders for tests. Every field has a boring default so each test can
 * name only the values it actually cares about.
 */

const stamps = {
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
};

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${(counter += 1)}`;

export function makeBill(overrides: Partial<Bill> = {}): Bill {
    return {
        id: nextId("bill"),
        name: "Rent",
        amount: 1000,
        dueDay: 5,
        isPaid: false,
        isRecurring: true,
        ...stamps,
        ...overrides,
    };
}

export function makeBillPayment(
    overrides: Partial<BillPayment> = {}
): BillPayment {
    return {
        id: nextId("bill-payment"),
        billId: "bill-1",
        amount: 1000,
        date: "2026-02-05",
        ...stamps,
        ...overrides,
    };
}

export function makeDebt(overrides: Partial<Debt> = {}): Debt {
    return {
        id: nextId("debt"),
        name: "Laptop instalment",
        balance: 12000,
        dueDay: 10,
        startDate: "2026-01-01",
        minimumPayment: 2000,
        type: "Instalment",
        ...stamps,
        ...overrides,
    };
}

export function makeDebtPayment(
    overrides: Partial<DebtPayment> = {}
): DebtPayment {
    return {
        id: nextId("debt-payment"),
        debtId: "debt-1",
        amount: 2000,
        date: "2026-02-10",
        ...stamps,
        ...overrides,
    };
}

export function makeExpense(overrides: Partial<Expense> = {}): Expense {
    return {
        id: nextId("expense"),
        name: "Groceries",
        amount: 500,
        date: "2026-02-14",
        ...stamps,
        ...overrides,
    };
}

export function makeIncome(overrides: Partial<Income> = {}): Income {
    return {
        id: nextId("income"),
        date: "2026-02-01",
        gross: 5000,
        net: 4000,
        source: "Salary",
        ...stamps,
        ...overrides,
    };
}

export function makeSavingsGoal(
    overrides: Partial<SavingsGoal> = {}
): SavingsGoal {
    return {
        id: nextId("savings"),
        name: "Emergency fund",
        targetAmount: 10000,
        currentAmount: 0,
        startDate: "2026-01-01",
        ...stamps,
        ...overrides,
    };
}

export function makeSavingsContribution(
    overrides: Partial<SavingsContribution> = {}
): SavingsContribution {
    return {
        id: nextId("savings-contribution"),
        savingsId: "savings-1",
        amount: 300,
        date: "2026-02-15",
        ...stamps,
        ...overrides,
    };
}
