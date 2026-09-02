import { debtData, expensesData } from "@/constants/sample-data";
import { Debt } from "@/types/debt";
import { Expenses } from "@/types/expense";
import AsyncStorage from "@react-native-async-storage/async-storage";


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