import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DateField } from "@/components/DateField";
import { FormDialog } from "@/components/FormDialog";
import { form, formColors } from "@/styles/form";
import { Income } from "@/types/income";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { currencySymbol } from "@/utils/money";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";

type IncomeFormProps = {
    visible: boolean;
    onClose: () => void;
    entry?: Income;
};

export default function IncomeForm({
    visible,
    onClose,
    entry,
}: IncomeFormProps) {
    const { addIncome, updateIncome, deleteIncome } = useIncome();
    const { currency } = useLocale();
    const symbol = currencySymbol(currency);

    const [source, setSource] = useState("");
    const [net, setNet] = useState("");
    const [gross, setGross] = useState("");
    const [date, setDate] = useState(todayIsoDate());
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const sourceHasError = showErrors && source.trim() === "";
    const netHasError = showErrors && net.trim() === "";
    const dateHasError = showErrors && parseIsoDate(date) === null;

    useEffect(() => {
        if (entry) {
            setSource(entry.source);
            setNet(String(entry.net));
            setGross(String(entry.gross));
            setDate(entry.date);
        } else {
            setSource("");
            setNet("");
            setGross("");
            setDate(todayIsoDate());
        }
        setShowErrors(false);
    }, [entry, visible]);

    const handleSubmit = async () => {
        if (!source || !net || parseIsoDate(date) === null) {
            setShowErrors(true);
            return;
        }

        const netNumber = Number(net);
        const grossNumber = gross.trim() === "" ? netNumber : Number(gross);
        const payload = {
            source: source.trim(),
            net: netNumber,
            gross: grossNumber,
            date: date.trim(),
        };

        if (entry) {
            await updateIncome(entry.id, payload);
        } else {
            await addIncome({
                id: Date.now().toString(),
                ...payload,
            });
            setSource("");
            setNet("");
            setGross("");
            setDate(todayIsoDate());
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
                        focusedInput === "source" &&
                            form.inputFocused,
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
                <Text style={form.label}>Net (take-home)</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "net" && form.inputFocused,
                        netHasError && form.inputError,
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
                {netHasError && (
                    <Text style={form.error}>
                        Net amount is required.
                    </Text>
                )}
            </View>

            <View style={form.field}>
                <Text style={form.label}>Gross (optional)</Text>
                <View
                    style={[
                        form.amountWrap,
                        focusedInput === "gross" &&
                            form.inputFocused,
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
            </View>
        </FormDialog>
    );
}
