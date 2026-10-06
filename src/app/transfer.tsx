import { useAccounts } from "@/app/contexts/AccountsContext";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { AccountPicker } from "@/components/AccountPicker";
import { DateField } from "@/components/DateField";
import { text } from "@/design";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useFormColors, useFormStyles } from "@/styles/form";
import { useDashboardStyles } from "@/styles/dashboard";
import { CASH_ACCOUNT_ID } from "@/types/account";
import { getAvailableToTransfer } from "@/utils/account-balances";
import { moneyFieldError, parseMoneyInput } from "@/utils/amount-input";
import {
    activeAccounts,
    defaultInboundAccountId,
} from "@/utils/accounts";
import { parseIsoDate, todayIsoDate } from "@/utils/date";
import { hapticConfirm } from "@/utils/haptics";
import { currencySymbol } from "@/utils/money";
import { goBackOrReplace } from "@/utils/navigation";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

export default function TransferScreen() {
    useStatusBarStyle("dark");
    const topPadding = useScreenTopPadding();
    const dashboard = useDashboardStyles();
    const form = useFormStyles();
    const formColors = useFormColors();
    const { theme } = useTheme();
    const { currency, formatMoney } = useLocale();
    const symbol = currencySymbol(currency);
    const { accounts, transfers, adjustments, addTransfer } = useAccounts();
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { payments: billPayments } = useBills();
    const { payments: debtPayments } = useDebt();
    const { contributions: savingsContributions } = useSavings();

    const pots = useMemo(() => activeAccounts(accounts), [accounts]);
    const onlineDefault = defaultInboundAccountId(accounts);
    const cashId =
        pots.find((account) => account.id === CASH_ACCOUNT_ID)?.id ??
        pots[0]?.id ??
        CASH_ACCOUNT_ID;

    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(todayIsoDate());
    const [fromAccountId, setFromAccountId] = useState(
        onlineDefault !== cashId ? onlineDefault : cashId
    );
    const [toAccountId, setToAccountId] = useState(() => {
        const from = onlineDefault !== cashId ? onlineDefault : cashId;
        return from === cashId
            ? onlineDefault !== cashId
                ? onlineDefault
                : (pots.find((account) => account.id !== from)?.id ?? cashId)
            : cashId;
    });
    const [note, setNote] = useState("");
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [busy, setBusy] = useState(false);

    const fromName =
        pots.find((account) => account.id === fromAccountId)?.name ?? "Account";

    const available = useMemo(
        () =>
            getAvailableToTransfer(
                fromAccountId,
                date,
                income,
                expenses,
                billPayments,
                debtPayments,
                savingsContributions,
                transfers,
                adjustments
            ),
        [
            fromAccountId,
            date,
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments,
        ]
    );

    const amountNumber = parseMoneyInput(amount);
    const amountError = showErrors ? moneyFieldError(amount) : null;
    const dateHasError = showErrors && parseIsoDate(date) === null;
    const samePotError =
        showErrors && fromAccountId === toAccountId
            ? "Pick two different accounts."
            : null;
    const fundsError =
        showErrors &&
        amountNumber !== null &&
        amountNumber > 0 &&
        fromAccountId !== toAccountId &&
        amountNumber > available
            ? available <= 0
                ? `${fromName} has nothing available to transfer on this date.`
                : `Only ${formatMoney(available)} available in ${fromName}.`
            : null;

    const styles = useMemo(
        () =>
            StyleSheet.create({
                content: {
                    paddingHorizontal: theme.space.screenX,
                    paddingBottom: theme.space.xl,
                },
                backRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    alignSelf: "flex-start",
                    gap: theme.space.xs,
                    minHeight: theme.size.tap,
                    marginLeft: -theme.space.xs,
                    marginBottom: theme.space.sm,
                },
                backLabel: {
                    color: theme.text.accent,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                pageTitle: {
                    ...text.display,
                    marginBottom: theme.space.xs,
                    marginLeft: theme.space.xs,
                },
                subtitle: {
                    ...text.caption,
                    marginBottom: theme.space.lg,
                    marginLeft: theme.space.xs,
                },
                save: {
                    marginTop: theme.space.md,
                    minHeight: theme.size.tap,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.action.primary.bg,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: theme.space.md,
                },
                saveText: {
                    color: theme.action.primary.fg,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.bold,
                },
                pressed: {
                    opacity: 0.85,
                },
            }),
        [theme]
    );

    const handleFromChange = (next: string) => {
        setFromAccountId(next);
        if (next === toAccountId) {
            const other =
                pots.find((account) => account.id !== next)?.id ?? cashId;
            setToAccountId(other);
        }
    };

    const handleToChange = (next: string) => {
        setToAccountId(next);
        if (next === fromAccountId) {
            const other =
                pots.find((account) => account.id !== next)?.id ?? cashId;
            setFromAccountId(other);
        }
    };

    const handleSave = async () => {
        const parsed = parseMoneyInput(amount);
        if (
            parsed === null ||
            parseIsoDate(date) === null ||
            fromAccountId === toAccountId ||
            parsed > available
        ) {
            setShowErrors(true);
            return;
        }

        setBusy(true);
        try {
            await addTransfer({
                amount: parsed,
                date: date.trim(),
                fromAccountId,
                toAccountId,
                note: note.trim() || undefined,
            });
            hapticConfirm();
            goBackOrReplace("/(tabs)");
        } catch (error) {
            Alert.alert(
                "Transfer failed",
                error instanceof Error ? error.message : "Something went wrong."
            );
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                    styles.content,
                    { paddingTop: topPadding },
                ]}
            >
                <Pressable
                    onPress={() => goBackOrReplace("/(tabs)")}
                    style={({ pressed }) => [
                        styles.backRow,
                        pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                >
                    <Ionicons
                        name="chevron-back"
                        size={22}
                        color={theme.text.accent}
                    />
                    <Text style={styles.backLabel}>Back</Text>
                </Pressable>

                <Text style={styles.pageTitle}>Transfer</Text>
                <Text style={styles.subtitle}>
                    Move money between Cash and Online. Total leftover stays the
                    same.
                </Text>

                <View style={form.field}>
                    <Text style={form.label}>Amount</Text>
                    <View
                        style={[
                            form.amountWrap,
                            focusedInput === "amount" && form.inputFocused,
                            (amountError || fundsError) && form.inputError,
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
                    {fundsError ? (
                        <Text style={form.error}>{fundsError}</Text>
                    ) : null}
                </View>

                <View style={form.field}>
                    <DateField
                        label="Date"
                        value={date}
                        onChange={setDate}
                        hasError={dateHasError}
                        errorMessage="Choose a valid date."
                    />
                </View>

                <View style={form.field}>
                    <Text style={form.label}>From</Text>
                    <AccountPicker
                        value={fromAccountId}
                        onChange={handleFromChange}
                        title="From"
                        excludeIds={[toAccountId]}
                    />
                    <Text style={form.helper}>
                        {available > 0
                            ? `${formatMoney(available)} available`
                            : "Nothing available on this date"}
                    </Text>
                </View>

                <View style={form.field}>
                    <Text style={form.label}>To</Text>
                    <AccountPicker
                        value={toAccountId}
                        onChange={handleToChange}
                        title="To"
                        excludeIds={[fromAccountId]}
                    />
                    {samePotError ? (
                        <Text style={form.error}>{samePotError}</Text>
                    ) : null}
                </View>

                <View style={form.field}>
                    <Text style={form.label}>Note (optional)</Text>
                    <TextInput
                        style={[
                            form.input,
                            focusedInput === "note" && form.inputFocused,
                        ]}
                        placeholder="ATM, deposit…"
                        placeholderTextColor={formColors.placeholder}
                        value={note}
                        onChangeText={setNote}
                        onFocus={() => setFocusedInput("note")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.save,
                        pressed && styles.pressed,
                        busy && { opacity: 0.6 },
                    ]}
                    disabled={busy}
                    onPress={() => {
                        void handleSave();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Save transfer"
                >
                    <Text style={styles.saveText}>Save transfer</Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}
