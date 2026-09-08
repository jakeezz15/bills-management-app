import { AppButton } from "@/components/AppButton";
import { PageHeader } from "@/components/ui";
import { dashboard } from "@/styles/dashboard";
import { screenStyles } from "@/styles/screen";
import { theme } from "@/theme";
import { exportBackup, importBackup } from "@/services/backup";
import { clearAllData } from "@/services/storage";
import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useSavings } from "../contexts/SavingsContext";

export default function SettingsScreen() {
    const { reload: reloadIncome } = useIncome();
    const { reload: reloadExpenses } = useExpenses();
    const { reload: reloadBills } = useBills();
    const { reload: reloadDebts } = useDebt();
    const { reload: reloadSavings } = useSavings();
    const [busy, setBusy] = useState(false);

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
            "This will erase everything saved on this device.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset",
                    style: "destructive",
                    onPress: async () => {
                        await clearAllData();
                        await reloadAll();
                    },
                },
            ]
        );
    };

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    { paddingTop: theme.space.screenTop },
                ]}
            >
                <PageHeader
                    title="Settings"
                    subtitle="Backup, restore, and app info"
                />

                <View style={dashboard.card}>
                    <Text style={screenStyles.listTitle}>Privacy</Text>
                    <Text style={[screenStyles.screenDescription, { marginTop: 8 }]}>
                        Your data stays on this device. Export saves a JSON backup
                        you can keep offline or move to another phone. Import
                        replaces all data here with that file.
                    </Text>
                </View>

                <View style={dashboard.card}>
                    <Text style={screenStyles.listTitle}>About</Text>
                    <Text style={[screenStyles.screenDescription, { marginTop: 8 }]}>
                        Finance Manager helps you answer “Am I okay this month?” by
                        tracking income, expenses, bills, savings, and debts.
                    </Text>
                    <Text style={[screenStyles.screenDescription, { marginTop: 8 }]}>
                        Version 1.0.0
                    </Text>
                </View>

                <View style={{ gap: 10 }}>
                    <AppButton
                        label="Export backup"
                        onPress={() => {
                            void handleExport();
                        }}
                        disabled={busy}
                    />
                    <AppButton
                        label="Import backup"
                        variant="ghost"
                        onPress={handleImport}
                        disabled={busy}
                    />
                    <AppButton
                        label="Reset all data"
                        variant="danger"
                        onPress={handleReset}
                        disabled={busy}
                    />
                </View>
            </ScrollView>
        </View>
    );
}
