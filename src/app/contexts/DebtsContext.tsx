import { loadDebts, saveDebts } from "@/services/storage";
import { Debt } from "@/types/debt";
import { createContext, useCallback, useContext, useEffect, useState } from "react";


type DebtsContextValue = {
    debts: Debt[];
    loading: boolean;
    addDebt: (debt: Debt) => Promise<void>
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

    return (
        <DebtsContext.Provider value={{ debts, loading, addDebt }}>
            {children}
        </DebtsContext.Provider>
    )
}
export function useDebt() {
    const context = useContext(DebtsContext);
    if (!context) {
        throw new Error("useExpenses must be used inside DebtsProvider");
    }
    return context;
}