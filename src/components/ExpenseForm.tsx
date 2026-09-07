import { useExpenses } from "@/app/contexts/ExpensesContext";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { Expense } from "@/types/expense";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type ExpenseFormProps = {
    visible: boolean;
    onClose: () => void;
    expense?: Expense;
};

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

export default function ExpenseForm({
    visible,
    onClose,
    expense,
}: ExpenseFormProps) {
    const { addExpense, updateExpense, deleteExpense } = useExpenses();

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(todayIsoDate());

    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const amountHasError = showErrors && amount.trim() === "";
    const dateHasError =
        showErrors && !/^\d{4}-\d{2}-\d{2}$/.test(date.trim());

    useEffect(() => {
        if (expense) {
            setName(expense.name);
            setAmount(String(expense.amount));
            setDate(expense.date);
        } else {
            setName("");
            setAmount("");
            setDate(todayIsoDate());
        }
        setShowErrors(false);
    }, [expense, visible]);

    const handleSubmit = async () => {
        if (!name || !amount || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
            setShowErrors(true);
            return;
        }

        if (expense) {
            await updateExpense(expense.id, {
                name,
                amount: Number(amount),
                date: date.trim(),
            });
        } else {
            await addExpense({
                id: Date.now().toString(),
                name,
                amount: Number(amount),
                date: date.trim(),
            });
            setName("");
            setAmount("");
            setDate(todayIsoDate());
        }

        setShowErrors(false);
        onClose();
    };

    const handleDelete = async (id: string) => {
        await deleteExpense(id);
        setName("");
        setAmount("");
        setDate(todayIsoDate());
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={modalForm.overlay}>
                <View
                    style={[
                        modalForm.card,
                        modalForm.cardResponsive,
                        modalForm.cardShadow,
                    ]}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Text style={modalForm.title}>
                            {expense ? "Update" : "Add"} Expense
                        </Text>

                        {expense && (
                            <Pressable
                                onPress={() => handleDelete(expense.id)}
                                accessibilityRole="button"
                                accessibilityLabel="Delete expense"
                                hitSlop={8}
                                style={({ pressed }) => [
                                    modalForm.closeButton,
                                    pressed && modalForm.closeButtonPressed,
                                ]}
                            >
                                <Ionicons
                                    name="trash"
                                    size={22}
                                    color="#f74f4f"
                                />
                            </Pressable>
                        )}
                    </View>

                    <Text style={modalForm.label}>Expense Name</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "name" && modalForm.inputFocused,
                            nameHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. Coffee"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {nameHasError && (
                        <Text style={modalForm.errorText}>
                            Expense name is required.
                        </Text>
                    )}

                    <Text style={modalForm.label}>Amount</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "amount" && modalForm.inputFocused,
                            amountHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. 5.50"
                        placeholderTextColor="#888"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("amount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {amountHasError && (
                        <Text style={modalForm.errorText}>
                            Amount is required.
                        </Text>
                    )}

                    <Text style={modalForm.label}>Date spent</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "date" && modalForm.inputFocused,
                            dateHasError && modalForm.inputError,
                        ]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#888"
                        value={date}
                        onChangeText={setDate}
                        onFocus={() => setFocusedInput("date")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {dateHasError && (
                        <Text style={modalForm.errorText}>
                            Use a date like 2026-09-07.
                        </Text>
                    )}

                    <View style={{ marginBottom: 18 }} />

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.submitButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={handleSubmit}
                    >
                        <Text style={buttonStyle.buttonText}>
                            {expense ? "Update" : "Add"} Expense
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            buttonStyle.cancelButton,
                            pressed && buttonStyle.cancelButtonPressed,
                        ]}
                    >
                        <Text style={buttonStyle.buttonText}>
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
