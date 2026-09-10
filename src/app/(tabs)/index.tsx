import { FirstRunEmpty } from "@/components/DashboardEmpty";
import ExpenseForm from "@/components/ExpenseForm";
import { Fab } from "@/components/Fab";
import { Hero } from "@/components/Hero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import IncomeForm from "@/components/IncomeForm";
import { RowGroup, StatusRow } from "@/components/StatusRow";
import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import { formatLeftoverKicker } from "@/utils/date";
import { getTotalsForRange } from "@/utils/finance";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";

type RecentItem = {
    id: string;
    title: string;
    date: string;
    amount: number;
    kind: "in" | "out";
};

export default function HomeScreen() {
    const { formatMoney } = useLocale();
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { bills, payments: billPayments } = useBills();
    const { debts, payments: debtPayments } = useDebt();
    const { savings, contributions: savingsContributions } = useSavings();
    const { periodUnit, range, label, shiftPeriod, resetToToday } =
        useDateRange();

    const [incomeOpen, setIncomeOpen] = useState(false);
    const [expenseOpen, setExpenseOpen] = useState(false);

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

    const recent = useMemo(() => {
        const rows: RecentItem[] = [
            ...income.map((item) => ({
                id: `in-${item.id}`,
                title: item.source,
                date: item.date,
                amount: item.net,
                kind: "in" as const,
            })),
            ...expenses.map((item) => ({
                id: `ex-${item.id}`,
                title: item.name,
                date: item.date,
                amount: item.amount,
                kind: "out" as const,
            })),
        ];
        return rows.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
    }, [income, expenses]);

    const needsFirstPaycheck = income.length === 0;
    const leftoverShare =
        totals.income > 0
            ? Math.round((Math.max(0, totals.leftover) / totals.income) * 100)
            : 0;

    const snapshot = [
        {
            label: "Paycheck",
            value: totals.income,
            sign: "+" as const,
            amountTone: "positive" as const,
        },
        {
            label: "Spent",
            value: totals.expenses,
            sign: "−" as const,
            amountTone: "negative" as const,
        },
        {
            label: "Bills paid",
            value: totals.bills,
            sign: "−" as const,
            amountTone: "ink" as const,
        },
    ];

    const openFab = () => {
        Alert.alert("Add", "What do you want to log?", [
            {
                text: "Paycheck",
                onPress: () => setIncomeOpen(true),
            },
            {
                text: "Spending",
                onPress: () => setExpenseOpen(true),
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    if (needsFirstPaycheck) {
        return (
            <View style={dashboard.screen}>
                <StatusBar style="dark" />
                <FirstRunEmpty onAddPaycheck={() => setIncomeOpen(true)} />
                <IncomeForm
                    visible={incomeOpen}
                    onClose={() => setIncomeOpen(false)}
                />
            </View>
        );
    }

    return (
        <View style={dashboard.screen}>
            <StatusBar style="light" />
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={styles.scroll}
            >
                <Hero
                    kicker={formatLeftoverKicker(range.end, periodUnit)}
                    value={formatMoney(totals.leftover)}
                    caption="After logged spending & payments"
                    percent={leftoverShare}
                    overlap
                >
                    <HeroPeriodNav
                        label={label}
                        onShift={shiftPeriod}
                        onResetToToday={resetToToday}
                    />
                </Hero>

                <View style={styles.overlap}>
                    <RowGroup>
                        {snapshot.map((row, index) => (
                            <StatusRow
                                key={row.label}
                                title={row.label}
                                amount={formatMoney(row.value, {
                                    sign: row.sign,
                                })}
                                amountTone={row.amountTone}
                                showChip={false}
                                isLast={index === snapshot.length - 1}
                            />
                        ))}
                    </RowGroup>
                </View>

                <View style={styles.body}>
                    <Text style={dashboard.sectionLabel}>Recent</Text>
                    <RowGroup>
                        {recent.length === 0 ? (
                            <StatusRow
                                title="Nothing logged yet"
                                amount=""
                                subtitle="Spending and paychecks show up here"
                                showChip={false}
                                isLast
                            />
                        ) : (
                            recent.map((item, index) => (
                                <StatusRow
                                    key={item.id}
                                    title={item.title}
                                    subtitle={item.date}
                                    amount={formatMoney(item.amount, {
                                        sign: item.kind === "in" ? "+" : "−",
                                    })}
                                    amountTone={
                                        item.kind === "in"
                                            ? "positive"
                                            : "ink"
                                    }
                                    showChip={false}
                                    isLast={index === recent.length - 1}
                                />
                            ))
                        )}
                    </RowGroup>
                </View>
            </ScrollView>

            <Fab onPress={openFab} accessibilityLabel="Add paycheck or spending" />

            <IncomeForm
                visible={incomeOpen}
                onClose={() => setIncomeOpen(false)}
            />
            <ExpenseForm
                visible={expenseOpen}
                onClose={() => setExpenseOpen(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 88,
    },
    overlap: {
        marginTop: -40,
        marginHorizontal: theme.space.lg,
        zIndex: 2,
    },
    body: {
        paddingHorizontal: theme.space.lg,
        paddingTop: theme.space.sm,
    },
});
