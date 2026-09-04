import ExpenseForm from "@/components/ExpenseForm";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buttonStyle } from "@/styles/button-style";
import { screenStyles } from "@/styles/screen";
import { Expenses } from "@/types/expense";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useExpenses } from "../contexts/ExpensesContext";

export default function ExpensesScreen() {
    const { expenses, loading } = useExpenses();

    const [isOpen, setIsOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expenses | null>(null);

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
                            Manage bills and everyday spending
                        </Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.normalButton,
                            pressed && buttonStyle.buttonPressed
                        ]}
                        onPress={() => {
                            setIsOpen(true)
                            setEditingExpense(null)
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
                    <View style={screenStyles.listHeader}>
                        <Text style={screenStyles.listTitle}>
                            All expenses
                        </Text>

                        <View style={screenStyles.countBadge}>
                            <Text style={screenStyles.countBadgeText}>
                                {expenses.length}
                            </Text>
                        </View>
                    </View>
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
                            Add your first bill or everyday expense to begin
                            tracking your spending.
                        </Text>

                        <Pressable

                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed
                            ]}
                            onPress={() => {
                                setIsOpen(true);
                                setEditingExpense(null);
                            }}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first expense
                            </Text>
                        </Pressable>
                    </View>
                )}

                {expenses.map((expense) => (
                    <FinanceRow
                        onPress={() => {
                            setEditingExpense(expense);
                            setIsOpen(true);
                        }}
                        key={expense.id}
                        label={expense.name}
                        amount={expense.amount}
                        subtitle={
                            expense.isRecurring
                                ? (
                                    expense.isPaid
                                        ? "Recurring · Paid"
                                        : "Recurring · Unpaid"
                                )
                                : (
                                    expense.isPaid
                                        ? "One-time · Paid"
                                        : "One-time · Unpaid"
                                )
                        }
                    />

                ))}
            </ScrollView>
        </>
    );
}
