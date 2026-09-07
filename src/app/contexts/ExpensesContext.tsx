import { loadExpenses, saveExpenses } from "@/services/storage";
import { Expense } from "@/types/expense";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

type ExpensesContextValue = {
    expenses: Expense[];
    loading: boolean;
    addExpense: (expense: Expense) => Promise<void>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    reload: () => Promise<void>;
};

const ExpensesContext = createContext<ExpensesContextValue | null>(null);

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadExpenses().then(setExpenses).finally(() => setLoading(false));
    }, []);

    const addExpense = useCallback(async (expense: Expense) => {
        const updated = [...expenses, expense];
        setExpenses(updated);
        await saveExpenses(updated);
    }, [expenses]);

    const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
        const updated = expenses.map((expense) => {
            if (expense.id === id) {
                return { ...expense, ...updates };
            }
            return expense;
        });
        setExpenses(updated);
        await saveExpenses(updated);
    }, [expenses]);

    const deleteExpense = useCallback(async (id: string) => {
        const updated = expenses.filter((expense) => expense.id !== id);
        setExpenses(updated);
        await saveExpenses(updated);
    }, [expenses]);

    const reload = useCallback(async () => {
        setLoading(true);
        const data = await loadExpenses();
        setExpenses(data);
        setLoading(false);
    }, []);

    return (
        <ExpensesContext.Provider
            value={{
                expenses,
                loading,
                addExpense,
                updateExpense,
                deleteExpense,
                reload,
            }}
        >
            {children}
        </ExpensesContext.Provider>
    );
}

export function useExpenses() {
    const context = useContext(ExpensesContext);
    if (!context) {
        throw new Error("useExpenses must be used inside ExpensesProvider");
    }
    return context;
}
