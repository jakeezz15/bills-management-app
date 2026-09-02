export interface Expenses {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    isPaid: boolean;
    category?: string;
    isRecurring: boolean;
}