import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import {
    clearStorageHealthIssues,
    noteStorageSaveFailure,
    noteStoredArrayLoad,
} from "@/services/storage-health";
import {
    parseBill,
    parseBillPayment,
    parseDebt,
    parseDebtPayment,
    parseExpense,
    parseIncome,
    parseSavingsContribution,
    parseSavingsGoal,
    parseStoredArray,
    parseStoredArrayDetailed,
} from "@/utils/data-validators";
import {
    debtStartDate,
    ensureTimestamps,
    savingsStartDate,
    stampCreate,
} from "@/utils/timestamps";
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

async function writeJson(collection: string, key: string, value: unknown) {
    try {
        await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
        noteStorageSaveFailure(collection);
        throw new Error(`Could not save ${collection}`);
    }
}

function readCollection<T>(
    collection: string,
    raw: string | null,
    parseItem: (value: unknown) => T | null
): T[] {
    const report = parseStoredArrayDetailed(raw, parseItem);
    noteStoredArrayLoad(collection, {
        rawCorrupt: report.rawCorrupt,
        droppedCount: report.droppedCount,
        kept: report.items.length,
    });
    return report.items;
}

export async function hasCompletedFirstRun(): Promise<boolean> {
    const value = await AsyncStorage.getItem(FIRST_RUN_KEY);
    return value === "true";
}

export async function markFirstRunComplete(): Promise<void> {
    await AsyncStorage.setItem(FIRST_RUN_KEY, "true");
}

/** Lets Reset / Dev replay the first-run walkthrough. */
export async function clearFirstRunFlag(): Promise<void> {
    await AsyncStorage.removeItem(FIRST_RUN_KEY);
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

    const parsed = parseStoredArray(expensesRaw, (value) => {
        if (typeof value !== "object" || value === null) {
            return null;
        }
        return value as Record<string, unknown>;
    });
    if (parsed.length === 0) {
        return;
    }

    const first = parsed[0];
    const looksLikeBill =
        typeof first.dueDay === "number" ||
        typeof first.isRecurring === "boolean";

    if (looksLikeBill) {
        await AsyncStorage.setItem(BILLS_KEY, expensesRaw);
        await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
    }
}

// Bills

export async function loadBills(): Promise<Bill[]> {
    await migrateLegacyExpensesIfNeeded();

    const raw = await AsyncStorage.getItem(BILLS_KEY);

    if (raw === null) {
        await writeJson("bills", BILLS_KEY, []);
        return [];
    }

    return readCollection("bills", raw, parseBill).map((bill) => {
        const withTs = ensureTimestamps(bill);
        return {
            ...withTs,
            amountVaries: withTs.amountVaries === true,
            amount: withTs.amountVaries === true ? 0 : withTs.amount,
        };
    });
}

export async function saveBills(bills: Bill[]): Promise<void> {
    await writeJson("bills", BILLS_KEY, bills);
}

// Everyday expenses

export async function loadExpenses(): Promise<Expense[]> {
    await migrateLegacyExpensesIfNeeded();

    const raw = await AsyncStorage.getItem(EXPENSES_KEY);

    if (raw === null) {
        await writeJson("expenses", EXPENSES_KEY, []);
        return [];
    }

    return readCollection("expenses", raw, parseExpense).map((expense) =>
        ensureTimestamps(expense, expense.date)
    );
}

export async function saveExpenses(expenses: Expense[]): Promise<void> {
    await writeJson("expenses", EXPENSES_KEY, expenses);
}

// Income

export async function loadIncome(): Promise<Income[]> {
    const raw = await AsyncStorage.getItem(INCOME_KEY);

    if (raw === null) {
        await writeJson("income", INCOME_KEY, []);
        return [];
    }

    return readCollection("income", raw, parseIncome).map((entry) =>
        ensureTimestamps(entry, entry.date)
    );
}

export async function saveIncome(income: Income[]): Promise<void> {
    await writeJson("income", INCOME_KEY, income);
}

// Debts

export async function loadDebts(): Promise<Debt[]> {
    const raw = await AsyncStorage.getItem(DEBTS_KEY);

    if (raw === null) {
        await writeJson("debts", DEBTS_KEY, []);
        return [];
    }

    return readCollection("debts", raw, parseDebt).map((debt) => {
        const withTs = ensureTimestamps(debt);
        return {
            ...withTs,
            startDate: debtStartDate(withTs),
        };
    });
}

export async function saveDebts(debts: Debt[]): Promise<void> {
    await writeJson("debts", DEBTS_KEY, debts);
}

// Debt payments

export async function loadDebtPayments(): Promise<DebtPayment[]> {
    const raw = await AsyncStorage.getItem(DEBT_PAYMENTS_KEY);

    if (raw !== null) {
        return readCollection("debt payments", raw, parseDebtPayment).map(
            (payment) => ensureTimestamps(payment, payment.date)
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
    await writeJson("debt payments", DEBT_PAYMENTS_KEY, payments);
}

// Bill payments

export async function loadBillPayments(): Promise<BillPayment[]> {
    const raw = await AsyncStorage.getItem(BILL_PAYMENTS_KEY);

    if (raw !== null) {
        return readCollection("bill payments", raw, parseBillPayment).map(
            (payment) => ensureTimestamps(payment, payment.date)
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
    await writeJson("bill payments", BILL_PAYMENTS_KEY, payments);
}

// Savings

export async function loadSavings(): Promise<SavingsGoal[]> {
    const raw = await AsyncStorage.getItem(SAVINGS_KEY);

    if (raw === null) {
        await writeJson("savings", SAVINGS_KEY, []);
        return [];
    }

    return readCollection("savings", raw, parseSavingsGoal).map((item) => {
        const withTs = ensureTimestamps(item);
        return {
            ...withTs,
            startDate: savingsStartDate(withTs),
        };
    });
}

export async function saveSavings(savings: SavingsGoal[]): Promise<void> {
    await writeJson("savings", SAVINGS_KEY, savings);
}

// Savings contributions

export async function loadSavingsContributions(): Promise<
    SavingsContribution[]
> {
    const raw = await AsyncStorage.getItem(SAVINGS_CONTRIBUTIONS_KEY);

    if (raw !== null) {
        return readCollection(
            "savings contributions",
            raw,
            parseSavingsContribution
        ).map((item) => ensureTimestamps(item, item.date));
    }

    // Empty ledger until the user logs contributions (no auto monthly deduction).
    await saveSavingsContributions([]);
    return [];
}

export async function saveSavingsContributions(
    contributions: SavingsContribution[]
): Promise<void> {
    await writeJson(
        "savings contributions",
        SAVINGS_CONTRIBUTIONS_KEY,
        contributions
    );
}

/** Wipe finance data and leave empty arrays so loaders do not re-seed samples. */
export async function clearAllData(): Promise<void> {
    await seedEmptyData();
    await clearFirstRunFlag();
    clearStorageHealthIssues();
}
