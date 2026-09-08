import { DashboardHero } from "@/components/DashboardHero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { PageHeader } from "@/components/ui";
import { SegmentControl } from "@/components/SegmentControl";
import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import {
    hasCompletedFirstRun,
    markFirstRunComplete,
    seedEmptyData,
} from "@/services/storage";
import { getTotalsForRange } from "@/utils/finance";
import {
    PERIOD_UNITS,
    PERIOD_UNIT_LABELS,
} from "@/utils/date";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useSavings } from "../contexts/SavingsContext";

const UNIT_OPTIONS = PERIOD_UNITS.map((unit) => PERIOD_UNIT_LABELS[unit]);

export default function HomeScreen() {
    const { income, reload: reloadIncome } = useIncome();
    const { expenses, reload: reloadExpenses } = useExpenses();
    const { bills, payments: billPayments, reload: reloadBills } = useBills();
    const { debts, payments: debtPayments, reload: reloadDebts } = useDebt();
    const {
        savings,
        contributions: savingsContributions,
        reload: reloadSavings,
    } = useSavings();
    const {
        periodUnit,
        range,
        label,
        setPeriodUnit,
        shiftPeriod,
        resetToToday,
    } = useDateRange();

    const totals = useMemo(
        () =>
            getTotalsForRange(
                range,
                expenses,
                bills,
                debts,
                savings,
                income,
                debtPayments,
                billPayments,
                savingsContributions
            ),
        [
            range,
            expenses,
            bills,
            debts,
            savings,
            income,
            debtPayments,
            billPayments,
            savingsContributions,
        ]
    );

    const outflows =
        totals.expenses +
        totals.bills +
        totals.debtPayments +
        totals.savings;
    const coverage =
        outflows > 0
            ? Math.min(100, Math.round((totals.income / outflows) * 100))
            : totals.income > 0
              ? 100
              : 0;

    const reloadAll = async () => {
        await Promise.all([
            reloadIncome(),
            reloadExpenses(),
            reloadBills(),
            reloadDebts(),
            reloadSavings(),
        ]);
    };

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const done = await hasCompletedFirstRun();
            if (cancelled || done) return;

            Alert.alert(
                "Welcome",
                "Try the sample data, or start with an empty app for your real numbers.",
                [
                    {
                        text: "Keep sample data",
                        onPress: async () => {
                            await markFirstRunComplete();
                        },
                    },
                    {
                        text: "Start empty",
                        style: "destructive",
                        onPress: async () => {
                            await seedEmptyData();
                            await markFirstRunComplete();
                            await reloadAll();
                        },
                    },
                ],
                { cancelable: false }
            );
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    const selectUnit = (value: string) => {
        const next = PERIOD_UNITS.find(
            (unit) => PERIOD_UNIT_LABELS[unit] === value
        );
        if (next) {
            setPeriodUnit(next);
        }
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
                    title="Finance Manager"
                    subtitle="Running balance as of the selected date"
                />

                <View style={{ marginBottom: 12 }}>
                    <SegmentControl
                        options={UNIT_OPTIONS}
                        selected={PERIOD_UNIT_LABELS[periodUnit]}
                        onSelect={selectUnit}
                        compact
                    />
                </View>

                <DashboardHero
                    kicker="Leftover"
                    value={`$${totals.leftover.toFixed(0)}`}
                    caption={
                        totals.leftover >= 0
                            ? "Income so far covers what you have spent and paid"
                            : "Outflows so far are higher than income received"
                    }
                    percent={coverage}
                    pace={
                        <HeroPeriodNav
                            label={label}
                            onShift={shiftPeriod}
                            onResetToToday={resetToToday}
                        />
                    }
                />

                <View style={dashboard.card}>
                    <SummaryLine label="Income" value={totals.income} tone="in" />
                    <View style={dashboard.summaryDivider} />
                    <SummaryLine label="Expenses" value={totals.expenses} tone="out" />
                    <View style={dashboard.summaryDivider} />
                    <SummaryLine label="Bills" value={totals.bills} tone="out" />
                    <View style={dashboard.summaryDivider} />
                    <SummaryLine
                        label="Debt payments"
                        value={totals.debtPayments}
                        tone="out"
                    />
                    <View style={dashboard.summaryDivider} />
                    <SummaryLine label="Savings" value={totals.savings} tone="accent" />
                </View>

                <Text style={dashboard.sectionLabel}>Quick actions</Text>

                <ActionRow
                    icon="swap-vertical-outline"
                    title="Activity"
                    subtitle="Log income or spending"
                    onPress={() => router.push("/(tabs)/activity")}
                />
                <ActionRow
                    icon="albums-outline"
                    title="Plans"
                    subtitle="Bills, savings, and debts"
                    onPress={() => router.push("/(tabs)/plans")}
                />
                <ActionRow
                    icon="settings-outline"
                    title="Settings"
                    subtitle="Backup, privacy, and about"
                    onPress={() => router.push("/(tabs)/settings")}
                />
            </ScrollView>
        </View>
    );
}

function SummaryLine({
    label,
    value,
    tone,
}: {
    label: string;
    value: number;
    tone: "in" | "out" | "accent";
}) {
    const color =
        tone === "in"
            ? theme.color.successText
            : tone === "out"
              ? theme.color.warning
              : theme.color.accent;

    return (
        <View style={dashboard.summaryRow}>
            <Text style={dashboard.summaryLabel}>{label}</Text>
            <Text style={[dashboard.summaryValue, { color }]}>
                ${value.toFixed(2)}
            </Text>
        </View>
    );
}

function ActionRow({
    icon,
    title,
    subtitle,
    onPress,
}: {
    icon: "swap-vertical-outline" | "albums-outline" | "settings-outline";
    title: string;
    subtitle: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [dashboard.card, pressed && { opacity: 0.94 }]}
        >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <View
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: theme.color.accentSoft,
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Ionicons name={icon} size={20} color={theme.color.accent} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={dashboard.cardTitle}>{title}</Text>
                    <Text style={dashboard.cardSubtitle}>{subtitle}</Text>
                </View>
                <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.color.soft}
                />
            </View>
        </Pressable>
    );
}
