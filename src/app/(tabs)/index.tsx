import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardHeroCompact } from "@/components/DashboardHero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { MonthGrid } from "@/components/MonthGrid";
import { MonthTrendChart, SpendByCategoryChart } from "@/components/HomeCharts";
import { SegmentControl } from "@/components/SegmentControl";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { theme, type } from "@/theme";
import {
    hasCompletedFirstRun,
    markFirstRunComplete,
} from "@/services/storage";
import {
    PERIOD_UNITS,
    PERIOD_UNIT_LABELS,
    parseIsoDate,
    startOfMonth,
} from "@/utils/date";
import {
    getExpenseSpendByCategory,
    getMonthlyTrend,
    getTotalsForRange,
} from "@/utils/finance";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";

const UNIT_OPTIONS = PERIOD_UNITS.map((unit) => PERIOD_UNIT_LABELS[unit]);

export default function HomeScreen() {
    const { formatMoney } = useLocale();
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { bills, payments: billPayments } = useBills();
    const { debts, payments: debtPayments } = useDebt();
    const { savings, contributions: savingsContributions } = useSavings();
    const {
        periodUnit,
        range,
        label,
        setPeriodUnit,
        shiftPeriod,
        resetToToday,
        selectDay,
        anchorIso,
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

    const lines: {
        label: string;
        value: number;
        sign: "+" | "−";
        href: "/(tabs)/activity" | "/(tabs)/plans";
    }[] = [
        {
            label: "Income",
            value: totals.income,
            sign: "+" as const,
            href: "/(tabs)/activity",
        },
        {
            label: "Spending",
            value: totals.expenses,
            sign: "−" as const,
            href: "/(tabs)/activity",
        },
        {
            label: "Bills",
            value: totals.bills,
            sign: "−" as const,
            href: "/(tabs)/plans",
        },
        {
            label: "Debt payments",
            value: totals.debtPayments,
            sign: "−" as const,
            href: "/(tabs)/plans",
        },
        {
            label: "Savings",
            value: totals.savings,
            sign: "−" as const,
            href: "/(tabs)/plans",
        },
    ];

    const maxLine = Math.max(...lines.map((line) => line.value), 1);

    const markedIso = useMemo(() => {
        const dates = [
            ...income.map((item) => item.date),
            ...expenses.map((item) => item.date),
            ...billPayments.map((item) => item.date),
            ...debtPayments.map((item) => item.date),
            ...savingsContributions.map((item) => item.date),
        ];
        return new Set(dates);
    }, [
        income,
        expenses,
        billPayments,
        debtPayments,
        savingsContributions,
    ]);

    const categorySpend = useMemo(
        () => getExpenseSpendByCategory(expenses, range),
        [expenses, range]
    );

    const monthTrend = useMemo(
        () =>
            getMonthlyTrend(
                range.end,
                6,
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
            range.end,
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

    useEffect(() => {
        void hasCompletedFirstRun().then((done) => {
            if (!done) {
                void markFirstRunComplete();
            }
        });
    }, []);

    const { collapsed, scrollProps } = useStickyHero({
        collapseAt: 140,
        expandAt: 48,
    });
    const leftoverLabel = formatMoney(totals.leftover, { compact: true });
    const needsFirstPaycheck = income.length === 0;
    const periodNav = (forCompact: boolean) => (
        <HeroPeriodNav
            label={label}
            onShift={shiftPeriod}
            onResetToToday={resetToToday}
            style={forCompact ? { marginTop: 8 } : { marginTop: 0, flex: 1 }}
        />
    );

    const selectUnit = (value: string) => {
        const next = PERIOD_UNITS.find(
            (unit) => PERIOD_UNIT_LABELS[unit] === value
        );
        if (next) {
            setPeriodUnit(next);
        }
    };

    const okay = totals.leftover >= 0;

    return (
        <View style={dashboard.screen}>
            {collapsed ? (
                <View style={styles.mastCompactSticky}>
                    <DashboardHeroCompact
                        kicker={okay ? "Leftover" : "Short"}
                        value={leftoverLabel}
                        pace={periodNav(true)}
                    />
                </View>
            ) : null}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={styles.scroll}
                {...scrollProps}
            >
                <View style={styles.masthead}>
                    <Text style={styles.mastKicker}>On Hand</Text>
                    <Text style={styles.mastValue}>
                        {okay ? "You’re okay" : "Short this period"}
                    </Text>
                    <Text style={styles.mastAmount}>{leftoverLabel}</Text>
                    <Text style={styles.mastCaption}>
                        {okay
                            ? "Income covers spending, bills, debts, and savings so far"
                            : "Outflows are higher than income received so far"}
                    </Text>

                    <View style={styles.mastNav}>{periodNav(false)}</View>
                </View>

                <View style={styles.body}>
                    <SegmentControl
                        options={UNIT_OPTIONS}
                        selected={PERIOD_UNIT_LABELS[periodUnit]}
                        onSelect={selectUnit}
                        compact
                    />

                    {needsFirstPaycheck ? (
                        <View style={{ marginTop: theme.space.lg, marginBottom: theme.space.md }}>
                            <DashboardEmpty
                                title="Add your first paycheck"
                                text="Leftover starts at zero until you log income. Activity is the place to record money in."
                                actionLabel="Add first paycheck"
                                onAction={() => router.push("/(tabs)/activity")}
                            />
                        </View>
                    ) : null}

                    <MonthGrid
                        month={startOfMonth(
                            parseIsoDate(anchorIso) ?? range.start
                        )}
                        selectedIso={
                            periodUnit === "day" ? anchorIso : undefined
                        }
                        markedIso={markedIso}
                        onSelectDay={selectDay}
                    />

                    <View style={styles.statement}>
                        <Text style={dashboard.sectionLabel}>
                            Cash so far
                        </Text>
                        {lines.map((line) => (
                            <Pressable
                                key={line.label}
                                onPress={() => router.push(line.href)}
                                style={({ pressed }) => [
                                    styles.line,
                                    pressed && { opacity: 0.85 },
                                ]}
                            >
                                <View style={styles.lineTop}>
                                    <Text style={styles.lineLabel}>{line.label}</Text>
                                    <Text
                                        style={[
                                            styles.lineValue,
                                            line.sign === "+"
                                                ? styles.lineIn
                                                : styles.lineOut,
                                        ]}
                                    >
                                        {formatMoney(line.value, {
                                            compact: true,
                                            sign: line.sign,
                                        })}
                                    </Text>
                                </View>
                                <View style={dashboard.barTrack}>
                                    <View
                                        style={[
                                            dashboard.barFill,
                                            line.sign === "+" && dashboard.barFillDone,
                                            {
                                                width: `${Math.min(
                                                    100,
                                                    (line.value / maxLine) * 100
                                                )}%`,
                                            },
                                        ]}
                                    />
                                </View>
                            </Pressable>
                        ))}

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Leftover</Text>
                            <Text
                                style={[
                                    styles.totalValue,
                                    {
                                        color: okay
                                            ? theme.color.successText
                                            : theme.color.danger,
                                    },
                                ]}
                            >
                                {formatMoney(totals.leftover, { compact: true })}
                            </Text>
                        </View>
                    </View>

                    <SpendByCategoryChart rows={categorySpend} />
                    <MonthTrendChart points={monthTrend} />

                    <Pressable
                        onPress={() => router.push("/(tabs)/activity")}
                        style={({ pressed }) => [
                            styles.cta,
                            pressed && { opacity: 0.94 },
                        ]}
                    >
                        <View>
                            <Text style={dashboard.cardTitle}>Log activity</Text>
                            <Text style={dashboard.cardSubtitle}>
                                Income and everyday spending
                            </Text>
                        </View>
                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color={theme.color.ink}
                        />
                    </Pressable>

                    <Pressable
                        onPress={() => router.push("/(tabs)/plans")}
                        style={({ pressed }) => [
                            styles.cta,
                            pressed && { opacity: 0.94 },
                        ]}
                    >
                        <View>
                            <Text style={dashboard.cardTitle}>Review plans</Text>
                            <Text style={dashboard.cardSubtitle}>
                                Bills, savings, and debts
                            </Text>
                        </View>
                        <Ionicons
                            name="arrow-forward"
                            size={18}
                            color={theme.color.ink}
                        />
                    </Pressable>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: 40,
    },
    masthead: {
        backgroundColor: theme.color.hero,
        paddingHorizontal: theme.space.xl,
        paddingTop: theme.space.screenTop,
        paddingBottom: theme.space.xxl,
    },
    mastKicker: {
        ...type.kicker,
        marginBottom: theme.space.sm,
    },
    mastValue: {
        color: theme.color.onHero,
        fontSize: 22,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.3,
    },
    mastAmount: {
        color: theme.color.onHero,
        fontSize: 44,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -1,
        marginTop: theme.space.xs,
    },
    mastCaption: {
        color: theme.color.onHeroCaption,
        fontSize: theme.font.caption,
        lineHeight: 18,
        marginTop: theme.space.sm,
        maxWidth: 280,
    },
    mastNav: {
        marginTop: theme.space.xl,
        paddingTop: theme.space.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.color.heroTrack,
    },
    mastCompactSticky: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        backgroundColor: theme.color.hero,
        paddingHorizontal: theme.space.xl,
        paddingTop: theme.space.screenTop,
        paddingBottom: theme.space.md,
    },
    body: {
        paddingHorizontal: theme.space.screenX,
        paddingTop: theme.space.lg,
    },
    statement: {
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.space.lg,
        paddingTop: theme.space.lg,
        paddingBottom: theme.space.md,
        marginTop: theme.space.lg,
        marginBottom: theme.space.md,
    },
    line: {
        marginBottom: theme.space.md,
    },
    lineTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 6,
    },
    lineLabel: {
        color: theme.color.ink,
        fontSize: theme.font.body,
        fontWeight: theme.font.weight.semibold,
    },
    lineValue: {
        fontSize: theme.font.body,
        fontWeight: theme.font.weight.bold,
    },
    lineIn: {
        color: theme.color.successText,
    },
    lineOut: {
        color: theme.color.ink,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: 1,
        borderTopColor: theme.color.border,
        paddingTop: theme.space.md,
        marginTop: theme.space.xs,
        marginBottom: theme.space.sm,
    },
    totalLabel: {
        ...type.sectionLabel,
        marginTop: 0,
        marginBottom: 0,
    },
    totalValue: {
        fontSize: 22,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.3,
    },
    cta: {
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        paddingHorizontal: theme.space.lg,
        paddingVertical: theme.space.lg,
        marginBottom: theme.space.md,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
});
