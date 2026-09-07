import { loadIncome, saveIncome } from "@/services/storage";
import { Income } from "@/types/income";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type IncomeContextValue = {
    income: Income[];
    loading: boolean;
    addIncome: (entry: Income) => Promise<void>;
    updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
    deleteIncome: (id: string) => Promise<void>;
    reload: () => Promise<void>;
};

const IncomeContext = createContext<IncomeContextValue | null>(null);

export function IncomeProvider({ children }: { children: React.ReactNode }) {
    const [income, setIncome] = useState<Income[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadIncome().then(setIncome).finally(() => setLoading(false));
    }, []);

    const addIncome = useCallback(async (entry: Income) => {
        const updated = [...income, entry];
        setIncome(updated);
        await saveIncome(updated);
    }, [income]);

    const updateIncome = useCallback(async (id: string, updates: Partial<Income>) => {
        const updated = income.map((entry) => {
            if (entry.id === id) {
                return { ...entry, ...updates };
            }
            return entry;
        });
        setIncome(updated);
        await saveIncome(updated);
    }, [income]);

    const deleteIncome = useCallback(async (id: string) => {
        const updated = income.filter((entry) => entry.id !== id);
        setIncome(updated);
        await saveIncome(updated);
    }, [income]);

    const reload = useCallback(async () => {
        setLoading(true);
        const data = await loadIncome();
        setIncome(data);
        setLoading(false);
    }, []);

    return (
        <IncomeContext.Provider
            value={{
                income,
                loading,
                addIncome,
                updateIncome,
                deleteIncome,
                reload,
            }}
        >
            {children}
        </IncomeContext.Provider>
    );
}

export function useIncome() {
    const context = useContext(IncomeContext);
    if (!context) {
        throw new Error("useIncome must be used inside IncomeProvider");
    }
    return context;
}
