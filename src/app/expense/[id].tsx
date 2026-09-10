import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DashboardHero } from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { DetailHeroNav } from "@/components/DetailHeroNav";
import ExpenseForm from "@/components/ExpenseForm";
import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { dashboard } from "@/styles/dashboard";
import { formatDisplayDate } from "@/utils/date";
import { goBackOrReplace, paramId } from "@/utils/navigation";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";

export default function ExpenseReceiptScreen() {
    useStatusBarStyle("light");
    const topPadding = useScreenTopPadding();
    const { id: rawId } = useLocalSearchParams<{ id: string }>();
    const id = paramId(rawId);

    const { formatMoney } = useLocale();
    const { expenses, loading } = useExpenses();
    const [editing, setEditing] = useState(false);

    const expense = expenses.find((item) => item.id === id);

    useEffect(() => {
        if (loading || !id) {
            return;
        }
        if (expense) {
            return;
        }
        goBackOrReplace("/(tabs)/activity");
    }, [loading, expense, id]);

    if (loading && !expense) {
        return (
            <View style={dashboard.screen}>
                <ScrollView
                    contentContainerStyle={[
                        dashboard.listContent,
                        { paddingTop: topPadding },
                    ]}
                >
                    <DashboardSkeleton />
                </ScrollView>
            </View>
        );
    }

    if (!expense) {
        return null;
    }

    const category = expense.category?.trim() || "Uncategorized";

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    { paddingTop: topPadding },
                ]}
            >
                <DashboardHero
                    title={expense.name}
                    kicker="Spent"
                    value={formatMoney(expense.amount, { compact: true })}
                    caption={formatDisplayDate(expense.date)}
                    header={
                        <DetailHeroNav
                            backLabel="Spending"
                            fallbackHref="/(tabs)/activity"
                            onEdit={() => setEditing(true)}
                            editAccessibilityLabel="Edit expense"
                        />
                    }
                />

                <SettingsSection title="Receipt">
                    <SettingsRow
                        title="Date"
                        value={formatDisplayDate(expense.date)}
                    />
                    <SettingsDivider />
                    <SettingsRow title="Category" value={category} />
                    <SettingsDivider />
                    <SettingsRow
                        title="Amount"
                        value={formatMoney(expense.amount)}
                    />
                </SettingsSection>
            </ScrollView>

            <ExpenseForm
                visible={editing}
                onClose={() => setEditing(false)}
                expense={expense}
            />
        </View>
    );
}
