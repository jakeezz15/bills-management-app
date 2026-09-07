import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";

const ts = (isoDate: string) => ({
    createdAt: `${isoDate}T12:00:00.000Z`,
    updatedAt: `${isoDate}T12:00:00.000Z`,
});

/** Recurring / scheduled obligations (rent, utilities, subscriptions) */
export const billsData: Bill[] = [
    {
        id: "1",
        name: "Electricity",
        amount: 120,
        dueDay: 15,
        isPaid: false,
        category: "Utilities",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
    {
        id: "2",
        name: "Water",
        amount: 80,
        dueDay: 10,
        isPaid: false,
        category: "Utilities",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
    {
        id: "3",
        name: "Rent",
        amount: 500,
        dueDay: 30,
        isPaid: false,
        category: "Housing",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
];

/** Everyday spending logs (coffee, groceries, gas) */
export const expensesData: Expense[] = [
    {
        id: "1",
        name: "Groceries",
        amount: 65.4,
        date: "2026-09-05",
        category: "Food",
        ...ts("2026-09-05"),
    },
    {
        id: "2",
        name: "Gas",
        amount: 40,
        date: "2026-09-06",
        category: "Transport",
        ...ts("2026-09-06"),
    },
    {
        id: "3",
        name: "Coffee",
        amount: 5.5,
        date: "2026-09-07",
        category: "Food",
        ...ts("2026-09-07"),
    },
];

export const incomeData: Income[] = [
    {
        id: "1",
        date: "2026-07-28",
        gross: 1100,
        net: 900,
        source: "Salary",
        ...ts("2026-07-28"),
    },
    {
        id: "2",
        date: "2026-08-28",
        gross: 1200,
        net: 1000,
        source: "Salary",
        ...ts("2026-08-28"),
    },
    {
        id: "3",
        date: "2026-09-28",
        gross: 1200,
        net: 1000,
        source: "Salary",
        ...ts("2026-09-28"),
    },
];

export const debtData: Debt[] = [
    {
        id: "1",
        name: "iPhone 16 Pro Max",
        balance: 500,
        dueDay: 15,
        minimumPayment: 45,
        isPaid: false,
        totalPaid: 0,
        startDate: "2026-08-01",
        remarks: "Installment plan",
        type: "Device / Installment",
        ...ts("2026-08-01"),
    },
    {
        id: "2",
        name: "MacBook Air",
        balance: 800,
        dueDay: 15,
        minimumPayment: 75,
        isPaid: false,
        totalPaid: 0,
        startDate: "2026-08-01",
        type: "Device / Installment",
        ...ts("2026-08-01"),
    },
];

export const savingsData: SavingsGoal[] = [
    {
        id: "1",
        name: "Emergency Fund",
        targetAmount: 5000,
        currentAmount: 1200,
        monthlyContribution: 200,
        ...ts("2026-07-01"),
    },
    {
        id: "2",
        name: "Vacation",
        targetAmount: 2000,
        currentAmount: 400,
        monthlyContribution: 100,
        ...ts("2026-07-01"),
    },
];
