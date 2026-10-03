import { AddActivityChooser } from "@/components/AddActivityChooser";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import ExpenseForm from "@/components/ExpenseForm";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import IncomeForm from "@/components/IncomeForm";
import {
    LedgerDayGroup,
    LedgerRow,
    groupByLedgerDate,
} from "@/components/LedgerList";
import { SearchField } from "@/components/SearchField";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import { TabScaffold } from "@/components/ui";
import { WalkthroughAnchor } from "@/components/walkthrough/WalkthroughAnchor";
import {
    useWalkthroughActivityDemo,
    walkthroughExpenseDemo,
    walkthroughIncomeDemo,
} from "@/components/walkthrough";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { useDashboardStyles } from "@/styles/dashboard";
import { isIsoInRange, isViewingCurrentPeriod } from "@/utils/date";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useTheme } from "../contexts/ThemeContext";

type ActivityRow = {
    id: string;
    date: string;
    kind: "income" | "spending";
    title: string;
    amount: number;
    searchText: string;
};

export default function ActivityScreen() {
    useStatusBarStyle("dark");
    const { theme } = useTheme();
    const dashboard = useDashboardStyles();
    const { formatMoney } = useLocale();

    const { income: storedIncome, loading: incomeLoading } = useIncome();
    const { expenses: storedExpenses, loading: expensesLoading } =
        useExpenses();
    const demoMode = useWalkthroughActivityDemo();
    const income = useMemo(
        () => (demoMode ? walkthroughIncomeDemo() : storedIncome),
        [demoMode, storedIncome]
    );
    const expenses = useMemo(
        () => (demoMode ? walkthroughExpenseDemo() : storedExpenses),
        [demoMode, storedExpenses]
    );

    const { range, label, periodUnit, shiftPeriod, resetToToday } =
        useDateRange();
    const [chooserOpen, setChooserOpen] = useState(false);
    const [incomeOpen, setIncomeOpen] = useState(false);
    const [expenseOpen, setExpenseOpen] = useState(false);
    const [query, setQuery] = useState("");

    const loading = (incomeLoading || expensesLoading) && !demoMode;

    const rows = useMemo(() => {
        const next: ActivityRow[] = [];
        for (const entry of income) {
            if (!isIsoInRange(entry.date, range)) continue;
            next.push({
                id: entry.id,
                date: entry.date,
                kind: "income",
                title: entry.source.trim() || "Income",
                amount: entry.net,
                searchText: `${entry.source} income`,
            });
        }
        for (const expense of expenses) {
            if (!isIsoInRange(expense.date, range)) continue;
            const category = expense.category?.trim() || "Uncategorized";
            next.push({
                id: expense.id,
                date: expense.date,
                kind: "spending",
                title: expense.name.trim() || "Spending",
                amount: expense.amount,
                searchText: `${expense.name} ${category} spending`,
            });
        }
        next.sort((a, b) => {
            const byDate = b.date.localeCompare(a.date);
            if (byDate !== 0) return byDate;
            if (a.kind !== b.kind) {
                return a.kind === "income" ? -1 : 1;
            }
            return a.id.localeCompare(b.id);
        });
        return next;
    }, [income, expenses, range]);

    const listed = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return rows;
        return rows.filter((row) => row.searchText.toLowerCase().includes(q));
    }, [rows, query]);

    // Keep filterBySearch unused path consistent for empty search copy - listed above is fine

    const dayGroups = useMemo(() => groupByLedgerDate(listed), [listed]);

    const incomeTotal = useMemo(
        () =>
            rows
                .filter((row) => row.kind === "income")
                .reduce((sum, row) => sum + row.amount, 0),
        [rows]
    );
    const spendingTotal = useMemo(
        () =>
            rows
                .filter((row) => row.kind === "spending")
                .reduce((sum, row) => sum + row.amount, 0),
        [rows]
    );
    const net = incomeTotal - spendingTotal;

    const viewingCurrentPeriod = isViewingCurrentPeriod(range, periodUnit);
    const hasAny = income.length > 0 || expenses.length > 0;
    const showHero = hasAny || demoMode;

    const heroValue = formatMoney(Math.abs(net), {
        compact: true,
        sign: net >= 0 ? "" : "−",
    });
    const heroCaption =
        rows.length === 0
            ? "Nothing recorded in this period"
            : `in ${formatMoney(incomeTotal, { compact: true, sign: "+" })} · out ${formatMoney(spendingTotal, { compact: true, sign: "−" })}`;

    const periodNav = (forCompact: boolean) => (
        <HeroPeriodNav
            label={label}
            onShift={shiftPeriod}
            onResetToToday={resetToToday}
            isCurrentPeriod={viewingCurrentPeriod}
            style={forCompact ? { marginTop: 8 } : undefined}
        />
    );

    const openChooser = () => setChooserOpen(true);

    const { collapsed, scrollProps } = useStickyHero();

    return (
        <TabScaffold title="Activity" subtitle="Money you logged">
            <View style={dashboard.screen}>
                {showHero && collapsed && !loading ? (
                    <StickyHeroBar>
                        <DashboardHeroCompact
                            kicker="Net this period"
                            value={heroValue}
                            amount={net}
                            formatAmount={(n) =>
                                formatMoney(Math.abs(n), {
                                    compact: true,
                                    sign: n >= 0 ? "" : "−",
                                })
                            }
                            pace={periodNav(true)}
                        />
                    </StickyHeroBar>
                ) : null}

                <ScrollView
                    style={dashboard.list}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    contentContainerStyle={dashboard.listContent}
                    {...scrollProps}
                >
                    {loading ? (
                        <DashboardSkeleton />
                    ) : showHero ? (
                        <DashboardHero
                            kicker="Net this period"
                            value={heroValue}
                            caption={heroCaption}
                            pace={periodNav(false)}
                        />
                    ) : null}

                    {showHero && !loading ? (
                        <SearchField
                            value={query}
                            onChange={setQuery}
                            placeholder="Search activity"
                            accessibilityLabel="Search activity"
                        />
                    ) : null}

                    {!hasAny && !loading && !demoMode ? (
                        <DashboardEmpty
                            icon="swap-vertical-outline"
                            title="No activity yet"
                            text="Log a paycheck or everyday spending so leftover and this list can update."
                            actionLabel="Add activity"
                            onAction={openChooser}
                        />
                    ) : null}

                    {hasAny && rows.length === 0 && !loading ? (
                        <DashboardEmpty
                            icon={
                                viewingCurrentPeriod
                                    ? "swap-vertical-outline"
                                    : "calendar-outline"
                            }
                            title="Nothing in this period"
                            text={
                                viewingCurrentPeriod
                                    ? "No income or spending in this window yet. Add some, or step the date."
                                    : "Step the date, or jump back to this month, to find entries you already logged."
                            }
                            actionLabel={
                                viewingCurrentPeriod
                                    ? "Add activity"
                                    : "Back to current month"
                            }
                            onAction={
                                viewingCurrentPeriod
                                    ? openChooser
                                    : resetToToday
                            }
                        />
                    ) : null}

                    {rows.length > 0 && listed.length === 0 ? (
                        <DashboardEmpty
                            icon="search-outline"
                            title="No matching activity"
                            text="Nothing in this period matches that search."
                            actionLabel="Clear search"
                            onAction={() => setQuery("")}
                        />
                    ) : null}

                    <WalkthroughAnchor id="activity-income">
                        {dayGroups.map((group) => (
                            <LedgerDayGroup
                                key={group.date}
                                label={group.label}
                            >
                                {group.items.map((row, index) => {
                                    const isIncome = row.kind === "income";
                                    return (
                                    <LedgerRow
                                        key={`${row.kind}-${row.id}`}
                                        title={row.title}
                                        amountLabel={formatMoney(row.amount, {
                                            compact: true,
                                            sign: isIncome ? "" : "−",
                                        })}
                                        amountColor={
                                            isIncome
                                                ? theme.money.in.fg
                                                : theme.money.out.fg
                                        }
                                        accentColor={
                                            isIncome
                                                ? theme.money.in.solid
                                                : theme.money.out.solid
                                        }
                                        isLast={
                                            index === group.items.length - 1
                                        }
                                        onPress={() => {
                                            if (demoMode) return;
                                            router.push(
                                                isIncome
                                                    ? `/paycheck/${row.id}`
                                                    : `/expense/${row.id}`
                                            );
                                        }}
                                    />
                                    );
                                })}
                            </LedgerDayGroup>
                        ))}
                    </WalkthroughAnchor>
                </ScrollView>

                {!loading || demoMode ? (
                    <FloatingAddButton
                        onPress={openChooser}
                        accessibilityLabel="Add activity"
                        walkthroughId="activity-add"
                    />
                ) : null}

                <AddActivityChooser
                    visible={chooserOpen}
                    onClose={() => setChooserOpen(false)}
                    onPickIncome={() => setIncomeOpen(true)}
                    onPickSpending={() => setExpenseOpen(true)}
                />
                <IncomeForm
                    visible={incomeOpen}
                    onClose={() => setIncomeOpen(false)}
                />
                <ExpenseForm
                    visible={expenseOpen}
                    onClose={() => setExpenseOpen(false)}
                />
            </View>
        </TabScaffold>
    );
}
