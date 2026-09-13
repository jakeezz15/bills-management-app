import { AppButton } from "@/components/AppButton";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { Bone } from "@/components/Skeleton";
import { DashboardHeroCompact } from "@/components/DashboardHero";
import { AnimatedMoneyText } from "@/components/AnimatedMoneyText";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { DueNowBadgeButton, DueNowModal } from "@/components/DueNowModal";
import { MonthGrid } from "@/components/MonthGrid";
import { MonthTrendChart, SpendByCategoryChart } from "@/components/HomeCharts";
import { SegmentControl } from "@/components/SegmentControl";
import {
    WalkthroughAnchor,
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
    calendarDaysBetween,
    isViewingCurrentPeriod,
    PERIOD_UNITS,
    PERIOD_UNIT_LABELS,
    parseIsoDate,
    startOfMonth,
} from "@/utils/date";
import {
    getActivityForRange,
    getCommittedForMonth,
    getCommittedInRange,
    getExpenseSpendByCategory,
    getMonthlyTrend,
    getTotalsForRange,
} from "@/utils/finance";
import { takeOpenDuesOnHome } from "@/utils/navigation";
import { resolvePayCycle } from "@/utils/pay-cycle";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useDebt } from "../contexts/DebtsContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";
import { useTheme } from "../contexts/ThemeContext";

const UNIT_OPTIONS = [
    ...PERIOD_UNITS.map((unit) => PERIOD_UNIT_LABELS[unit]),
    "Payday",
];

export default function HomeScreen() {
    const { theme: accentTheme } = useTheme();
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
    const [duesOpen, setDuesOpen] = useState(false);
    const scrollRef = useRef<ScrollView>(null);
    const walkthrough = useWalkthroughOptional();

    const loading =
        incomeLoading ||
        expensesLoading ||
        billsLoading ||
        debtsLoading ||
        savingsLoading;

    const payCycle = useMemo(
        () => (payMode ? resolvePayCycle(income, new Date(), payOffset) : null),
        [payMode, income, payOffset]
    );
    const homeRange = payCycle?.range ?? range;

    const totals = useMemo(
        () =>
            getTotalsForRange(
                homeRange,
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
            homeRange,
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
                homeRange,
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
            homeRange,
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

    const committed = useMemo(() => {
        if (payCycle) {
            return getCommittedInRange(
                payCycle.range,
                bills,
                billPayments,
                debts,
                debtPayments,
                new Date()
            );
        }
        return getCommittedForMonth(
            range.end,
            bills,
            billPayments,
            debts,
            debtPayments
        );
    }, [
        payCycle,
        range.end,
        bills,
        billPayments,
        debts,
        debtPayments,
    ]);

    const lines: {
        label: string;
        value: number;
        sign: "+" | "−";
        href: "/(tabs)/activity" | "/(tabs)/plans";
    }[] = [
        {
            label: "Income",
            value: activity.income,
            sign: "+" as const,
            href: "/(tabs)/activity",
        },
        {
            label: "Spending",
            value: activity.expenses,
            sign: "−" as const,
            href: "/(tabs)/activity",
        },
        {
            label: "Bills",
            value: activity.bills,
            sign: "−" as const,
            href: "/(tabs)/plans",
        },
        {
            label: "Debt payments",
            value: activity.debtPayments,
            sign: "−" as const,
            href: "/(tabs)/plans",
        },
        {
            label: "Savings",
            value: activity.savings,
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
        () => getExpenseSpendByCategory(expenses, homeRange),
        [expenses, homeRange]
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
        if (
            id === "home-leftover" ||
            id === "home-due" ||
            id === "home-period"
        ) {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
        } else if (id === "home-breakdown") {
            // Statement sits below the calendar — nudge it into view.
            setTimeout(() => {
                scrollRef.current?.scrollTo({ y: 360, animated: true });
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
        collapseAt: 140,
        expandAt: 48,
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
    const usingPayNav = Boolean(payMode && payCycle);
    const dueSoonWithinDays =
        payMode && payCycle && payOffset === 0
            ? Math.max(
                  0,
                  calendarDaysBetween(new Date(), payCycle.nextPayday) - 1
              )
            : undefined;
    const { count: dueCount } = useDueNowInbox(dueSoonWithinDays);
    const displayDueCount = walkthroughHomeDemo
        ? WALKTHROUGH_HOME_DEMO.dueCount
        : dueCount;
    const openDues = () => setDuesOpen(true);
    const payLabel = payCycle
        ? `Until ${payCycle.nextPayday.toLocaleDateString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
          })}`
        : label;
    const daysUntilPayday = payCycle
        ? Math.max(1, calendarDaysBetween(new Date(), payCycle.nextPayday))
        : 0;
    const dailyLeftover =
        daysUntilPayday > 0 ? totals.leftover / daysUntilPayday : 0;
    const dailyLabel = formatMoney(dailyLeftover, { compact: true });
    const viewingCurrentPeriod = usingPayNav
        ? payOffset === 0
        : isViewingCurrentPeriod(range, periodUnit);
    const periodNav = (forCompact: boolean) => (
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
            style={
                forCompact
                    ? { marginTop: theme.space.sm }
                    : { marginTop: 0, flex: 1 }
            }
        />
    );

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

    const pickDay = (iso: string) => {
        setPayMode(false);
        setPayOffset(0);
        selectDay(iso);
    };

    const leftoverOkay = displayLeftover >= 0;
    const availableOkay = walkthroughHomeDemo
        ? true
        : available >= 0;
    const activityNetOkay = activity.leftover >= 0;
    const activityNetLabel = formatMoney(activity.leftover, { compact: true });
    const activitySectionTitle = payCycle
        ? "This pay cycle"
        : periodUnit === "day"
          ? "This day"
          : periodUnit === "week"
            ? "This week"
            : periodUnit === "year"
              ? "This year"
              : "This month";

    // Variable bills carry no amount until they're logged, so say so rather
    // than let "available" read as the whole picture.
    const unknownNote =
        committed.unknownCount > 0
            ? ` · ${committed.unknownCount} open ${
                  committed.unknownCount === 1 ? "bill" : "bills"
              } not counted yet`
            : "";

    const heroCaption = (() => {
        if (walkthroughHomeDemo) {
            return WALKTHROUGH_HOME_DEMO.caption;
        }
        if (payMode && !payCycle) {
            return "Set weekly, every 2 weeks, or monthly on a paycheck.";
        }
        const dailyBit =
            payCycle && daysUntilPayday > 0 ? ` · ${dailyLabel} / day` : "";
        if (bills.length === 0 && debts.length === 0) {
            return (
                (leftoverOkay
                    ? "Income covers everything logged so far"
                    : "Outflows are higher than income received so far") +
                dailyBit
            );
        }
        const dueWindow = payCycle ? "before payday" : "this month";
        if (committed.total > 0) {
            return `${formatMoney(committed.total, {
                compact: true,
            })} still due ${dueWindow} — not in leftover until paid${unknownNote}${dailyBit}`;
        }
        return `Everything due ${dueWindow} is paid${unknownNote}${dailyBit}`;
    })();

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
                        pace={periodNav(true)}
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
                            <View style={styles.mastNav}>
                                <Bone
                                    width="36%"
                                    height={theme.lineHeight.xs}
                                    tone="inverse"
                                />
                            </View>
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
                    <Text style={styles.mastCaption}>{heroCaption}</Text>

                    <View style={styles.mastNav}>{periodNav(false)}</View>
                        </>
                    )}
                </View>

                <View style={styles.body}>
                    {loading ? (
                        <DashboardSkeleton variant="home" />
                    ) : (
                        <>
                    <WalkthroughAnchor id="home-period">
                        <SegmentControl
                            options={UNIT_OPTIONS}
                            selected={
                                payMode
                                    ? "Payday"
                                    : PERIOD_UNIT_LABELS[periodUnit]
                            }
                            onSelect={selectUnit}
                            compact
                        />
                    </WalkthroughAnchor>

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
                        onSelectDay={pickDay}
                    />

                    <WalkthroughAnchor id="home-breakdown">
                    <View style={styles.statement}>
                        <Text style={dashboard.sectionLabel}>
                            {activitySectionTitle}
                        </Text>
                            {lines.map((line, index) => {
                                const lineValue = walkthroughHomeDemo
                                    ? WALKTHROUGH_HOME_DEMO.lines[
                                          line.label as keyof typeof WALKTHROUGH_HOME_DEMO.lines
                                      ] ?? line.value
                                    : line.value;
                                const maxDemo = walkthroughHomeDemo
                                    ? Math.max(
                                          ...Object.values(
                                              WALKTHROUGH_HOME_DEMO.lines
                                          ),
                                          1
                                      )
                                    : maxLine;
                                return (
                                <Pressable
                                    key={line.label}
                                    onPress={() => router.push(line.href)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${line.label}, ${formatMoney(lineValue, { compact: true, sign: line.sign })}`}
                                    style={({ pressed }) => [
                                        styles.line,
                                        index < lines.length - 1 &&
                                            styles.lineGap,
                                        pressed && styles.linePressed,
                                    ]}
                                >
                                    <View style={styles.lineTop}>
                                        <Text style={styles.lineLabel}>
                                            {line.label}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.lineValue,
                                                line.sign === "+"
                                                    ? styles.lineIn
                                                    : styles.lineOut,
                                            ]}
                                        >
                                            {formatMoney(lineValue, {
                                                compact: true,
                                                sign: line.sign,
                                            })}
                                        </Text>
                                    </View>
                                    <View style={dashboard.barTrack}>
                                        <View
                                            style={[
                                                dashboard.barFill,
                                                {
                                                    width: `${Math.min(
                                                        100,
                                                        (lineValue / maxDemo) *
                                                            100
                                                    )}%`,
                                                    backgroundColor:
                                                        line.sign === "+"
                                                            ? accentTheme.intent
                                                                  .positive.solid
                                                            : accentTheme.chart[
                                                                  (index + 1) %
                                                                      accentTheme
                                                                          .chart
                                                                          .length
                                                              ],
                                                },
                                            ]}
                                        />
                                    </View>
                                </Pressable>
                                );
                            })}

                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Net this period</Text>
                            <Text
                                style={[
                                    styles.totalValue,
                                    {
                                        color: activityNetOkay
                                            ? theme.intent.positive.fg
                                            : theme.intent.negative.fg,
                                    },
                                ]}
                            >
                                {activityNetLabel}
                            </Text>
                        </View>

                        {committed.total > 0 ? (
                            <Pressable
                                onPress={() => router.push("/(tabs)/plans")}
                                accessibilityRole="button"
                                accessibilityLabel={`Still due ${
                                    payCycle ? "this cycle" : "this month"
                                }, ${formatMoney(
                                    committed.total,
                                    { compact: true, sign: "−" }
                                )}`}
                                style={({ pressed }) => [
                                    styles.dueRow,
                                    pressed && styles.linePressed,
                                ]}
                            >
                                <Text style={styles.dueLabel}>
                                    {payCycle
                                        ? "Still due this cycle"
                                        : "Still due this month"}
                                </Text>
                                <Text style={styles.dueValue}>
                                    {formatMoney(committed.total, {
                                        compact: true,
                                        sign: "−",
                                    })}
                                </Text>
                            </Pressable>
                        ) : null}

                        <View style={styles.grandRow}>
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
                    </WalkthroughAnchor>

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
                        </>
                    )}
                </View>
            </ScrollView>

            <DueNowModal
                visible={duesOpen}
                onClose={() => setDuesOpen(false)}
                title={
                    payMode && payCycle && payOffset === 0
                        ? "Due before payday"
                        : "Due now"
                }
                caption={
                    payMode && payCycle && payOffset === 0
                        ? "Unpaid plans that land before your next check."
                        : undefined
                }
                clearCaption={
                    payMode && payCycle && payOffset === 0
                        ? "Nothing waiting before this payday."
                        : undefined
                }
                soonWithinDays={dueSoonWithinDays}
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
        fontSize: theme.fontSize.lg,
        lineHeight: theme.lineHeight.lg,
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
