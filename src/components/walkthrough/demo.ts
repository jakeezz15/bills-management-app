/**
 * Display-only sample figures for the walkthrough.
 * Never written to storage — real data returns when the tour ends.
 */
import type { Bill } from "@/types/bill";
import type { Debt } from "@/types/debt";
import type { Expense } from "@/types/expense";
import type { Income } from "@/types/income";
import type { SavingsGoal } from "@/types/savings";
import type { DueNowItem } from "@/utils/due-now";
import { todayIsoDate } from "@/utils/date";
import { stampCreate } from "@/utils/timestamps";

export const WALKTHROUGH_HOME_DEMO = {
    leftover: 1840,
    dueCount: 3,
    caption: "Sample numbers for this tour — your real leftover stays unchanged.",
    lines: {
        Income: 3200,
        Spending: 640,
        Bills: 420,
        "Debt payments": 200,
        Savings: 100,
    },
} as const;

/** Sample Due now rows — display only, no pay/toggle during the tour. */
export const WALKTHROUGH_DUE_DEMO: DueNowItem[] = [
    {
        kind: "bill",
        id: "walkthrough-demo-rent",
        name: "Rent",
        amount: 1200,
        urgency: "due-today",
        dueDay: 1,
    },
    {
        kind: "bill",
        id: "walkthrough-demo-electric",
        name: "Electric",
        amount: 0,
        amountVaries: true,
        urgency: "due-soon",
        dueDay: 15,
    },
    {
        kind: "debt",
        id: "walkthrough-demo-car",
        name: "Car loan",
        amount: 285,
        remaining: 6420,
        urgency: "overdue",
        dueDay: 5,
    },
];

export function walkthroughIncomeDemo(): Income[] {
    const date = todayIsoDate();
    const stamp = stampCreate();
    return [
        {
            id: "wt-income-1",
            date,
            gross: 4200,
            net: 3200,
            source: "Primary job",
            payCadence: "biweekly",
            ...stamp,
        },
        {
            id: "wt-income-2",
            date,
            gross: 400,
            net: 400,
            source: "Side gig",
            payCadence: "once",
            ...stamp,
        },
    ];
}

export function walkthroughExpenseDemo(): Expense[] {
    const date = todayIsoDate();
    const stamp = stampCreate();
    return [
        {
            id: "wt-expense-1",
            name: "Groceries",
            amount: 86.4,
            date,
            category: "Food",
            ...stamp,
        },
        {
            id: "wt-expense-2",
            name: "Transit pass",
            amount: 45,
            date,
            category: "Transport",
            ...stamp,
        },
        {
            id: "wt-expense-3",
            name: "Coffee",
            amount: 12.5,
            date,
            category: "Food",
            ...stamp,
        },
    ];
}

export function walkthroughBillDemo(): Bill[] {
    const stamp = stampCreate();
    return [
        {
            id: "wt-bill-rent",
            name: "Rent",
            amount: 1200,
            dueDay: 1,
            isPaid: false,
            category: "Housing",
            isRecurring: true,
            ...stamp,
        },
        {
            id: "wt-bill-electric",
            name: "Electric",
            amount: 0,
            dueDay: 15,
            isPaid: false,
            category: "Utilities",
            isRecurring: true,
            amountVaries: true,
            ...stamp,
        },
        {
            id: "wt-bill-internet",
            name: "Internet",
            amount: 65,
            dueDay: 10,
            isPaid: false,
            category: "Utilities",
            isRecurring: true,
            ...stamp,
        },
    ];
}

export function walkthroughSavingsDemo(): SavingsGoal[] {
    const stamp = stampCreate();
    const startDate = todayIsoDate();
    return [
        {
            id: "wt-goal-emergency",
            name: "Emergency fund",
            targetAmount: 5000,
            currentAmount: 1850,
            startDate,
            monthlyContribution: 200,
            ...stamp,
        },
        {
            id: "wt-goal-trip",
            name: "Trip",
            targetAmount: 1200,
            currentAmount: 420,
            startDate,
            monthlyContribution: 100,
            ...stamp,
        },
    ];
}

export function walkthroughDebtDemo(): Debt[] {
    const stamp = stampCreate();
    return [
        {
            id: "wt-debt-car",
            name: "Car loan",
            balance: 6420,
            dueDay: 5,
            startDate: todayIsoDate(),
            minimumPayment: 285,
            type: "Auto",
            ...stamp,
        },
        {
            id: "wt-debt-card",
            name: "Credit card",
            balance: 1100,
            dueDay: 20,
            startDate: todayIsoDate(),
            minimumPayment: 45,
            type: "Credit card",
            ...stamp,
        },
    ];
}
