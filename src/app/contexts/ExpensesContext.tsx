import { loadExpenses, saveExpenses } from "@/services/storage";
import { Expenses } from "@/types/expense";
import { createContext, useCallback, useContext, useEffect, useState } from "react";


type ExpensesContextValue = {
    expenses: Expenses[];
    loading: boolean;
    addExpense: (expense: Expenses) => Promise<void>
}
const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
    const [expenses, setExpenses] = useState<Expenses[]>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        loadExpenses().then(setExpenses).finally(() => setLoading(false))
    }, []);

    const addExpense = useCallback(async (expense: Expenses) => {
        const updated = [...expenses, expense]
        setExpenses(updated);
        await saveExpenses(updated);
    }, [expenses]);

    return (
        <ExpensesContext.Provider value={{ expenses, loading, addExpense }}>
            {children}
        </ExpensesContext.Provider>
    )
}
export function useExpenses() {
    const context = useContext(ExpensesContext);
    if (!context) {
        throw new Error("useExpenses must be used inside ExpensesProvider");
    }
    return context;
}