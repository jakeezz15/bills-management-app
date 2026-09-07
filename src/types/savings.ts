import { Timestamps } from "@/utils/timestamps";

export interface SavingsGoal extends Timestamps {
    id: string;
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyContribution?: number;
}
