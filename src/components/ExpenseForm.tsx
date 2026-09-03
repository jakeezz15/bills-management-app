import { useExpenses } from "@/app/contexts/ExpensesContext";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type ExpenseFormProps = {
    visible: boolean;
    onClose: () => void;
};

export default function ExpenseForm({
    visible,
    onClose
}: ExpenseFormProps) {
    const { addExpense } = useExpenses();

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");

    // Suggested addition: tracks which input is selected
    const [focusedInput, setFocusedInput] = useState<string | null>(null);

    // Suggested addition: controls validation messages
    const [showErrors, setShowErrors] = useState(false);

    // Suggested addition: individual validation conditions
    const nameHasError = showErrors && name.trim() === "";
    const amountHasError = showErrors && amount.trim() === "";

    const handleSubmit = async () => {
        // Suggested addition: display errors after an invalid submission
        if (!name || !amount) {
            setShowErrors(true);
            return;
        }

        await addExpense({
            id: Date.now().toString(),
            name,
            amount: Number(amount),
            dueDay: 1,
            isPaid: false,
            isRecurring: false
        });

        setName("");
        setAmount("");

        // Suggested addition: reset validation after submission
        setShowErrors(false);

        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent

            // Suggested addition: Android back-button support
            onRequestClose={onClose}
        >
            <View style={modalForm.overlay}>
                <View
                    style={[
                        modalForm.card,

                        // Suggested additions: responsive width and shadow
                        modalForm.cardResponsive,
                        modalForm.cardShadow,
                    ]}
                >
                    <Text style={modalForm.title}>Add Expense</Text>

                    <TextInput
                        style={[
                            modalForm.input,

                            // Suggested addition: focused appearance
                            focusedInput === "name" &&
                            modalForm.inputFocused,

                            // Suggested addition: error appearance
                            nameHasError &&
                            modalForm.inputError,
                        ]}
                        placeholder="Expense name"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}

                        // Suggested additions: detect focus
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                    />

                    {/* Suggested addition: name validation message */}
                    {nameHasError && (
                        <Text style={modalForm.errorText}>
                            Expense name is required.
                        </Text>
                    )}

                    <TextInput
                        style={[
                            modalForm.input,

                            // Suggested addition: focused appearance
                            focusedInput === "amount" &&
                            modalForm.inputFocused,

                            // Suggested addition: error appearance
                            amountHasError &&
                            modalForm.inputError,
                        ]}
                        placeholder="Amount"
                        placeholderTextColor="#888"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"

                        // Suggested additions: detect focus
                        onFocus={() => setFocusedInput("amount")}
                        onBlur={() => setFocusedInput(null)}
                    />

                    {/* Suggested addition: amount validation message */}
                    {amountHasError && (
                        <Text style={modalForm.errorText}>
                            Amount is required.
                        </Text>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.submitButton,
                            pressed && buttonStyle.buttonPressed
                        ]}
                        onPress={handleSubmit}
                    >
                        <Text style={buttonStyle.buttonText}>
                            Add Expense
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            buttonStyle.cancelButton,
                            pressed && buttonStyle.cancelButtonPressed
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