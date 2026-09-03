import { debtData, expensesData, savingsData } from "@/constants/sample-data";
import { Debt } from "@/types/debt";
import { Expenses } from "@/types/expense";
import { SavingsGoal } from "@/types/savings";
import AsyncStorage from "@react-native-async-storage/async-storage";



// expenses
const EXPENSES_KEY = "expenses";

export async function loadExpenses(): Promise<Expenses[]> {
    const raw = await AsyncStorage.getItem(EXPENSES_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expensesData));
        return expensesData
    }
    return JSON.parse(raw) as Expenses[];
}

export async function saveExpenses(expenses: Expenses[]): Promise<void> {
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// debts

const DEBTS_KEY = "debts";

export async function loadDebts(): Promise<Debt[]> {
    const raw = await AsyncStorage.getItem(DEBTS_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(DEBTS_KEY, JSON.stringify(debtData));
        return debtData;
    }
    return JSON.parse(raw) as Debt[];
}

export async function saveDebts(debts: Debt[]): Promise<void> {
    await AsyncStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
}

// Savings

const SAVINGS_KEY = "savings";

export async function loadSavings(): Promise<SavingsGoal[]> {
    const raw = await AsyncStorage.getItem(SAVINGS_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(SAVINGS_KEY, JSON.stringify(savingsData));
        return savingsData;
    }
    return JSON.parse(raw) as SavingsGoal[];
}

export async function saveSavings(savings: SavingsGoal[]): Promise<void> {
    await AsyncStorage.setItem(SAVINGS_KEY, JSON.stringify(savings));
}


export async function clearAllData(): Promise<void> {
    await AsyncStorage.multiRemove([
        EXPENSES_KEY,
        DEBTS_KEY,
        SAVINGS_KEY,
    ]);
}

export async function resetToSampleData(): Promise<void> {
    await clearAllData();
    await saveExpenses(expensesData);
    await saveDebts(debtData);
    await saveSavings(savingsData);
}