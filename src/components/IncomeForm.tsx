import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { ChoiceChips } from "@/components/ChoiceChips";
import { DateField } from "@/components/DateField";
import { FormDialog } from "@/components/FormDialog";
import { form, formColors } from "@/styles/form";
import { Income } from "@/types/income";
import {
    moneyFieldError,
    optionalMoneyFieldError,
    parseMoneyInput,
    parseOptionalMoneyInput,
} from "@/utils/amount-input";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { currencySymbol } from "@/utils/money";
import {
    chipFromPayCadence,
    PAY_CADENCE_CHIPS,
    payCadenceFromChip,
    PayCadenceChip,
} from "@/utils/pay-cycle";
import { useFormSession } from "@/hooks/useFormSession";
import { useState } from "react";
import { Text, TextInput, View } from "react-native";

type IncomeFormProps = {
    visible: boolean;
    onClose: () => void;
    entry?: Income;
};

export default function IncomeForm(props: IncomeFormProps) {
    const session = useFormSession(props.visible, props.entry?.id);
    return <IncomeEditor key={session} {...props} />;
}

function IncomeEditor({ visible, onClose, entry }: IncomeFormProps) {
    const { addIncome, updateIncome, deleteIncome } = useIncome();
    const { currency } = useLocale();
    const symbol = currencySymbol(currency);

    const [source, setSource] = useState(entry?.source ?? "");
    const [net, setNet] = useState(entry ? String(entry.net) : "");
    const [gross, setGross] = useState(entry ? String(entry.gross) : "");
    const [date, setDate] = useState(entry?.date ?? todayIsoDate());
    const [cadenceChip, setCadenceChip] = useState<PayCadenceChip>(
        chipFromPayCadence(entry?.payCadence)
    );
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const sourceHasError = showErrors && source.trim() === "";
    const netError = showErrors ? moneyFieldError(net) : null;
    const grossError = showErrors ? optionalMoneyFieldError(gross) : null;
    const dateHasError = showErrors && parseIsoDate(date) === null;

    const handleSubmit = async () => {
        const netNumber = parseMoneyInput(net);
        const grossParsed = parseOptionalMoneyInput(gross);

        if (
            !source.trim() ||
            netNumber === null ||
            grossParsed === null ||
            parseIsoDate(date) === null
        ) {
            setShowErrors(true);
            return;
        }

        const payload = {
            source: source.trim(),
            net: netNumber,
            gross: grossParsed ?? netNumber,
            date: date.trim(),
            payCadence: payCadenceFromChip(cadenceChip),
        };

        if (entry) {
            await updateIncome(entry.id, payload);
        } else {
            await addIncome({
                id: Date.now().toString(),
                ...payload,
            });
        }

        setShowErrors(false);
        onClose();
    };

    return (
        <FormDialog
            visible={visible}
            onClose={onClose}
            kicker="Money in"
            title={entry ? "Edit income" : "New income"}
            saveLabel={entry ? "Save income" : "Add income"}
            onSave={() => {
                void handleSubmit();
            }}
            deleteLabel={entry ? "Delete income" : undefined}
            deleteMessage="This removes this income entry from the device."
            onDelete={
                entry
                    ? async () => {
                          await deleteIncome(entry.id);
                          onClose();
                      }
                    : undefined
            }
        >
            <View style={form.field}>
                <Text style={form.label}>Source</Text>
                <TextInput
                    style={[
                        form.input,
                        focusedInput === "source" && form.inputFocused,
                        sourceHasError && form.inputError,
                    ]}
                    placeholder="Salary, freelance…"
                    placeholderTextColor={formColors.placeholder}
                    value={source}
                    onChangeText={setSource}
                    onFocus={() => setFocusedInput("source")}
                    onBlur={() => setFocusedInput(null)}
                />
                {sourceHasError && (
                    <Text style={form.error}>Source is required.</Text>
                )}
            </View>

            <View style={form.field}>
                <DateField
                    label="Pay date"
                    value={date}
                    onChange={setDate}
                    hasError={dateHasError}
                    errorMessage="Choose a valid pay date."
                />
            </View>

            <View style={form.field}>
                <Text style={form.label}>Pay cycle</Text>
                <ChoiceChips
                    options={PAY_CADENCE_CHIPS}
                    selected={cadenceChip}
                    onSelect={setCadenceChip}
                    title="Pay cycle"
                />
                <Text style={form.helper}>
                    {cadenceChip === "Once"
                        ? "A one-off deposit. Home payday needs a repeating cycle."
                        : "Home can count leftover until the next payday on this cycle."}
                </Text>
            </View>

            <View style={form.field}>
                <Text style={form.label}>Net (take-home)</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "net" && form.inputFocused,
                        netError && form.inputError,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={formColors.placeholder}
                        value={net}
                        onChangeText={setNet}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("net")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {netError ? <Text style={form.error}>{netError}</Text> : null}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Gross (optional)</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "gross" && form.inputFocused,
                        grossError && form.inputError,
                    ]}
                >
                    <Text style={form.amountPrefix}>{symbol}</Text>
                    <TextInput
                        style={form.amountInput}
                        placeholder="Defaults to net"
                        placeholderTextColor={formColors.placeholder}
                        value={gross}
                        onChangeText={setGross}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("gross")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {grossError ? (
                    <Text style={form.error}>{grossError}</Text>
                ) : null}
            </View>
        </FormDialog>
    );
}
