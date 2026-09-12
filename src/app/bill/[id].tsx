import { useBills } from "@/app/contexts/BillsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DashboardHero } from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import BillForm from "@/components/BillForm";
import { DetailHeroNav } from "@/components/DetailHeroNav";
import {
    SettingsDivider,
    SettingsRow,
    SettingsSection,
} from "@/components/SettingsList";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { buttonStyle } from "@/styles/button-style";
import { dashboard } from "@/styles/dashboard";
import { form, formColors } from "@/styles/form";
import { text, theme } from "@/design";
import { confirmDestructive } from "@/utils/confirm";
import { parseMoneyInput } from "@/utils/amount-input";
import {
    formatDisplayDate,
    isSameCalendarMonth,
    ordinalDay,
    parseIsoDate,
    todayIsoDate,
} from "@/utils/date";
import {
    dueCatalogLabel,
    dueCatalogStatus,
    getBillTotalPaid,
    isBillPaidAsOf,
} from "@/utils/filters";
import { hapticConfirm, hapticUndo } from "@/utils/haptics";
import { currencySymbol } from "@/utils/money";
import { goBackOrReplace, paramFlag, paramId } from "@/utils/navigation";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function BillDetailScreen() {
    useStatusBarStyle("light");
    const topPadding = useScreenTopPadding();
    const navigation = useNavigation();
    const leavingFromReminder = useRef(false);
    const { id: rawId, fromReminder: rawFromReminder } = useLocalSearchParams<{
        id: string;
        fromReminder?: string;
    }>();
    const id = paramId(rawId);
    const fromReminder = paramFlag(rawFromReminder);

    const leaveFromReminder = () => {
        leavingFromReminder.current = true;
        goBackOrReplace("/(tabs)/plans", { fromReminder: true });
    };

    const { currency, formatMoney } = useLocale();
    const symbol = currencySymbol(currency);
    const {
        bills,
        payments,
        loading,
        toggleBillPaid,
        updateBill,
        removeBillPayment,
    } = useBills();
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [logAmount, setLogAmount] = useState("");
    const [logError, setLogError] = useState(false);
    const [focused, setFocused] = useState(false);
    const [logSeedKey, setLogSeedKey] = useState("");

    const bill = bills.find((item) => item.id === id);
    const today = useMemo(() => new Date(), []);
    const todayIso = todayIsoDate();

    const ledger = useMemo(() => {
        if (!id) {
            return [];
        }
        return payments
            .filter((payment) => payment.billId === id)
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
            );
    }, [id, payments]);

    const paidThisMonth = bill
        ? isBillPaidAsOf(bill, payments, today, { anyDayInMonth: true })
        : false;
    const monthPayment = ledger.find((payment) => {
        const paidOn = parseIsoDate(payment.date);
        return paidOn ? isSameCalendarMonth(paidOn, today) : false;
    });
    const totalPaid = id ? getBillTotalPaid(id, payments) : 0;

    const nextLogSeedKey = bill
        ? `${bill.id}:${monthPayment?.id ?? "none"}:${monthPayment?.amount ?? ""}:${bill.amount}:${bill.amountVaries === true}`
        : "";
    if (bill && nextLogSeedKey !== logSeedKey) {
        setLogSeedKey(nextLogSeedKey);
        if (monthPayment) {
            setLogAmount(String(monthPayment.amount));
        } else if (!bill.amountVaries) {
            setLogAmount(String(bill.amount));
        } else {
            setLogAmount("");
        }
    }

    useEffect(() => {
        if (loading || !id) {
            return;
        }
        if (bill) {
            return;
        }
        if (fromReminder) {
            leaveFromReminder();
            return;
        }
        goBackOrReplace("/(tabs)/plans");
    }, [loading, bill, id, fromReminder]);

    useEffect(() => {
        if (!fromReminder) {
            return;
        }
        const sub = navigation.addListener("beforeRemove", (event) => {
            if (leavingFromReminder.current) {
                return;
            }
            event.preventDefault();
            leaveFromReminder();
        });
        return sub;
    }, [navigation, fromReminder]);

    if (loading && !bill) {
        return (
            <View style={dashboard.screen}>
                <ScrollView
                    contentContainerStyle={[
                        dashboard.listContent,
                        { paddingTop: topPadding },
                    ]}
                >
                    <DashboardSkeleton />
                </ScrollView>
            </View>
        );
    }

    if (!bill) {
        return null;
    }

    const captionParts = [
        `Due the ${ordinalDay(bill.dueDay)}`,
        bill.amountVaries ? "Varies" : bill.category,
    ].filter(Boolean);
    const status = dueCatalogStatus(bill.dueDay, paidThisMonth, today);
    const heroCaption = [dueCatalogLabel(status), ...captionParts]
        .filter(Boolean)
        .join(" · ");
    const heroValue = paidThisMonth
        ? formatMoney(monthPayment?.amount ?? 0, { compact: true })
        : bill.amountVaries
          ? formatMoney(0, { compact: true })
          : formatMoney(bill.amount, { compact: true });
    const heroKicker = paidThisMonth
        ? "This month"
        : bill.amountVaries
          ? "This month"
          : "Typical";

    const handleLog = async () => {
        if (paidThisMonth || busy) {
            return;
        }
        if (bill.amountVaries) {
            const amount = parseMoneyInput(logAmount);
            if (amount === null) {
                setLogError(true);
                return;
            }
            setBusy(true);
            try {
                hapticConfirm();
                await toggleBillPaid(bill.id, todayIso, amount);
                setLogError(false);
            } finally {
                setBusy(false);
            }
            return;
        }
        setBusy(true);
        try {
            hapticConfirm();
            await toggleBillPaid(bill.id, todayIso);
            setLogError(false);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdateAmount = async () => {
        if (!paidThisMonth || busy) {
            return;
        }
        const amount = parseMoneyInput(logAmount);
        if (amount === null) {
            setLogError(true);
            return;
        }
        setBusy(true);
        try {
            hapticConfirm();
            await updateBill(
                bill.id,
                { isPaid: true },
                todayIso,
                amount
            );
            setLogError(false);
        } finally {
            setBusy(false);
        }
    };

    const handleUndoMonth = async () => {
        if (!paidThisMonth || busy) {
            return;
        }
        setBusy(true);
        try {
            hapticUndo();
            await toggleBillPaid(bill.id, todayIso);
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
                    dashboard.listContent,
                    { paddingTop: topPadding },
                ]}
            >
                <DashboardHero
                    title={bill.name}
                    kicker={heroKicker}
                    value={heroValue}
                    caption={heroCaption}
                    statusTone={status}
                    header={
                        <DetailHeroNav
                            backLabel="Bills"
                            fallbackHref="/(tabs)/plans"
                            onBack={fromReminder ? leaveFromReminder : undefined}
                            onEdit={() => setEditing(true)}
                            editAccessibilityLabel="Edit bill"
                        />
                    }
                />

                {paidThisMonth ? (
                    <View style={[form.actionCard, form.actionCardLead]}>
                        <Text style={form.actionCardTitle}>Paid this month</Text>
                        <Text style={form.actionCardCaption}>
                            Leftover uses this amount. Change it if the
                            statement is different, or undo.
                        </Text>
                        {bill.amountVaries ? (
                            <>
                                <View
                                    style={[
                                        form.amountWrap,
                                        focused && form.inputFocused,
                                        logError && form.inputError,
                                        { marginBottom: theme.space.md },
                                    ]}
                                >
                                    <Text style={form.amountPrefix}>
                                        {symbol}
                                    </Text>
                                    <TextInput
                                        style={form.amountInput}
                                        placeholder="0.00"
                                        placeholderTextColor={
                                            formColors.placeholder
                                        }
                                        value={logAmount}
                                        onChangeText={(value) => {
                                            setLogAmount(value);
                                            setLogError(false);
                                        }}
                                        keyboardType="decimal-pad"
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                    />
                                </View>
                                {logError ? (
                                    <Text style={form.error}>
                                        Enter a valid amount greater than zero.
                                    </Text>
                                ) : null}
                                <Pressable
                                    style={({ pressed }) => [
                                        form.actionCardButton,
                                        pressed && buttonStyle.buttonPressed,
                                        form.actionCardButtonSpacer,
                                        busy && { opacity: 0.6 },
                                    ]}
                                    disabled={busy}
                                    onPress={() => {
                                        void handleUpdateAmount();
                                    }}
                                    accessibilityRole="button"
                                    accessibilityLabel="Update this month’s amount"
                                >
                                    <Text style={buttonStyle.buttonText}>
                                        Update amount
                                    </Text>
                                </Pressable>
                            </>
                        ) : null}
                        <Pressable
                            style={({ pressed }) => [
                                form.actionCardButton,
                                pressed && buttonStyle.buttonPressed,
                                bill.amountVaries &&
                                    form.actionCardButtonMuted,
                                busy && { opacity: 0.6 },
                            ]}
                            disabled={busy}
                            onPress={() => {
                                void handleUndoMonth();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Undo this month"
                        >
                            <Text style={buttonStyle.buttonText}>
                                Undo this month
                            </Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={[form.actionCard, form.actionCardLead]}>
                        <Text style={form.actionCardTitle}>
                            Log this month
                        </Text>
                        <Text style={form.actionCardCaption}>
                            {bill.amountVaries
                                ? "Leftover ignores this bill until you log the statement."
                                : `Marks this month paid at ${formatMoney(bill.amount)}. You can log any day, not only when it is due.`}
                        </Text>
                        {bill.amountVaries ? (
                            <>
                                <View
                                    style={[
                                        form.amountWrap,
                                        focused && form.inputFocused,
                                        logError && form.inputError,
                                        { marginBottom: theme.space.md },
                                    ]}
                                >
                                    <Text style={form.amountPrefix}>
                                        {symbol}
                                    </Text>
                                    <TextInput
                                        style={form.amountInput}
                                        placeholder="0.00"
                                        placeholderTextColor={
                                            formColors.placeholder
                                        }
                                        value={logAmount}
                                        onChangeText={(value) => {
                                            setLogAmount(value);
                                            setLogError(false);
                                        }}
                                        keyboardType="decimal-pad"
                                        onFocus={() => setFocused(true)}
                                        onBlur={() => setFocused(false)}
                                    />
                                </View>
                                {logError ? (
                                    <Text style={form.error}>
                                        Enter a valid amount greater than zero.
                                    </Text>
                                ) : null}
                            </>
                        ) : null}
                        <Pressable
                            style={({ pressed }) => [
                                form.actionCardButton,
                                pressed && buttonStyle.buttonPressed,
                                busy && { opacity: 0.6 },
                            ]}
                            disabled={busy}
                            onPress={() => {
                                void handleLog();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={
                                bill.amountVaries
                                    ? "Log this month"
                                    : `Log ${formatMoney(bill.amount)}`
                            }
                        >
                            <Text style={buttonStyle.buttonText}>
                                {bill.amountVaries
                                    ? (() => {
                                          const preview =
                                              parseMoneyInput(logAmount);
                                          return preview !== null
                                              ? `Log ${formatMoney(preview)}`
                                              : "Log this month";
                                      })()
                                    : `Log ${formatMoney(bill.amount)}`}
                            </Text>
                        </Pressable>
                    </View>
                )}

                <Text style={styles.paidSoFar}>
                    {totalPaid > 0
                        ? `${formatMoney(totalPaid)} logged across months`
                        : "No payments yet"}
                </Text>

                {ledger.length > 0 ? (
                    <SettingsSection title="History">
                        {ledger.map((payment, index) => (
                            <Fragment key={payment.id}>
                                {index > 0 ? <SettingsDivider /> : null}
                                <SettingsRow
                                    title={formatDisplayDate(payment.date)}
                                    value={formatMoney(payment.amount)}
                                    onPress={() => {
                                        confirmDestructive(
                                            "Remove this payment?",
                                            "That month will show as unpaid.",
                                            () => {
                                                hapticUndo();
                                                void removeBillPayment(
                                                    payment.id
                                                );
                                            },
                                            "Remove"
                                        );
                                    }}
                                />
                            </Fragment>
                        ))}
                    </SettingsSection>
                ) : (
                    <Text style={styles.emptyLedger}>
                        Each month you log shows up here. Missed months stay
                        as a gap — bills are never paid off.
                    </Text>
                )}
            </ScrollView>

            <BillForm
                visible={editing}
                onClose={() => setEditing(false)}
                bill={bill}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    paidSoFar: {
        ...text.caption,
        marginBottom: theme.space.sm,
    },
    emptyLedger: {
        ...text.bodyMuted,
        marginTop: theme.space.sm,
    },
});
