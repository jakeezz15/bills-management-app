import { loadDebts, saveDebts } from "@/services/storage";
import { Debt } from "@/types/debt";
import { toIsoDate } from "@/utils/date";
import { stampCreate, stampUpdate } from "@/utils/timestamps";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type DebtsContextValue = {
    debts: Debt[];
    loading: boolean;
    addDebt: (debt: Omit<Debt, "createdAt" | "updatedAt">) => Promise<void>;
    updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
    deleteDebt: (id: string) => Promise<void>;
    recordPayment: (
        id: string,
        amount?: number,
        paymentDate?: string
    ) => Promise<void>;
    reload: () => Promise<void>;
};

const DebtsContext = createContext<DebtsContextValue | null>(null);

function withPaidOffState(
    debt: Debt,
    nextBalance: number,
    paymentDate: string
): Partial<Debt> {
    if (nextBalance <= 0) {
        return {
            balance: 0,
            paidOffDate: debt.paidOffDate ?? paymentDate,
            isPaid: true,
        };
    }

    return {
        balance: nextBalance,
        paidOffDate: undefined,
    };
}

export function DebtsProvider({ children }: { children: React.ReactNode }) {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDebts().then(setDebts).finally(() => setLoading(false));
    }, []);

    const addDebt = useCallback(async (debt: Omit<Debt, "createdAt" | "updatedAt">) => {
        const stamps = stampCreate();
        const stamped: Debt = {
            ...debt,
            ...stamps,
            startDate: debt.startDate || toIsoDate(new Date()),
        };
        const updated = [...debts, stamped];
        setDebts(updated);
        await saveDebts(updated);
    }, [debts]);

    const updateDebt = useCallback(async (id: string, updates: Partial<Debt>) => {
        const updated = debts.map((debt) => {
            if (debt.id !== id) {
                return debt;
            }

            const merged = { ...debt, ...updates, ...stampUpdate() };
            if (typeof updates.balance === "number") {
                const paymentDate = toIsoDate(new Date());
                return {
                    ...merged,
                    ...withPaidOffState(merged, updates.balance, paymentDate),
                };
            }
            return merged;
        });
        setDebts(updated);
        await saveDebts(updated);
    }, [debts]);

    const deleteDebt = useCallback(async (id: string) => {
        const updated = debts.filter((debt) => debt.id !== id);
        setDebts(updated);
        await saveDebts(updated);
    }, [debts]);

    const recordPayment = useCallback(async (
        id: string,
        amount?: number,
        paymentDate?: string
    ) => {
        const paidOn = paymentDate ?? toIsoDate(new Date());

        const updated = debts.map((debt) => {
            if (debt.id !== id) {
                return debt;
            }

            if (debt.balance <= 0) {
                return debt;
            }

            const requested = amount ?? debt.minimumPayment;
            const payment = Math.min(Math.max(requested, 0), debt.balance);
            const nextBalance = Math.round((debt.balance - payment) * 100) / 100;

            return {
                ...debt,
                totalPaid: (debt.totalPaid ?? 0) + payment,
                isPaid: true,
                lastPaymentDate: paidOn,
                ...stampUpdate(),
                ...withPaidOffState(debt, nextBalance, paidOn),
            };
        });

        setDebts(updated);
        await saveDebts(updated);
    }, [debts]);

    const reload = useCallback(async () => {
        setLoading(true);
        const data = await loadDebts();
        setDebts(data);
        setLoading(false);
    }, []);

    return (
        <DebtsContext.Provider
            value={{
                debts,
                loading,
                addDebt,
                updateDebt,
                deleteDebt,
                recordPayment,
                reload,
            }}
        >
            {children}
        </DebtsContext.Provider>
    );
}

export function useDebt() {
    const context = useContext(DebtsContext);
    if (!context) {
        throw new Error("useDebt must be used inside DebtsProvider");
    }
    return context;
}
