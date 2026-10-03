import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { text } from "@/design";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useDashboardStyles } from "@/styles/dashboard";
import {
    formatDisplayDate,
    isViewingCurrentPeriod,
    shiftAnchor,
    startOfMonth,
} from "@/utils/date";
import { goBackOrReplace } from "@/utils/navigation";
import {
    StatementLine,
    buildMonthStatement,
    clampStatementMonth,
    groupStatementLinesByDate,
    isStatementAtCurrentMonth,
    isStatementAtEarliestMonth,
    parseMonthParam,
    statementEarliestMonth,
} from "@/utils/month-statement";
import { exportStatementPdf } from "@/utils/statement-pdf";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

export default function StatementScreen() {
    useStatusBarStyle("dark");
    const topPadding = useScreenTopPadding();
    const dashboard = useDashboardStyles();
    const { theme } = useTheme();
    const { formatMoney, currency } = useLocale();
    const { month: rawMonth } = useLocalSearchParams<{ month?: string }>();
    const [exporting, setExporting] = useState(false);

    const { income, loading: incomeLoading } = useIncome();
    const { expenses, loading: expensesLoading } = useExpenses();
    const { bills, payments: billPayments, loading: billsLoading } = useBills();
    const { debts, payments: debtPayments, loading: debtsLoading } = useDebt();
    const {
        savings,
        contributions: savingsContributions,
        loading: savingsLoading,
    } = useSavings();

    const loading =
        incomeLoading ||
        expensesLoading ||
        billsLoading ||
        debtsLoading ||
        savingsLoading;

    const earliestMonth = useMemo(
        () => statementEarliestMonth(income),
        [income]
    );

    const routeAnchor = useMemo(
        () =>
            parseMonthParam(rawMonth, new Date(), new Date(), earliestMonth),
        [rawMonth, earliestMonth]
    );
    const [anchor, setAnchor] = useState(routeAnchor);
    const [prevRouteAnchor, setPrevRouteAnchor] = useState(routeAnchor);

    // When the route month or earliest bound changes, follow the derived date.
    if (routeAnchor.getTime() !== prevRouteAnchor.getTime()) {
        setPrevRouteAnchor(routeAnchor);
        setAnchor(routeAnchor);
    }

    const atCurrentMonth = isStatementAtCurrentMonth(anchor);
    const atEarliestMonth = isStatementAtEarliestMonth(anchor, earliestMonth);

    const statement = useMemo(
        () =>
            buildMonthStatement({
                anchor,
                income,
                expenses,
                bills,
                debts,
                savings,
                billPayments,
                debtPayments,
                savingsContributions,
            }),
        [
            anchor,
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

    const isCurrentMonth = isViewingCurrentPeriod(statement.range, "month");

    const shiftMonth = (delta: -1 | 1) => {
        setAnchor((current) => {
            const next = shiftAnchor(current, "month", delta);
            return clampStatementMonth(next, new Date(), earliestMonth);
        });
    };

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: theme.space.screenX,
                    paddingBottom: theme.space.xxl,
                },
                topRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: theme.space.sm,
                },
                backRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.space.xs,
                    minHeight: theme.size.tap,
                    marginLeft: -theme.space.xs,
                },
                backLabel: {
                    color: theme.text.accent,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                shareHit: {
                    minHeight: theme.size.tap,
                    minWidth: theme.size.tap,
                    alignItems: "center",
                    justifyContent: "center",
                },
                pageTitle: {
                    ...text.display,
                    marginBottom: theme.space.md,
                    marginLeft: theme.space.xs,
                },
                periodRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: theme.space.lg,
                    backgroundColor: theme.bg.surface,
                    borderRadius: theme.radius.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border.subtle,
                    paddingVertical: theme.space.xs,
                    paddingHorizontal: theme.space.xs,
                },
                periodChevron: {
                    minHeight: theme.size.tap,
                    minWidth: theme.size.tap,
                    alignItems: "center",
                    justifyContent: "center",
                },
                periodLabelHit: {
                    flex: 1,
                    alignItems: "center",
                    paddingHorizontal: theme.space.sm,
                },
                periodLabel: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                periodHint: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.xs,
                    marginTop: 2,
                },
                balanceCard: {
                    backgroundColor: theme.bg.surface,
                    borderRadius: theme.radius.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border.subtle,
                    padding: theme.space.md,
                    marginBottom: theme.space.lg,
                    gap: theme.space.sm,
                },
                balanceRow: {
                    flexDirection: "row",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: theme.space.md,
                },
                balanceLabel: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                },
                balanceValue: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.bold,
                    fontVariant: ["tabular-nums"],
                },
                sectionLabel: {
                    ...text.sectionLabel,
                    marginBottom: theme.space.sm,
                },
                empty: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.sm,
                    lineHeight: theme.lineHeight.sm,
                    marginBottom: theme.space.lg,
                },
                ledger: {
                    marginBottom: theme.space.lg,
                    gap: theme.space.sm,
                },
                dayCard: {
                    backgroundColor: theme.bg.surface,
                    borderRadius: theme.radius.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border.subtle,
                    overflow: "hidden",
                },
                dayHeader: {
                    paddingHorizontal: theme.space.md,
                    paddingTop: theme.space.md,
                    paddingBottom: theme.space.sm,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border.subtle,
                    backgroundColor: theme.bg.sunken,
                },
                dayHeaderLabel: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.xs,
                    lineHeight: theme.lineHeight.xs,
                    fontWeight: theme.fontWeight.bold,
                    letterSpacing: 0.3,
                    textTransform: "uppercase",
                },
                row: {
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: theme.space.sm,
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.md,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.border.subtle,
                },
                rowLast: {
                    borderBottomWidth: 0,
                },
                rowBody: {
                    flex: 1,
                    minWidth: 0,
                    gap: 2,
                },
                rowLabel: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.sm,
                    lineHeight: theme.lineHeight.sm,
                    fontWeight: theme.fontWeight.semibold,
                },
                rowKind: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.xs,
                    lineHeight: theme.lineHeight.xs,
                },
                rowAmounts: {
                    alignItems: "flex-end",
                    gap: 2,
                    minWidth: 96,
                },
                rowAmount: {
                    fontSize: theme.fontSize.sm,
                    lineHeight: theme.lineHeight.sm,
                    fontWeight: theme.fontWeight.bold,
                    fontVariant: ["tabular-nums"],
                },
                rowBalance: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.xs,
                    lineHeight: theme.lineHeight.xs,
                    fontWeight: theme.fontWeight.semibold,
                    fontVariant: ["tabular-nums"],
                },
                monthEndCard: {
                    backgroundColor: theme.bg.inverse,
                    borderRadius: theme.radius.md,
                    padding: theme.space.md,
                    marginBottom: theme.space.lg,
                    gap: theme.space.xs,
                },
                monthEndLabel: {
                    color: theme.text.inverseTertiary,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.bold,
                    letterSpacing: 0.4,
                    textTransform: "uppercase",
                },
                monthEndValue: {
                    color: theme.text.inverse,
                    fontSize: theme.fontSize.xl,
                    fontWeight: theme.fontWeight.bold,
                    fontVariant: ["tabular-nums"],
                },
                monthEndHint: {
                    color: theme.text.inverseSecondary,
                    fontSize: theme.fontSize.xs,
                    lineHeight: theme.lineHeight.xs,
                },
                amountIn: {
                    color: theme.intent.positive.fg,
                },
                amountOut: {
                    color: theme.text.primary,
                },
                amountSkipped: {
                    color: theme.text.tertiary,
                },
                totalsCard: {
                    backgroundColor: theme.bg.surface,
                    borderRadius: theme.radius.md,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border.subtle,
                    padding: theme.space.md,
                    gap: theme.space.sm,
                },
                totalRow: {
                    flexDirection: "row",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: theme.space.md,
                },
                totalLabel: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.sm,
                },
                totalValue: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                    fontVariant: ["tabular-nums"],
                },
                netRow: {
                    marginTop: theme.space.xs,
                    paddingTop: theme.space.sm,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    borderTopColor: theme.border.subtle,
                },
                netLabel: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.bold,
                },
                netValue: {
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.bold,
                    fontVariant: ["tabular-nums"],
                },
                pressed: {
                    opacity: 0.82,
                },
            }),
        [theme]
    );

    const handleExportPdf = async () => {
        if (exporting) {
            return;
        }
        try {
            setExporting(true);
            await exportStatementPdf({
                statement,
                formatMoney,
                currencyCode: currency,
            });
        } catch (error) {
            Alert.alert(
                "Export failed",
                error instanceof Error ? error.message : "Something went wrong."
            );
        } finally {
            setExporting(false);
        }
    };

    const kindLabel = (line: StatementLine): string => {
        switch (line.kind) {
            case "income":
                return "Income";
            case "expense":
                return "Spending";
            case "bill":
                return line.skipped ? "Bill · skipped" : "Bill payment";
            case "debt":
                return line.skipped ? "Debt · skipped" : "Debt payment";
            case "savings":
                return "Savings";
        }
    };

    const dayGroups = useMemo(
        () => groupStatementLinesByDate(statement.lines),
        [statement.lines]
    );

    if (loading) {
        return (
            <View style={dashboard.screen}>
                <DashboardSkeleton />
            </View>
        );
    }

    const { activity } = statement;
    const netOkay = activity.leftover >= 0;

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: topPadding },
                ]}
            >
                <View style={styles.topRow}>
                    <Pressable
                        onPress={() => goBackOrReplace("/(tabs)")}
                        style={({ pressed }) => [
                            styles.backRow,
                            pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Back"
                        hitSlop={8}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={22}
                            color={theme.text.accent}
                        />
                        <Text style={styles.backLabel}>Back</Text>
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            void handleExportPdf();
                        }}
                        disabled={exporting}
                        style={({ pressed }) => [
                            styles.shareHit,
                            pressed && styles.pressed,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel="Export PDF statement"
                        accessibilityState={{ busy: exporting }}
                        hitSlop={8}
                    >
                        {exporting ? (
                            <ActivityIndicator
                                size="small"
                                color={theme.text.accent}
                            />
                        ) : (
                            <Ionicons
                                name="download-outline"
                                size={22}
                                color={theme.text.accent}
                            />
                        )}
                    </Pressable>
                </View>

                <Text style={styles.pageTitle}>Month statement</Text>

                <View style={styles.periodRow}>
                    <Pressable
                        onPress={() => {
                            if (!atEarliestMonth) {
                                shiftMonth(-1);
                            }
                        }}
                        disabled={atEarliestMonth}
                        accessibilityRole="button"
                        accessibilityLabel={
                            atEarliestMonth
                                ? "Previous month unavailable. Statements start at your first paycheck month."
                                : "Previous month"
                        }
                        accessibilityState={{ disabled: atEarliestMonth }}
                        style={styles.periodChevron}
                    >
                        <Ionicons
                            name="chevron-back"
                            size={20}
                            color={
                                atEarliestMonth
                                    ? theme.text.disabled
                                    : theme.text.primary
                            }
                        />
                    </Pressable>
                    <Pressable
                        onPress={() =>
                            setAnchor(
                                clampStatementMonth(
                                    startOfMonth(new Date()),
                                    new Date(),
                                    earliestMonth
                                )
                            )
                        }
                        accessibilityRole="button"
                        accessibilityLabel={
                            isCurrentMonth
                                ? `Current month ${statement.label}`
                                : `Month ${statement.label}. Tap to jump to this month.`
                        }
                        style={styles.periodLabelHit}
                    >
                        <Text style={styles.periodLabel}>{statement.label}</Text>
                        {isCurrentMonth ? (
                            <Text style={styles.periodHint}>This month</Text>
                        ) : null}
                    </Pressable>
                    <Pressable
                        onPress={() => {
                            if (!atCurrentMonth) {
                                shiftMonth(1);
                            }
                        }}
                        disabled={atCurrentMonth}
                        accessibilityRole="button"
                        accessibilityLabel={
                            atCurrentMonth
                                ? "Next month unavailable. Statements stop at the current month."
                                : "Next month"
                        }
                        accessibilityState={{ disabled: atCurrentMonth }}
                        style={styles.periodChevron}
                    >
                        <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={
                                atCurrentMonth
                                    ? theme.text.disabled
                                    : theme.text.primary
                            }
                        />
                    </Pressable>
                </View>

                <View style={styles.balanceCard}>
                    <View style={styles.balanceRow}>
                        <Text style={styles.balanceLabel}>Opening balance</Text>
                        <Text style={styles.balanceValue}>
                            {formatMoney(statement.openingLeftover)}
                        </Text>
                    </View>
                </View>

                <Text style={styles.sectionLabel}>Transactions</Text>
                {statement.lines.length === 0 ? (
                    <Text style={styles.empty}>No money moved this month.</Text>
                ) : (
                    <View style={styles.ledger}>
                        {dayGroups.map((group) => (
                            <View key={group.date} style={styles.dayCard}>
                                <View style={styles.dayHeader}>
                                    <Text style={styles.dayHeaderLabel}>
                                        {formatDisplayDate(group.date)}
                                    </Text>
                                </View>
                                {group.lines.map((line, index) => {
                                    const isLast =
                                        index === group.lines.length - 1;
                                    const amountStyle = line.skipped
                                        ? styles.amountSkipped
                                        : line.direction === "in"
                                          ? styles.amountIn
                                          : styles.amountOut;
                                    const amountText =
                                        line.skipped && line.amount === 0
                                            ? formatMoney(0)
                                            : formatMoney(line.amount, {
                                                  sign:
                                                      line.direction === "in"
                                                          ? "+"
                                                          : "−",
                                              });
                                    return (
                                        <View
                                            key={line.id}
                                            style={[
                                                styles.row,
                                                isLast && styles.rowLast,
                                            ]}
                                        >
                                            <View style={styles.rowBody}>
                                                <Text
                                                    style={styles.rowLabel}
                                                    numberOfLines={2}
                                                >
                                                    {line.label}
                                                </Text>
                                                <Text style={styles.rowKind}>
                                                    {kindLabel(line)}
                                                </Text>
                                            </View>
                                            <View style={styles.rowAmounts}>
                                                <Text
                                                    style={[
                                                        styles.rowAmount,
                                                        amountStyle,
                                                    ]}
                                                >
                                                    {amountText}
                                                </Text>
                                                <Text style={styles.rowBalance}>
                                                    Bal{" "}
                                                    {formatMoney(
                                                        line.balanceAfter
                                                    )}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.monthEndCard}>
                    <Text style={styles.monthEndLabel}>
                        Balance at month end
                    </Text>
                    <Text style={styles.monthEndValue}>
                        {formatMoney(statement.closingLeftover)}
                    </Text>
                    <Text style={styles.monthEndHint}>
                        What’s left after everything logged this month.
                    </Text>
                </View>

                <Text style={styles.sectionLabel}>Month totals</Text>
                <View style={styles.totalsCard}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Income</Text>
                        <Text style={[styles.totalValue, styles.amountIn]}>
                            {formatMoney(activity.income, { sign: "+" })}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Spending</Text>
                        <Text style={styles.totalValue}>
                            {formatMoney(activity.expenses, { sign: "−" })}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Bills paid</Text>
                        <Text style={styles.totalValue}>
                            {formatMoney(activity.bills, { sign: "−" })}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Debt payments</Text>
                        <Text style={styles.totalValue}>
                            {formatMoney(activity.debtPayments, { sign: "−" })}
                        </Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Savings</Text>
                        <Text style={styles.totalValue}>
                            {formatMoney(activity.savings, { sign: "−" })}
                        </Text>
                    </View>
                    <View style={[styles.totalRow, styles.netRow]}>
                        <Text style={styles.netLabel}>Net this month</Text>
                        <Text
                            style={[
                                styles.netValue,
                                {
                                    color: netOkay
                                        ? theme.intent.positive.fg
                                        : theme.intent.negative.fg,
                                },
                            ]}
                        >
                            {activity.leftover > 0
                                ? formatMoney(activity.leftover, { sign: "+" })
                                : activity.leftover < 0
                                  ? formatMoney(Math.abs(activity.leftover), {
                                        sign: "−",
                                    })
                                  : formatMoney(0)}
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}
