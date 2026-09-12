import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DateField } from "@/components/DateField";
import { DueDayPicker } from "@/components/DueDayPicker";
import { FormDialog } from "@/components/FormDialog";
import { SelectMenu } from "@/components/SelectMenu";
import { form, formColors } from "@/styles/form";
import { Debt } from "@/types/debt";
import {
    moneyFieldError,
    parseMoneyInput,
} from "@/utils/amount-input";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { currencySymbol } from "@/utils/money";
import { useFormSession } from "@/hooks/useFormSession";
import { useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";

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
    const [dueDay, setDueDay] = useState<number | null>(debt?.dueDay ?? null);
    const [startDate, setStartDate] = useState(
        debt?.startDate || todayIsoDate()
    );
    const [type, setType] = useState(debt?.type ?? "");
    const [remind, setRemind] = useState(debt?.remind !== false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const balanceError = showErrors
        ? moneyFieldError(balance, { allowZero: true })
        : null;
    const paymentError = showErrors
        ? moneyFieldError(minimumPayment, { allowZero: true })
        : null;
    const dueDayHasError = showErrors && dueDay === null;
    const startDateHasError = showErrors && parseIsoDate(startDate) === null;
    const typeHasError = showErrors && type.trim() === "";

    const handleSubmit = async () => {
        const balanceNumber = parseMoneyInput(balance, { allowZero: true });
        const paymentNumber = parseMoneyInput(minimumPayment, {
            allowZero: true,
        });

        if (
            !name.trim() ||
            balanceNumber === null ||
            paymentNumber === null ||
            dueDay === null ||
            !type.trim() ||
            parseIsoDate(startDate) === null
        ) {
            setShowErrors(true);
            return;
        }

        if (debt) {
            await updateDebt(debt.id, {
                name,
                balance: balanceNumber,
                minimumPayment: paymentNumber,
                dueDay,
                startDate: startDate.trim(),
                type,
                remind,
            });
        } else {
            await addDebt({
                id: Date.now().toString(),
                name,
                balance: balanceNumber,
                minimumPayment: paymentNumber,
                dueDay,
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
                <DueDayPicker value={dueDay} onChange={setDueDay} />
                {dueDayHasError && (
                    <Text style={form.error}>Choose a due day.</Text>
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
                <SelectMenu
                    options={LOAN_TYPES}
                    value={
                        (LOAN_TYPES as readonly string[]).includes(type)
                            ? (type as (typeof LOAN_TYPES)[number])
                            : null
                    }
                    onChange={(value) => setType(value ?? "")}
                    title="Type"
                    placeholder="Choose type"
                    noneLabel={null}
                />
                {typeHasError && (
                    <Text style={form.error}>Choose a type.</Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Remaining</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "balance" && form.inputFocused,
                        balanceError && form.inputError,
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
                {balanceError ? (
                    <Text style={form.error}>{balanceError}</Text>
                ) : null}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Monthly payment</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "minimumPayment" &&
                            form.inputFocused,
                        paymentError && form.inputError,
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
                {paymentError ? (
                    <Text style={form.error}>{paymentError}</Text>
                ) : null}
            </View>
        </FormDialog>
    );
}
