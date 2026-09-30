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
    getAccountSplitThrough,
    getAvailableToTransfer,
} from "@/utils/account-balances";
import { getRangeForPeriod } from "@/utils/date";
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
});
