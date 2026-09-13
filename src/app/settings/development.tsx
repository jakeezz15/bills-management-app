import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useWalkthrough } from "@/components/walkthrough";
import { resetWelcomeForDev } from "@/services/auth-preference";
import {
    pickTestReminderTarget,
    remindersUnavailableReason,
    sendTestReminder,
} from "@/services/reminders";
import { seedDemoData, seedScreenshotData } from "@/services/seed-demo";
import {
    clearStorageHealthIssues,
    recordStorageHealthIssue,
} from "@/services/storage-health";
import { isDevToolsBuild } from "@/utils/dev-tools";
import { Redirect } from "expo-router";
import { useState } from "react";
import { Alert, DevSettings } from "react-native";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useSavings } from "@/app/contexts/SavingsContext";

export default function SettingsDevelopmentScreen() {
    const [busy, setBusy] = useState(false);
    const { prepareReplay } = useWalkthrough();
    const [reminderBusy, setReminderBusy] = useState(false);
    const { bills, reload: reloadBills } = useBills();
    const { debts, reload: reloadDebts } = useDebt();
    const { reload: reloadIncome } = useIncome();
    const { reload: reloadExpenses } = useExpenses();
    const { reload: reloadSavings } = useSavings();
    const remindersBlocked = remindersUnavailableReason();

    if (!isDevToolsBuild()) {
        return <Redirect href="/(tabs)/settings" />;
    }

    const reloadAll = async () => {
        await Promise.all([
            reloadIncome(),
            reloadExpenses(),
            reloadBills(),
            reloadDebts(),
            reloadSavings(),
        ]);
    };

    const runSeed = (
        title: string,
        message: string,
        actionLabel: string,
        seed: () => Promise<{
            income: number;
            expenses: number;
            bills: number;
            debts: number;
            savings: number;
        }>
    ) => {
        Alert.alert(title, message, [
            { text: "Cancel", style: "cancel" },
            {
                text: actionLabel,
                onPress: async () => {
                    try {
                        setBusy(true);
                        const result = await seed();
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
        ]);
    };

    const handleTestReminder = async () => {
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
        <SettingsSubpage title="Development">
            <SettingsSection title="Tools">
                <SettingsRow
                    icon="flash-outline"
                    title="Send test reminder"
                    subtitle="Banner in a few seconds — tap to open that bill or debt"
                    disabled={
                        reminderBusy || busy || Boolean(remindersBlocked)
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
                    onPress={() => {
                        runSeed(
                            "Load demo data?",
                            "Replaces all finance data with realistic entries from July through today (income, spending, bills, debts, savings). For development only.",
                            "Seed data",
                            () => seedDemoData()
                        );
                    }}
                />
                <SettingsDivider />
                <SettingsRow
                    icon="camera-outline"
                    title="Seed screenshot demo"
                    subtitle="Curated for store photos — clean leftover and readable lists"
                    disabled={busy}
                    showChevron
                    onPress={() => {
                        runSeed(
                            "Load screenshot demo?",
                            "Replaces all finance data with a curated set for store screenshots: clean leftover, paid + unpaid bills, savings progress, and readable ledger rows.",
                            "Seed screenshots",
                            () => seedScreenshotData()
                        );
                    }}
                />
                <SettingsDivider />
                <SettingsRow
                    icon="bulb-outline"
                    title="Replay walkthrough"
                    subtitle="Shows the first-run spotlight tour again"
                    disabled={busy}
                    showChevron
                    onPress={() => {
                        void prepareReplay();
                    }}
                />
                <SettingsDivider />
                <SettingsRow
                    icon="log-in-outline"
                    title="Replay welcome screen"
                    subtitle="Clears guest/welcome flags and reloads the app"
                    disabled={busy}
                    showChevron
                    onPress={() => {
                        void (async () => {
                            await resetWelcomeForDev();
                            DevSettings.reload();
                        })();
                    }}
                />
                <SettingsDivider />
                <SettingsRow
                    icon="warning-outline"
                    title="Simulate storage warning"
                    subtitle="Shows the recovery banner (dismiss to clear)"
                    disabled={busy}
                    showChevron
                    onPress={() => {
                        clearStorageHealthIssues();
                        recordStorageHealthIssue(
                            "demo",
                            "Saved demo data was unreadable and was skipped."
                        );
                        Alert.alert(
                            "Banner shown",
                            "Look at the top of the app for the storage warning."
                        );
                    }}
                />
            </SettingsSection>
        </SettingsSubpage>
    );
}
