import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import {
    parseBill,
    parseBillPayment,
    parseDebt,
    parseDebtPayment,
    parseExpense,
    parseIncome,
    parseOptionalArray,
    parseRequiredArray,
    parseSavingsContribution,
    parseSavingsGoal,
} from "@/utils/data-validators";
import { CurrencyCode, isCurrencyCode } from "@/utils/money";
import {
    REMINDER_HOUR_OPTIONS,
    REMINDER_LEAD_OPTIONS,
    type ReminderHour,
    type ReminderLeadDays,
} from "@/utils/reminder-schedule";

/** Optional display / reminder prefs. Older backups omit this block. */
export type BackupPrefs = {
    currencyCode: CurrencyCode;
    dueRemindersEnabled: boolean;
    dueReminderHour: ReminderHour;
    dueReminderLeadDays: ReminderLeadDays;
};

export type AppBackup = {
    version: 1;
    exportedAt: string;
    income: Income[];
    expenses: Expense[];
    bills: Bill[];
    debts: Debt[];
    savings: SavingsGoal[];
    debtPayments: DebtPayment[];
    billPayments: BillPayment[];
    savingsContributions: SavingsContribution[];
    prefs?: Partial<BackupPrefs>;
};

export type ParseAppBackupResult =
    | { ok: true; backup: AppBackup; prefs: BackupPrefs | null }
    | { ok: false; error: string };

/**
 * Deep-validate a parsed backup. Rejects the whole file if any required
 * collection is missing or contains a bad row — never partially apply.
 */
export function parseAppBackup(value: unknown): ParseAppBackupResult {
    if (typeof value !== "object" || value === null) {
        return { ok: false, error: "Backup file is not a JSON object." };
    }

    const v = value as Record<string, unknown>;

    if (v.version !== 1) {
        return { ok: false, error: "Unsupported backup version." };
    }
    if (typeof v.exportedAt !== "string" || v.exportedAt.trim() === "") {
        return { ok: false, error: "Backup is missing exportedAt." };
    }

    const income = parseRequiredArray(v.income, parseIncome, "income");
    if (!income.ok) {
        return income;
    }
    const expenses = parseRequiredArray(v.expenses, parseExpense, "expenses");
    if (!expenses.ok) {
        return expenses;
    }
    const bills = parseRequiredArray(v.bills, parseBill, "bills");
    if (!bills.ok) {
        return bills;
    }
    const debts = parseRequiredArray(v.debts, parseDebt, "debts");
    if (!debts.ok) {
        return debts;
    }
    const savings = parseRequiredArray(v.savings, parseSavingsGoal, "savings");
    if (!savings.ok) {
        return savings;
    }

    const debtPayments = parseOptionalArray(
        v.debtPayments,
        parseDebtPayment,
        "debtPayments"
    );
    if (!debtPayments.ok) {
        return debtPayments;
    }
    const billPayments = parseOptionalArray(
        v.billPayments,
        parseBillPayment,
        "billPayments"
    );
    if (!billPayments.ok) {
        return billPayments;
    }
    const savingsContributions = parseOptionalArray(
        v.savingsContributions,
        parseSavingsContribution,
        "savingsContributions"
    );
    if (!savingsContributions.ok) {
        return savingsContributions;
    }

    const backup: AppBackup = {
        version: 1,
        exportedAt: v.exportedAt,
        income: income.items,
        expenses: expenses.items,
        bills: bills.items,
        debts: debts.items,
        savings: savings.items,
        debtPayments: debtPayments.items,
        billPayments: billPayments.items,
        savingsContributions: savingsContributions.items,
        prefs:
            v.prefs && typeof v.prefs === "object"
                ? (v.prefs as Partial<BackupPrefs>)
                : undefined,
    };

    return {
        ok: true,
        backup,
        prefs: normalizeBackupPrefs(backup.prefs),
    };
}

function isReminderHour(value: unknown): value is ReminderHour {
    return (
        typeof value === "number" &&
        (REMINDER_HOUR_OPTIONS as readonly number[]).includes(value)
    );
}

function isReminderLeadDays(value: unknown): value is ReminderLeadDays {
    return (
        typeof value === "number" &&
        (REMINDER_LEAD_OPTIONS as readonly number[]).includes(value)
    );
}

/** Accept a full prefs block, or ignore incomplete / invalid older shapes. */
export function normalizeBackupPrefs(
    value: Partial<BackupPrefs> | undefined
): BackupPrefs | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    if (
        typeof value.currencyCode !== "string" ||
        !isCurrencyCode(value.currencyCode) ||
        typeof value.dueRemindersEnabled !== "boolean" ||
        !isReminderHour(value.dueReminderHour) ||
        !isReminderLeadDays(value.dueReminderLeadDays)
    ) {
        return null;
    }

    return {
        currencyCode: value.currencyCode,
        dueRemindersEnabled: value.dueRemindersEnabled,
        dueReminderHour: value.dueReminderHour,
        dueReminderLeadDays: value.dueReminderLeadDays,
    };
}
