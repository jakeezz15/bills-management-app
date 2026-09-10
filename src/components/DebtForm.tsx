import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DateField } from "@/components/DateField";
import { FormDialog } from "@/components/FormDialog";
import { form, formColors } from "@/styles/form";
import { Debt } from "@/types/debt";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { currencySymbol } from "@/utils/money";
import { useFormSession } from "@/hooks/useFormSession";
import { useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";

type DebtFormProps = {
    visible: boolean;
    onClose: () => void;
    debt?: Debt;
};

const LOAN_TYPES = [
    "Device / Installment",
    "Credit Card",
    "Student Loan",
    "Mortgage",
    "Car Loan",
    "Personal Loan",
] as const;

export default function DebtForm(props: DebtFormProps) {
    const session = useFormSession(props.visible, props.debt?.id);
    return <DebtEditor key={session} {...props} />;
}

function DebtEditor({ visible, onClose, debt }: DebtFormProps) {
    const { addDebt, updateDebt, deleteDebt } = useDebt();
    const { currency } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState(debt?.name ?? "");
    const [balance, setBalance] = useState(
        debt ? String(debt.balance) : ""
    );
    const [minimumPayment, setMinimumPayment] = useState(
        debt ? String(debt.minimumPayment) : ""
    );
    const [dueDay, setDueDay] = useState(debt ? String(debt.dueDay) : "");
    const [startDate, setStartDate] = useState(
        debt?.startDate || todayIsoDate()
    );
    const [type, setType] = useState(debt?.type ?? "");
    const [remind, setRemind] = useState(debt?.remind !== false);
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
                remind,
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
                remind,
            });
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
            <View style={form.field}>
                <Text style={form.label}>Name</Text>
                <TextInput
                    style={[
                        form.input,
                        focusedInput === "name" && form.inputFocused,
                        nameHasError && form.inputError,
                    ]}
                    placeholder="iPhone installment"
                    placeholderTextColor={formColors.placeholder}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                />
                {nameHasError && (
                    <Text style={form.error}>Name is required.</Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Due day each month</Text>
                <TextInput
                    style={[
                        form.input,
                        focusedInput === "dueDay" &&
                            form.inputFocused,
                        dueDayHasError && form.inputError,
                    ]}
                    placeholder="1–31"
                    placeholderTextColor={formColors.placeholder}
                    value={dueDay}
                    onChangeText={setDueDay}
                    keyboardType="number-pad"
                    onFocus={() => setFocusedInput("dueDay")}
                    onBlur={() => setFocusedInput(null)}
                />
                {dueDayHasError && (
                    <Text style={form.error}>
                        Enter a day between 1 and 31.
                    </Text>
                )}
            </View>

            <View style={form.switchRow}>
                <View style={form.switchCopy}>
                    <Text style={form.switchTitle}>Remind me</Text>
                    <Text style={form.switchCaption}>
                        {remind
                            ? "Uses the time and lead from Settings"
                            : "No alert for this debt"}
                    </Text>
                </View>
                <Switch
                    value={remind}
                    onValueChange={setRemind}
                    trackColor={{
                        false: formColors.switchTrackOff,
                        true: formColors.switchTrackOn,
                    }}
                    thumbColor={formColors.switchThumb}
                />
            </View>

            <View style={form.field}>
                <DateField
                    label="Start date"
                    value={startDate}
                    onChange={setStartDate}
                    hasError={startDateHasError}
                    errorMessage="Choose a valid start date."
                />
            </View>

            <View style={form.field}>
                <Text style={form.label}>Type</Text>
                <View style={form.chipRow}>
                    {LOAN_TYPES.map((loanType) => {
                        const selected = type === loanType;
                        return (
                            <Pressable
                                key={loanType}
                                onPress={() => setType(loanType)}
                                accessibilityRole="button"
                                accessibilityLabel={loanType}
                                accessibilityState={{ selected }}
                                style={({ pressed }) => [
                                    form.chip,
                                    selected && form.chipSelected,
                                    pressed && form.chipPressed,
                                ]}
                            >
                                <Text
                                    style={[
                                        form.chipText,
                                        selected && form.chipTextSelected,
                                    ]}
                                >
                                    {loanType}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>
                {typeHasError && (
                    <Text style={form.error}>Choose a type.</Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Remaining</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "balance" &&
                            form.inputFocused,
                        balanceHasError && form.inputError,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={formColors.placeholder}
                        value={balance}
                        onChangeText={setBalance}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("balance")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {balanceHasError && (
                    <Text style={form.error}>Balance is required.</Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Monthly payment</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "minimumPayment" &&
                            form.inputFocused,
                        paymentHasError && form.inputError,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={formColors.placeholder}
                        value={minimumPayment}
                        onChangeText={setMinimumPayment}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("minimumPayment")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {paymentHasError && (
                    <Text style={form.error}>
                        Monthly payment is required.
                    </Text>
                )}
            </View>
        </FormDialog>
    );
}
