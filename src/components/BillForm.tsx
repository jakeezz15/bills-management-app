import { useBills } from "@/app/contexts/BillsContext";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { Bill } from "@/types/bill";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type BillFormProps = {
    visible: boolean;
    onClose: () => void;
    bill?: Bill;
};

export default function BillForm({
    visible,
    onClose,
    bill,
}: BillFormProps) {
    const { addBill, updateBill, deleteBill } = useBills();

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDay, setDueDay] = useState("");

    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const amountHasError = showErrors && amount.trim() === "";
    const dueDayHasError =
        showErrors &&
        (dueDay.trim() === "" ||
            Number(dueDay) < 1 ||
            Number(dueDay) > 31);

    useEffect(() => {
        if (bill) {
            setName(bill.name);
            setAmount(String(bill.amount));
            setDueDay(String(bill.dueDay));
        } else {
            setName("");
            setAmount("");
            setDueDay("");
        }
        setShowErrors(false);
    }, [bill, visible]);

    const handleSubmit = async () => {
        if (!name || !amount || !dueDay) {
            setShowErrors(true);
            return;
        }

        const dueDayNumber = Number(dueDay);
        if (dueDayNumber < 1 || dueDayNumber > 31) {
            setShowErrors(true);
            return;
        }

        if (bill) {
            await updateBill(bill.id, {
                name,
                amount: Number(amount),
                dueDay: dueDayNumber,
            });
        } else {
            await addBill({
                id: Date.now().toString(),
                name,
                amount: Number(amount),
                dueDay: dueDayNumber,
                isPaid: false,
                isRecurring: true,
            });
            setName("");
            setAmount("");
            setDueDay("");
        }

        setShowErrors(false);
        onClose();
    };

    const handleDelete = async (id: string) => {
        await deleteBill(id);
        setName("");
        setAmount("");
        setDueDay("");
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
                            {bill ? "Update" : "Add"} Bill
                        </Text>

                        {bill && (
                            <Pressable
                                onPress={() => handleDelete(bill.id)}
                                accessibilityRole="button"
                                accessibilityLabel="Delete bill"
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

                    <Text style={modalForm.label}>Bill Name</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "name" && modalForm.inputFocused,
                            nameHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. Rent"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {nameHasError && (
                        <Text style={modalForm.errorText}>
                            Bill name is required.
                        </Text>
                    )}

                    <Text style={modalForm.label}>Amount</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "amount" && modalForm.inputFocused,
                            amountHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. 500"
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

                    <Text style={modalForm.label}>Due Day</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "dueDay" && modalForm.inputFocused,
                            dueDayHasError && modalForm.inputError,
                        ]}
                        placeholder="Due day (1-31)"
                        placeholderTextColor="#888"
                        value={dueDay}
                        onChangeText={setDueDay}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("dueDay")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {dueDayHasError && (
                        <Text style={modalForm.errorText}>
                            Due day is required (1-31).
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
                            {bill ? "Update" : "Add"} Bill
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
