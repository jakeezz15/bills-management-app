import { useExpenses } from "@/app/contexts/ExpensesContext";
import { modalForm } from "@/styles/modal-form";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type ExpenseFormProps = {
    visible: boolean,
    onClose: () => void;
}

export default function ExpenseForm({ visible, onClose }: ExpenseFormProps) {

    const { addExpense } = useExpenses();
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");

    const handleSubmit = async () => {
        if (!name || !amount) return;

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
        onClose();
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalForm.overlay}>
                <View style={modalForm.card}>
                    <Text style={modalForm.title}>Add Expense</Text>
                    <TextInput
                        style={modalForm.input}
                        placeholder="Expense name"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={modalForm.input}
                        placeholder="Amount"
                        placeholderTextColor="#888"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />
                    <Pressable style={modalForm.submitButton} onPress={handleSubmit}><Text style={modalForm.submitButton}>Add Expense</Text></Pressable>
                    <Pressable onPress={onClose} style={modalForm.cancel}>
                        <Text style={modalForm.cancel}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );

}

