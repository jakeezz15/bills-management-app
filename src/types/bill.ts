export interface Bill {
    id: string;
    name: string;
    amount: number;
    dueDay: number;
    isPaid: boolean;
    category?: string;
}