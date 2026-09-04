import { loadSavings, saveSavings } from "@/services/storage";
import { SavingsGoal } from "@/types/savings";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type SavingsContextValue = {
    savings: SavingsGoal[];
    loading: boolean;
    addSavings: (saving: SavingsGoal) => Promise<void>;
    updateSavings: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
    deleteSavings: (id: string) => Promise<void>;
    reload: () => Promise<void>;
};

const SavingsContext = createContext<SavingsContextValue | null>(null);

export function SavingsProvider({ children }: { children: React.ReactNode }) {
    const [savings, setSavings] = useState<SavingsGoal[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        loadSavings().then(setSavings).finally(() => setLoading(false));
    }, []);

    const addSavings = useCallback(async (saving: SavingsGoal) => {
        const updated = [...savings, saving];
        setSavings(updated);
        await saveSavings(updated);
    }, [savings]);

    const updateSavings = useCallback(async (id: string, updates: Partial<SavingsGoal>) => {
        const updated = savings.map((item) => {
            if (item.id === id) {
                return {
                    ...item, ...updates
                }
            }
            return item;
        })
        setSavings(updated);
        await saveSavings(updated)

    }, [savings])

    const deleteSavings = useCallback(async (id: string) => {
        const updated = savings.filter((item) => item.id !== id)
        setSavings(updated);
        await saveSavings(updated);

    }, [savings])

    const reload = useCallback(async () => {
        setLoading(true);
        const data = await loadSavings();
        setSavings(data);
        setLoading(false);
    }, [])

    return (
        <SavingsContext.Provider value={{ savings, loading, addSavings, reload, updateSavings, deleteSavings }}>
            {children}
        </SavingsContext.Provider>
    );
}

export function useSavings() {
    const context = useContext(SavingsContext);
    if (!context) {
        throw new Error("useSavings must be used inside SavingsProvider");
    }
    return context;
}
