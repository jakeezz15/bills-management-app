import { ACCOUNT_COLORS } from "@/design";
import {
    CASH_ACCOUNT_ID,
    CashAccount,
    DEFAULT_ONLINE_ACCOUNT_ID,
} from "@/types/account";
import { stampCreate } from "@/utils/timestamps";

/** Seed accounts for a new install (or missing accounts key). */
export function createDefaultAccounts(now = stampCreate()): CashAccount[] {
    return [
        {
            id: CASH_ACCOUNT_ID,
            kind: "cash",
            name: "Cash",
            color: ACCOUNT_COLORS[0],
            ...now,
        },
        {
            id: DEFAULT_ONLINE_ACCOUNT_ID,
            kind: "online",
            name: "Online",
            color: ACCOUNT_COLORS[1],
            isPrimary: true,
            ...now,
        },
    ];
}

/** First letter for avatar — skips spaces/symbols. */
export function accountAvatarLetter(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) {
        return "?";
    }
    const match = trimmed.match(/[A-Za-z0-9]/);
    return (match?.[0] ?? trimmed[0]!).toUpperCase();
}

export function isCashAccountId(id: string): boolean {
    return id === CASH_ACCOUNT_ID;
}

/** Active (non-archived) accounts for pickers. Cash always included. */
export function activeAccounts(accounts: CashAccount[]): CashAccount[] {
    return accounts.filter(
        (account) => account.kind === "cash" || account.archived !== true
    );
}

export function onlineAccounts(accounts: CashAccount[]): CashAccount[] {
    return accounts.filter(
        (account) => account.kind === "online" && account.archived !== true
    );
}

/** Primary Online account, or first Online, or null. */
export function primaryOnlineAccount(
    accounts: CashAccount[]
): CashAccount | null {
    const online = onlineAccounts(accounts);
    if (online.length === 0) {
        return null;
    }
    return online.find((account) => account.isPrimary) ?? online[0]!;
}

/** Default pot when logging income / bills / debts / savings. */
export function defaultInboundAccountId(accounts: CashAccount[]): string {
    return primaryOnlineAccount(accounts)?.id ?? CASH_ACCOUNT_ID;
}

/** Default pot when logging everyday spending. */
export function defaultSpendAccountId(_accounts: CashAccount[]): string {
    return CASH_ACCOUNT_ID;
}

/**
 * Ensure Cash + at least one Online exist. Keeps user Online accounts.
 * Does not mutate input — returns a new array when changes are needed.
 */
export function ensureDefaultAccounts(
    accounts: CashAccount[] | null | undefined
): CashAccount[] {
    const list = accounts ? [...accounts] : [];
    const stamps = stampCreate();
    let changed = false;

    if (!list.some((account) => account.id === CASH_ACCOUNT_ID)) {
        list.unshift({
            id: CASH_ACCOUNT_ID,
            kind: "cash",
            name: "Cash",
            color: ACCOUNT_COLORS[0],
            ...stamps,
        });
        changed = true;
    }

    const hasOnline = list.some(
        (account) => account.kind === "online" && account.archived !== true
    );
    if (!hasOnline) {
        list.push({
            id: DEFAULT_ONLINE_ACCOUNT_ID,
            kind: "online",
            name: "Online",
            color: ACCOUNT_COLORS[1],
            isPrimary: true,
            ...stamps,
        });
        changed = true;
    }

    const online = list.filter((account) => account.kind === "online");
    const primaryCount = online.filter((account) => account.isPrimary).length;
    if (online.length > 0 && primaryCount !== 1) {
        changed = true;
        return list.map((account) => {
            if (account.kind !== "online") {
                return account;
            }
            const firstOnline = online.find((item) => item.archived !== true);
            return {
                ...account,
                isPrimary: account.id === firstOnline?.id,
            };
        });
    }

    return changed ? list : accounts ?? list;
}

/** Next accent color for a newly added Online account. */
export function nextAccountColor(accounts: CashAccount[]): string {
    const used = new Set(accounts.map((account) => account.color));
    for (const color of ACCOUNT_COLORS) {
        if (!used.has(color)) {
            return color;
        }
    }
    return ACCOUNT_COLORS[(accounts.length + 1) % ACCOUNT_COLORS.length]!;
}
