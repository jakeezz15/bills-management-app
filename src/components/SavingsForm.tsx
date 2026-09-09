import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { DateField } from "@/components/DateField";
import { FormDialog } from "@/components/FormDialog";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { SavingsGoal } from "@/types/savings";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { getLatestSavingsContributionInMonth } from "@/utils/filters";
import { currencySymbol } from "@/utils/money";
import { savingsStartDate } from "@/utils/timestamps";
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

type SavingsFormProps = {
    visible: boolean;
    onClose: () => void;
    savingsInfo?: SavingsGoal;
    asOfIso?: string;
};

export default function SavingsForm({
    visible,
    onClose,
    savingsInfo,
    asOfIso,
}: SavingsFormProps) {
    const { addSavings, updateSavings, deleteSavings, addContribution, undoContribution, contributions } =
        useSavings();
    const { currency, formatMoney } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [monthlyContribution, setMonthlyContribution] = useState("");
    const [startDate, setStartDate] = useState(todayIsoDate());
    const [logAmount, setLogAmount] = useState("");
    const [logDate, setLogDate] = useState(todayIsoDate());
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [logShowErrors, setLogShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const targetHasError = showErrors && targetAmount.trim() === "";
    const currentHasError = showErrors && currentAmount.trim() === "";
    const startDateHasError = showErrors && parseIsoDate(startDate) === null;

    const asOf = parseIsoDate(asOfIso ?? todayIsoDate()) ?? new Date();
    const latestThisMonth = savingsInfo
        ? getLatestSavingsContributionInMonth(
              savingsInfo.id,
              contributions,
              asOf
          )
        : undefined;

    useEffect(() => {
        if (savingsInfo) {
            setName(savingsInfo.name);
            setTargetAmount(savingsInfo.targetAmount.toString());
            setCurrentAmount(savingsInfo.currentAmount.toString());
            setMonthlyContribution(
                savingsInfo.monthlyContribution?.toString() || ""
            );
            setStartDate(savingsStartDate(savingsInfo));
            setLogAmount(
                latestThisMonth
                    ? String(latestThisMonth.amount)
                    : savingsInfo.monthlyContribution
                      ? savingsInfo.monthlyContribution.toString()
                      : ""
            );
            setLogDate(latestThisMonth?.date ?? todayIsoDate());
        } else {
            setName("");
            setTargetAmount("");
            setCurrentAmount("0");
            setMonthlyContribution("");
            setStartDate(todayIsoDate());
            setLogAmount("");
            setLogDate(todayIsoDate());
        }
        setShowErrors(false);
        setLogShowErrors(false);
    }, [savingsInfo, visible]);

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
            setName("");
            setTargetAmount("");
            setCurrentAmount("0");
            setMonthlyContribution("");
            setStartDate(todayIsoDate());
        }
        onClose();
    };

    const plannedAmount = Number(monthlyContribution) || 0;
    const logValue = Number(logAmount);
    const logAmountHasError = logShowErrors && !(logValue > 0);
    const logDateHasError = logShowErrors && parseIsoDate(logDate) === null;

    const handleLog = async () => {
        if (!savingsInfo) {
            return;
        }
        if (!(logValue > 0) || parseIsoDate(logDate) === null) {
            setLogShowErrors(true);
            return;
        }
        await addContribution(savingsInfo.id, logValue, logDate.trim());
        onClose();
    };

    const handleUndo = async () => {
        if (!savingsInfo || !latestThisMonth) {
            return;
        }
        await undoContribution(savingsInfo.id, asOfIso ?? todayIsoDate());
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
            {savingsInfo ? (
                <View style={[modalForm.actionCard, modalForm.actionCardLead]}>
                    <Text style={modalForm.actionCardTitle}>
                        {latestThisMonth
                            ? "Logged this month"
                            : "Log a contribution"}
                    </Text>
                    <Text style={modalForm.actionCardCaption}>
                        {latestThisMonth
                            ? `Recorded ${formatMoney(latestThisMonth.amount)}. Undo if you logged this by mistake, or log another amount.`
                            : "Only this amount reduces leftover — like marking a bill paid. Change it for a one-off."}
                    </Text>
                    <View style={modalForm.actionCardField}>
                        <View
                            style={[
                                modalForm.dialogAmountWrap,
                                focusedInput === "logAmount" &&
                                    modalForm.dialogInputFocused,
                                logAmountHasError &&
                                    modalForm.dialogInputError,
                            ]}
                        >
                            <Text style={modalForm.dialogAmountPrefix}>
                                {symbol}
                            </Text>
                            <TextInput
                                style={modalForm.dialogAmountInput}
                                placeholder={
                                    plannedAmount > 0
                                        ? plannedAmount.toString()
                                        : "0.00"
                                }
                                placeholderTextColor="#CBD5E1"
                                value={logAmount}
                                onChangeText={setLogAmount}
                                keyboardType="decimal-pad"
                                onFocus={() => setFocusedInput("logAmount")}
                                onBlur={() => setFocusedInput(null)}
                            />
                        </View>
                        {logAmountHasError ? (
                            <Text
                                style={[
                                    modalForm.errorText,
                                    { marginTop: 8, marginBottom: 0 },
                                ]}
                            >
                                Enter an amount to log.
                            </Text>
                        ) : null}
                    </View>
                    <View style={modalForm.actionCardField}>
                        <DateField
                            layout="dialog"
                            label="Date"
                            value={logDate}
                            onChange={setLogDate}
                            hasError={logDateHasError}
                            errorMessage="Choose a valid date."
                        />
                    </View>
                    {latestThisMonth ? (
                        <Pressable
                            style={({ pressed }) => [
                                modalForm.actionCardButton,
                                pressed && buttonStyle.buttonPressed,
                            ]}
                            onPress={() => {
                                void handleLog();
                            }}
                        >
                            <Text style={buttonStyle.buttonText}>
                                {logValue > 0
                                    ? `Log ${formatMoney(logValue)}`
                                    : "Log another"}
                            </Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        style={({ pressed }) => [
                            modalForm.actionCardButton,
                            pressed && buttonStyle.buttonPressed,
                            latestThisMonth && { backgroundColor: "#334155" },
                            latestThisMonth
                                ? modalForm.actionCardButtonSpacer
                                : null,
                        ]}
                        onPress={() => {
                            if (latestThisMonth) {
                                void handleUndo();
                            } else {
                                void handleLog();
                            }
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            {latestThisMonth
                                ? "Undo this month"
                                : logValue > 0
                                  ? `Log ${formatMoney(logValue)}`
                                  : "Log contribution"}
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
                <Text style={modalForm.dialogLabel}>
                    Already saved (opening balance)
                </Text>
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
                            style={modalForm.dialogAmountInput}
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
                <Text style={modalForm.dialogLabel}>
                    Planned monthly (optional)
                </Text>
                <View
                    style={[
                        modalForm.dialogAmountWrap,
                        focusedInput === "monthlyContribution" &&
                            modalForm.dialogInputFocused,
                    ]}
                >
                    <Text style={modalForm.dialogAmountPrefix}>{symbol}</Text>
                        <TextInput
                            style={modalForm.dialogAmountInput}
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        value={monthlyContribution}
                        onChangeText={setMonthlyContribution}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("monthlyContribution")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                <Text style={modalForm.helper}>
                    Used for pace estimates only. Leftover drops when you tap
                    Log.
                </Text>
            </View>
        </FormDialog>
    );
}
