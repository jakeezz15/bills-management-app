import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsContribution } from "@/types/savings-contribution";
import { SavingsGoal } from "@/types/savings";

const ts = (isoDate: string) => ({
    createdAt: `${isoDate}T12:00:00.000Z`,
    updatedAt: `${isoDate}T12:00:00.000Z`,
});

/**
 * September 2026 sample (USD).
 * Leftover = paycheck 3200 − spent 1217.50 − bills paid 500 = 1482.50.
 * Unpaid bills do not reduce leftover.
 */
export const billsData: Bill[] = [
    {
        id: "bill-rent",
        name: "Rent",
        amount: 1450,
        dueDay: 1,
        isPaid: false,
        category: "Housing",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
    {
        id: "bill-utilities",
        name: "Utilities",
        amount: 120,
        dueDay: 12,
        isPaid: false,
        category: "Utilities",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
    {
        id: "bill-netflix",
        name: "Netflix",
        amount: 15.99,
        dueDay: 25,
        isPaid: false,
        category: "Subscriptions",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
    {
        id: "bill-internet",
        name: "Internet",
        amount: 80,
        dueDay: 5,
        isPaid: true,
        category: "Utilities",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
    {
        id: "bill-insurance",
        name: "Insurance",
        amount: 420,
        dueDay: 8,
        isPaid: true,
        category: "Insurance",
        isRecurring: true,
        ...ts("2026-07-01"),
    },
];

export const billPaymentsData: BillPayment[] = [
    {
        id: "pay-internet-sep",
        billId: "bill-internet",
        amount: 80,
        date: "2026-09-03",
        ...ts("2026-09-03"),
    },
    {
        id: "pay-insurance-sep",
        billId: "bill-insurance",
        amount: 420,
        date: "2026-09-05",
        ...ts("2026-09-05"),
    },
];

export const expensesData: Expense[] = [
    {
        id: "exp-coffee",
        name: "Coffee",
        amount: 4.5,
        date: "2026-09-09",
        category: "Food",
        ...ts("2026-09-09"),
    },
    {
        id: "exp-rideshare",
        name: "Rideshare",
        amount: 36,
        date: "2026-09-08",
        category: "Transport",
        ...ts("2026-09-08"),
    },
    {
        id: "exp-groceries",
        name: "Groceries",
        amount: 86.2,
        date: "2026-09-08",
        category: "Food",
        ...ts("2026-09-08"),
    },
    {
        id: "exp-gas",
        name: "Gas",
        amount: 45,
        date: "2026-09-07",
        category: "Transport",
        ...ts("2026-09-07"),
    },
    {
        id: "exp-dining",
        name: "Dining",
        amount: 64.8,
        date: "2026-09-06",
        category: "Food",
        ...ts("2026-09-06"),
    },
    {
        id: "exp-pharmacy",
        name: "Pharmacy",
        amount: 22.4,
        date: "2026-09-06",
        category: "Health",
        ...ts("2026-09-06"),
    },
    {
        id: "exp-target",
        name: "Target",
        amount: 156.8,
        date: "2026-09-05",
        category: "Shopping",
        ...ts("2026-09-05"),
    },
    {
        id: "exp-lunch",
        name: "Lunch",
        amount: 14.75,
        date: "2026-09-05",
        category: "Food",
        ...ts("2026-09-05"),
    },
    {
        id: "exp-household",
        name: "Household",
        amount: 67.3,
        date: "2026-09-04",
        category: "Shopping",
        ...ts("2026-09-04"),
    },
    {
        id: "exp-movie",
        name: "Movie",
        amount: 32,
        date: "2026-09-04",
        category: "Entertainment",
        ...ts("2026-09-04"),
    },
    {
        id: "exp-takeout",
        name: "Takeout",
        amount: 41.15,
        date: "2026-09-03",
        category: "Food",
        ...ts("2026-09-03"),
    },
    {
        id: "exp-parking",
        name: "Parking",
        amount: 12,
        date: "2026-09-03",
        category: "Transport",
        ...ts("2026-09-03"),
    },
    {
        id: "exp-clothing",
        name: "Clothing",
        amount: 89,
        date: "2026-09-02",
        category: "Shopping",
        ...ts("2026-09-02"),
    },
    {
        id: "exp-haircut",
        name: "Haircut",
        amount: 45,
        date: "2026-09-02",
        category: "Other",
        ...ts("2026-09-02"),
    },
    {
        id: "exp-electronics",
        name: "Electronics",
        amount: 249.85,
        date: "2026-09-02",
        category: "Shopping",
        ...ts("2026-09-02"),
    },
    {
        id: "exp-books",
        name: "Books",
        amount: 18.5,
        date: "2026-09-01",
        category: "Shopping",
        ...ts("2026-09-01"),
    },
    {
        id: "exp-snacks",
        name: "Snacks",
        amount: 11.25,
        date: "2026-09-01",
        category: "Food",
        ...ts("2026-09-01"),
    },
    {
        id: "exp-gym",
        name: "Gym",
        amount: 55,
        date: "2026-09-01",
        category: "Health",
        ...ts("2026-09-01"),
    },
    {
        id: "exp-transit",
        name: "Transit pass",
        amount: 166,
        date: "2026-09-01",
        category: "Transport",
        ...ts("2026-09-01"),
    },
];

export const incomeData: Income[] = [
    {
        id: "inc-paycheck",
        date: "2026-09-01",
        gross: 3200,
        net: 3200,
        source: "Paycheck",
        ...ts("2026-09-01"),
    },
];

export const debtData: Debt[] = [
    {
        id: "debt-car",
        name: "Car loan",
        balance: 8400,
        dueDay: 12,
        minimumPayment: 285,
        startDate: "2026-01-12",
        type: "Car Loan",
        remarks: "Monthly installment",
        ...ts("2026-01-12"),
    },
];

export const debtPaymentsData: DebtPayment[] = [];

export const savingsData: SavingsGoal[] = [
    {
        id: "sav-emergency",
        name: "Emergency fund",
        targetAmount: 5000,
        currentAmount: 3250,
        startDate: "2026-01-15",
        monthlyContribution: 200,
        ...ts("2026-01-15"),
    },
];

export const savingsContributionsData: SavingsContribution[] = [];
