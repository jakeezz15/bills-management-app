import { Bill } from "@/types/bill";
import { BillPayment } from "@/types/bill-payment";
import { Debt } from "@/types/debt";
import { DebtPayment } from "@/types/debt-payment";
import { Expense } from "@/types/expense";
import { Income } from "@/types/income";
import { SavingsGoal } from "@/types/savings";
import { SavingsContribution } from "@/types/savings-contribution";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
    loadBillPayments,
    loadBills,
    loadDebtPayments,
    loadDebts,
    loadExpenses,
    loadIncome,
    loadSavings,
    loadSavingsContributions,
    saveBillPayments,
    saveBills,
    saveDebtPayments,
    saveDebts,
    saveExpenses,
    saveIncome,
    saveSavings,
    saveSavingsContributions,
} from "./storage";

type AppBackup = {
    version: 1;
    exportedAt: string;
    income: Income[];
    expenses: Expense[];
    bills: Bill[];
    debts: Debt[];
    savings: SavingsGoal[];
    debtPayments?: DebtPayment[];
    billPayments?: BillPayment[];
    savingsContributions?: SavingsContribution[];
};

export async function exportBackup(): Promise<void> {
    const [
        bills,
        debts,
        expenses,
        savings,
        incomes,
        debtPayments,
        billPayments,
        savingsContributions,
    ] = await Promise.all([
        loadBills(),
        loadDebts(),
        loadExpenses(),
        loadSavings(),
        loadIncome(),
        loadDebtPayments(),
        loadBillPayments(),
        loadSavingsContributions(),
    ]);

    const backup: AppBackup = {
        version: 1,
        exportedAt: new Date().toISOString(),
        income: incomes,
        expenses,
        bills,
        debts,
        savings,
        debtPayments,
        billPayments,
        savingsContributions,
    };

    const text = JSON.stringify(backup, null, 2);
    const file = new File(Paths.cache, "finance-backup.json");

    if (file.exists) {
        file.delete();
    }

    file.create();
    file.write(text);

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
        throw new Error("Sharing is not available on this device!");
    }

    await Sharing.shareAsync(file.uri, {
        mimeType: "application/json",
        dialogTitle: "Export backup",
    });
}

export async function importBackup(): Promise<boolean> {
    const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
        return false;
    }

    const uri = result.assets[0].uri;
    const file = new File(uri);
    const text = await file.text();

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error("Backup file is not valid JSON");
    }

    if (!isAppBackup(parsed)) {
        throw new Error("Backup file is missing required fields!");
    }

    const backup = parsed;

    await Promise.all([
        saveIncome(backup.income),
        saveExpenses(backup.expenses),
        saveBills(backup.bills),
        saveDebts(backup.debts),
        saveSavings(backup.savings),
        saveDebtPayments(backup.debtPayments ?? []),
        saveBillPayments(backup.billPayments ?? []),
        saveSavingsContributions(backup.savingsContributions ?? []),
    ]);

    return true;
}

function isAppBackup(value: unknown): value is AppBackup {
    if (typeof value !== "object" || value === null) return false;

    const v = value as Record<string, unknown>;

    return (
        v.version === 1 &&
        typeof v.exportedAt === "string" &&
        Array.isArray(v.income) &&
        Array.isArray(v.expenses) &&
        Array.isArray(v.bills) &&
        Array.isArray(v.debts) &&
        Array.isArray(v.savings)
    );
}
