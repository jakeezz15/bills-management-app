import ExpenseForm from "@/components/ExpenseForm";
import { FilterChips } from "@/components/FilterChips";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { EXPENSE_CATEGORIES } from "@/constants/categories";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { Expense } from "@/types/expense";
import { filterExpensesByCategory } from "@/utils/filters";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useExpenses } from "../contexts/ExpensesContext";

export default function ExpensesScreen() {
    const { expenses, loading } = useExpenses();

    const [isOpen, setIsOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const filteredExpenses = useMemo(
        () => filterExpensesByCategory(expenses, categoryFilter),
        [expenses, categoryFilter]
    );

    return (
        <>
            {loading && <LoadingScreen />}

            <ScrollView
                style={screenStyles.section}
                contentContainerStyle={screenStyles.content}
            >
                <View style={screenStyles.header}>
                    <View>
                        <Text style={screenStyles.title}>
                            Expenses
                        </Text>

                        <Text style={screenStyles.screenDescription}>
                            Everyday spending by date
                        </Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.normalButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={() => {
                            setEditingExpense(null);
                            setIsOpen(true);
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            + Add expense
                        </Text>
                    </Pressable>
                </View>

                <ExpenseForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingExpense(null);
                    }}
                    expense={editingExpense ?? undefined}
                />

                {expenses.length > 0 && (
                    <>
                        <FilterChips
                            options={EXPENSE_CATEGORIES}
                            selected={categoryFilter}
                            onSelect={setCategoryFilter}
                        />

                        <View style={screenStyles.listHeader}>
                            <Text style={screenStyles.listTitle}>
                                All expenses
                            </Text>

                            <View style={screenStyles.countBadge}>
                                <Text style={screenStyles.countBadgeText}>
                                    {filteredExpenses.length}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                {expenses.length === 0 && !loading && (
                    <View style={screenStyles.emptyState}>
                        <View style={screenStyles.emptyStateIcon}>
                            <Text style={screenStyles.emptyStateIconText}>
                                $
                            </Text>
                        </View>

                        <Text style={screenStyles.emptyStateTitle}>
                            No expenses yet
                        </Text>

                        <Text style={screenStyles.emptyStateText}>
                            Log coffee, groceries, or other everyday spending
                            with the date you spent it.
                        </Text>

                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed,
                            ]}
                            onPress={() => {
                                setEditingExpense(null);
                                setIsOpen(true);
                            }}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first expense
                            </Text>
                        </Pressable>
                    </View>
                )}

                {expenses.length > 0 && filteredExpenses.length === 0 && (
                    <View style={screenStyles.emptyState}>
                        <Text style={screenStyles.emptyStateTitle}>
                            No matching expenses
                        </Text>
                        <Text style={screenStyles.emptyStateText}>
                            Try a different category filter.
                        </Text>
                    </View>
                )}

                {filteredExpenses.map((expense) => (
                    <FinanceRow
                        key={expense.id}
                        label={expense.name}
                        amount={expense.amount}
                        subtitle={
                            expense.category
                                ? `${expense.date} · ${expense.category}`
                                : expense.date
                        }
                        onPress={() => {
                            setEditingExpense(expense);
                            setIsOpen(true);
                        }}
                    />
                ))}
            </ScrollView>
        </>
    );
}
