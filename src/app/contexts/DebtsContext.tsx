import { loadDebts, saveDebts } from "@/services/storage";
import { Debt } from "@/types/debt";
import { createContext, useCallback, useContext, useEffect, useState } from "react";


type DebtsContextValue = {
    debts: Debt[];
    loading: boolean;
    addDebt: (debt: Debt) => Promise<void>;
    updateDebt: (id: string, updates: Partial<Debt>) => Promise<void>;
    deleteDebt: (id: string) => Promise<void>;
    reload: () => Promise<void>;
}
const DebtsContext = createContext<DebtsContextValue | null>(null);

export function DebtsProvider({ children }: { children: React.ReactNode }) {
    const [debts, setDebts] = useState<Debt[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        loadDebts().then(setDebts).finally(() => setLoading(false))
    }, []);

    const addDebt = useCallback(async (debt: Debt) => {
        const updated = [...debts, debt]
        setDebts(updated);
        await saveDebts(updated);
    }, [debts]);

    const updateDebt = useCallback(async (id: string, updates: Partial<Debt>) => {
        const updated = debts.map((debt) => {
            if (debt.id === id) {
                return { ...debt, ...updates };
            }
            return debt;
        });
        setDebts(updated);
        await saveDebts(updated);
    }, [debts]);

    const deleteDebt = useCallback(async (id: string) => {
        const updated = debts.filter((debt) => debt.id !== id);
        setDebts(updated);
        await saveDebts(updated);
    }, [debts]);

    const reload = useCallback(async () => {
        setLoading(true);
        const data = await loadDebts();
        setDebts(data);
        setLoading(false);
    }, [])

    return (
        <DebtsContext.Provider value={{ debts, loading, addDebt, updateDebt, deleteDebt, reload }}>
            {children}
        </DebtsContext.Provider>
    )
}
export function useDebt() {
    const context = useContext(DebtsContext);
    if (!context) {
        throw new Error("useDebt must be used inside DebtsProvider");
    }
    return context;
}