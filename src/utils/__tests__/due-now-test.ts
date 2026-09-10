import { getDueNowItems } from "@/utils/due-now";
import {
    makeBill,
    makeBillPayment,
    makeDebt,
    makeDebtPayment,
} from "./factories";

describe("getDueNowItems", () => {
    it("hides a debt paid later this month from the Debts screen stamp", () => {
        const debt = makeDebt({
            dueDay: 5,
            minimumPayment: 500,
            balance: 5000,
        });
        const payments = [
            makeDebtPayment({ debtId: debt.id, date: "2026-09-30" }),
        ];
        const today = new Date(2026, 8, 10);

        const items = getDueNowItems([], [], [debt], payments, today);

        expect(items).toHaveLength(0);
    });

    it("hides a bill paid later this month", () => {
        const bill = makeBill({ dueDay: 5, amount: 1000 });
        const payments = [
            makeBillPayment({ billId: bill.id, date: "2026-09-30" }),
        ];
        const today = new Date(2026, 8, 10);

        const items = getDueNowItems([bill], payments, [], [], today);

        expect(items).toHaveLength(0);
    });

    it("still lists an unpaid installment that is overdue", () => {
        const debt = makeDebt({
            dueDay: 5,
            minimumPayment: 500,
            balance: 5000,
        });
        const today = new Date(2026, 8, 10);

        const items = getDueNowItems([], [], [debt], [], today);

        expect(items).toEqual([
            expect.objectContaining({
                kind: "debt",
                id: debt.id,
                urgency: "overdue",
            }),
        ]);
    });
});
