import { AppButton } from "@/components/AppButton";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DueNowSection } from "@/components/DueNowSection";
import { DashboardHeroCompact } from "@/components/DashboardHero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { MonthGrid } from "@/components/MonthGrid";
import { MonthTrendChart, SpendByCategoryChart } from "@/components/HomeCharts";
import { SegmentControl } from "@/components/SegmentControl";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { text, theme } from "@/design";
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
            style={
                forCompact
                    ? { marginTop: theme.space.sm }
                    : { marginTop: 0, flex: 1 }
            }
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
                <View
                    style={[
                        dashboard.heroCompactSticky,
                        styles.mastCompactSticky,
                    ]}
                >
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
                    <View style={styles.mastEyebrow}>
                        <Text style={styles.mastKicker}>On hand</Text>
                        <Text
                            style={[
                                styles.mastStatus,
                                {
                                    color: okay
                                        ? theme.intent.positive.bright
                                        : theme.text.inverseSecondary,
                                },
                            ]}
                        >
                            {okay ? "Okay" : "Short"}
                        </Text>
                    </View>
                    <Text
                        style={styles.mastAmount}
                        accessibilityRole="header"
                    >
                        {leftoverLabel}
                    </Text>
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
                        <View style={styles.emptyWrap}>
                            <DashboardEmpty
                                icon="cash-outline"
                                title="Add your first paycheck"
                                text="Leftover starts at zero until you log income. Activity is the place to record money in."
                                actionLabel="Add first paycheck"
                                onAction={() => router.push("/(tabs)/activity")}
                            />
                        </View>
                    ) : null}

                    <DueNowSection />

                    <Text style={[dashboard.sectionLabel, styles.calLabel]}>
                        Calendar
                    </Text>
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
                        {lines.map((line, index) => (
                            <Pressable
                                key={line.label}
                                onPress={() => router.push(line.href)}
                                accessibilityRole="button"
                                accessibilityLabel={`${line.label}, ${formatMoney(line.value, { compact: true, sign: line.sign })}`}
                                style={({ pressed }) => [
                                    styles.line,
                                    index < lines.length - 1 && styles.lineGap,
                                    pressed && styles.linePressed,
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
                                            ? theme.intent.positive.fg
                                            : theme.intent.negative.fg,
                                    },
                                ]}
                            >
                                {formatMoney(totals.leftover, { compact: true })}
                            </Text>
                        </View>
                    </View>

                    <SpendByCategoryChart rows={categorySpend} />
                    <MonthTrendChart points={monthTrend} />

                    <View style={styles.actions}>
                        <AppButton
                            label="Log activity"
                            onPress={() => router.push("/(tabs)/activity")}
                        />
                        <Pressable
                            onPress={() => router.push("/(tabs)/plans")}
                            accessibilityRole="button"
                            accessibilityLabel="Review plans"
                            style={({ pressed }) => [
                                styles.secondaryAction,
                                pressed && { opacity: 0.7 },
                            ]}
                        >
                            <Text style={styles.secondaryActionText}>
                                Review plans
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={16}
                                color={theme.text.primary}
                            />
                        </Pressable>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: theme.space.xl,
    },
    masthead: {
        backgroundColor: theme.bg.inverse,
        paddingHorizontal: theme.space.screenX,
        paddingTop: theme.space.screenTop,
        paddingBottom: theme.space.lg,
    },
    mastEyebrow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: theme.space.md,
        marginBottom: theme.space.sm,
    },
    mastKicker: text.kicker,
    mastStatus: {
        ...text.kicker,
        fontWeight: theme.fontWeight.bold,
    },
    mastAmount: text.hero,
    mastCaption: {
        color: theme.text.inverseSecondary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        marginTop: theme.space.sm,
        maxWidth: 320,
    },
    mastNav: {
        marginTop: theme.space.lg,
        paddingTop: theme.space.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border.inverse,
    },
    mastCompactSticky: {
        paddingTop: theme.space.screenTop,
        paddingBottom: theme.space.md,
    },
    body: {
        width: "100%",
        maxWidth: theme.size.readable,
        alignSelf: "center",
        paddingHorizontal: theme.space.screenX,
        paddingTop: theme.space.md,
    },
    emptyWrap: {
        marginTop: theme.space.md,
        marginBottom: theme.space.sm,
    },
    calLabel: {
        marginTop: theme.space.md,
        marginBottom: theme.space.sm,
    },
    statement: {
        marginTop: theme.space.lg,
        marginBottom: theme.space.sm,
    },
    line: {
        paddingVertical: theme.space.sm,
    },
    lineGap: {
        marginBottom: theme.space.sm,
    },
    linePressed: {
        opacity: 0.85,
    },
    lineTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: theme.space.sm,
    },
    lineLabel: {
        ...text.body,
        fontWeight: theme.fontWeight.semibold,
    },
    lineValue: {
        ...text.money,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
    },
    lineIn: {
        color: theme.intent.positive.fg,
    },
    lineOut: {
        color: theme.text.primary,
    },
    totalRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border.subtle,
        paddingTop: theme.space.md,
        marginTop: theme.space.sm,
    },
    totalLabel: text.sectionLabel,
    totalValue: {
        ...text.money,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
    },
    actions: {
        marginTop: theme.space.md,
        marginBottom: theme.space.sm,
        gap: theme.space.sm,
    },
    secondaryAction: {
        minHeight: theme.size.tap,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: theme.space.sm,
    },
    secondaryActionText: {
        color: theme.text.primary,
        fontSize: theme.fontSize.md,
        lineHeight: theme.lineHeight.md,
        fontWeight: theme.fontWeight.semibold,
    },
});
