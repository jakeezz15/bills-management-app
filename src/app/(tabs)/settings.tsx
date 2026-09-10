import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import { exportBackup, importBackup } from "@/services/backup";
import {
    areDueRemindersEnabled,
    disableDueReminders,
    enableDueReminders,
    remindersUnavailableReason,
} from "@/services/reminders";
import { clearAllData } from "@/services/storage";
import { currencyLabel } from "@/utils/money";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";

export default function SettingsScreen() {
    const { currency, setCurrency } = useLocale();
    const { reload: reloadIncome } = useIncome();
    const { reload: reloadExpenses } = useExpenses();
    const { bills, reload: reloadBills } = useBills();
    const { debts, reload: reloadDebts } = useDebt();
    const { reload: reloadSavings } = useSavings();
    const [busy, setBusy] = useState(false);
    const [remindersOn, setRemindersOn] = useState(false);
    const [reminderBusy, setReminderBusy] = useState(false);
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const remindersBlocked = remindersUnavailableReason();

    useEffect(() => {
        void areDueRemindersEnabled().then(setRemindersOn);
    }, []);

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
                            const imported = await importBackup();
                            if (!imported) {
                                return;
                            }
                            await reloadAll();
                            Alert.alert(
                                "Import complete",
                                "Your backup has been restored."
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
                        Alert.alert(
                            "Data reset",
                            "Everything financial on this device is empty now."
                        );
                    },
                },
            ]
        );
    };

    const handleToggleReminders = async (next: boolean) => {
        if (remindersBlocked) {
            Alert.alert("Reminders unavailable", remindersBlocked);
            return;
        }

        setReminderBusy(true);
        try {
            if (next) {
                const result = await enableDueReminders(bills, debts);
                if (!result.ok) {
                    setRemindersOn(false);
                    Alert.alert(
                        "Reminders off",
                        result.reason ?? "Could not enable reminders."
                    );
                    return;
                }
                setRemindersOn(true);
                Alert.alert(
                    "Reminders on",
                    result.scheduled === 0
                        ? "No bills or debts to remind about yet. Add one and we will schedule it."
                        : `${result.scheduled} monthly reminders set for 9:00 AM on due days.`
                );
            } else {
                await disableDueReminders();
                setRemindersOn(false);
            }
        } finally {
            setReminderBusy(false);
        }
    };

    return (
        <View style={dashboard.screen}>
            <StatusBar style="dark" />
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={styles.content}
            >
                <Text style={styles.pageTitle}>Settings</Text>

                <SettingsSection title="Currency">
                    <SettingsRow
                        icon="cash-outline"
                        title="Currency"
                        subtitle={currencyLabel(currency)}
                        value={currency}
                        showChevron
                        onPress={() => setCurrencyOpen(true)}
                    />
                </SettingsSection>

                <SettingsSection title="Reminders">
                    <SettingsRow
                        icon="notifications-outline"
                        title="Due-day reminders"
                        subtitle={
                            remindersBlocked
                                ? remindersBlocked
                                : "9:00 AM on bill and debt due days"
                        }
                        disabled={
                            reminderBusy || busy || Boolean(remindersBlocked)
                        }
                        switchValue={remindersOn}
                        onSwitchChange={(value) => {
                            void handleToggleReminders(value);
                        }}
                    />
                </SettingsSection>

                <SettingsSection title="Backup">
                    <SettingsRow
                        icon="download-outline"
                        title="Export backup"
                        subtitle="Save a JSON file of your data"
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

                <SettingsSection title="Reset">
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

                <Text style={styles.footer}>
                    On Hand · on-device only · no account
                </Text>
            </ScrollView>

            <CurrencyPickerModal
                visible={currencyOpen}
                selected={currency}
                onClose={() => setCurrencyOpen(false)}
                onSelect={(code) => {
                    void setCurrency(code);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingHorizontal: theme.space.screenX,
        paddingTop: theme.space.screenTop,
        paddingBottom: 40,
    },
    pageTitle: {
        color: theme.color.ink,
        fontSize: theme.font.display,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.4,
        marginBottom: theme.space.xl,
    },
    footer: {
        color: theme.color.soft,
        fontSize: 12,
        textAlign: "center",
        marginTop: theme.space.sm,
        marginBottom: theme.space.lg,
    },
});
