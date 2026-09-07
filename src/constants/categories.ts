export const BILL_CATEGORIES = [
    "Utilities",
    "Housing",
    "Subscriptions",
    "Insurance",
    "Other",
] as const;

export const EXPENSE_CATEGORIES = [
    "Food",
    "Transport",
    "Shopping",
    "Entertainment",
    "Health",
    "Other",
] as const;

export type BillCategory = (typeof BILL_CATEGORIES)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const PAID_FILTERS = ["All", "Unpaid", "Paid"] as const;
export type PaidFilter = (typeof PAID_FILTERS)[number];
