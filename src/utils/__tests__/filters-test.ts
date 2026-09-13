import {
    billDueStatusReference,
    filterByCategory,
    filterBySearch,
    getBillDueOffset,
    getBillDueStatus,
    dueCatalogLabel,
    dueCatalogStatus,
    isBillPaidAsOf,
    getBillPaymentInMonth,
    getBillTotalPaid,
    getLastBillPayment,
    isDebtFullyPaidOff,
    isDebtInstallmentPaidAsOf,
    isDebtNotStartedAsOf,
    isDebtVisibleAsOf,
} from "@/utils/filters";
import { toIsoDate } from "@/utils/date";
import {
    makeBill,
    makeBillPayment,
    makeDebt,
    makeDebtPayment,
} from "./factories";

describe("isBillPaidAsOf", () => {
    it("counts a payment made earlier in the same month", () => {
        const bill = makeBill();
        const payments = [makeBillPayment({ billId: bill.id, date: "2026-02-05" })];

        expect(isBillPaidAsOf(bill, payments, new Date(2026, 1, 20))).toBe(true);
    });

    it("does not count a payment dated after the day being viewed", () => {
        const bill = makeBill();
        const payments = [makeBillPayment({ billId: bill.id, date: "2026-02-20" })];

        // Viewing Feb 5, the Feb 20 payment has not happened yet.
        expect(isBillPaidAsOf(bill, payments, new Date(2026, 1, 5))).toBe(false);
    });

    it("can treat any payment in the month as paid (Due now vs month-end stamp)", () => {
        const bill = makeBill();
        const payments = [makeBillPayment({ billId: bill.id, date: "2026-02-28" })];

        expect(
            isBillPaidAsOf(bill, payments, new Date(2026, 1, 10), {
                anyDayInMonth: true,
            })
        ).toBe(true);
    });

    it("does not carry a payment across into another month", () => {
        const bill = makeBill();
        const payments = [makeBillPayment({ billId: bill.id, date: "2026-01-05" })];

        // Bills are monthly: January being settled says nothing about February.
        expect(isBillPaidAsOf(bill, payments, new Date(2026, 1, 20))).toBe(false);
    });

    it("ignores payments belonging to a different bill", () => {
        const bill = makeBill();
        const payments = [
            makeBillPayment({ billId: "some-other-bill", date: "2026-02-05" }),
        ];

        expect(isBillPaidAsOf(bill, payments, new Date(2026, 1, 20))).toBe(false);
    });

    it("falls back to the legacy isPaid flag only when there is no ledger history", () => {
        const bill = makeBill({ isPaid: true });

        expect(isBillPaidAsOf(bill, [], new Date(2026, 1, 20))).toBe(true);
    });

    it("stops trusting the legacy flag once the bill has ledger history", () => {
        const bill = makeBill({ isPaid: true });
        const payments = [makeBillPayment({ billId: bill.id, date: "2026-01-05" })];

        // Once a real payment exists, the ledger is the only source of truth.
        expect(isBillPaidAsOf(bill, payments, new Date(2026, 1, 20))).toBe(false);
    });
});

describe("getBillPaymentInMonth", () => {
    it("can find a payment dated later in the same month", () => {
        const bill = makeBill();
        const payments = [
            makeBillPayment({ billId: bill.id, date: "2026-02-28" }),
        ];

        expect(
            getBillPaymentInMonth(bill.id, payments, new Date(2026, 1, 10), {
                anyDayInMonth: true,
            })?.amount
        ).toBe(payments[0].amount);
        expect(
            getBillPaymentInMonth(bill.id, payments, new Date(2026, 1, 10))
        ).toBeUndefined();
    });
});

describe("getBillTotalPaid", () => {
    it("sums every ledger row for that bill", () => {
        const bill = makeBill();
        const payments = [
            makeBillPayment({ billId: bill.id, amount: 10, date: "2026-01-05" }),
            makeBillPayment({ billId: bill.id, amount: 15, date: "2026-02-05" }),
            makeBillPayment({
                billId: "other",
                amount: 99,
                date: "2026-02-05",
            }),
        ];

        expect(getBillTotalPaid(bill.id, payments)).toBe(25);
    });
});

describe("getLastBillPayment", () => {
    it("returns the newest payment for that bill", () => {
        const bill = makeBill();
        const payments = [
            makeBillPayment({ billId: bill.id, amount: 40, date: "2026-01-05" }),
            makeBillPayment({ billId: bill.id, amount: 42, date: "2026-03-05" }),
            makeBillPayment({ billId: bill.id, amount: 41, date: "2026-02-05" }),
            makeBillPayment({
                billId: "other",
                amount: 99,
                date: "2026-04-05",
            }),
        ];

        expect(getLastBillPayment(bill.id, payments)?.amount).toBe(42);
    });

    it("ignores skipped months when picking previous payment", () => {
        const bill = makeBill();
        const payments = [
            makeBillPayment({ billId: bill.id, amount: 40, date: "2026-01-05" }),
            makeBillPayment({
                billId: bill.id,
                amount: 0,
                date: "2026-03-05",
                skipped: true,
            }),
        ];

        expect(getLastBillPayment(bill.id, payments)?.amount).toBe(40);
    });

    it("returns null when the bill has no payments", () => {
        expect(getLastBillPayment("missing", [])).toBeNull();
    });
});

describe("isDebtInstallmentPaidAsOf", () => {
    it("counts a payment dated later in the same month", () => {
        const debt = makeDebt();
        const payments = [makeDebtPayment({ debtId: debt.id, date: "2026-02-28" })];

        expect(
            isDebtInstallmentPaidAsOf(debt, new Date(2026, 1, 10), payments)
        ).toBe(true);
    });

    it("requires a fresh payment each month", () => {
        const debt = makeDebt();
        const payments = [makeDebtPayment({ debtId: debt.id, date: "2026-01-10" })];

        expect(
            isDebtInstallmentPaidAsOf(debt, new Date(2026, 1, 20), payments)
        ).toBe(false);
    });

    it("treats a cleared balance as nothing left to pay", () => {
        const debt = makeDebt({ balance: 0 });

        expect(isDebtInstallmentPaidAsOf(debt, new Date(2026, 1, 20), [])).toBe(
            true
        );
    });

    it("treats a paid-off debt as nothing left to pay", () => {
        const debt = makeDebt({ paidOffDate: "2026-01-31" });

        expect(isDebtInstallmentPaidAsOf(debt, new Date(2026, 1, 20), [])).toBe(
            true
        );
    });

    it("reports an untouched month as unpaid", () => {
        const debt = makeDebt();

        expect(isDebtInstallmentPaidAsOf(debt, new Date(2026, 1, 20), [])).toBe(
            false
        );
    });
});

describe("isDebtFullyPaidOff", () => {
    it("treats a zero balance as paid off", () => {
        expect(isDebtFullyPaidOff(makeDebt({ balance: 0 }))).toBe(true);
    });

    it("treats a payoff date as paid off even if a leftover balance remains", () => {
        expect(
            isDebtFullyPaidOff(makeDebt({ balance: 12, paidOffDate: "2026-02-01" }))
        ).toBe(true);
    });
});

describe("isDebtNotStartedAsOf", () => {
    it("is upcoming before the start date", () => {
        const debt = makeDebt({ startDate: "2026-03-01" });
        expect(isDebtNotStartedAsOf(debt, new Date(2026, 1, 20))).toBe(true);
    });

    it("has started on the start date", () => {
        const debt = makeDebt({ startDate: "2026-03-01" });
        expect(isDebtNotStartedAsOf(debt, new Date(2026, 2, 1))).toBe(false);
    });
});

describe("isDebtVisibleAsOf", () => {
    it("hides a debt before its plan starts", () => {
        const debt = makeDebt({ startDate: "2026-03-01" });

        expect(isDebtVisibleAsOf(debt, new Date(2026, 1, 20))).toBe(false);
    });

    it("shows an outstanding debt from its start date onward", () => {
        const debt = makeDebt({ startDate: "2026-01-01" });

        expect(isDebtVisibleAsOf(debt, new Date(2026, 1, 20))).toBe(true);
    });

    it("keeps a paid-off debt visible up to its payoff day, then hides it", () => {
        const debt = makeDebt({ balance: 0, paidOffDate: "2026-02-10" });

        expect(isDebtVisibleAsOf(debt, new Date(2026, 1, 10))).toBe(true);
        expect(isDebtVisibleAsOf(debt, new Date(2026, 1, 11))).toBe(false);
    });
});

describe("getBillDueOffset", () => {
    it("counts days forward to the due day", () => {
        expect(getBillDueOffset(20, new Date(2026, 1, 1), new Date(2026, 1, 15))).toBe(
            5
        );
    });

    it("goes negative once the due day has passed", () => {
        expect(getBillDueOffset(5, new Date(2026, 1, 1), new Date(2026, 1, 15))).toBe(
            -10
        );
    });

    it("clamps a due day that the month is too short to contain", () => {
        // Day 31 in a 28-day February resolves to the 28th, so from the 15th
        // the bill is 13 days out rather than being treated as overdue.
        expect(getBillDueOffset(31, new Date(2026, 1, 1), new Date(2026, 1, 15))).toBe(
            13
        );
    });

    it("uses the real month length in a leap year", () => {
        expect(getBillDueOffset(31, new Date(2024, 1, 1), new Date(2024, 1, 15))).toBe(
            14
        );
    });
});

describe("getBillDueStatus", () => {
    const month = new Date(2026, 1, 1);

    it("reports a settled bill as paid regardless of its due day", () => {
        const bill = makeBill({ dueDay: 5 });
        const payments = [makeBillPayment({ billId: bill.id, date: "2026-02-05" })];

        expect(
            getBillDueStatus(bill, payments, 3, new Date(2026, 1, 20), new Date(2026, 1, 20))
        ).toBe("paid");
    });

    it("reports an unpaid bill past its due day as overdue", () => {
        const bill = makeBill({ dueDay: 5 });

        expect(getBillDueStatus(bill, [], 3, month, new Date(2026, 1, 15))).toBe(
            "overdue"
        );
    });

    it("reports a bill inside the warning window as due soon", () => {
        const bill = makeBill({ dueDay: 18 });

        expect(getBillDueStatus(bill, [], 3, month, new Date(2026, 1, 15))).toBe(
            "due-soon"
        );
    });

    it("treats a bill due today as due soon, not overdue", () => {
        const bill = makeBill({ dueDay: 15 });

        expect(getBillDueStatus(bill, [], 3, month, new Date(2026, 1, 15))).toBe(
            "due-soon"
        );
    });

    it("reports anything beyond the window as upcoming", () => {
        const bill = makeBill({ dueDay: 25 });

        expect(getBillDueStatus(bill, [], 3, month, new Date(2026, 1, 15))).toBe(
            "upcoming"
        );
    });
});

describe("dueCatalogStatus", () => {
    it("is paid when this month is already logged", () => {
        expect(dueCatalogStatus(10, true, new Date(2026, 8, 10))).toBe("paid");
    });

    it("is overdue after the due day", () => {
        expect(dueCatalogStatus(5, false, new Date(2026, 8, 10))).toBe("overdue");
    });

    it("is due soon inside the 3-day window", () => {
        expect(dueCatalogStatus(12, false, new Date(2026, 8, 10))).toBe("due-soon");
    });

    it("is upcoming when the due day is further out", () => {
        expect(dueCatalogStatus(25, false, new Date(2026, 8, 10))).toBe(
            "upcoming"
        );
    });
});

describe("dueCatalogLabel", () => {
    it("names paid, overdue, and soon so color is not the only cue", () => {
        expect(dueCatalogLabel("paid")).toBe("Paid");
        expect(dueCatalogLabel("skipped")).toBe("Skipped");
        expect(dueCatalogLabel("overdue")).toBe("Overdue");
        expect(dueCatalogLabel("due-soon")).toBe("Soon");
    });

    it("leaves upcoming unlabeled so the due day can lead", () => {
        expect(dueCatalogLabel("upcoming")).toBeNull();
    });
});

describe("billDueStatusReference", () => {
    const today = new Date(2026, 1, 15);

    it("uses the real today when viewing the current month", () => {
        const reference = billDueStatusReference(new Date(2026, 1, 28), today);

        // Month end must not be used, or every bill due before the 28th would
        // look overdue for the whole month.
        expect(toIsoDate(reference)).toBe("2026-02-15");
    });

    it("uses the period end when looking back at a past month", () => {
        const reference = billDueStatusReference(new Date(2026, 0, 31), today);

        expect(toIsoDate(reference)).toBe("2026-01-31");
    });

    it("uses today when looking ahead, so future bills are not yet overdue", () => {
        const reference = billDueStatusReference(new Date(2026, 5, 30), today);

        expect(toIsoDate(reference)).toBe("2026-02-15");
    });
});

describe("filterBySearch", () => {
    it("matches name or source, ignoring case and surrounding space", () => {
        const items = [
            { name: "Rent" },
            { source: "Salary" },
            { name: "Coffee", source: "GCash" },
        ];

        expect(filterBySearch(items, "  rent ")).toEqual([{ name: "Rent" }]);
        expect(filterBySearch(items, "SAL")).toEqual([{ source: "Salary" }]);
        expect(filterBySearch(items, "gcash")).toEqual([
            { name: "Coffee", source: "GCash" },
        ]);
    });

    it("returns everything when the query is blank", () => {
        const items = [{ name: "Rent" }];

        expect(filterBySearch(items, "   ")).toEqual(items);
    });
});

describe("filterByCategory", () => {
    it("keeps only the chosen category", () => {
        const items = [
            { name: "Coffee", category: "Food" },
            { name: "Bus", category: "Transport" },
        ];

        expect(filterByCategory(items, "Food")).toEqual([items[0]]);
    });

    it("returns everything when no category is chosen", () => {
        const items = [{ name: "Coffee", category: "Food" }];

        expect(filterByCategory(items, null)).toEqual(items);
    });
});
