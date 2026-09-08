import { useDebt } from "@/app/contexts/DebtsContext";
import { DateField } from "@/components/DateField";
import { FormDialog } from "@/components/FormDialog";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { Debt } from "@/types/debt";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type DebtFormProps = {
    visible: boolean;
    onClose: () => void;
    debt?: Debt;
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
    const dueDayHasError =
        showErrors &&
        (dueDay.trim() === "" || Number(dueDay) < 1 || Number(dueDay) > 31);
    const startDateHasError = showErrors && parseIsoDate(startDate) === null;
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
            parseIsoDate(startDate) === null
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

    const handleDelete = async () => {
        if (!debt) {
            return;
        }
        await deleteDebt(debt.id);
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
        <FormDialog
            visible={visible}
            onClose={onClose}
            kicker="Installment"
            title={debt ? "Edit debt" : "New debt"}
            saveLabel={debt ? "Save debt" : "Add debt"}
            onSave={() => {
                void handleSubmit();
            }}
            deleteLabel={debt ? "Delete debt" : undefined}
            deleteMessage="This removes this debt and its payment history from the device."
            onDelete={debt ? handleDelete : undefined}
        >
            {debt && debt.balance <= 0 ? (
                <View style={modalForm.paidBanner}>
                    <Text style={modalForm.paidBannerText}>
                        Paid off — remaining balance is $0
                    </Text>
                </View>
            ) : null}

            {debt && debt.balance > 0 ? (
                <View style={[modalForm.actionCard, { marginTop: 0, marginBottom: 16 }]}>
                    <Text style={modalForm.actionCardTitle}>
                        Record this period’s payment
                    </Text>
                    <Text style={modalForm.actionCardCaption}>
                        Lowers remaining balance by $
                        {debt.minimumPayment.toFixed(2)}
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            modalForm.actionCardButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={() => {
                            void handleRecordPayment();
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            Record ${debt.minimumPayment.toFixed(2)}
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Remaining</Text>
                <View
                    style={[
                        modalForm.dialogAmountWrap,
                        focusedInput === "balance" &&
                            modalForm.dialogInputFocused,
                        balanceHasError && modalForm.dialogInputError,
                    ]}
                >
                    <Text style={modalForm.dialogAmountPrefix}>$</Text>
                    <TextInput
                        style={modalForm.dialogAmountInput}
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        value={balance}
                        onChangeText={setBalance}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("balance")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {balanceHasError && (
                    <Text style={modalForm.errorText}>Balance is required.</Text>
                )}
            </View>

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Name</Text>
                <TextInput
                    style={[
                        modalForm.dialogInput,
                        focusedInput === "name" && modalForm.dialogInputFocused,
                        nameHasError && modalForm.dialogInputError,
                    ]}
                    placeholder="iPhone installment"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                />
                {nameHasError && (
                    <Text style={modalForm.errorText}>Name is required.</Text>
                )}
            </View>

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Monthly payment</Text>
                <View
                    style={[
                        modalForm.dialogAmountWrap,
                        focusedInput === "minimumPayment" &&
                            modalForm.dialogInputFocused,
                        paymentHasError && modalForm.dialogInputError,
                    ]}
                >
                    <Text style={modalForm.dialogAmountPrefix}>$</Text>
                    <TextInput
                        style={[
                            modalForm.dialogAmountInput,
                            { fontSize: 20 },
                        ]}
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        value={minimumPayment}
                        onChangeText={setMinimumPayment}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("minimumPayment")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {paymentHasError && (
                    <Text style={modalForm.errorText}>
                        Monthly payment is required.
                    </Text>
                )}
            </View>

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Due day each month</Text>
                <TextInput
                    style={[
                        modalForm.dialogInput,
                        focusedInput === "dueDay" &&
                            modalForm.dialogInputFocused,
                        dueDayHasError && modalForm.dialogInputError,
                    ]}
                    placeholder="1–31"
                    placeholderTextColor="#94A3B8"
                    value={dueDay}
                    onChangeText={setDueDay}
                    keyboardType="number-pad"
                    onFocus={() => setFocusedInput("dueDay")}
                    onBlur={() => setFocusedInput(null)}
                />
                {dueDayHasError && (
                    <Text style={modalForm.errorText}>
                        Enter a day between 1 and 31.
                    </Text>
                )}
            </View>

            <View style={modalForm.dialogField}>
                <DateField
                    layout="dialog"
                    label="Start date"
                    value={startDate}
                    onChange={setStartDate}
                    hasError={startDateHasError}
                    errorMessage="Choose a valid start date."
                />
            </View>

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Type</Text>
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
                                        selected &&
                                            modalForm.typeChipTextSelected,
                                    ]}
                                >
                                    {loanType}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                {typeHasError && (
                    <Text style={modalForm.errorText}>Choose a type.</Text>
                )}
            </View>
        </FormDialog>
    );
}
