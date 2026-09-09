import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { FormDialog } from "@/components/FormDialog";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { SavingsGoal } from "@/types/savings";
import { currencySymbol } from "@/utils/money";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type SavingsFormProps = {
    visible: boolean;
    onClose: () => void;
    savingsInfo?: SavingsGoal;
};

export default function SavingsForm({
    visible,
    onClose,
    savingsInfo,
}: SavingsFormProps) {
    const { addSavings, updateSavings, deleteSavings, addContribution } =
        useSavings();
    const { currency, formatMoney } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [monthlyContribution, setMonthlyContribution] = useState("");
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const targetHasError = showErrors && targetAmount.trim() === "";
    const currentHasError = showErrors && currentAmount.trim() === "";
    const contributionHasError =
        showErrors && monthlyContribution.trim() === "";

    useEffect(() => {
        if (savingsInfo) {
            setName(savingsInfo.name);
            setTargetAmount(savingsInfo.targetAmount.toString());
            setCurrentAmount(savingsInfo.currentAmount.toString());
            setMonthlyContribution(
                savingsInfo.monthlyContribution?.toString() || ""
            );
        } else {
            setName("");
            setTargetAmount("");
            setCurrentAmount("");
            setMonthlyContribution("");
        }
        setShowErrors(false);
    }, [savingsInfo, visible]);

    const handleSubmit = async () => {
        if (!name || !targetAmount || !currentAmount || !monthlyContribution) {
            setShowErrors(true);
            return;
        }

        if (savingsInfo) {
            await updateSavings(savingsInfo.id, {
                name,
                targetAmount: Number(targetAmount),
                currentAmount: Number(currentAmount),
                monthlyContribution: Number(monthlyContribution),
            });
        } else {
            await addSavings({
                id: Date.now().toString(),
                name,
                targetAmount: Number(targetAmount),
                currentAmount: Number(currentAmount),
                monthlyContribution: Number(monthlyContribution),
            });
            setName("");
            setTargetAmount("");
            setCurrentAmount("");
            setMonthlyContribution("");
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
            deleteMessage="This removes this savings goal from the device."
            onDelete={
                savingsInfo
                    ? async () => {
                          await deleteSavings(savingsInfo.id);
                          onClose();
                      }
                    : undefined
            }
        >
            {savingsInfo && Number(monthlyContribution) > 0 ? (
                <View style={[modalForm.actionCard, { marginTop: 0, marginBottom: 16 }]}>
                    <Text style={modalForm.actionCardTitle}>
                        Log a contribution
                    </Text>
                    <Text style={modalForm.actionCardCaption}>
                        Adds {formatMoney(Number(monthlyContribution) || 0)} to
                        this goal
                    </Text>
                    <Pressable
                        style={({ pressed }) => [
                            modalForm.actionCardButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={async () => {
                            await addContribution(
                                savingsInfo.id,
                                Number(monthlyContribution)
                            );
                            onClose();
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            Log {formatMoney(Number(monthlyContribution) || 0)}
                        </Text>
                    </Pressable>
                </View>
            ) : null}

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Name</Text>
                <TextInput
                    style={[
                        modalForm.dialogInput,
                        focusedInput === "name" && modalForm.dialogInputFocused,
                        nameHasError && modalForm.dialogInputError,
                    ]}
                    placeholder="Emergency fund"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                />
                {nameHasError && (
                    <Text style={modalForm.errorText}>
                        Savings name is required.
                    </Text>
                )}
            </View>

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Target</Text>
                <View
                    style={[
                        modalForm.dialogAmountWrap,
                        focusedInput === "targetAmount" &&
                            modalForm.dialogInputFocused,
                        targetHasError && modalForm.dialogInputError,
                    ]}
                >
                    <Text style={modalForm.dialogAmountPrefix}>{symbol}</Text>
                    <TextInput
                        style={modalForm.dialogAmountInput}
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("targetAmount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {targetHasError && (
                    <Text style={modalForm.errorText}>
                        Target amount is required.
                    </Text>
                )}
            </View>

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Current</Text>
                <View
                    style={[
                        modalForm.dialogAmountWrap,
                        focusedInput === "currentAmount" &&
                            modalForm.dialogInputFocused,
                        currentHasError && modalForm.dialogInputError,
                    ]}
                >
                    <Text style={modalForm.dialogAmountPrefix}>{symbol}</Text>
                    <TextInput
                        style={[modalForm.dialogAmountInput, { fontSize: 20 }]}
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        value={currentAmount}
                        onChangeText={setCurrentAmount}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("currentAmount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {currentHasError && (
                    <Text style={modalForm.errorText}>
                        Current amount is required.
                    </Text>
                )}
            </View>

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Monthly contribution</Text>
                <View
                    style={[
                        modalForm.dialogAmountWrap,
                        focusedInput === "monthlyContribution" &&
                            modalForm.dialogInputFocused,
                        contributionHasError && modalForm.dialogInputError,
                    ]}
                >
                    <Text style={modalForm.dialogAmountPrefix}>{symbol}</Text>
                    <TextInput
                        style={[modalForm.dialogAmountInput, { fontSize: 20 }]}
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        value={monthlyContribution}
                        onChangeText={setMonthlyContribution}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("monthlyContribution")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {contributionHasError && (
                    <Text style={modalForm.errorText}>
                        Monthly contribution is required.
                    </Text>
                )}
            </View>
        </FormDialog>
    );
}
