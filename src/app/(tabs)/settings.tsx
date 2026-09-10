import { ChoiceChips } from "@/components/ChoiceChips";
import { CurrencyPickerModal } from "@/components/CurrencyPickerModal";
import {
    SettingsDivider,
    SettingsInset,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { text, theme } from "@/design";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { exportBackup, importBackup } from "@/services/backup";
import {
    areDueRemindersEnabled,
    disableDueReminders,
    enableDueReminders,
    getReminderPrefs,
    pickTestReminderTarget,
    remindersUnavailableReason,
    sendTestReminder,
    setReminderPrefs,
    syncDueReminders,
    type ReminderPrefs,
} from "@/services/reminders";
import { seedDemoData } from "@/services/seed-demo";
import { clearAllData } from "@/services/storage";
import { dashboard } from "@/styles/dashboard";
import { isDevToolsBuild } from "@/utils/dev-tools";
import { currencyLabel } from "@/utils/money";
import {
    formatReminderHour,
    formatReminderLead,
    formatReminderScheduleCaption,
    REMINDER_HOUR_OPTIONS,
    REMINDER_LEAD_OPTIONS,
} from "@/utils/reminder-schedule";
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
    // Plain canvas at the top, no dark band.
    useStatusBarStyle("dark");
    const topPadding = useScreenTopPadding();

    const { currency, setCurrency, formatMoney } = useLocale();
    const { reload: reloadIncome } = useIncome();
    const { reload: reloadExpenses } = useExpenses();
    const { bills, reload: reloadBills } = useBills();
    const { debts, reload: reloadDebts } = useDebt();
    const { reload: reloadSavings } = useSavings();
    const [busy, setBusy] = useState(false);
    const [remindersOn, setRemindersOn] = useState(false);
    const [reminderBusy, setReminderBusy] = useState(false);
    const [reminderPrefs, setReminderPrefsState] = useState<ReminderPrefs>({
        hour: 9,
        leadDays: 3,
    });
    const [currencyOpen, setCurrencyOpen] = useState(false);
    const remindersBlocked = remindersUnavailableReason();
    const version = Constants.expoConfig?.version ?? "1.0.0";
    const scheduleCaption = formatReminderScheduleCaption(
        reminderPrefs.hour,
        reminderPrefs.leadDays
    );
    const hourLabels = REMINDER_HOUR_OPTIONS.map(formatReminderHour);
    const leadLabels = REMINDER_LEAD_OPTIONS.map(formatReminderLead);

    useEffect(() => {
        void Promise.all([
            areDueRemindersEnabled(),
            getReminderPrefs(),
        ]).then(([enabled, prefs]) => {
            setRemindersOn(enabled);
            setReminderPrefsState(prefs);
        });
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
        if (!isDevToolsBuild()) {
            return;
        }
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
                        : `${result.scheduled} reminders set: ${scheduleCaption}.`
                );
            } else {
                await disableDueReminders();
                setRemindersOn(false);
            }
        } finally {
            setReminderBusy(false);
        }
    };

    const applyReminderPrefs = async (next: ReminderPrefs) => {
        setReminderPrefsState(next);
        setReminderBusy(true);
        try {
            await setReminderPrefs(next);
            if (remindersOn) {
                await syncDueReminders(bills, debts);
            }
        } finally {
            setReminderBusy(false);
        }
    };

    const handleHourChange = (label: string) => {
        const hour = REMINDER_HOUR_OPTIONS.find(
            (option) => formatReminderHour(option) === label
        );
        if (hour == null || hour === reminderPrefs.hour) {
            return;
        }
        void applyReminderPrefs({ ...reminderPrefs, hour });
    };

    const handleLeadChange = (label: string) => {
        const leadDays = REMINDER_LEAD_OPTIONS.find(
            (option) => formatReminderLead(option) === label
        );
        if (leadDays == null || leadDays === reminderPrefs.leadDays) {
            return;
        }
        void applyReminderPrefs({ ...reminderPrefs, leadDays });
    };

    const handleTestReminder = async () => {
        if (!isDevToolsBuild()) {
            return;
        }
        setReminderBusy(true);
        try {
            const target = pickTestReminderTarget(bills, debts);
            const result = await sendTestReminder(target);
            if (!result.ok) {
                Alert.alert(
                    "Could not send test",
                    result.reason ?? "Something went wrong."
                );
                return;
            }
            Alert.alert(
                "Test scheduled",
                target
                    ? "Leave the app or lock the phone. In a few seconds tap the banner — it should open Home and that bill or debt."
                    : "You should see a banner in a few seconds. Add a bill or debt to also test that tapping it opens the form."
            );
        } finally {
            setReminderBusy(false);
        }
    };

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: topPadding },
                ]}
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
                            remindersBlocked ? remindersBlocked : scheduleCaption
                        }
                        disabled={
                            reminderBusy || busy || Boolean(remindersBlocked)
                        }
                        switchValue={remindersOn}
                        onSwitchChange={(value) => {
                            void handleToggleReminders(value);
                        }}
                    />
                    {remindersBlocked ? null : (
                        <>
                            <SettingsDivider />
                            <SettingsInset title="Time">
                                <ChoiceChips
                                    options={hourLabels}
                                    selected={formatReminderHour(
                                        reminderPrefs.hour
                                    )}
                                    onSelect={handleHourChange}
                                />
                            </SettingsInset>
                            <SettingsDivider />
                            <SettingsInset title="Lead">
                                <ChoiceChips
                                    options={leadLabels}
                                    selected={formatReminderLead(
                                        reminderPrefs.leadDays
                                    )}
                                    onSelect={handleLeadChange}
                                />
                            </SettingsInset>
                        </>
                    )}
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

                {isDevToolsBuild() ? (
                    <SettingsSection title="Development">
                        <SettingsRow
                            icon="flash-outline"
                            title="Send test reminder"
                            subtitle="Banner in a few seconds — tap it to open Home"
                            disabled={
                                reminderBusy ||
                                busy ||
                                Boolean(remindersBlocked)
                            }
                            showChevron
                            onPress={() => {
                                void handleTestReminder();
                            }}
                        />
                        <SettingsDivider />
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
    // paddingTop comes from useScreenTopPadding at the call site.
    content: {
        paddingHorizontal: theme.space.screenX,
        paddingBottom: theme.space.xl,
    },
    pageTitle: {
        ...text.display,
        marginBottom: theme.space.lg,
        marginLeft: theme.space.xs,
    },
    footer: {
        color: theme.text.tertiary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        textAlign: "center" as const,
        marginTop: theme.space.sm,
        marginBottom: theme.space.md,
    },
};
