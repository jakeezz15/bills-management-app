import { parseAppBackup } from "@/utils/backup-parse";
import {
    isDueDay,
    isFiniteNumber,
    isIsoDateString,
    isNonNegativeNumber,
    parseBill,
    parseExpense,
    parseIncome,
    parseStoredArray,
    parseStoredArrayDetailed,
} from "@/utils/data-validators";

describe("number guards", () => {
    it("rejects NaN and Infinity", () => {
        expect(isFiniteNumber(NaN)).toBe(false);
        expect(isFiniteNumber(Infinity)).toBe(false);
        expect(isFiniteNumber(12.5)).toBe(true);
    });

    it("rejects negative money", () => {
        expect(isNonNegativeNumber(-1)).toBe(false);
        expect(isNonNegativeNumber(0)).toBe(true);
    });

    it("accepts due days 1–31 only", () => {
        expect(isDueDay(1)).toBe(true);
        expect(isDueDay(31)).toBe(true);
        expect(isDueDay(0)).toBe(false);
        expect(isDueDay(32)).toBe(false);
        expect(isDueDay(15.5)).toBe(false);
    });
});

describe("parseStoredArray", () => {
    it("returns [] for corrupt JSON instead of throwing", () => {
        expect(parseStoredArray("{not-json", parseExpense)).toEqual([]);
    });

    it("returns [] when the root is not an array", () => {
        expect(parseStoredArray('{"a":1}', parseExpense)).toEqual([]);
    });

    it("drops invalid items and keeps valid ones", () => {
        const raw = JSON.stringify([
            {
                id: "1",
                name: "Coffee",
                amount: 4.5,
                date: "2026-09-01",
            },
            { id: "2", name: "Bad", amount: NaN, date: "2026-09-01" },
            null,
        ]);

        expect(parseStoredArray(raw, parseExpense)).toEqual([
            {
                id: "1",
                name: "Coffee",
                amount: 4.5,
                date: "2026-09-01",
            },
        ]);
    });

    it("reports corrupt and dropped counts in the detailed parse", () => {
        expect(
            parseStoredArrayDetailed("{nope", parseExpense)
        ).toMatchObject({
            items: [],
            rawCorrupt: true,
            droppedCount: 0,
        });

        const raw = JSON.stringify([
            {
                id: "1",
                name: "Coffee",
                amount: 4.5,
                date: "2026-09-01",
            },
            { id: "2", amount: 1 },
        ]);
        expect(parseStoredArrayDetailed(raw, parseExpense)).toMatchObject({
            rawCorrupt: false,
            droppedCount: 1,
        });
    });
});

describe("entity parsers", () => {
    it("rejects bills with bad amounts", () => {
        expect(
            parseBill({
                id: "b1",
                name: "Rent",
                amount: -10,
                dueDay: 1,
                isPaid: false,
                isRecurring: true,
            })
        ).toBeNull();
    });

    it("accepts a minimal valid income row", () => {
        expect(
            parseIncome({
                id: "i1",
                date: "2026-09-01",
                gross: 1000,
                net: 800,
                source: "Job",
                payCadence: "biweekly",
            })
        ).toMatchObject({
            id: "i1",
            net: 800,
            payCadence: "biweekly",
        });
    });

    it("strips unknown payCadence instead of failing the row", () => {
        expect(
            parseIncome({
                id: "i1",
                date: "2026-09-01",
                gross: 1000,
                net: 800,
                source: "Job",
                payCadence: "yearly",
            })
        ).toMatchObject({
            id: "i1",
            payCadence: undefined,
        });
    });

    it("requires a real calendar date", () => {
        expect(isIsoDateString("2026-02-30")).toBe(false);
        expect(
            parseExpense({
                id: "e1",
                name: "X",
                amount: 1,
                date: "2026-02-30",
            })
        ).toBeNull();
    });
});

describe("parseAppBackup", () => {
    const base = {
        version: 1 as const,
        exportedAt: "2026-09-12T12:00:00.000Z",
        income: [] as unknown[],
        expenses: [] as unknown[],
        bills: [] as unknown[],
        debts: [] as unknown[],
        savings: [] as unknown[],
    };

    it("accepts an empty v1 backup", () => {
        const result = parseAppBackup(base);
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.backup.debtPayments).toEqual([]);
            expect(result.prefs).toBeNull();
        }
    });

    it("rejects a bad expense without writing anything", () => {
        const result = parseAppBackup({
            ...base,
            expenses: [
                {
                    id: "e1",
                    name: "Coffee",
                    amount: "not-a-number",
                    date: "2026-09-01",
                },
            ],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toMatch(/expenses\[0\]/);
        }
    });

    it("rejects the wrong version", () => {
        const result = parseAppBackup({ ...base, version: 2 });
        expect(result.ok).toBe(false);
    });

    it("rejects a corrupt optional ledger", () => {
        const result = parseAppBackup({
            ...base,
            billPayments: [{ id: "p1" }],
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toMatch(/billPayments/);
        }
    });

    it("accepts a full valid snapshot", () => {
        const result = parseAppBackup({
            ...base,
            income: [
                {
                    id: "i1",
                    date: "2026-09-01",
                    gross: 2000,
                    net: 1600,
                    source: "Acme",
                    payCadence: "monthly",
                },
            ],
            bills: [
                {
                    id: "b1",
                    name: "Internet",
                    amount: 50,
                    dueDay: 15,
                    isPaid: false,
                    isRecurring: true,
                },
            ],
            prefs: {
                currencyCode: "USD",
                dueRemindersEnabled: true,
                dueReminderHour: 9,
                dueReminderLeadDays: 3,
            },
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.backup.income).toHaveLength(1);
            expect(result.backup.bills[0].name).toBe("Internet");
            expect(result.prefs).toEqual({
                currencyCode: "USD",
                dueRemindersEnabled: true,
                dueReminderHour: 9,
                dueReminderLeadDays: 3,
            });
        }
    });
});
