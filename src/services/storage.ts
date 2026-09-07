import { billsData, debtData, expensesData, savingsData } from "@/constants/sample-data";
import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { Expense } from "@/types/expense";
import { SavingsGoal } from "@/types/savings";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BILLS_KEY = "bills";
const EXPENSES_KEY = "expenses";
const DEBTS_KEY = "debts";
const SAVINGS_KEY = "savings";

/**
 * Phase 2.5 migration: old installs stored bill-shaped data under "expenses".
 * Move those records to "bills" and seed everyday expenses once.
 */
async function migrateLegacyExpensesIfNeeded(): Promise<void> {
    const billsRaw = await AsyncStorage.getItem(BILLS_KEY);
    if (billsRaw !== null) {
        return;
    }

    const expensesRaw = await AsyncStorage.getItem(EXPENSES_KEY);
    if (expensesRaw === null) {
        return;
    }

    try {
        const parsed = JSON.parse(expensesRaw) as unknown;
        if (!Array.isArray(parsed) || parsed.length === 0) {
            return;
        }

        const first = parsed[0] as Record<string, unknown>;
        const looksLikeBill =
            typeof first.dueDay === "number" ||
            typeof first.isRecurring === "boolean";

        if (looksLikeBill) {
            await AsyncStorage.setItem(BILLS_KEY, expensesRaw);
            await AsyncStorage.setItem(
                EXPENSES_KEY,
                JSON.stringify(expensesData)
            );
        }
    } catch {
        // Leave storage alone if parse fails; loaders will re-seed.
    }
}

// Bills

export async function loadBills(): Promise<Bill[]> {
    await migrateLegacyExpensesIfNeeded();

    const raw = await AsyncStorage.getItem(BILLS_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(BILLS_KEY, JSON.stringify(billsData));
        return billsData;
    }

    return JSON.parse(raw) as Bill[];
}

export async function saveBills(bills: Bill[]): Promise<void> {
    await AsyncStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

// Everyday expenses

export async function loadExpenses(): Promise<Expense[]> {
    await migrateLegacyExpensesIfNeeded();

    const raw = await AsyncStorage.getItem(EXPENSES_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expensesData));
        return expensesData;
    }

    return JSON.parse(raw) as Expense[];
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// Debts

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
        BILLS_KEY,
        EXPENSES_KEY,
        DEBTS_KEY,
        SAVINGS_KEY,
    ]);
}

export async function resetToSampleData(): Promise<void> {
    await clearAllData();
    await saveBills(billsData);
    await saveExpenses(expensesData);
    await saveDebts(debtData);
    await saveSavings(savingsData);
}
