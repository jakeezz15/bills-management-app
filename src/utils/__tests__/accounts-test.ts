import { ACCOUNT_COLORS } from "@/design";
import {
    CASH_ACCOUNT_ID,
    DEFAULT_ONLINE_ACCOUNT_ID,
} from "@/types/account";
import {
    createDefaultAccounts,
    ensureDefaultAccounts,
    accountAvatarLetter,
    primaryOnlineAccount,
} from "@/utils/accounts";
import {
    getAccountBalanceThrough,
    getAccountSplitThrough,
    getAvailableToDebit,
    getAvailableToTransfer,
    getDebitShortfall,
    getPotActivity,
} from "@/utils/account-balances";
import { getRangeForPeriod, rangeThrough } from "@/utils/date";
import {
    makeExpense,
    makeIncome,
} from "./factories";

describe("accounts helpers", () => {
    it("seeds Cash + Online defaults", () => {
        const accounts = createDefaultAccounts();
        expect(accounts.map((a) => a.id)).toEqual([
            CASH_ACCOUNT_ID,
            DEFAULT_ONLINE_ACCOUNT_ID,
        ]);
        expect(primaryOnlineAccount(accounts)?.id).toBe(
            DEFAULT_ONLINE_ACCOUNT_ID
        );
    });

    it("ensures missing Cash / Online are restored", () => {
        const ensured = ensureDefaultAccounts([]);
        expect(ensured.some((a) => a.id === CASH_ACCOUNT_ID)).toBe(true);
        expect(ensured.some((a) => a.kind === "online")).toBe(true);
    });

    it("picks an avatar letter from the name", () => {
        expect(accountAvatarLetter("GCash")).toBe("G");
        expect(accountAvatarLetter("  bdo")).toBe("B");
    });
});

describe("getAccountSplitThrough", () => {
    const february = getRangeForPeriod(new Date(2026, 1, 15), "month");
    const accounts = createDefaultAccounts();

    it("puts legacy (untagged) cash rows into Cash and keeps Online at zero", () => {
        const split = getAccountSplitThrough(
            february,
            accounts,
            [makeIncome({ date: "2026-02-01", net: 1000, source: "Job" })],
            [makeExpense({ date: "2026-02-02", amount: 100, name: "Food" })],
            [],
            [],
            [],
            []
        );
        // parse defaults accountId to cash; factories omit it → treated as cash
        expect(split.cash).toBe(900);
        expect(split.online).toBe(0);
        expect(split.total).toBe(900);
    });

    it("splits by accountId and applies transfers", () => {
        const split = getAccountSplitThrough(
            february,
            accounts,
            [
                makeIncome({
                    date: "2026-02-01",
                    net: 5000,
                    source: "Job",
                    accountId: DEFAULT_ONLINE_ACCOUNT_ID,
                }),
            ],
            [
                makeExpense({
                    date: "2026-02-03",
                    amount: 200,
                    name: "Coffee",
                    accountId: CASH_ACCOUNT_ID,
                }),
            ],
            [],
            [],
            [],
            [
                {
                    id: "t1",
                    date: "2026-02-02",
                    amount: 1000,
                    fromAccountId: DEFAULT_ONLINE_ACCOUNT_ID,
                    toAccountId: CASH_ACCOUNT_ID,
                    createdAt: "2026-02-02T00:00:00.000Z",
                    updatedAt: "2026-02-02T00:00:00.000Z",
                },
            ]
        );
        // Online: +5000 -1000 transfer = 4000
        // Cash: +1000 transfer -200 spend = 800
        expect(split.online).toBe(4000);
        expect(split.cash).toBe(800);
        expect(split.total).toBe(4800);
    });

    it("keeps archived Online balances in the Online rollup", () => {
        const withArchived = [
            ...accounts,
            {
                id: "online-old",
                kind: "online" as const,
                name: "Old bank",
                color: ACCOUNT_COLORS[2],
                archived: true,
                createdAt: "2026-01-01T00:00:00.000Z",
                updatedAt: "2026-01-01T00:00:00.000Z",
            },
        ];
        const split = getAccountSplitThrough(
            february,
            withArchived,
            [
                makeIncome({
                    date: "2026-02-01",
                    net: 300,
                    source: "Side",
                    accountId: "online-old",
                }),
                makeIncome({
                    date: "2026-02-01",
                    net: 700,
                    source: "Job",
                    accountId: DEFAULT_ONLINE_ACCOUNT_ID,
                }),
            ],
            [],
            [],
            [],
            [],
            []
        );
        expect(split.online).toBe(1000);
        expect(
            split.byAccount.find((row) => row.accountId === "online-old")
                ?.balance
        ).toBe(300);
    });

    it("applies balance adjustments", () => {
        const split = getAccountSplitThrough(
            february,
            accounts,
            [
                makeIncome({
                    date: "2026-02-01",
                    net: 100,
                    source: "Job",
                    accountId: CASH_ACCOUNT_ID,
                }),
            ],
            [],
            [],
            [],
            [],
            [],
            [
                {
                    id: "adj1",
                    accountId: CASH_ACCOUNT_ID,
                    date: "2026-02-01",
                    delta: 50,
                    createdAt: "2026-02-01T00:00:00.000Z",
                    updatedAt: "2026-02-01T00:00:00.000Z",
                },
            ]
        );
        expect(split.cash).toBe(150);
    });
});

describe("getAvailableToTransfer", () => {
    it("reports what the source pot can send on a date", () => {
        const available = getAvailableToTransfer(
            DEFAULT_ONLINE_ACCOUNT_ID,
            "2026-02-10",
            [
                makeIncome({
                    date: "2026-02-01",
                    net: 1000,
                    source: "Job",
                    accountId: DEFAULT_ONLINE_ACCOUNT_ID,
                }),
            ],
            [],
            [],
            [],
            [],
            []
        );
        expect(available).toBe(1000);
    });

    it("is zero when the pot is empty", () => {
        expect(
            getAvailableToTransfer(
                CASH_ACCOUNT_ID,
                "2026-02-10",
                [],
                [],
                [],
                [],
                [],
                []
            )
        ).toBe(0);
    });

    it("subtracts prior outflows before allowing a transfer", () => {
        const available = getAvailableToTransfer(
            DEFAULT_ONLINE_ACCOUNT_ID,
            "2026-02-10",
            [
                makeIncome({
                    date: "2026-02-01",
                    net: 1000,
                    source: "Job",
                    accountId: DEFAULT_ONLINE_ACCOUNT_ID,
                }),
            ],
            [
                makeExpense({
                    date: "2026-02-05",
                    amount: 400,
                    name: "Shop",
                    accountId: DEFAULT_ONLINE_ACCOUNT_ID,
                }),
            ],
            [],
            [],
            [],
            []
        );
        expect(available).toBe(600);
    });

    it("includes adjustments in available funds", () => {
        const available = getAvailableToTransfer(
            CASH_ACCOUNT_ID,
            "2026-02-10",
            [],
            [],
            [],
            [],
            [],
            [],
            [
                {
                    id: "adj1",
                    accountId: CASH_ACCOUNT_ID,
                    date: "2026-02-01",
                    delta: 250,
                    createdAt: "2026-02-01T00:00:00.000Z",
                    updatedAt: "2026-02-01T00:00:00.000Z",
                },
            ]
        );
        expect(available).toBe(250);
    });
});

describe("getPotActivity", () => {
    it("lists tagged activity and treats untagged as Cash", () => {
        const rows = getPotActivity(
            CASH_ACCOUNT_ID,
            [makeIncome({ date: "2026-02-01", net: 100, source: "Tip" })],
            [
                makeExpense({
                    date: "2026-02-02",
                    amount: 20,
                    name: "Snack",
                    accountId: CASH_ACCOUNT_ID,
                }),
            ],
            [],
            [],
            [],
            [],
            [
                {
                    id: "adj1",
                    accountId: CASH_ACCOUNT_ID,
                    date: "2026-02-03",
                    delta: 5,
                    note: "Opening",
                    createdAt: "2026-02-03T00:00:00.000Z",
                    updatedAt: "2026-02-03T00:00:00.000Z",
                },
            ]
        );
        expect(rows.map((row) => row.kind)).toEqual([
            "adjustment",
            "expense",
            "income",
        ]);
        expect(
            getAccountBalanceThrough(
                CASH_ACCOUNT_ID,
                rangeThrough(new Date(2026, 1, 28)),
                [makeIncome({ date: "2026-02-01", net: 100, source: "Tip" })],
                [
                    makeExpense({
                        date: "2026-02-02",
                        amount: 20,
                        name: "Snack",
                        accountId: CASH_ACCOUNT_ID,
                    }),
                ],
                [],
                [],
                [],
                [],
                [
                    {
                        id: "adj1",
                        accountId: CASH_ACCOUNT_ID,
                        date: "2026-02-03",
                        delta: 5,
                        createdAt: "2026-02-03T00:00:00.000Z",
                        updatedAt: "2026-02-03T00:00:00.000Z",
                    },
                ]
            )
        ).toBe(85);
    });
});

describe("getDebitShortfall", () => {
    const ledgerBase = {
        income: [] as ReturnType<typeof makeIncome>[],
        expenses: [] as ReturnType<typeof makeExpense>[],
        billPayments: [] as [],
        debtPayments: [] as [],
        savingsContributions: [] as [],
        transfers: [] as [],
        adjustments: [] as {
            id: string;
            accountId: string;
            date: string;
            delta: number;
            createdAt: string;
            updatedAt: string;
        }[],
    };

    it("rejects when the pot is negative", () => {
        const ledger = {
            ...ledgerBase,
            adjustments: [
                {
                    id: "adj1",
                    accountId: DEFAULT_ONLINE_ACCOUNT_ID,
                    date: "2026-02-01",
                    delta: -50,
                    createdAt: "2026-02-01T00:00:00.000Z",
                    updatedAt: "2026-02-01T00:00:00.000Z",
                },
            ],
        };
        expect(
            getDebitShortfall(
                DEFAULT_ONLINE_ACCOUNT_ID,
                10,
                "2026-02-10",
                ledger
            )
        ).toBe(60);
        expect(
            getAvailableToDebit(
                DEFAULT_ONLINE_ACCOUNT_ID,
                "2026-02-10",
                ledger
            )
        ).toBe(-50);
    });

    it("allows when funds cover the amount", () => {
        const ledger = {
            ...ledgerBase,
            income: [
                makeIncome({
                    date: "2026-02-01",
                    net: 100,
                    source: "Job",
                    accountId: DEFAULT_ONLINE_ACCOUNT_ID,
                }),
            ],
        };
        expect(
            getDebitShortfall(
                DEFAULT_ONLINE_ACCOUNT_ID,
                40,
                "2026-02-10",
                ledger
            )
        ).toBe(0);
    });

    it("excludes the expense being edited from available", () => {
        const expense = makeExpense({
            id: "e1",
            date: "2026-02-05",
            amount: 30,
            name: "Food",
            accountId: CASH_ACCOUNT_ID,
        });
        const ledger = {
            ...ledgerBase,
            income: [
                makeIncome({
                    date: "2026-02-01",
                    net: 50,
                    source: "Job",
                    accountId: CASH_ACCOUNT_ID,
                }),
            ],
            expenses: [expense],
        };
        // With e1 counted: available = 20; raising to 50 would shortfall.
        expect(
            getDebitShortfall(CASH_ACCOUNT_ID, 50, "2026-02-10", ledger)
        ).toBe(30);
        // Excluding e1: available = 50; same amount ok.
        expect(
            getDebitShortfall(CASH_ACCOUNT_ID, 50, "2026-02-10", ledger, {
                expenseId: "e1",
            })
        ).toBe(0);
    });
});
