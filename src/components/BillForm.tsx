import { useBills } from "@/app/contexts/BillsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { FilterChips } from "@/components/FilterChips";
import { FormDialog } from "@/components/FormDialog";
import { BILL_CATEGORIES } from "@/constants/categories";
import { modalForm } from "@/styles/modal-form";
import { Bill } from "@/types/bill";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { isBillPaidAsOf } from "@/utils/filters";
import { currencySymbol } from "@/utils/money";
import { useEffect, useMemo, useState } from "react";
import { Switch, Text, TextInput, View } from "react-native";

type BillFormProps = {
    visible: boolean;
    onClose: () => void;
    bill?: Bill;
    /** Period end used for “paid this month” (defaults to today). */
    asOfIso?: string;
};

export default function BillForm({
    visible,
    onClose,
    bill,
    asOfIso,
}: BillFormProps) {
    const { addBill, updateBill, deleteBill, payments } = useBills();
    const { currency } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [dueDay, setDueDay] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const amountHasError = showErrors && amount.trim() === "";
    const dueDayHasError =
        showErrors &&
        (dueDay.trim() === "" || Number(dueDay) < 1 || Number(dueDay) > 31);

    const resolvedAsOfIso = asOfIso ?? todayIsoDate();
    const asOf = useMemo(
        () => parseIsoDate(resolvedAsOfIso) ?? new Date(),
        [resolvedAsOfIso]
    );

    useEffect(() => {
        if (bill) {
            setName(bill.name);
            setAmount(String(bill.amount));
            setDueDay(String(bill.dueDay));
            setCategory(bill.category ?? null);
            setIsPaid(isBillPaidAsOf(bill, payments, asOf));
        } else {
            setName("");
            setAmount("");
            setDueDay("");
            setCategory(null);
            setIsPaid(false);
        }
        setShowErrors(false);
    }, [bill, visible, payments, asOf]);

    const handleSubmit = async () => {
        if (!name || !amount || !dueDay) {
            setShowErrors(true);
            return;
        }

        const dueDayNumber = Number(dueDay);
        if (dueDayNumber < 1 || dueDayNumber > 31) {
            setShowErrors(true);
            return;
        }

        if (bill) {
            await updateBill(
                bill.id,
                {
                    name,
                    amount: Number(amount),
                    dueDay: dueDayNumber,
                    category: category ?? undefined,
                    isPaid,
                },
                resolvedAsOfIso
            );
        } else {
            await addBill(
                {
                    id: Date.now().toString(),
                    name,
                    amount: Number(amount),
                    dueDay: dueDayNumber,
                    category: category ?? undefined,
                    isPaid,
                    isRecurring: true,
                },
                resolvedAsOfIso
            );

            setName("");
            setAmount("");
            setDueDay("");
            setCategory(null);
            setIsPaid(false);
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
            deleteMessage="This removes this bill from the device."
            onDelete={
                bill
                    ? async () => {
                          await deleteBill(bill.id);
                          onClose();
                      }
                    : undefined
            }
        >
            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Amount</Text>
                <View
                    style={[
                        modalForm.dialogAmountWrap,
                        focusedInput === "amount" &&
                            modalForm.dialogInputFocused,
                        amountHasError && modalForm.dialogInputError,
                    ]}
                >
                    <Text style={modalForm.dialogAmountPrefix}>{symbol}</Text>
                    <TextInput
                        style={modalForm.dialogAmountInput}
                        placeholder="0.00"
                        placeholderTextColor="#CBD5E1"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="decimal-pad"
                        onFocus={() => setFocusedInput("amount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
                {amountHasError && (
                    <Text style={modalForm.errorText}>Amount is required.</Text>
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
                    placeholder="Rent, internet, Netflix…"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput("name")}
                    onBlur={() => setFocusedInput(null)}
                />
                {nameHasError && (
                    <Text style={modalForm.errorText}>
                        Bill name is required.
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
                <Text style={modalForm.dialogLabel}>Category</Text>
                <FilterChips
                    options={BILL_CATEGORIES}
                    selected={category}
                    onSelect={setCategory}
                    allowClear
                />
            </View>

            <View style={modalForm.dialogSwitchRow}>
                <View style={modalForm.dialogSwitchCopy}>
                    <Text style={modalForm.dialogSwitchTitle}>
                        Paid this month
                    </Text>
                    <Text style={modalForm.dialogSwitchCaption}>
                        Turn off and save to undo this period’s payment
                    </Text>
                </View>
                <Switch
                    value={isPaid}
                    onValueChange={setIsPaid}
                    trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
                    thumbColor={isPaid ? "#15803D" : "#F8FAFC"}
                />
            </View>
        </FormDialog>
    );
}
