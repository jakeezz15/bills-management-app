import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useWalkthrough } from "@/components/walkthrough";
import { exportBackup, importBackup } from "@/services/backup";
import {
    disableDueReminders,
    enableDueReminders,
} from "@/services/reminders";
import { clearAllData, loadBills, loadDebts } from "@/services/storage";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { useState } from "react";
import { Alert } from "react-native";

export default function SettingsDataScreen() {
    const [busy, setBusy] = useState(false);
    const { openOfferIfNeeded } = useWalkthrough();
    const { setCurrency } = useLocale();
    const { reload: reloadIncome } = useIncome();
    const { reload: reloadExpenses } = useExpenses();
    const { reload: reloadBills } = useBills();
    const { reload: reloadDebts } = useDebt();
    const { reload: reloadSavings } = useSavings();

    const reloadAll = async () => {
        await Promise.all([
            reloadIncome(),
            reloadExpenses(),
            reloadBills(),
            reloadDebts(),
            reloadSavings(),
        ]);
    };

    const handleExport = async () => {
        try {
            setBusy(true);
            await exportBackup();
        } catch (error) {
            Alert.alert(
                "Export failed",
                error instanceof Error ? error.message : "Something went wrong."
            );
        } finally {
            setBusy(false);
        }
    };

    const handleImport = () => {
        Alert.alert(
            "Import backup?",
            "This will replace all data on this device with the file you choose.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Import",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setBusy(true);
                            const result = await importBackup();
                            if (!result.imported) {
                                return;
                            }
                            await reloadAll();

                            if (result.prefs) {
                                await setCurrency(result.prefs.currencyCode);
                                const [nextBills, nextDebts] =
                                    await Promise.all([
                                        loadBills(),
                                        loadDebts(),
                                    ]);
                                if (result.prefs.dueRemindersEnabled) {
                                    await enableDueReminders(
                                        nextBills,
                                        nextDebts
                                    );
                                } else {
                                    await disableDueReminders();
                                }
                            }

                            Alert.alert(
                                "Import complete",
                                result.prefs
                                    ? "Your backup, currency, and reminder settings have been restored."
                                    : "Your backup has been restored."
                            );
                        } catch (error) {
                            Alert.alert(
                                "Import failed",
                                error instanceof Error
                                    ? error.message
                                    : "Something went wrong."
                            );
                        } finally {
                            setBusy(false);
                        }
                    },
                },
            ]
        );
    };

    const handleReset = () => {
        Alert.alert(
            "Reset all data?",
            "This erases income, spending, bills, debts, savings, and payment history on this device. The app will stay empty — sample data will not come back. Currency and reminder settings are kept.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllData();
                        await reloadAll();
                        await openOfferIfNeeded();
                        Alert.alert(
                            "Data reset",
                            "Everything financial on this device is empty now. You’ll see the walkthrough offer again when you’re ready."
                        );
                    },
                },
            ]
        );
    };

    return (
        <SettingsSubpage title="Data & privacy">
            <SettingsSection title="Backup">
                <SettingsRow
                    icon="download-outline"
                    title="Export backup"
                    subtitle="JSON with date in the filename"
                    disabled={busy}
                    showChevron
                    onPress={() => {
                        void handleExport();
                    }}
                />
                <SettingsDivider />
                <SettingsRow
                    icon="cloud-upload-outline"
                    title="Import backup"
                    subtitle="Replace all data on this device"
                    disabled={busy}
                    showChevron
                    onPress={handleImport}
                />
            </SettingsSection>

            <SettingsSection title="Danger zone">
                <SettingsRow
                    icon="trash-outline"
                    title="Reset all data"
                    subtitle="Clear everything — stays empty, no sample data"
                    destructive
                    disabled={busy}
                    showChevron
                    onPress={handleReset}
                />
            </SettingsSection>
        </SettingsSubpage>
    );
}
