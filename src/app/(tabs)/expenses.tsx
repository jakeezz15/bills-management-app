import ExpenseForm from "@/components/ExpenseForm";
import { FinanceRow } from "@/components/FinanceRow";
import { LoadingScreen } from "@/components/LoadingScreen";
import { buttonStyle } from "@/styles/button-style";
import { expensesStyle } from "@/styles/expenses-style";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useExpenses } from "../contexts/ExpensesContext";

export default function ExpensesScreen() {
    const { expenses, loading } = useExpenses();

    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {loading && <LoadingScreen />}

            <ScrollView
                style={expensesStyle.section}
                contentContainerStyle={expensesStyle.content}
            >
                <View style={expensesStyle.header}>
                    <View>
                        <Text style={expensesStyle.title}>
                            Expenses
                        </Text>

                        {/* Suggested addition: explains the page purpose */}
                        <Text style={expensesStyle.screenDescription}>
                            Manage bills and everyday spending
                        </Text>
                    </View>

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.normalButton,
                            pressed && buttonStyle.buttonPressed
                        ]}
                        onPress={() => setIsOpen(true)}
                    >
                        <Text style={buttonStyle.buttonText}>
                            + Add expense
                        </Text>
                    </Pressable>
                </View>

                <ExpenseForm
                    visible={isOpen}
                    onClose={() => setIsOpen(false)}
                />

                {/* Suggested addition: list heading and item count */}
                {expenses.length > 0 && (
                    <View style={expensesStyle.listHeader}>
                        <Text style={expensesStyle.listTitle}>
                            All expenses
                        </Text>

                        <View style={expensesStyle.countBadge}>
                            <Text style={expensesStyle.countBadgeText}>
                                {expenses.length}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Suggested addition: empty-state guidance */}
                {expenses.length === 0 && !loading && (
                    <View style={expensesStyle.emptyState}>
                        <View style={expensesStyle.emptyStateIcon}>
                            <Text style={expensesStyle.emptyStateIconText}>
                                $
                            </Text>
                        </View>

                        <Text style={expensesStyle.emptyStateTitle}>
                            No expenses yet
                        </Text>

                        <Text style={expensesStyle.emptyStateText}>
                            Add your first bill or everyday expense to begin
                            tracking your spending.
                        </Text>

                        {/* Suggested addition: convenient empty-state action */}
                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.normalButton,
                                pressed && buttonStyle.buttonPressed
                            ]}
                            onPress={() => setIsOpen(true)}
                        >
                            <Text style={buttonStyle.buttonText}>
                                + Add first expense
                            </Text>
                        </Pressable>
                    </View>
                )}

                {expenses.map((expense) => (
                    <FinanceRow
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