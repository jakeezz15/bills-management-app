import { useBills } from "@/app/contexts/BillsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { FilterChips } from "@/components/FilterChips";
import { FormDialog } from "@/components/FormDialog";
import { BILL_CATEGORIES } from "@/constants/categories";
import { theme } from "@/design";
import { buttonStyle } from "@/styles/button-style";
import { form, formColors } from "@/styles/form";
import { Bill } from "@/types/bill";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { getBillPaymentInMonth, isBillPaidAsOf } from "@/utils/filters";
import { currencySymbol } from "@/utils/money";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Switch, Text, TextInput, View } from "react-native";

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
    const { currency, formatMoney } = useLocale();
    const symbol = currencySymbol(currency);

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [paidAmount, setPaidAmount] = useState("");
    const [dueDay, setDueDay] = useState("");
    const [category, setCategory] = useState<string | null>(null);
    const [isPaid, setIsPaid] = useState(false);
    const [amountVaries, setAmountVaries] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [logShowErrors, setLogShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const amountHasError =
        showErrors && !amountVaries && !(Number(amount) > 0);
    const dueDayHasError =
        showErrors &&
        (dueDay.trim() === "" || Number(dueDay) < 1 || Number(dueDay) > 31);
    const paidAmountHasError =
        showErrors && !amountVaries && isPaid && !(Number(paidAmount) > 0);
    const logValue = Number(paidAmount);
    const logAmountHasError = logShowErrors && !(logValue > 0);

    const resolvedAsOfIso = asOfIso ?? todayIsoDate();
    const asOf = useMemo(
        () => parseIsoDate(resolvedAsOfIso) ?? new Date(),
        [resolvedAsOfIso]
    );

    useEffect(() => {
        if (bill) {
            const monthPayment = getBillPaymentInMonth(bill.id, payments, asOf);
            const varies = bill.amountVaries === true;
            setName(bill.name);
            setAmount(varies ? "0" : String(bill.amount));
            setDueDay(String(bill.dueDay));
            setCategory(bill.category ?? null);
            setAmountVaries(varies);
            const paid = isBillPaidAsOf(bill, payments, asOf);
            setIsPaid(paid);
            setPaidAmount(monthPayment ? String(monthPayment.amount) : "");
        } else {
            setName("");
            setAmount("");
            setPaidAmount("");
            setDueDay("");
            setCategory(null);
            setIsPaid(false);
            setAmountVaries(false);
        }
        setShowErrors(false);
        setLogShowErrors(false);
    }, [bill, visible, payments, asOf]);

    const persistGoal = async (paid: boolean, paymentAmount?: number) => {
        const dueDayNumber = Number(dueDay);
        const storedAmount = amountVaries ? 0 : Number(amount);

        if (bill) {
            await updateBill(
                bill.id,
                {
                    name,
                    amount: storedAmount,
                    dueDay: dueDayNumber,
                    category: category ?? undefined,
                    isPaid: paid,
                    amountVaries,
                },
                resolvedAsOfIso,
                paid ? paymentAmount : undefined
            );
        } else {
            await addBill(
                {
                    id: Date.now().toString(),
                    name,
                    amount: storedAmount,
                    dueDay: dueDayNumber,
                    category: category ?? undefined,
                    isPaid: paid,
                    isRecurring: true,
                    amountVaries,
                },
                resolvedAsOfIso,
                paid ? paymentAmount : undefined
            );
            setName("");
            setAmount("");
            setPaidAmount("");
            setDueDay("");
            setCategory(null);
            setIsPaid(false);
            setAmountVaries(false);
        }
    };

    const detailsValid = () => {
        if (!name.trim() || !dueDay.trim()) {
            return false;
        }
        const dueDayNumber = Number(dueDay);
        if (dueDayNumber < 1 || dueDayNumber > 31) {
            return false;
        }
        if (!amountVaries && !(Number(amount) > 0)) {
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!detailsValid()) {
            setShowErrors(true);
            return;
        }
        if (!amountVaries && isPaid && !(Number(paidAmount) > 0)) {
            setShowErrors(true);
            return;
        }

        await persistGoal(
            isPaid,
            !amountVaries && isPaid ? Number(paidAmount) : undefined
        );
        setShowErrors(false);
        onClose();
    };

    const handleLogPayment = async () => {
        if (!detailsValid()) {
            setShowErrors(true);
            return;
        }
        if (!(logValue > 0)) {
            setLogShowErrors(true);
            return;
        }
        await persistGoal(true, logValue);
        onClose();
    };

    const handleUndoPayment = async () => {
        if (!bill) {
            return;
        }
        if (!detailsValid()) {
            setShowErrors(true);
            return;
        }
        await persistGoal(false);
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
            {amountVaries ? (
                <View style={[form.actionCard, form.actionCardLead]}>
                    <Text style={form.actionCardTitle}>
                        {isPaid ? "Paid this month" : "This month’s bill"}
                    </Text>
                    <Text style={form.actionCardCaption}>
                        {isPaid
                            ? "Leftover uses this amount. Change it if the statement is different, or undo."
                            : "Stays $0 until you log what the statement actually is."}
                    </Text>
                    <View
                        style={[
                            form.amountWrap,
                            focusedInput === "paidAmount" &&
                                form.inputFocused,
                            logAmountHasError && form.inputError,
                            { marginBottom: theme.space.md },
                        ]}
                    >
                        <Text style={form.amountPrefix}>
                            {symbol}
                        </Text>
                        <TextInput
                            style={form.amountInput}
                            placeholder="0.00"
                            placeholderTextColor={formColors.placeholder}
                            value={paidAmount}
                            onChangeText={setPaidAmount}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedInput("paidAmount")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    {logAmountHasError ? (
                        <Text style={form.error}>
                            Enter this month’s amount.
                        </Text>
                    ) : null}
                    {isPaid ? (
                        <Pressable
                            style={({ pressed }) => [
                                form.actionCardButton,
                                pressed && buttonStyle.buttonPressed,
                                form.actionCardButtonSpacer,
                            ]}
                            onPress={() => {
                                void handleLogPayment();
                            }}
                        >
                            <Text style={buttonStyle.buttonText}>
                                {logValue > 0
                                    ? `Update ${formatMoney(logValue)}`
                                    : "Update payment"}
                            </Text>
                        </Pressable>
                    ) : null}
                    <Pressable
                        style={({ pressed }) => [
                            form.actionCardButton,
                            pressed && buttonStyle.buttonPressed,
                            isPaid && form.actionCardButtonMuted,
                        ]}
                        onPress={() => {
                            if (isPaid) {
                                void handleUndoPayment();
                            } else {
                                void handleLogPayment();
                            }
                        }}
                    >
                        <Text style={buttonStyle.buttonText}>
                            {isPaid
                                ? "Undo this month"
                                : logValue > 0
                                  ? `Log ${formatMoney(logValue)}`
                                  : "Log this month"}
                        </Text>
                    </Pressable>
                </View>
            ) : null}

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
                    <Text style={form.error}>
                        Bill name is required.
                    </Text>
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

            <View style={form.field}>
                <Text style={form.label}>Category</Text>
                <FilterChips
                    options={BILL_CATEGORIES}
                    selected={category}
                    onSelect={setCategory}
                    allowClear
                />
            </View>

            <View style={form.switchRow}>
                <View style={form.switchCopy}>
                    <Text style={form.switchTitle}>
                        Amount changes each month
                    </Text>
                    <Text style={form.switchCaption}>
                        Water, electricity — $0 until you log the statement
                    </Text>
                </View>
                <Switch
                    value={amountVaries}
                    onValueChange={(next) => {
                        setAmountVaries(next);
                        if (next) {
                            setAmount("0");
                            if (!isPaid) {
                                setPaidAmount("");
                            }
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
                    <Text style={form.label}>Amount</Text>
                    <View
                        style={[
                            form.amountWrap,
                            focusedInput === "amount" &&
                                form.inputFocused,
                            amountHasError && form.inputError,
                        ]}
                    >
                        <Text style={form.amountPrefix}>
                            {symbol}
                        </Text>
                        <TextInput
                            style={form.amountInput}
                            placeholder="0.00"
                            placeholderTextColor={formColors.placeholder}
                            value={amount}
                            onChangeText={(value) => {
                                setAmount(value);
                                if (!isPaid) {
                                    setPaidAmount(value);
                                }
                            }}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedInput("amount")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    {amountHasError && (
                        <Text style={form.error}>
                            Amount is required.
                        </Text>
                    )}
                </View>
            ) : null}

            {!amountVaries ? (
                <View style={form.switchRow}>
                    <View style={form.switchCopy}>
                        <Text style={form.switchTitle}>
                            Paid this month
                        </Text>
                        <Text style={form.switchCaption}>
                            Turn off and save to undo this period’s payment
                        </Text>
                    </View>
                    <Switch
                        value={isPaid}
                        onValueChange={(next) => {
                            setIsPaid(next);
                            if (next && paidAmount.trim() === "") {
                                setPaidAmount(amount);
                            }
                        }}
                        trackColor={{
                            false: formColors.switchTrackOff,
                            true: formColors.switchTrackOn,
                        }}
                        thumbColor={formColors.switchThumb}
                    />
                </View>
            ) : null}

            {!amountVaries && isPaid ? (
                <View style={form.field}>
                    <Text style={form.label}>Paid this month</Text>
                    <View
                        style={[
                            form.amountWrap,
                            focusedInput === "fixedPaidAmount" &&
                                form.inputFocused,
                            paidAmountHasError && form.inputError,
                        ]}
                    >
                        <Text style={form.amountPrefix}>
                            {symbol}
                        </Text>
                        <TextInput
                            style={form.amountInput}
                            placeholder="0.00"
                            placeholderTextColor={formColors.placeholder}
                            value={paidAmount}
                            onChangeText={setPaidAmount}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedInput("fixedPaidAmount")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    {paidAmountHasError ? (
                        <Text style={form.error}>
                            Enter what you actually paid.
                        </Text>
                    ) : (
                        <Text style={form.actionCardCaption}>
                            This is the amount leftover subtracts.
                        </Text>
                    )}
                </View>
            ) : null}
        </FormDialog>
    );
}
