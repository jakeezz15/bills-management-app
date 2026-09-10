import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { DateField } from "@/components/DateField";
import { FormDialog } from "@/components/FormDialog";
import { form, formColors } from "@/styles/form";
import { SavingsGoal } from "@/types/savings";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { currencySymbol } from "@/utils/money";
import { savingsStartDate } from "@/utils/timestamps";
import { useFormSession } from "@/hooks/useFormSession";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

type SavingsFormProps = {
    visible: boolean;
    onClose: () => void;
    savingsInfo?: SavingsGoal;
};

export default function SavingsForm(props: SavingsFormProps) {
    const session = useFormSession(props.visible, props.savingsInfo?.id);
    return <SavingsEditor key={session} {...props} />;
}

function SavingsEditor({ visible, onClose, savingsInfo }: SavingsFormProps) {
    const { addSavings, updateSavings, deleteSavings } = useSavings();
    const { currency } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState(savingsInfo?.name ?? "");
    const [targetAmount, setTargetAmount] = useState(
        savingsInfo ? savingsInfo.targetAmount.toString() : ""
    );
    const [currentAmount, setCurrentAmount] = useState(
        savingsInfo ? savingsInfo.currentAmount.toString() : "0"
    );
    const [monthlyContribution, setMonthlyContribution] = useState(
        savingsInfo?.monthlyContribution?.toString() || ""
    );
    const [startDate, setStartDate] = useState(
        savingsInfo ? savingsStartDate(savingsInfo) : todayIsoDate()
    );
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const targetHasError = showErrors && targetAmount.trim() === "";
    const currentHasError = showErrors && currentAmount.trim() === "";
    const startDateHasError = showErrors && parseIsoDate(startDate) === null;

    const handleSubmit = async () => {
        if (
            !name ||
            !targetAmount ||
            currentAmount.trim() === "" ||
            parseIsoDate(startDate) === null
        ) {
            setShowErrors(true);
            return;
        }

        const plannedMonthly =
            monthlyContribution.trim() === ""
                ? undefined
                : Number(monthlyContribution);

        if (savingsInfo) {
            await updateSavings(savingsInfo.id, {
                name,
                targetAmount: Number(targetAmount),
                currentAmount: Number(currentAmount),
                startDate: startDate.trim(),
                monthlyContribution: plannedMonthly,
            });
        } else {
            await addSavings({
                id: Date.now().toString(),
                name,
                targetAmount: Number(targetAmount),
                currentAmount: Number(currentAmount),
                startDate: startDate.trim(),
                monthlyContribution: plannedMonthly,
            });
        }
        onClose();
    };

    return (
        <FormDialog
            visible={visible}
            onClose={onClose}
            kicker="Goal"
            title={savingsInfo ? "Edit savings" : "New savings"}
            saveLabel={savingsInfo ? "Save goal" : "Add goal"}
            onSave={() => {
                void handleSubmit();
            }}
            deleteLabel={savingsInfo ? "Delete savings goal" : undefined}
            deleteMessage="This removes this savings goal and its contributions from the device."
            onDelete={
                savingsInfo
                    ? async () => {
                          await deleteSavings(savingsInfo.id);
                          onClose();
                      }
                    : undefined
            }
        >
            <View style={form.field}>
                <Text style={form.label}>Name</Text>
                <TextInput
                    style={[
                        form.input,
                        focusedInput === "name" && form.inputFocused,
                        nameHasError && form.inputError,
                    ]}
                    placeholder="Emergency fund"
                    placeholderTextColor={formColors.placeholder}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                />
                {nameHasError && (
                    <Text style={form.error}>Savings name is required.</Text>
                )}
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
                <Text style={form.label}>Target</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "targetAmount" && form.inputFocused,
                        targetHasError && form.inputError,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={formColors.placeholder}
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("targetAmount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {targetHasError && (
                    <Text style={form.error}>Target amount is required.</Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Already saved (opening balance)</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "currentAmount" && form.inputFocused,
                        currentHasError && form.inputError,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={formColors.placeholder}
                        value={currentAmount}
                        onChangeText={setCurrentAmount}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("currentAmount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {currentHasError && (
                    <Text style={form.error}>Current amount is required.</Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Planned monthly (optional)</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "monthlyContribution" &&
                            form.inputFocused,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={formColors.placeholder}
                        value={monthlyContribution}
                        onChangeText={setMonthlyContribution}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("monthlyContribution")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                <Text style={form.helper}>
                    Used for pace estimates only. Leftover drops when you log a
                    contribution on the goal page.
                </Text>
            </View>
        </FormDialog>
    );
}
