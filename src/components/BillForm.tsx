import { useBills } from "@/app/contexts/BillsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { CategoryPicker } from "@/components/CategoryPicker";
import { DueDayPicker } from "@/components/DueDayPicker";
import { FormDialog } from "@/components/FormDialog";
import { BILL_CATEGORIES } from "@/constants/categories";
import { useFormStyles, useFormColors } from "@/styles/form";
import { Bill } from "@/types/bill";
import { moneyFieldError, parseMoneyInput } from "@/utils/amount-input";
import { currencySymbol } from "@/utils/money";
import { useFormSession } from "@/hooks/useFormSession";
import { useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";

type BillFormProps = {
    visible: boolean;
    onClose: () => void;
    bill?: Bill;
};

export default function BillForm(props: BillFormProps) {
    const session = useFormSession(props.visible, props.bill?.id);
    return <BillEditor key={session} {...props} />;
}

function BillEditor({ visible, onClose, bill }: BillFormProps) {
    const form = useFormStyles();
    const formColors = useFormColors();
    const { addBill, updateBill, deleteBill } = useBills();
    const { currency } = useLocale();
    const symbol = currencySymbol(currency);

    const varies = bill?.amountVaries === true;
    const [name, setName] = useState(bill?.name ?? "");
    const [amount, setAmount] = useState(() => {
        if (!bill) {
            return "";
        }
        return varies ? "0" : String(bill.amount);
    });
    const [dueDay, setDueDay] = useState<number | null>(bill?.dueDay ?? null);
    const [category, setCategory] = useState<string | null>(
        bill?.category ?? null
    );
    const [amountVaries, setAmountVaries] = useState(varies);
    const [remind, setRemind] = useState(bill?.remind !== false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const amountError =
        showErrors && !amountVaries ? moneyFieldError(amount) : null;
    const dueDayHasError = showErrors && dueDay === null;

    const handleSubmit = async () => {
        if (!name.trim() || dueDay === null) {
            setShowErrors(true);
            return;
        }

        let storedAmount = 0;
        if (!amountVaries) {
            const parsed = parseMoneyInput(amount);
            if (parsed === null) {
                setShowErrors(true);
                return;
            }
            storedAmount = parsed;
        }

        if (bill) {
            await updateBill(bill.id, {
                name,
                amount: storedAmount,
                dueDay,
                category: category ?? undefined,
                amountVaries,
                remind,
            });
        } else {
            await addBill({
                id: Date.now().toString(),
                name,
                amount: storedAmount,
                dueDay,
                category: category ?? undefined,
                isPaid: false,
                isRecurring: true,
                amountVaries,
                remind,
            });
        }

        setShowErrors(false);
        onClose();
    };

    return (
        <FormDialog
            visible={visible}
            onClose={onClose}
            kicker="Recurring bill"
            title={bill ? "Edit bill" : "New bill"}
            saveLabel={bill ? "Save bill" : "Add bill"}
            onSave={() => {
                void handleSubmit();
            }}
            deleteLabel={bill ? "Delete bill" : undefined}
            deleteMessage="This removes this bill and its payment history from the device."
            onDelete={
                bill
                    ? async () => {
                          await deleteBill(bill.id);
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
                    placeholder="Rent, electricity, Netflix…"
                    placeholderTextColor={formColors.placeholder}
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                />
                {nameHasError && (
                    <Text style={form.error}>Bill name is required.</Text>
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
                            : "No alert for this bill"}
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
                <Text style={form.label}>Category (optional)</Text>
                <CategoryPicker
                    options={BILL_CATEGORIES}
                    selected={category}
                    onSelect={setCategory}
                />
            </View>

            <View style={form.switchRow}>
                <View style={form.switchCopy}>
                    <Text style={form.switchTitle}>
                        Amount changes each month
                    </Text>
                    <Text style={form.switchCaption}>
                        Water, electricity — log the statement on the bill page
                    </Text>
                </View>
                <Switch
                    value={amountVaries}
                    onValueChange={(next) => {
                        setAmountVaries(next);
                        if (next) {
                            setAmount("0");
                        }
                    }}
                    trackColor={{
                        false: formColors.switchTrackOff,
                        true: formColors.switchTrackOn,
                    }}
                    thumbColor={formColors.switchThumb}
                />
            </View>

            {!amountVaries ? (
                <View style={form.field}>
                    <Text style={form.label}>Recurring amount</Text>
                    <View
                        style={[
                            form.amountWrap,
                            focusedInput === "amount" && form.inputFocused,
                            amountError && form.inputError,
                        ]}
                    >
                        <Text style={form.amountPrefix}>{symbol}</Text>
                        <TextInput
                            style={form.amountInput}
                            placeholder="0.00"
                            placeholderTextColor={formColors.placeholder}
                            value={amount}
                            onChangeText={setAmount}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedInput("amount")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    {amountError ? (
                        <Text style={form.error}>{amountError}</Text>
                    ) : null}
                </View>
            ) : null}
        </FormDialog>
    );
}
