import { makeSavingsGoal } from "./factories";
import {
    isSavingsGoalReached,
    savingsMonthsRemaining,
    savingsProgressPercent,
} from "@/utils/savings";

describe("isSavingsGoalReached", () => {
    it("is reached when saved meets the target", () => {
        expect(
            isSavingsGoalReached(
                makeSavingsGoal({ currentAmount: 100, targetAmount: 100 })
            )
        ).toBe(true);
    });

    it("is not reached below the target", () => {
        expect(
            isSavingsGoalReached(
                makeSavingsGoal({ currentAmount: 40, targetAmount: 100 })
            )
        ).toBe(false);
    });
});

describe("savingsProgressPercent", () => {
    it("caps at 100", () => {
        expect(
            savingsProgressPercent(
                makeSavingsGoal({ currentAmount: 150, targetAmount: 100 })
            )
        ).toBe(100);
    });

    it("is 0 when the target is missing", () => {
        expect(
            savingsProgressPercent(
                makeSavingsGoal({ currentAmount: 40, targetAmount: 0 })
            )
        ).toBe(0);
    });
});

describe("savingsMonthsRemaining", () => {
    it("rounds up partial months", () => {
        expect(
            savingsMonthsRemaining(
                makeSavingsGoal({
                    currentAmount: 0,
                    targetAmount: 100,
                    monthlyContribution: 40,
                })
            )
        ).toBe(3);
    });

    it("is null without a planned monthly", () => {
        expect(
            savingsMonthsRemaining(
                makeSavingsGoal({
                    currentAmount: 0,
                    targetAmount: 100,
                    monthlyContribution: undefined,
                })
            )
        ).toBeNull();
    });
});
