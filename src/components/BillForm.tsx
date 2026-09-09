import { useBills } from "@/app/contexts/BillsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { FilterChips } from "@/components/FilterChips";
import { FormDialog } from "@/components/FormDialog";
import { BILL_CATEGORIES } from "@/constants/categories";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
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
                <View style={[modalForm.actionCard, modalForm.actionCardLead]}>
                    <Text style={modalForm.actionCardTitle}>
                        {isPaid ? "Paid this month" : "This month’s bill"}
                    </Text>
                    <Text style={modalForm.actionCardCaption}>
                        {isPaid
                            ? "Leftover uses this amount. Change it if the statement is different, or undo."
                            : "Stays $0 until you log what the statement actually is."}
                    </Text>
                    <View
                        style={[
                            modalForm.dialogAmountWrap,
                            focusedInput === "paidAmount" &&
                                modalForm.dialogInputFocused,
                            logAmountHasError && modalForm.dialogInputError,
                            { marginBottom: 12 },
                        ]}
                    >
                        <Text style={modalForm.dialogAmountPrefix}>
                            {symbol}
                        </Text>
                        <TextInput
                            style={modalForm.dialogAmountInput}
                            placeholder="0.00"
                            placeholderTextColor="#CBD5E1"
                            value={paidAmount}
                            onChangeText={setPaidAmount}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedInput("paidAmount")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    {logAmountHasError ? (
                        <Text style={modalForm.errorText}>
                            Enter this month’s amount.
                        </Text>
                    ) : null}
                    {isPaid ? (
                        <Pressable
                            style={({ pressed }) => [
                                modalForm.actionCardButton,
                                pressed && buttonStyle.buttonPressed,
                                { marginBottom: 8 },
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
                            modalForm.actionCardButton,
                            pressed && buttonStyle.buttonPressed,
                            isPaid && { backgroundColor: "#334155" },
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

            <View style={modalForm.dialogField}>
                <Text style={modalForm.dialogLabel}>Name</Text>
                <TextInput
                    style={[
                        modalForm.dialogInput,
                        focusedInput === "name" && modalForm.dialogInputFocused,
                        nameHasError && modalForm.dialogInputError,
                    ]}
                    placeholder="Rent, electricity, Netflix…"
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
                        Amount changes each month
                    </Text>
                    <Text style={modalForm.dialogSwitchCaption}>
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
                    trackColor={{ false: "#CBD5E1", true: "#93C5FD" }}
                    thumbColor={amountVaries ? "#1D4ED8" : "#F8FAFC"}
                />
            </View>

            {!amountVaries ? (
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
                        <Text style={modalForm.dialogAmountPrefix}>
                            {symbol}
                        </Text>
                        <TextInput
                            style={modalForm.dialogAmountInput}
                            placeholder="0.00"
                            placeholderTextColor="#CBD5E1"
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
                        <Text style={modalForm.errorText}>
                            Amount is required.
                        </Text>
                    )}
                </View>
            ) : null}

            {!amountVaries ? (
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
                        onValueChange={(next) => {
                            setIsPaid(next);
                            if (next && paidAmount.trim() === "") {
                                setPaidAmount(amount);
                            }
                        }}
                        trackColor={{ false: "#CBD5E1", true: "#86EFAC" }}
                        thumbColor={isPaid ? "#15803D" : "#F8FAFC"}
                    />
                </View>
            ) : null}

            {!amountVaries && isPaid ? (
                <View style={modalForm.dialogField}>
                    <Text style={modalForm.dialogLabel}>Paid this month</Text>
                    <View
                        style={[
                            modalForm.dialogAmountWrap,
                            focusedInput === "fixedPaidAmount" &&
                                modalForm.dialogInputFocused,
                            paidAmountHasError && modalForm.dialogInputError,
                        ]}
                    >
                        <Text style={modalForm.dialogAmountPrefix}>
                            {symbol}
                        </Text>
                        <TextInput
                            style={modalForm.dialogAmountInput}
                            placeholder="0.00"
                            placeholderTextColor="#CBD5E1"
                            value={paidAmount}
                            onChangeText={setPaidAmount}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedInput("fixedPaidAmount")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    {paidAmountHasError ? (
                        <Text style={modalForm.errorText}>
                            Enter what you actually paid.
                        </Text>
                    ) : (
                        <Text style={modalForm.actionCardCaption}>
                            This is the amount leftover subtracts.
                        </Text>
                    )}
                </View>
            ) : null}
        </FormDialog>
    );
}
