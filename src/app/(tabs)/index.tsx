import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Bone } from "@/components/Skeleton";
import { DashboardHeroCompact } from "@/components/DashboardHero";
import { AnimatedMoneyText } from "@/components/AnimatedMoneyText";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import { DueNowBadgeButton, DueNowModal } from "@/components/DueNowModal";
import { MonthTrendChart, SpendByCategoryChart } from "@/components/HomeCharts";
import { WalkthroughAnchor } from "@/components/walkthrough/WalkthroughAnchor";
import {
    useWalkthroughOptional,
    WALKTHROUGH_HOME_DEMO,
    WALKTHROUGH_DUE_DEMO,
} from "@/components/walkthrough";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { useDueNowInbox } from "@/hooks/useDueNowInbox";
import { useDashboardStyles } from "@/styles/dashboard";
import { text, theme } from "@/design";
import {
    getActivityForRange,
    getCommittedForMonth,
    getExpenseSpendByCategory,
    getMonthlyTrend,
    getTotalsForRange,
} from "@/utils/finance";
import { getAccountSplitThrough } from "@/utils/account-balances";
import { takeOpenDuesOnHome } from "@/utils/navigation";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAccounts } from "../contexts/AccountsContext";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";

export default function HomeScreen() {
    const dashboard = useDashboardStyles();
    // The masthead is a dark band, so the clock needs to be light.
    useStatusBarStyle("light");

    const { formatMoney } = useLocale();
    const { income, loading: incomeLoading } = useIncome();
    const { expenses, loading: expensesLoading } = useExpenses();
    const { bills, payments: billPayments, loading: billsLoading } = useBills();
    const { debts, payments: debtPayments, loading: debtsLoading } = useDebt();
    const {
        savings,
        contributions: savingsContributions,
        loading: savingsLoading,
    } = useSavings();
    const {
        accounts,
        transfers,
        adjustments,
        loading: accountsLoading,
    } = useAccounts();
    const { periodUnit, range } = useDateRange();
    const [duesOpen, setDuesOpen] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const walkthrough = useWalkthroughOptional();

    const loading =
        incomeLoading ||
        expensesLoading ||
        billsLoading ||
        debtsLoading ||
        savingsLoading ||
        accountsLoading;

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

    const activity = useMemo(
        () =>
            getActivityForRange(
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

    const committed = useMemo(
        () =>
            getCommittedForMonth(
                range.end,
                bills,
                billPayments,
                debts,
                debtPayments
            ),
        [range.end, bills, billPayments, debts, debtPayments]
    );

    const incomeLine = {
        label: "Income",
        value: activity.income,
        href: "/(tabs)/activity" as const,
    };
    const outLines: {
        label: string;
        value: number;
        href: "/(tabs)/activity" | "/(tabs)/bills" | "/(tabs)/savings" | "/(tabs)/debts";
    }[] = [
        {
            label: "Spending",
            value: activity.expenses,
            href: "/(tabs)/activity",
        },
        {
            label: "Bills",
            value: activity.bills,
            href: "/(tabs)/bills",
        },
        {
            label: "Debt payments",
            value: activity.debtPayments,
            href: "/(tabs)/debts",
        },
        {
            label: "Savings",
            value: activity.savings,
            href: "/(tabs)/savings",
        },
    ];

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

    useFocusEffect(
        useCallback(() => {
            if (takeOpenDuesOnHome()) {
                setDuesOpen(true);
            }
        }, [])
    );

    useEffect(() => {
        const id = walkthrough?.activeId;
        if (!id) return;
        if (id === "home-leftover" || id === "home-due") {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        } else if (id === "home-breakdown") {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ y: 120, animated: true });
            }, 80);
        }
    }, [walkthrough?.activeId]);

    useEffect(() => {
        if (walkthrough?.phase === "running" && walkthrough.activeId === "home-due") {
            setDuesOpen(true);
            return;
        }
        if (walkthrough?.phase === "running") {
            setDuesOpen(false);
        }
    }, [walkthrough?.phase, walkthrough?.activeId]);

    const { collapsed, scrollProps } = useStickyHero({
        collapseAt: 100,
        expandAt: 40,
    });
    const topPadding = useScreenTopPadding();
    // The pinned bar is chrome, not a page header, so it hugs the status bar.
    const stickyTopPadding = useScreenTopPadding(theme.space.sm);
    const available = totals.leftover - committed.total;
    const walkthroughHomeDemo =
        walkthrough?.phase === "running" &&
        typeof walkthrough.activeId === "string" &&
        walkthrough.activeId.startsWith("home-");
    const displayLeftover = walkthroughHomeDemo
        ? WALKTHROUGH_HOME_DEMO.leftover
        : totals.leftover;
    const leftoverLabel = formatMoney(displayLeftover, { compact: true });
    const accountSplit = useMemo(
        () =>
            getAccountSplitThrough(
                range,
                accounts,
                income,
                expenses,
                billPayments,
                debtPayments,
                savingsContributions,
                transfers,
                adjustments
            ),
        [
            range,
            accounts,
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments,
        ]
    );
    const accountSplitLabel = walkthroughHomeDemo
        ? "Cash · Online"
        : `Cash: ${formatMoney(accountSplit.cash, { compact: true })}  |  Online: ${formatMoney(accountSplit.online, { compact: true })}`;
    const availableLabel = formatMoney(
        walkthroughHomeDemo
            ? WALKTHROUGH_HOME_DEMO.leftover -
                  WALKTHROUGH_HOME_DEMO.lines.Bills -
                  WALKTHROUGH_HOME_DEMO.lines["Debt payments"]
            : available,
        { compact: true }
    );
    const needsFirstPaycheck =
        !loading && income.length === 0 && !walkthroughHomeDemo;
    const { count: dueCount } = useDueNowInbox();
    const displayDueCount = walkthroughHomeDemo
        ? WALKTHROUGH_HOME_DEMO.dueCount
        : dueCount;
    const openDues = () => setDuesOpen(true);

    const leftoverOkay = displayLeftover >= 0;
    const availableOkay = walkthroughHomeDemo ? true : available >= 0;
    const showDuesPrediction =
        committed.total > 0 || walkthroughHomeDemo;
    const displayIncome = walkthroughHomeDemo
        ? WALKTHROUGH_HOME_DEMO.lines.Income
        : incomeLine.value;
    const displayOutLines = outLines.map((line) => ({
        ...line,
        value: walkthroughHomeDemo
            ? WALKTHROUGH_HOME_DEMO.lines[
                  line.label as keyof typeof WALKTHROUGH_HOME_DEMO.lines
              ] ?? line.value
            : line.value,
    }));
    const displayOutTotal = displayOutLines.reduce(
        (sum, line) => sum + line.value,
        0
    );
    const activitySectionTitle =
        periodUnit === "day"
            ? "This day"
            : periodUnit === "week"
              ? "This week"
              : periodUnit === "year"
                ? "This year"
                : "This month";

    return (
        <View style={dashboard.screen}>
            {collapsed && !loading ? (
                <StickyHeroBar
                    style={[
                        styles.mastCompactSticky,
                        { paddingTop: stickyTopPadding },
                    ]}
                >
                    <DashboardHeroCompact
                        kicker="Leftover"
                        value={leftoverLabel}
                        amount={displayLeftover}
                        formatAmount={(n) =>
                            formatMoney(n, { compact: true })
                        }
                        trailing={
                            <DueNowBadgeButton
                                count={displayDueCount}
                                onPress={openDues}
                                tone="default"
                            />
                        }
                    />
                </StickyHeroBar>
            ) : null}

            <ScrollView
                ref={scrollRef}
                style={dashboard.list}
                contentContainerStyle={styles.scroll}
                {...scrollProps}
            >
                <View style={[styles.masthead, { paddingTop: topPadding }]}>
                    {loading ? (
                        <View
                            accessibilityRole="progressbar"
                            accessibilityLabel="Loading"
                        >
                            <View style={styles.mastEyebrow}>
                                <Text style={styles.mastKicker}>Leftover</Text>
                            </View>
                            <Bone
                                width="48%"
                                height={theme.lineHeight.hero}
                                radius={theme.radius.md}
                                tone="inverse"
                            />
                            <Bone
                                width="72%"
                                height={theme.lineHeight.xs}
                                tone="inverse"
                                style={{ marginTop: theme.space.sm }}
                            />
                        </View>
                    ) : (
                        <>
                    <View style={styles.mastEyebrow}>
                        <Text style={styles.mastKicker}>Leftover</Text>
                        <WalkthroughAnchor id="home-due">
                            <DueNowBadgeButton
                                count={displayDueCount}
                                onPress={openDues}
                                tone="inverse"
                            />
                        </WalkthroughAnchor>
                    </View>
                    <WalkthroughAnchor id="home-leftover">
                        <AnimatedMoneyText
                            amount={displayLeftover}
                            format={(n) => formatMoney(n, { compact: true })}
                            style={[
                                styles.mastAmount,
                                !leftoverOkay
                                    ? { color: theme.intent.negative.fg }
                                    : null,
                            ]}
                            accessibilityRole="header"
                        />
                    </WalkthroughAnchor>
                    <Pressable
                        style={styles.mastSplit}
                        accessibilityLabel={accountSplitLabel}
                        accessibilityRole="button"
                        accessibilityHint="Opens transfer"
                        onPress={() => {
                            if (!walkthroughHomeDemo) {
                                router.push("/transfer");
                            }
                        }}
                        disabled={walkthroughHomeDemo}
                    >
                        <View style={styles.mastSplitCell}>
                            <Text style={styles.mastSplitLabel}>Cash</Text>
                            <Text
                                style={styles.mastSplitValue}
                                numberOfLines={1}
                            >
                                {walkthroughHomeDemo
                                    ? "—"
                                    : formatMoney(accountSplit.cash, {
                                          compact: true,
                                      })}
                            </Text>
                        </View>
                        <View style={styles.mastSplitCell}>
                            <Text style={styles.mastSplitLabel}>Online</Text>
                            <Text
                                style={styles.mastSplitValue}
                                numberOfLines={1}
                            >
                                {walkthroughHomeDemo
                                    ? "—"
                                    : formatMoney(accountSplit.online, {
                                          compact: true,
                                      })}
                            </Text>
                        </View>
                    </Pressable>
                        </>
                    )}
                </View>

                <View style={styles.body}>
                    {loading ? (
                        <DashboardSkeleton variant="home" />
                    ) : (
                        <>
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

                    <WalkthroughAnchor id="home-breakdown">
                    <View style={[dashboard.card, styles.statement]}>
                        <Text style={[dashboard.sectionLabel, styles.statementTitle]}>
                            {activitySectionTitle}
                        </Text>

                        <View style={styles.inOutRow}>
                            <View style={styles.inOutCol}>
                                <Text style={styles.inOutKicker}>In</Text>
                                <Text style={[styles.inOutTotal, styles.lineIn]}>
                                    {formatMoney(displayIncome, {
                                        compact: true,
                                    })}
                                </Text>
                                <View style={styles.inOutColRule} />
                                <Pressable
                                    onPress={() =>
                                        router.push(incomeLine.href)
                                    }
                                    accessibilityRole="button"
                                    accessibilityLabel={`Income, ${formatMoney(displayIncome, { compact: true })}`}
                                    style={({ pressed }) => [
                                        styles.flowRow,
                                        pressed && styles.linePressed,
                                    ]}
                                >
                                    <Text style={styles.flowLabel}>
                                        {incomeLine.label}
                                    </Text>
                                    <Text style={styles.flowValue}>
                                        {formatMoney(displayIncome, {
                                            compact: true,
                                        })}
                                    </Text>
                                </Pressable>
                            </View>

                            <View style={styles.inOutDivider} />

                            <View style={styles.inOutCol}>
                                <Text style={styles.inOutKicker}>Out</Text>
                                <Text style={styles.inOutTotal}>
                                    {formatMoney(displayOutTotal, {
                                        compact: true,
                                    })}
                                </Text>
                                <View style={styles.inOutColRule} />
                                {displayOutLines.map((line) => (
                                    <Pressable
                                        key={line.label}
                                        onPress={() => router.push(line.href)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${line.label}, ${formatMoney(line.value, { compact: true, sign: "−" })}`}
                                        style={({ pressed }) => [
                                            styles.flowRow,
                                            pressed && styles.linePressed,
                                        ]}
                                    >
                                        <Text
                                            style={styles.flowLabel}
                                            numberOfLines={1}
                                        >
                                            {line.label}
                                        </Text>
                                        <Text style={styles.flowValue}>
                                            {formatMoney(line.value, {
                                                compact: true,
                                            })}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>

                        {showDuesPrediction || committed.unknownCount > 0 ? (
                        <View style={styles.totalsFooter}>
                        {committed.total > 0 ? (
                            <Pressable
                                onPress={() => router.push("/(tabs)/bills")}
                                accessibilityRole="button"
                                accessibilityLabel={`Still due this month, ${formatMoney(
                                    committed.total,
                                    { compact: true, sign: "−" }
                                )}`}
                                style={({ pressed }) => [
                                    styles.dueRow,
                                    pressed && styles.linePressed,
                                ]}
                            >
                                <Text style={styles.dueLabel}>
                                    Still due this month
                                </Text>
                                <Text style={styles.dueValue}>
                                    {formatMoney(committed.total, {
                                        compact: true,
                                        sign: "−",
                                    })}
                                </Text>
                            </Pressable>
                        ) : null}

                        {showDuesPrediction ? (
                        <View
                            style={[
                                styles.grandRow,
                                committed.total === 0 && styles.grandRowFlush,
                            ]}
                        >
                            <Text style={styles.grandLabel}>After dues</Text>
                            <Text
                                style={[
                                    styles.grandValue,
                                    {
                                        color: availableOkay
                                            ? theme.intent.positive.fg
                                            : theme.intent.negative.fg,
                                    },
                                ]}
                            >
                                {availableLabel}
                            </Text>
                        </View>
                        ) : null}

                        {committed.unknownCount > 0 ? (
                            <Text style={styles.grandNote}>
                                {committed.unknownCount}{" "}
                                {committed.unknownCount === 1
                                    ? "bill has"
                                    : "bills have"}{" "}
                                no set amount yet, so{" "}
                                {committed.unknownCount === 1
                                    ? "it is"
                                    : "they are"}{" "}
                                not subtracted.
                            </Text>
                        ) : null}
                        </View>
                        ) : null}
                    </View>
                    </WalkthroughAnchor>

                    <SpendByCategoryChart rows={categorySpend} />
                    <MonthTrendChart points={monthTrend} />
                        </>
                    )}
                </View>
            </ScrollView>

            <DueNowModal
                visible={duesOpen}
                onClose={() => setDuesOpen(false)}
                title="Due now"
                itemsOverride={
                    walkthrough?.phase === "running" &&
                    walkthrough.activeId === "home-due"
                        ? WALKTHROUGH_DUE_DEMO
                        : undefined
                }
                tour={
                    walkthrough?.phase === "running" &&
                    walkthrough.activeId === "home-due" &&
                    walkthrough.step
                        ? {
                              title: walkthrough.step.title,
                              body: walkthrough.step.body,
                              stepIndex: walkthrough.stepIndex,
                              totalSteps: walkthrough.totalSteps,
                              onNext: walkthrough.next,
                              onSkip: walkthrough.skip,
                          }
                        : undefined
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    scroll: {
        paddingBottom: theme.space.xl,
    },
    // paddingTop comes from useScreenTopPadding at the call site.
    masthead: {
        backgroundColor: theme.bg.inverse,
        paddingHorizontal: theme.space.screenX,
        paddingBottom: theme.space.lg,
    },
    mastEyebrow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.space.md,
        marginBottom: theme.space.sm,
    },
    mastKicker: text.kicker,
    mastAmount: {
        ...text.hero,
        textAlign: "center",
        alignSelf: "stretch",
    },
    mastSplit: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginTop: theme.space.sm,
        gap: theme.space.md,
    },
    mastSplitCell: {
        flex: 1,
    },
    mastSplitLabel: {
        color: theme.text.inverseTertiary,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.semibold,
        textAlign: "left",
    },
    mastSplitValue: {
        color: theme.text.inverseSecondary,
        fontSize: theme.fontSize.sm,
        lineHeight: theme.lineHeight.sm,
        fontWeight: theme.fontWeight.semibold,
        textAlign: "left",
        fontVariant: ["tabular-nums"],
        marginTop: 2,
    },
    mastCompactSticky: {
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
    statement: {
        marginTop: theme.space.md,
    },
    statementTitle: {
        marginTop: 0,
    },
    inOutRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: theme.space.md,
    },
    inOutCol: {
        flex: 1,
        minWidth: 0,
    },
    inOutDivider: {
        width: StyleSheet.hairlineWidth,
        alignSelf: "stretch",
        backgroundColor: theme.border.subtle,
    },
    inOutKicker: {
        ...text.kicker,
        color: theme.text.tertiary,
        marginBottom: theme.space.xs,
    },
    inOutTotal: {
        ...text.money,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
        color: theme.text.primary,
        marginBottom: theme.space.sm,
    },
    inOutColRule: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.border.subtle,
        marginBottom: theme.space.sm,
    },
    flowRow: {
        paddingVertical: theme.space.xs,
        gap: 2,
    },
    flowLabel: {
        ...text.caption,
        color: theme.text.tertiary,
    },
    flowValue: {
        ...text.caption,
        color: theme.text.secondary,
        fontVariant: ["tabular-nums"],
    },
    totalsFooter: {
        marginTop: theme.space.md,
        paddingTop: theme.space.sm,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border.base,
    },
    linePressed: {
        opacity: 0.85,
    },
    lineIn: {
        color: theme.intent.positive.fg,
    },
    dueRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        minHeight: theme.size.tap,
        paddingTop: theme.space.sm,
    },
    dueLabel: {
        ...text.body,
        color: theme.text.secondary,
    },
    dueValue: {
        ...text.money,
        fontSize: theme.fontSize.lg,
        lineHeight: theme.lineHeight.lg,
        color: theme.intent.caution.fg,
    },
    grandRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border.base,
        paddingTop: theme.space.md,
        marginTop: theme.space.sm,
    },
    grandRowFlush: {
        borderTopWidth: 0,
        paddingTop: 0,
        marginTop: 0,
    },
    grandLabel: {
        ...text.sectionLabel,
        color: theme.text.primary,
    },
    grandValue: {
        ...text.money,
        fontSize: theme.fontSize.xl,
        lineHeight: theme.lineHeight.xl,
    },
    grandNote: {
        ...text.caption,
        marginTop: theme.space.sm,
    },
});
