import { toIsoDate } from "@/utils/date";
import {
    AppBackup,
    BackupPrefs,
    parseAppBackup,
} from "@/utils/backup-parse";
import { getStoredCurrency, setStoredCurrency } from "@/utils/money";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import {
    areDueRemindersEnabled,
    getReminderPrefs,
    setDueRemindersEnabled,
    setReminderPrefs,
} from "./reminders";
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

export type { AppBackup, BackupPrefs, ParseAppBackupResult } from "@/utils/backup-parse";
export { normalizeBackupPrefs, parseAppBackup } from "@/utils/backup-parse";

export type ImportBackupResult =
    | { imported: false }
    | { imported: true; prefs: BackupPrefs | null };

/** Unique share filename so repeated exports do not overwrite each other. */
export function backupFileName(now = new Date()): string {
    const day = toIsoDate(now);
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `on-hand-backup-${day}-${hh}${mm}${ss}.json`;
}

/** Build the same payload used for file export and cloud sync. */
export async function buildAppBackup(): Promise<AppBackup> {
    const [
        bills,
        debts,
        expenses,
        savings,
        incomes,
        debtPayments,
        billPayments,
        savingsContributions,
        currencyCode,
        dueRemindersEnabled,
        reminderPrefs,
    ] = await Promise.all([
        loadBills(),
        loadDebts(),
        loadExpenses(),
        loadSavings(),
        loadIncome(),
        loadDebtPayments(),
        loadBillPayments(),
        loadSavingsContributions(),
        getStoredCurrency(),
        areDueRemindersEnabled(),
        getReminderPrefs(),
    ]);

    return {
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
        prefs: {
            currencyCode,
            dueRemindersEnabled,
            dueReminderHour: reminderPrefs.hour,
            dueReminderLeadDays: reminderPrefs.leadDays,
        },
    };
}

export function isAppBackupEmpty(backup: AppBackup): boolean {
    return (
        backup.income.length === 0 &&
        backup.expenses.length === 0 &&
        backup.bills.length === 0 &&
        backup.debts.length === 0 &&
        backup.savings.length === 0 &&
        backup.debtPayments.length === 0 &&
        backup.billPayments.length === 0 &&
        backup.savingsContributions.length === 0
    );
}

/** Replace all local finance data (+ optional prefs) from a validated backup. */
export async function applyAppBackup(
    backup: AppBackup,
    prefs: BackupPrefs | null
): Promise<void> {
    await Promise.all([
        saveIncome(backup.income),
        saveExpenses(backup.expenses),
        saveBills(backup.bills),
        saveDebts(backup.debts),
        saveSavings(backup.savings),
        saveDebtPayments(backup.debtPayments),
        saveBillPayments(backup.billPayments),
        saveSavingsContributions(backup.savingsContributions),
    ]);

    if (prefs) {
        await Promise.all([
            setStoredCurrency(prefs.currencyCode),
            setReminderPrefs({
                hour: prefs.dueReminderHour,
                leadDays: prefs.dueReminderLeadDays,
            }),
            setDueRemindersEnabled(prefs.dueRemindersEnabled),
        ]);
    }
}

export async function exportBackup(): Promise<void> {
    const backup = await buildAppBackup();
    const text = JSON.stringify(backup, null, 2);
    const fileName = backupFileName();
    const file = new File(Paths.cache, fileName);

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

export async function importBackup(): Promise<ImportBackupResult> {
    const result = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/plain", "*/*"],
        copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets[0]) {
        return { imported: false };
    }

    const text = await readPickedBackupText(result.assets[0].uri);

    let parsed: unknown;
    try {
        parsed = JSON.parse(text);
    } catch {
        throw new Error("Backup file is not valid JSON");
    }

    const checked = parseAppBackup(parsed);
    if (!checked.ok) {
        throw new Error(checked.error);
    }

    await applyAppBackup(checked.backup, checked.prefs);
    return { imported: true, prefs: checked.prefs };
}

/**
 * DocumentPicker URIs (especially on Expo Go / Android) often fail with
 * `new File(uri).text()` → "Missing READ permission". Prefer fetch, then the
 * legacy FileSystem reader which still handles those cache paths.
 */
async function readPickedBackupText(uri: string): Promise<string> {
    try {
        const response = await fetch(uri);
        const body = await response.text();
        if (response.ok || body.length > 0) {
            return body;
        }
    } catch {
        // Fall through to legacy reader.
    }

    try {
        const FileSystem = await import("expo-file-system/legacy");
        return await FileSystem.readAsStringAsync(uri);
    } catch {
        throw new Error(
            "Could not read the backup file. Try again, or use a development/production build if Expo Go keeps blocking access."
        );
    }
}
