import { useBills } from "@/app/contexts/BillsContext";
import { useDateRange } from "@/app/contexts/DateRangeContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import {
    accentForLabel,
    groupByLedgerDate,
    LedgerDayGroup,
    LedgerRow,
} from "@/components/LedgerList";
import { MonthGrid } from "@/components/MonthGrid";
import { SegmentControl } from "@/components/SegmentControl";
import { WalkthroughAnchor } from "@/components/walkthrough/WalkthroughAnchor";
import { text, theme } from "@/design";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useDashboardStyles } from "@/styles/dashboard";
import {
    isViewingCurrentPeriod,
    parseIsoDate,
    PERIOD_UNIT_LABELS,
    PERIOD_UNITS,
    startOfMonth,
} from "@/utils/date";
import {
    activityKindLabel,
    activityLineHref,
    CALENDAR_ACTIVITY_LIMIT,
    clampStatementMonth,
    collectActivityLinesForRange,
    statementEarliestMonth,
    toMonthParam,
} from "@/utils/month-statement";
import { resolvePayCycle } from "@/utils/pay-cycle";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, type Href } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const UNIT_OPTIONS = [
    ...PERIOD_UNITS.map((unit) => PERIOD_UNIT_LABELS[unit]),
    "Payday",
];

export default function CalendarTabScreen() {
    useStatusBarStyle("dark");
    const topPadding = useScreenTopPadding();
    const dashboard = useDashboardStyles();
    const { theme: accentTheme } = useTheme();
    const { formatMoney } = useLocale();

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

    const [payMode, setPayMode] = useState(false);
    const [payOffset, setPayOffset] = useState(0);

    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { bills, payments: billPayments } = useBills();
    const { debts, payments: debtPayments } = useDebt();
    const { savings, contributions: savingsContributions } = useSavings();

    const payCycle = useMemo(
        () => (payMode ? resolvePayCycle(income, new Date(), payOffset) : null),
        [payMode, income, payOffset]
    );
    const listRange = payCycle?.range ?? range;

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

    const allLines = useMemo(
        () =>
            collectActivityLinesForRange(
                listRange,
                {
                    income,
                    expenses,
                    bills,
                    debts,
                    savings,
                    billPayments,
                    debtPayments,
                    savingsContributions,
                },
                true
            ),
        [
            listRange,
            income,
            expenses,
            bills,
            debts,
            savings,
            billPayments,
            debtPayments,
            savingsContributions,
        ]
    );

    const truncated = allLines.length > CALENDAR_ACTIVITY_LIMIT;
    const visibleLines = truncated
        ? allLines.slice(0, CALENDAR_ACTIVITY_LIMIT)
        : allLines;

    const dayGroups = useMemo(
        () => groupByLedgerDate(visibleLines),
        [visibleLines]
    );

    const usingPayNav = Boolean(payMode && payCycle);
    const payLabel = payCycle
        ? `Until ${payCycle.nextPayday.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
          })}`
        : label;
    const viewingCurrentPeriod = usingPayNav
        ? payOffset === 0
        : isViewingCurrentPeriod(range, periodUnit);

    const activitySectionTitle = payCycle
        ? "This pay cycle"
        : periodUnit === "day"
          ? "This day"
          : periodUnit === "week"
            ? "This week"
            : periodUnit === "year"
              ? "This year"
              : "This month";

    const unitSelected = payMode
        ? "Payday"
        : PERIOD_UNIT_LABELS[periodUnit];

    const pickDay = (iso: string) => {
        setPayMode(false);
        setPayOffset(0);
        selectDay(iso);
    };

    const selectUnit = (value: string) => {
        if (value === "Payday") {
            setPayMode(true);
            setPayOffset(0);
            return;
        }
        setPayMode(false);
        setPayOffset(0);
        const next = PERIOD_UNITS.find(
            (unit) => PERIOD_UNIT_LABELS[unit] === value
        );
        if (next) {
            setPeriodUnit(next);
        }
    };

    const openMonthStatement = () => {
        const earliest = statementEarliestMonth(income);
        const monthAnchor = clampStatementMonth(
            startOfMonth(parseIsoDate(anchorIso) ?? range.start),
            new Date(),
            earliest
        );
        router.push(`/statement?month=${toMonthParam(monthAnchor)}`);
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
                <View style={styles.titleRow}>
                    <Text style={styles.pageTitle}>Calendar</Text>
                    <Pressable
                        onPress={openMonthStatement}
                        style={({ pressed }) => [
                            styles.statementHit,
                            pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="View month statement"
                        hitSlop={8}
                    >
                        <Ionicons
                            name="document-text-outline"
                            size={22}
                            color={accentTheme.text.accent}
                        />
                    </Pressable>
                </View>
                <Text style={styles.pageSubtitle}>
                    Change the leftover window and browse what moved. Dots mark
                    days with logged activity.
                </Text>

                <WalkthroughAnchor id="calendar-period">
                    <SegmentControl
                        options={UNIT_OPTIONS}
                        selected={unitSelected}
                        onSelect={selectUnit}
                        compact
                    />
                </WalkthroughAnchor>

                <HeroPeriodNav
                    label={usingPayNav ? payLabel : label}
                    onShift={
                        usingPayNav
                            ? (delta) => {
                                  setPayOffset((offset) => offset + delta);
                              }
                            : shiftPeriod
                    }
                    onResetToToday={
                        usingPayNav
                            ? () => {
                                  setPayOffset(0);
                              }
                            : resetToToday
                    }
                    isCurrentPeriod={viewingCurrentPeriod}
                    tone="default"
                    style={styles.periodNav}
                />

                {!payMode ? (
                    <MonthGrid
                        month={startOfMonth(
                            parseIsoDate(anchorIso) ?? range.start
                        )}
                        selectedIso={
                            periodUnit === "day" ? anchorIso : undefined
                        }
                        markedIso={markedIso}
                        onSelectDay={pickDay}
                    />
                ) : null}

                <Text style={[dashboard.sectionLabel, styles.activityLabel]}>
                    {activitySectionTitle}
                </Text>

                {visibleLines.length === 0 ? (
                    <Text style={styles.empty}>
                        No money moved in this window yet.
                    </Text>
                ) : (
                    <>
                        {dayGroups.map((group) => (
                            <LedgerDayGroup key={group.date} label={group.label}>
                                {group.items.map((line, index) => (
                                    <LedgerRow
                                        key={line.id}
                                        title={line.label}
                                        meta={activityKindLabel(line)}
                                        amountLabel={
                                            line.skipped && line.amount === 0
                                                ? formatMoney(0)
                                                : formatMoney(line.amount, {
                                                      sign:
                                                          line.direction ===
                                                          "in"
                                                              ? "+"
                                                              : "−",
                                                  })
                                        }
                                        accentColor={accentForLabel(
                                            activityKindLabel(line),
                                            accentTheme.chart
                                        )}
                                        isLast={
                                            index === group.items.length - 1
                                        }
                                        onPress={() =>
                                            router.push(
                                                activityLineHref(line) as Href
                                            )
                                        }
                                    />
                                ))}
                            </LedgerDayGroup>
                        ))}
                        {truncated ? (
                            <Text style={styles.truncateNote}>
                                Showing latest {CALENDAR_ACTIVITY_LIMIT}. Open
                                the month statement for the full ledger.
                            </Text>
                        ) : null}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    content: {
        width: "100%",
        maxWidth: theme.size.readable,
        alignSelf: "center",
        paddingHorizontal: theme.space.screenX,
        paddingBottom: theme.space.xl,
    },
    pressed: {
        opacity: 0.7,
    },
    pageTitle: {
        ...text.pageTitle,
        flex: 1,
        marginBottom: 0,
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.md,
        marginBottom: theme.space.xs,
        minHeight: theme.size.tap,
    },
    statementHit: {
        minHeight: theme.size.tap,
        minWidth: theme.size.tap,
        alignItems: "center",
        justifyContent: "center",
    },
    pageSubtitle: {
        ...text.caption,
        marginBottom: theme.space.md,
    },
    periodNav: {
        marginTop: theme.space.md,
        marginBottom: theme.space.sm,
    },
    activityLabel: {
        marginTop: theme.space.md,
        marginBottom: theme.space.sm,
    },
    empty: {
        ...text.caption,
        marginBottom: theme.space.md,
    },
    truncateNote: {
        ...text.caption,
        marginBottom: theme.space.sm,
    },
});
