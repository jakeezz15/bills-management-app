import {
    loadAccounts,
    loadTransfers,
    saveAccounts,
    saveTransfers,
} from "@/services/storage";
import { CASH_ACCOUNT_ID, CashAccount } from "@/types/account";
import { Transfer } from "@/types/transfer";
import {
    createDefaultAccounts,
    ensureDefaultAccounts,
    nextAccountColor,
    onlineAccounts,
    primaryOnlineAccount,
} from "@/utils/accounts";
import { stampCreate, stampUpdate } from "@/utils/timestamps";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

type AccountsContextValue = {
    accounts: CashAccount[];
    transfers: Transfer[];
    loading: boolean;
    cashAccount: CashAccount;
    primaryOnlineId: string;
    reload: () => Promise<void>;
    addOnlineAccount: (name: string) => Promise<CashAccount>;
    renameAccount: (id: string, name: string) => Promise<void>;
    setPrimaryOnline: (id: string) => Promise<void>;
    archiveOnlineAccount: (id: string) => Promise<void>;
    addTransfer: (
        entry: Omit<Transfer, "id" | "createdAt" | "updatedAt">
    ) => Promise<void>;
    deleteTransfer: (id: string) => Promise<void>;
};

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: React.ReactNode }) {
    const [accounts, setAccounts] = useState<CashAccount[]>(() =>
        createDefaultAccounts()
    );
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        setLoading(true);
        const [nextAccounts, nextTransfers] = await Promise.all([
            loadAccounts(),
            loadTransfers(),
        ]);
        setAccounts(nextAccounts);
        setTransfers(nextTransfers);
        setLoading(false);
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const cashAccount = useMemo(
        () =>
            accounts.find((account) => account.id === CASH_ACCOUNT_ID) ??
            createDefaultAccounts()[0]!,
        [accounts]
    );

    const primaryOnlineId = useMemo(
        () => primaryOnlineAccount(accounts)?.id ?? CASH_ACCOUNT_ID,
        [accounts]
    );

    const persistAccounts = useCallback(async (next: CashAccount[]) => {
        const ensured = ensureDefaultAccounts(next);
        setAccounts(ensured);
        await saveAccounts(ensured);
    }, []);

    const addOnlineAccount = useCallback(
        async (name: string) => {
            const trimmed = name.trim() || "Online";
            const created: CashAccount = {
                id: `online-${Date.now()}`,
                kind: "online",
                name: trimmed,
                color: nextAccountColor(accounts),
                isPrimary: primaryOnlineAccount(accounts) === null,
                ...stampCreate(),
            };
            await persistAccounts([...accounts, created]);
            return created;
        },
        [accounts, persistAccounts]
    );

    const renameAccount = useCallback(
        async (id: string, name: string) => {
            const trimmed = name.trim();
            if (!trimmed) {
                return;
            }
            await persistAccounts(
                accounts.map((account) =>
                    account.id === id
                        ? { ...account, name: trimmed, ...stampUpdate() }
                        : account
                )
            );
        },
        [accounts, persistAccounts]
    );

    const setPrimaryOnline = useCallback(
        async (id: string) => {
            await persistAccounts(
                accounts.map((account) => {
                    if (account.kind !== "online") {
                        return account;
                    }
                    return {
                        ...account,
                        isPrimary: account.id === id,
                        ...stampUpdate(),
                    };
                })
            );
        },
        [accounts, persistAccounts]
    );

    const archiveOnlineAccount = useCallback(
        async (id: string) => {
            if (id === CASH_ACCOUNT_ID) {
                return;
            }
            // Keep at least one Online pot so pickers always have a destination.
            if (onlineAccounts(accounts).length <= 1) {
                return;
            }
            const next = accounts.map((account) =>
                account.id === id
                    ? {
                          ...account,
                          archived: true,
                          isPrimary: false,
                          ...stampUpdate(),
                      }
                    : account
            );
            await persistAccounts(next);
        },
        [accounts, persistAccounts]
    );

    const addTransfer = useCallback(
        async (entry: Omit<Transfer, "id" | "createdAt" | "updatedAt">) => {
            if (
                entry.amount <= 0 ||
                entry.fromAccountId === entry.toAccountId
            ) {
                throw new Error("Transfer needs two different accounts and an amount.");
            }
            const stamped: Transfer = {
                ...entry,
                id: `transfer-${Date.now()}`,
                ...stampCreate(),
            };
            const updated = [...transfers, stamped];
            setTransfers(updated);
            await saveTransfers(updated);
        },
        [transfers]
    );

    const deleteTransfer = useCallback(
        async (id: string) => {
            const updated = transfers.filter((item) => item.id !== id);
            setTransfers(updated);
            await saveTransfers(updated);
        },
        [transfers]
    );

    return (
        <AccountsContext.Provider
            value={{
                accounts,
                transfers,
                loading,
                cashAccount,
                primaryOnlineId,
                reload,
                addOnlineAccount,
                renameAccount,
                setPrimaryOnline,
                archiveOnlineAccount,
                addTransfer,
                deleteTransfer,
            }}
        >
            {children}
        </AccountsContext.Provider>
    );
}

export function useAccounts() {
    const context = useContext(AccountsContext);
    if (!context) {
        throw new Error("useAccounts must be used inside AccountsProvider");
    }
    return context;
}
