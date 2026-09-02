import ExpenseForm from "@/components/ExpenseForm";
import { FinanceRow } from "@/components/FinanceRow";
import { screenStyles } from "@/styles/screen";
import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useExpenses } from "../contexts/ExpensesContext";

export default function ExpensesScreen() {

    const { expenses, loading } = useExpenses();
    const [isOpen, setIsOpen] = useState(false);
    return (
        <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
            {loading && <Text>Loading...</Text>}
            <Text style={screenStyles.title}>Expenses</Text>
            <Pressable onPress={() => setIsOpen(true)}>
                <Text style={{ color: "#208AEF", marginBottom: 16 }}>+ Add expense</Text>
            </Pressable>


            <ExpenseForm visible={isOpen} onClose={() => setIsOpen(false)} />


            {expenses.map((expense) => (
                <FinanceRow
                    key={expense.id}
                    label={expense.name}
                    amount={expense.amount}
                    subtitle={
                        expense.isRecurring
                            ? (expense.isPaid ? "Recurring · Paid" : "Recurring · Unpaid")
                            : (expense.isPaid ? "One-time · Paid" : "One-time · Unpaid")
                    }
                />
            ))}



        </ScrollView>
    );
}

