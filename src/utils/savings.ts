import { SavingsGoal } from "@/types/savings";

export function isSavingsGoalReached(goal: SavingsGoal): boolean {
    return goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
}

export function savingsProgressPercent(goal: SavingsGoal): number {
    if (goal.targetAmount <= 0) {
        return 0;
    }
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

/** Whole months left at the planned monthly pace. `null` if pace is unknown. */
export function savingsMonthsRemaining(goal: SavingsGoal): number | null {
    const leftover = Math.max(0, goal.targetAmount - goal.currentAmount);
    const monthly = goal.monthlyContribution ?? 0;
    if (leftover <= 0) {
        return 0;
    }
    if (monthly <= 0) {
        return null;
    }
    return Math.ceil(leftover / monthly);
}
