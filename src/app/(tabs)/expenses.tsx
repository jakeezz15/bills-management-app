import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import ExpenseForm from "@/components/ExpenseForm";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import {
    LedgerDayGroup,
    LedgerRow,
    accentForLabel,
    groupByLedgerDate,
} from "@/components/LedgerList";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { Expense } from "@/types/expense";
import { isIsoInRange } from "@/utils/date";
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
    const { formatMoney } = useLocale();
    const { expenses, loading } = useExpenses();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const inPeriod = useMemo(
        () =>
            expenses
                .filter((expense) => isIsoInRange(expense.date, range))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [expenses, range]
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

    const dayGroups = useMemo(() => groupByLedgerDate(inPeriod), [inPeriod]);

    const openAdd = () => {
        setEditingExpense(null);
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
            {loading && <LoadingScreen />}

            {showHero && collapsed ? (
                <View style={dashboard.heroCompactSticky}>
                    <DashboardHeroCompact
                        kicker="Spent"
                        value={heroValue}
                        pace={periodNav(true)}
                        onAdd={openAdd}
                        addAccessibilityLabel="Add expense"
                    />
                </View>
            ) : null}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
                {...scrollProps}
            >
                {!embedded ? (
                    <PageHeader
                        title="Spending"
                        subtitle="Everyday purchases, newest first"
                    />
                ) : null}

                {showHero ? (
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
                        onAdd={openAdd}
                        addAccessibilityLabel="Add expense"
                    />
                ) : null}

                <ExpenseForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingExpense(null);
                    }}
                    expense={editingExpense ?? undefined}
                />

                {expenses.length === 0 && !loading && (
                    <DashboardEmpty
                        title="No spending yet"
                        text="Log coffee, groceries, or other everyday spending with the date you spent it."
                        actionLabel="Add first expense"
                        onAction={openAdd}
                    />
                )}

                {expenses.length > 0 && inPeriod.length === 0 && (
                    <DashboardEmpty
                        title="Nothing in this period"
                        text="Step the date, or jump to today, to find purchases you already logged."
                        actionLabel="Jump to today"
                        onAction={resetToToday}
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
                                        setEditingExpense(expense);
                                        setIsOpen(true);
                                    }}
                                />
                            );
                        })}
                    </LedgerDayGroup>
                ))}
            </ScrollView>
        </View>
    );
}
