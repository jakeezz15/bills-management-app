export interface Debt {
    id: string;
    name: string;
    balance: number;
    dueDay: number;
    isPaid: boolean;
    remarks?: string;
    minimumPayment: number;
    type: string;
}