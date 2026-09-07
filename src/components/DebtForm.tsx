import { useDebt } from "@/app/contexts/DebtsContext";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { Debt } from "@/types/debt";
import { toIsoDate } from "@/utils/date";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type DebtFormProps = {
    visible: boolean;
    onClose: () => void;
    debt?: Debt;
    /** As-of date from the period picker (ISO) used when recording a payment. */
    paymentDate?: string;
};

const LOAN_TYPES = [
    "Device / Installment",
    "Credit Card",
    "Student Loan",
    "Mortgage",
    "Car Loan",
    "Personal Loan",
] as const;

function todayIsoDate() {
    return toIsoDate(new Date());
}

export default function DebtForm({
    visible,
    onClose,
    debt,
    paymentDate,
}: DebtFormProps) {
    const { addDebt, updateDebt, deleteDebt, recordPayment } = useDebt();

    const [name, setName] = useState("");
    const [balance, setBalance] = useState("");
    const [minimumPayment, setMinimumPayment] = useState("");
    const [dueDay, setDueDay] = useState("");
    const [startDate, setStartDate] = useState(todayIsoDate());
    const [type, setType] = useState("");

    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const balanceHasError = showErrors && balance.trim() === "";
    const paymentHasError = showErrors && minimumPayment.trim() === "";
    const dueDayHasError = showErrors && dueDay.trim() === "";
    const startDateHasError =
        showErrors && !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim());
    const typeHasError = showErrors && type.trim() === "";

    useEffect(() => {
        if (debt) {
            setName(debt.name);
            setBalance(String(debt.balance));
            setMinimumPayment(String(debt.minimumPayment));
            setDueDay(String(debt.dueDay));
            setStartDate(debt.startDate || todayIsoDate());
            setType(debt.type);
        } else {
            setName("");
            setBalance("");
            setMinimumPayment("");
            setDueDay("");
            setStartDate(todayIsoDate());
            setType("");
        }
        setShowErrors(false);
    }, [debt, visible]);

    const handleSubmit = async () => {
        if (
            !name ||
            !balance ||
            !minimumPayment ||
            !dueDay ||
            !type ||
            !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())
        ) {
            setShowErrors(true);
            return;
        }

        const dueDayNumber = Number(dueDay);
        if (dueDayNumber < 1 || dueDayNumber > 31) {
            setShowErrors(true);
            return;
        }

        if (debt) {
            await updateDebt(debt.id, {
                name,
                balance: Number(balance),
                minimumPayment: Number(minimumPayment),
                dueDay: dueDayNumber,
                startDate: startDate.trim(),
                type,
            });
        } else {
            await addDebt({
                id: Date.now().toString(),
                name,
                balance: Number(balance),
                minimumPayment: Number(minimumPayment),
                dueDay: dueDayNumber,
                startDate: startDate.trim(),
                isPaid: false,
                totalPaid: 0,
                type,
            });
            setName("");
            setBalance("");
            setMinimumPayment("");
            setDueDay("");
            setStartDate(todayIsoDate());
            setType("");
        }

        setShowErrors(false);
        onClose();
    };

    const handleDelete = async (id: string) => {
        await deleteDebt(id);
        setName("");
        setBalance("");
        setMinimumPayment("");
        setDueDay("");
        setStartDate(todayIsoDate());
        setType("");
        onClose();
    };

    const handleRecordPayment = async () => {
        if (!debt || debt.balance <= 0) {
            return;
        }
        await recordPayment(debt.id, undefined, paymentDate);
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
                            {debt ? "Update" : "Add"} Debt
                        </Text>

                        {debt && (
                            <Pressable
                                onPress={() => handleDelete(debt.id)}
                                accessibilityRole="button"
                                accessibilityLabel="Delete debt"
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

                    <Text style={modalForm.label}>Name</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "name" && modalForm.inputFocused,
                            nameHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. iPhone installment"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {nameHasError && (
                        <Text style={modalForm.errorText}>
                            Name is required.
                        </Text>
                    )}

                    <Text style={modalForm.label}>Remaining balance</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "balance" && modalForm.inputFocused,
                            balanceHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. 500"
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

                    <Text style={modalForm.label}>Monthly payment</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "minimumPayment" && modalForm.inputFocused,
                            paymentHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. 45"
                        placeholderTextColor="#888"
                        value={minimumPayment}
                        onChangeText={setMinimumPayment}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("minimumPayment")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {paymentHasError && (
                        <Text style={modalForm.errorText}>
                            Monthly payment is required.
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

                    <Text style={modalForm.label}>Start date</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "startDate" && modalForm.inputFocused,
                            startDateHasError && modalForm.inputError,
                        ]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#888"
                        value={startDate}
                        onChangeText={setStartDate}
                        onFocus={() => setFocusedInput("startDate")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {startDateHasError && (
                        <Text style={modalForm.errorText}>
                            Use a start date like 2026-08-01.
                        </Text>
                    )}

                    <Text style={modalForm.label}>Type</Text>

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
                            Type is required.
                        </Text>
                    )}

                    {debt && debt.balance > 0 && (
                        <Pressable
                            style={({ pressed }) => [
                                buttonStyle.submitButton,
                                { backgroundColor: "#15803D", marginBottom: 8 },
                                pressed && buttonStyle.buttonPressed,
                            ]}
                            onPress={handleRecordPayment}
                        >
                            <Text style={buttonStyle.buttonText}>
                                Record payment (${debt.minimumPayment.toFixed(2)})
                            </Text>
                        </Pressable>
                    )}

                    {debt && debt.balance <= 0 && (
                        <Text
                            style={[
                                modalForm.errorText,
                                { color: "#15803D", marginBottom: 12 },
                            ]}
                        >
                            Paid off — balance is $0.
                        </Text>
                    )}

                    <View style={{ marginBottom: 8 }} />

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.submitButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={handleSubmit}
                    >
                        <Text style={buttonStyle.buttonText}>
                            {debt ? "Update" : "Add"} Debt
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
