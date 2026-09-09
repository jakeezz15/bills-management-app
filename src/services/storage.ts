import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import { debtStartDate, ensureTimestamps, savingsStartDate, stampCreate } from "@/utils/timestamps";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BILLS_KEY = "bills";
const EXPENSES_KEY = "expenses";
const DEBTS_KEY = "debts";
const DEBT_PAYMENTS_KEY = "debtPayments";
const BILL_PAYMENTS_KEY = "billPayments";
const SAVINGS_KEY = "savings";
const SAVINGS_CONTRIBUTIONS_KEY = "savingsContributions";
const INCOME_KEY = "income";

const FIRST_RUN_KEY = "hasCompletedFirstRun";

export async function hasCompletedFirstRun(): Promise<boolean> {
    const value = await AsyncStorage.getItem(FIRST_RUN_KEY);
    return value === "true";
}

export async function markFirstRunComplete(): Promise<void> {
    await AsyncStorage.setItem(FIRST_RUN_KEY, "true");
}

export async function seedEmptyData(): Promise<void> {
    await Promise.all([
        saveBills([]),
        saveExpenses([]),
        saveIncome([]),
        saveDebts([]),
        saveDebtPayments([]),
        saveBillPayments([]),
        saveSavings([]),
        saveSavingsContributions([]),
    ]);
}

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
            await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
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
        await AsyncStorage.setItem(BILLS_KEY, JSON.stringify([]));
        return [];
    }

    const parsed = JSON.parse(raw) as Bill[];
    return parsed.map((bill) => {
        const withTs = ensureTimestamps(bill);
        return {
            ...withTs,
            amountVaries: withTs.amountVaries === true,
            amount: withTs.amountVaries === true ? 0 : withTs.amount,
        };
    });
}

export async function saveBills(bills: Bill[]): Promise<void> {
    await AsyncStorage.setItem(BILLS_KEY, JSON.stringify(bills));
}

// Everyday expenses

export async function loadExpenses(): Promise<Expense[]> {
    await migrateLegacyExpensesIfNeeded();

    const raw = await AsyncStorage.getItem(EXPENSES_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
        return [];
    }

    const parsed = JSON.parse(raw) as Expense[];
    return parsed.map((expense) => ensureTimestamps(expense, expense.date));
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
    await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

// Income

export async function loadIncome(): Promise<Income[]> {
    const raw = await AsyncStorage.getItem(INCOME_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(INCOME_KEY, JSON.stringify([]));
        return [];
    }

    const parsed = JSON.parse(raw) as Income[];
    return parsed.map((entry) => ensureTimestamps(entry, entry.date));
}

export async function saveIncome(income: Income[]): Promise<void> {
    await AsyncStorage.setItem(INCOME_KEY, JSON.stringify(income));
}

// Debts

export async function loadDebts(): Promise<Debt[]> {
    const raw = await AsyncStorage.getItem(DEBTS_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(DEBTS_KEY, JSON.stringify([]));
        return [];
    }

    const parsed = JSON.parse(raw) as Debt[];
    return parsed.map((debt) => {
        const withTs = ensureTimestamps(debt);
        return {
            ...withTs,
            startDate: debtStartDate(withTs),
        };
    });
}

export async function saveDebts(debts: Debt[]): Promise<void> {
    await AsyncStorage.setItem(DEBTS_KEY, JSON.stringify(debts));
}

// Debt payments

export async function loadDebtPayments(): Promise<DebtPayment[]> {
    const raw = await AsyncStorage.getItem(DEBT_PAYMENTS_KEY);

    if (raw !== null) {
        const parsed = JSON.parse(raw) as DebtPayment[];
        return parsed.map((payment) =>
            ensureTimestamps(payment, payment.date)
        );
    }

    const debts = await loadDebts();
    const migrated: DebtPayment[] = [];

    for (const debt of debts) {
        const amount = debt.totalPaid ?? 0;
        if (amount <= 0) {
            continue;
        }

        const date = debt.lastPaymentDate || debt.startDate;
        migrated.push({
            id: `migrated-${debt.id}`,
            debtId: debt.id,
            amount,
            date,
            ...stampCreate(),
        });
    }

    await saveDebtPayments(migrated);
    return migrated;
}

export async function saveDebtPayments(
    payments: DebtPayment[]
): Promise<void> {
    await AsyncStorage.setItem(DEBT_PAYMENTS_KEY, JSON.stringify(payments));
}

// Bill payments

export async function loadBillPayments(): Promise<BillPayment[]> {
    const raw = await AsyncStorage.getItem(BILL_PAYMENTS_KEY);

    if (raw !== null) {
        const parsed = JSON.parse(raw) as BillPayment[];
        return parsed.map((payment) =>
            ensureTimestamps(payment, payment.date)
        );
    }

    const bills = await loadBills();
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(Math.min(today.getDate(), 28)).padStart(2, "0");
    const paidOn = `${y}-${m}-${d}`;

    const migrated: BillPayment[] = bills
        .filter((bill) => bill.isPaid)
        .map((bill) => ({
            id: `migrated-bill-${bill.id}`,
            billId: bill.id,
            amount: bill.amount,
            date: paidOn,
            ...stampCreate(),
        }));

    await saveBillPayments(migrated);
    return migrated;
}

export async function saveBillPayments(
    payments: BillPayment[]
): Promise<void> {
    await AsyncStorage.setItem(BILL_PAYMENTS_KEY, JSON.stringify(payments));
}

// Savings

export async function loadSavings(): Promise<SavingsGoal[]> {
    const raw = await AsyncStorage.getItem(SAVINGS_KEY);

    if (raw === null) {
        await AsyncStorage.setItem(SAVINGS_KEY, JSON.stringify([]));
        return [];
    }

    const parsed = JSON.parse(raw) as SavingsGoal[];
    return parsed.map((item) => {
        const withTs = ensureTimestamps(item);
        return {
            ...withTs,
            startDate: savingsStartDate(withTs),
        };
    });
}

export async function saveSavings(savings: SavingsGoal[]): Promise<void> {
    await AsyncStorage.setItem(SAVINGS_KEY, JSON.stringify(savings));
}

// Savings contributions

export async function loadSavingsContributions(): Promise<
    SavingsContribution[]
> {
    const raw = await AsyncStorage.getItem(SAVINGS_CONTRIBUTIONS_KEY);

    if (raw !== null) {
        const parsed = JSON.parse(raw) as SavingsContribution[];
        return parsed.map((item) => ensureTimestamps(item, item.date));
    }

    // Empty ledger until the user logs contributions (no auto monthly deduction).
    await saveSavingsContributions([]);
    return [];
}

export async function saveSavingsContributions(
    contributions: SavingsContribution[]
): Promise<void> {
    await AsyncStorage.setItem(
        SAVINGS_CONTRIBUTIONS_KEY,
        JSON.stringify(contributions)
    );
}

/** Wipe finance data and leave empty arrays so loaders do not re-seed samples. */
export async function clearAllData(): Promise<void> {
    await seedEmptyData();
}
