import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";

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
    },
    {
        id: "2",
        name: "Water",
        amount: 80,
        dueDay: 10,
        isPaid: false,
        category: "Utilities",
        isRecurring: true,
    },
    {
        id: "3",
        name: "Rent",
        amount: 500,
        dueDay: 30,
        isPaid: false,
        category: "House",
        isRecurring: true,
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
    },
    {
        id: "2",
        name: "Gas",
        amount: 40,
        date: "2026-09-06",
        category: "Transport",
    },
    {
        id: "3",
        name: "Coffee",
        amount: 5.5,
        date: "2026-09-07",
        category: "Food",
    },
];

export const incomeData: Income[] = [
    {
        id: "1",
        date: "07/28/26",
        gross: 1100,
        net: 900,
        source: "Salary",
    },
    {
        id: "2",
        date: "08/28/26",
        gross: 1200,
        net: 1000,
        source: "Salary",
    },
];

export const debtData: Debt[] = [
    {
        id: "1",
        name: "Iphone 16 Pro Max",
        balance: 500,
        dueDay: 15,
        minimumPayment: 45,
        isPaid: false,
        remarks: "Can't pay right now",
        type: "loan",
    },
    {
        id: "2",
        name: "Macbook Air",
        balance: 800,
        dueDay: 15,
        minimumPayment: 75,
        isPaid: false,
        type: "loan",
    },
];

export const savingsData: SavingsGoal[] = [
    {
        id: "1",
        name: "Emergency Fund",
        targetAmount: 5000,
        currentAmount: 1200,
        monthlyContribution: 200,
    },
    {
        id: "2",
        name: "Vacation",
        targetAmount: 2000,
        currentAmount: 400,
        monthlyContribution: 100,
    },
];
