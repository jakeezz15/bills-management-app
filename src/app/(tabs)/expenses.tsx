import { DashboardEmpty } from "@/components/DashboardEmpty";
import { SearchField } from "@/components/SearchField";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { CategoryPicker } from "@/components/CategoryPicker";
import ExpenseForm from "@/components/ExpenseForm";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import {
    LedgerDayGroup,
    LedgerRow,
    accentForLabel,
    groupByLedgerDate,
} from "@/components/LedgerList";
import { PageHeader } from "@/components/ui";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { dashboard } from "@/styles/dashboard";
import { form } from "@/styles/form";
import { isIsoInRange } from "@/utils/date";
import { filterByCategory, filterBySearch } from "@/utils/filters";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useExpenses } from "../contexts/ExpensesContext";
import { useLocale } from "../contexts/LocaleContext";

type ExpensesScreenProps = {
    embedded?: boolean;
};

export default function ExpensesScreen({
    embedded = false,
}: ExpensesScreenProps) {
    // Standalone deep link shows the dark hero band; when embedded the
    // host tab owns the bar.
    useStatusBarStyle(embedded ? null : "light");
    const topPadding = useScreenTopPadding();

    const { formatMoney } = useLocale();
    const { expenses, loading } = useExpenses();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<string | null>(null);

    const inPeriod = useMemo(
        () =>
            expenses
                .filter((expense) => isIsoInRange(expense.date, range))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [expenses, range]
    );

    const listed = useMemo(
        () =>
            filterBySearch(filterByCategory(inPeriod, category), query),
        [inPeriod, category, query]
    );

    const total = inPeriod.reduce((sum, expense) => sum + expense.amount, 0);

    const topCategory = useMemo(() => {
        const totals = new Map<string, number>();
        for (const expense of inPeriod) {
            const key = expense.category?.trim() || "Uncategorized";
            totals.set(key, (totals.get(key) ?? 0) + expense.amount);
        }
        let best: { category: string; total: number } | null = null;
        for (const [category, amount] of totals) {
            if (!best || amount > best.total) {
                best = { category, total: amount };
            }
        }
        return best;
    }, [inPeriod]);

    const dayGroups = useMemo(() => groupByLedgerDate(listed), [listed]);

    const openAdd = () => {
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(total, { compact: true });
    const showHero = expenses.length > 0;
    const periodNav = (forCompact: boolean) => (
        <HeroPeriodNav
            label={label}
            onShift={shiftPeriod}
            onResetToToday={resetToToday}
            style={forCompact ? { marginTop: 8 } : undefined}
        />
    );

    return (
        <View style={dashboard.screen}>
            {showHero && collapsed ? (
                <StickyHeroBar>
                    <DashboardHeroCompact
                        kicker="Spent"
                        value={heroValue}
                        pace={periodNav(true)}
                    />
                </StickyHeroBar>
            ) : null}

            <ScrollView
                style={dashboard.list}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: topPadding },
                ]}
                {...scrollProps}
            >
                {!embedded ? (
                    <PageHeader
                        title="Spending"
                        subtitle="Everyday purchases, newest first"
                    />
                ) : null}

                {loading ? (
                    <DashboardSkeleton />
                ) : showHero ? (
                    <DashboardHero
                        kicker="Spent"
                        value={heroValue}
                        caption={
                            inPeriod.length === 0
                                ? "Nothing recorded in this period"
                                : topCategory
                                  ? `${inPeriod.length} purchases · ${topCategory.category} is largest`
                                  : `${inPeriod.length} purchases this period`
                        }
                        percent={
                            inPeriod.length > 0 && topCategory && total > 0
                                ? Math.round((topCategory.total / total) * 100)
                                : 0
                        }
                        pace={periodNav(false)}
                    />
                ) : null}

                <ExpenseForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                    }}
                />

                {showHero && !loading ? (
                    <>
                        <SearchField
                            value={query}
                            onChange={setQuery}
                            placeholder="Search spending"
                            accessibilityLabel="Search spending"
                        />
                        <View style={form.field}>
                            <CategoryPicker
                                options={EXPENSE_CATEGORIES}
                                selected={category}
                                onSelect={setCategory}
                                noneLabel="All"
                            />
                        </View>
                    </>
                ) : null}

                {expenses.length === 0 && !loading && (
                    <DashboardEmpty
                        icon="bag-handle-outline"
                        title="No spending yet"
                        text="Log coffee, groceries, or other everyday spending with the date you spent it."
                        actionLabel="Add first expense"
                        onAction={openAdd}
                    />
                )}

                {expenses.length > 0 && inPeriod.length === 0 && (
                    <DashboardEmpty
                        icon="calendar-outline"
                        title="Nothing in this period"
                        text="Step the date, or jump to today, to find purchases you already logged."
                        actionLabel="Jump to today"
                        onAction={resetToToday}
                    />
                )}

                {inPeriod.length > 0 && listed.length === 0 && (
                    <DashboardEmpty
                        icon="search-outline"
                        title="No matching spending"
                        text="Nothing in this period matches that search or category."
                        actionLabel="Clear filters"
                        onAction={() => {
                            setQuery("");
                            setCategory(null);
                        }}
                    />
                )}

                {dayGroups.map((group) => (
                    <LedgerDayGroup key={group.date} label={group.label}>
                        {group.items.map((expense, index) => {
                            const category =
                                expense.category?.trim() || "Uncategorized";
                            return (
                                <LedgerRow
                                    key={expense.id}
                                    title={expense.name}
                                    meta={category}
                                    amountLabel={formatMoney(expense.amount, {
                                        compact: true,
                                    })}
                                    accentColor={accentForLabel(category)}
                                    isLast={index === group.items.length - 1}
                                    onPress={() => {
                                        router.push(`/expense/${expense.id}`);
                                    }}
                                />
                            );
                        })}
                    </LedgerDayGroup>
                ))}
            </ScrollView>
            {!loading ? (
                <FloatingAddButton
                    onPress={openAdd}
                    accessibilityLabel="Add expense"
                />
            ) : null}
        </View>
    );
}
