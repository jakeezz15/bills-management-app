import { useDebt } from "@/app/contexts/DebtsContext";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type DebtFormProps = {
    visible: boolean;
    onClose: () => void;
};

const LOAN_TYPES = [
    "Credit Card",
    "Student Loan",
    "Mortgage",
    "Car Loan",
    "Personal Loan",
] as const;

export default function DebtForm({
    visible,
    onClose,
}: DebtFormProps) {
    const { addDebt } = useDebt();

    const [name, setName] = useState("");
    const [balance, setBalance] = useState("");
    const [minimumPayment, setMinimumPayment] = useState("");
    const [dueDay, setDueDay] = useState("");
    const [type, setType] = useState("");

    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const balanceHasError = showErrors && balance.trim() === "";
    const paymentHasError = showErrors && minimumPayment.trim() === "";
    const dueDayHasError = showErrors && dueDay.trim() === "";
    const typeHasError = showErrors && type.trim() === "";

    const handleSubmit = async () => {
        if (!name || !balance || !minimumPayment || !dueDay || !type) {
            setShowErrors(true);
            return;
        }

        const dueDayNumber = Number(dueDay);
        if (dueDayNumber < 1 || dueDayNumber > 31) {
            setShowErrors(true);
            return;
        }

        await addDebt({
            id: Date.now().toString(),
            name,
            balance: Number(balance),
            minimumPayment: Number(minimumPayment),
            dueDay: dueDayNumber,
            isPaid: false,
            type,
        });

        setName("");
        setBalance("");
        setMinimumPayment("");
        setDueDay("");
        setType("");
        setShowErrors(false);

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
                    <Text style={modalForm.title}>Add Debt</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "name" && modalForm.inputFocused,
                            nameHasError && modalForm.inputError,
                        ]}
                        placeholder="Debt name"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {nameHasError && (
                        <Text style={modalForm.errorText}>
                            Debt name is required.
                        </Text>
                    )}

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "balance" && modalForm.inputFocused,
                            balanceHasError && modalForm.inputError,
                        ]}
                        placeholder="Balance"
                        placeholderTextColor="#888"
                        value={balance}
                        onChangeText={setBalance}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("balance")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {balanceHasError && (
                        <Text style={modalForm.errorText}>
                            Balance is required.
                        </Text>
                    )}

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "minimumPayment" && modalForm.inputFocused,
                            paymentHasError && modalForm.inputError,
                        ]}
                        placeholder="Minimum payment"
                        placeholderTextColor="#888"
                        value={minimumPayment}
                        onChangeText={setMinimumPayment}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("minimumPayment")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {paymentHasError && (
                        <Text style={modalForm.errorText}>
                            Minimum payment is required.
                        </Text>
                    )}

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

                    <View style={modalForm.typeRow}>
                        {LOAN_TYPES.map((loanType) => {
                            const selected = type === loanType;

                            return (
                                <Pressable
                                    key={loanType}
                                    onPress={() => setType(loanType)}
                                    style={[
                                        modalForm.typeChip,
                                        selected && modalForm.typeChipSelected,
                                    ]}
                                >
                                    <Text
                                        style={[
                                            modalForm.typeChipText,
                                            selected && modalForm.typeChipTextSelected,
                                        ]}
                                    >
                                        {loanType}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>
                    {typeHasError && (
                        <Text style={modalForm.errorText}>
                            Loan type is required.
                        </Text>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.submitButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={handleSubmit}
                    >
                        <Text style={buttonStyle.buttonText}>
                            Add Debt
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
