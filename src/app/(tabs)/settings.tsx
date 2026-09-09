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
    sendTestReminder,
} from "@/services/reminders";
import { clearAllData } from "@/services/storage";
import { seedDemoData } from "@/services/seed-demo";
import { currencyLabel } from "@/utils/money";
import Constants from "expo-constants";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";

export default function SettingsScreen() {
    const { currency, setCurrency, formatMoney } = useLocale();
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
    const version = Constants.expoConfig?.version ?? "1.0.0";

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

    const handleSeedDemo = () => {
        Alert.alert(
            "Load demo data?",
            "Replaces all finance data with realistic entries from July through today (income, spending, bills, debts, savings). For development only.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Seed data",
                    onPress: async () => {
                        try {
                            setBusy(true);
                            const result = await seedDemoData();
                            await reloadAll();
                            Alert.alert(
                                "Demo data loaded",
                                `${result.income} income · ${result.expenses} expenses · ${result.bills} bills · ${result.debts} debts · ${result.savings} savings goals`
                            );
                        } catch (error) {
                            Alert.alert(
                                "Seed failed",
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

    const handleTestReminder = async () => {
        setReminderBusy(true);
        try {
            const result = await sendTestReminder();
            if (!result.ok) {
                Alert.alert(
                    "Could not send test",
                    result.reason ?? "Something went wrong."
                );
                return;
            }
            Alert.alert("Test scheduled", "You should see an alert in a few seconds.");
        } finally {
            setReminderBusy(false);
        }
    };

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={styles.content}
            >
                <Text style={styles.pageTitle}>Settings</Text>

                <SettingsSection title="General">
                    <SettingsRow
                        icon="cash-outline"
                        title="Currency"
                        subtitle={currencyLabel(currency)}
                        value={currency}
                        showChevron
                        onPress={() => setCurrencyOpen(true)}
                    />
                </SettingsSection>

                <SettingsSection title="Notifications">
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
                    <SettingsDivider />
                    <SettingsRow
                        icon="flash-outline"
                        title="Send test reminder"
                        subtitle="Schedules a local alert in a few seconds"
                        disabled={
                            reminderBusy || busy || Boolean(remindersBlocked)
                        }
                        showChevron
                        onPress={() => {
                            void handleTestReminder();
                        }}
                    />
                </SettingsSection>

                <SettingsSection title="Data & privacy">
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
                    <SettingsDivider />
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

                {__DEV__ ? (
                    <SettingsSection title="Development">
                        <SettingsRow
                            icon="flask-outline"
                            title="Seed demo data"
                            subtitle="July → today: realistic income, spend, bills, debts, savings"
                            disabled={busy}
                            showChevron
                            onPress={handleSeedDemo}
                        />
                    </SettingsSection>
                ) : null}

                <SettingsSection title="About">
                    <SettingsRow
                        icon="information-circle-outline"
                        title="On Hand"
                        subtitle="What's left after what you logged."
                        value={version}
                    />
                    <SettingsDivider />
                    <SettingsRow
                        icon="phone-portrait-outline"
                        title="Storage"
                        subtitle="Your data stays on this device. Nothing is uploaded."
                    />
                </SettingsSection>

                <Text style={styles.footer}>
                    {currencyLabel(currency)} · example {formatMoney(1234.5)}
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

const styles = {
    content: {
        paddingHorizontal: theme.space.screenX,
        paddingTop: theme.space.screenTop,
        paddingBottom: 40,
    },
    pageTitle: {
        color: theme.color.ink,
        fontSize: 32,
        fontWeight: "700" as const,
        letterSpacing: -0.6,
        marginBottom: theme.space.xl,
        marginLeft: theme.space.xs,
    },
    footer: {
        color: theme.color.soft,
        fontSize: 12,
        textAlign: "center" as const,
        marginTop: theme.space.sm,
        marginBottom: theme.space.lg,
    },
};
