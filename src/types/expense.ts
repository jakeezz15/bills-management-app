export interface Expense {
    id: string;
    name: string;
    amount: number;
    date: string; // ISO YYYY-MM-DD — when the money was spent
    category?: string;
}
