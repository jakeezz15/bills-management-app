import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardHero } from "@/components/DashboardHero";
import ExpenseForm from "@/components/ExpenseForm";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PlanItemCard } from "@/components/PlanItemCard";
import { dashboard } from "@/styles/dashboard";
import { Expense } from "@/types/expense";
import { formatDisplayDate, isIsoInRange } from "@/utils/date";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useExpenses } from "../contexts/ExpensesContext";

type ExpensesScreenProps = {
    embedded?: boolean;
};

type CategoryGroup = {
    category: string;
    items: Expense[];
    total: number;
};

function groupByCategory(expenses: Expense[]): CategoryGroup[] {
    const map = new Map<string, Expense[]>();
    for (const expense of expenses) {
        const key = expense.category?.trim() || "Uncategorized";
        const list = map.get(key) ?? [];
        list.push(expense);
        map.set(key, list);
    }

    return [...map.entries()]
        .map(([category, items]) => ({
            category,
            items: [...items].sort((a, b) => b.date.localeCompare(a.date)),
            total: items.reduce((sum, item) => sum + item.amount, 0),
        }))
        .sort((a, b) => b.total - a.total);
}

export default function ExpensesScreen({
    embedded = false,
}: ExpensesScreenProps) {
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
    const groups = useMemo(() => groupByCategory(inPeriod), [inPeriod]);
    const topCategory = groups[0];

    const openAdd = () => {
        setEditingExpense(null);
        setIsOpen(true);
    };

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
            >
                {!embedded ? (
                    <PageHeader
                        title="Spending"
                        subtitle="Everyday spending by date"
                    />
                ) : null}

                {expenses.length > 0 ? (
                    <DashboardHero
                        kicker="Spent"
                        value={`$${total.toFixed(0)}`}
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
                        pace={
                            <HeroPeriodNav
                                label={label}
                                onShift={shiftPeriod}
                                onResetToToday={resetToToday}
                            />
                        }
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

                {groups.map((group) => (
                    <View key={group.category}>
                        <Text style={dashboard.sectionLabel}>
                            {group.category}
                        </Text>
                        {group.items.map((expense) => {
                            const share =
                                total > 0
                                    ? Math.min(
                                          100,
                                          (expense.amount / total) * 100
                                      )
                                    : 0;

                            return (
                                <PlanItemCard
                                    key={expense.id}
                                    title={expense.name}
                                    subtitle={formatDisplayDate(expense.date)}
                                    rightLabel={`$${expense.amount.toFixed(0)}`}
                                    percent={share}
                                    amounts={`$${expense.amount.toFixed(0)}`}
                                    amountsMuted={
                                        total > 0
                                            ? ` · ${Math.round(share)}% of period`
                                            : undefined
                                    }
                                    onPress={() => {
                                        setEditingExpense(expense);
                                        setIsOpen(true);
                                    }}
                                />
                            );
                        })}
                    </View>
                ))}
            </ScrollView>
        </View>
    );
}
