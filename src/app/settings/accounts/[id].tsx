import { useAccounts } from "@/app/contexts/AccountsContext";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { AccountAvatar } from "@/components/AccountAvatar";
import { DateField } from "@/components/DateField";
import { FormDialog } from "@/components/FormDialog";
import {
    SettingsDivider,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useFormColors, useFormStyles } from "@/styles/form";
import { CASH_ACCOUNT_ID } from "@/types/account";
import {
    getAccountBalanceThrough,
    getPotActivity,
    type PotActivityRow,
} from "@/utils/account-balances";
import {
    moneyFieldError,
    parseMoneyInput,
} from "@/utils/amount-input";
import { confirmDestructive } from "@/utils/confirm";
import { rangeThrough, todayIsoDate } from "@/utils/date";
import { hapticConfirm } from "@/utils/haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

function activityKindLabel(kind: PotActivityRow["kind"]): string {
    switch (kind) {
        case "income":
            return "Income";
        case "expense":
            return "Spending";
        case "bill":
            return "Bill";
        case "debt":
            return "Debt";
        case "savings":
            return "Savings";
        case "transfer-in":
            return "Transfer in";
        case "transfer-out":
            return "Transfer out";
        case "adjustment":
            return "Adjustment";
        default:
            return "Activity";
    }
}

export default function AccountDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const accountId = typeof id === "string" ? id : CASH_ACCOUNT_ID;
    const { theme } = useTheme();
    const form = useFormStyles();
    const formColors = useFormColors();
    const { formatMoney } = useLocale();
    const {
        accounts,
        transfers,
        adjustments,
        addAdjustment,
        deleteAdjustment,
        deleteTransfer,
        unarchiveOnlineAccount,
        archiveOnlineAccount,
        setPrimaryOnline,
    } = useAccounts();
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { payments: billPayments } = useBills();
    const { payments: debtPayments } = useDebt();
    const { contributions: savingsContributions } = useSavings();

    const account = accounts.find((item) => item.id === accountId);
    const balance = useMemo(
        () =>
            getAccountBalanceThrough(
                accountId,
                rangeThrough(new Date()),
                income,
                expenses,
                billPayments,
                debtPayments,
                savingsContributions,
                transfers,
                adjustments
            ),
        [
            accountId,
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments,
        ]
    );

    const activity = useMemo(
        () =>
            getPotActivity(
                accountId,
                income,
                expenses,
                billPayments,
                debtPayments,
                savingsContributions,
                transfers,
                adjustments
            ),
        [
            accountId,
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments,
        ]
    );

    const [adjustOpen, setAdjustOpen] = useState(false);
    const [targetDraft, setTargetDraft] = useState("");
    const [noteDraft, setNoteDraft] = useState("");
    const [dateDraft, setDateDraft] = useState(todayIsoDate());
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);
    const [busy, setBusy] = useState(false);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                hero: {
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.space.md,
                    paddingVertical: theme.space.md,
                    paddingHorizontal: theme.space.md,
                    marginBottom: theme.space.sm,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.bg.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border.subtle,
                },
                heroCopy: {
                    flex: 1,
                    minWidth: 0,
                },
                heroName: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.lg,
                    lineHeight: theme.lineHeight.lg,
                    fontWeight: theme.fontWeight.bold,
                },
                heroMeta: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.xs,
                    marginTop: 2,
                },
                heroBalance: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.xl,
                    lineHeight: theme.lineHeight.xl,
                    fontWeight: theme.fontWeight.bold,
                    fontVariant: ["tabular-nums"],
                },
                balanceNegative: {
                    color: theme.intent.negative.fg,
                },
                actions: {
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: theme.space.sm,
                    marginBottom: theme.space.md,
                },
                actionChip: {
                    minHeight: 40,
                    paddingHorizontal: theme.space.md,
                    borderRadius: theme.radius.sm,
                    backgroundColor: theme.bg.sunken,
                    alignItems: "center",
                    justifyContent: "center",
                },
                actionChipPrimary: {
                    backgroundColor: theme.action.primary.bg,
                },
                actionLabel: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                },
                actionLabelPrimary: {
                    color: theme.text.inverse,
                },
                row: {
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.sm,
                    minHeight: 52,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: theme.space.sm,
                },
                copy: {
                    flex: 1,
                    minWidth: 0,
                },
                title: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                subtitle: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.xs,
                    marginTop: 2,
                },
                amount: {
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                    fontVariant: ["tabular-nums"],
                },
                amountIn: {
                    color: theme.intent.positive.fg,
                },
                amountOut: {
                    color: theme.intent.negative.fg,
                },
                empty: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.sm,
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.md,
                },
                missing: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.md,
                    padding: theme.space.md,
                },
            }),
        [theme]
    );

    if (!account) {
        return (
            <SettingsSubpage title="Account">
                <Text style={styles.missing}>This pot was not found.</Text>
                <Pressable
                    onPress={() => router.back()}
                    accessibilityRole="button"
                >
                    <Text style={styles.actionLabel}>Back to Wallet</Text>
                </Pressable>
            </SettingsSubpage>
        );
    }

    const openAdjust = () => {
        setTargetDraft(String(Math.max(0, Math.round(balance * 100) / 100)));
        setNoteDraft("");
        setDateDraft(todayIsoDate());
        setShowErrors(false);
        setAdjustOpen(true);
    };

    const saveAdjust = async () => {
        const target = parseMoneyInput(targetDraft, { allowZero: true });
        if (target === null) {
            setShowErrors(true);
            return;
        }
        const delta =
            Math.round((target - balance) * 100) / 100;
        if (delta === 0) {
            setAdjustOpen(false);
            return;
        }
        setBusy(true);
        try {
            await addAdjustment({
                accountId,
                date: dateDraft,
                delta,
                note: noteDraft.trim() || "Set balance",
            });
            hapticConfirm();
            setAdjustOpen(false);
        } finally {
            setBusy(false);
        }
    };

    const onActivityPress = (row: PotActivityRow) => {
        if (row.kind === "adjustment") {
            const adjId = row.id.replace(/^adj-/, "");
            confirmDestructive(
                "Remove adjustment?",
                "This undoes the balance change.",
                () => {
                    void deleteAdjustment(adjId).then(() => hapticConfirm());
                },
                "Remove"
            );
            return;
        }
        if (row.kind === "transfer-in" || row.kind === "transfer-out") {
            const transferId = row.id.replace(/^xfer-(in|out)-/, "");
            confirmDestructive(
                "Undo transfer?",
                "Removes this move between pots.",
                () => {
                    void deleteTransfer(transferId).then(() => hapticConfirm());
                },
                "Undo"
            );
        }
    };

    const onlineActive =
        account.kind === "online" && account.archived !== true;
    const canArchive =
        onlineActive &&
        accounts.filter(
            (item) => item.kind === "online" && item.archived !== true
        ).length > 1;

    return (
        <SettingsSubpage title={account.name}>
            <View style={styles.hero}>
                <AccountAvatar name={account.name} color={account.color} />
                <View style={styles.heroCopy}>
                    <Text style={styles.heroName} numberOfLines={1}>
                        {account.name}
                    </Text>
                    <Text style={styles.heroMeta}>
                        {account.kind === "cash"
                            ? "Physical money"
                            : account.archived
                              ? "Archived Online"
                              : account.isPrimary
                                ? "Primary Online"
                                : "Online pot"}
                    </Text>
                </View>
                <Text
                    style={[
                        styles.heroBalance,
                        balance < 0 && styles.balanceNegative,
                    ]}
                >
                    {formatMoney(balance, { compact: true })}
                </Text>
            </View>

            <View style={styles.actions}>
                <Pressable
                    style={[styles.actionChip, styles.actionChipPrimary]}
                    onPress={openAdjust}
                    accessibilityRole="button"
                    accessibilityLabel="Adjust balance"
                >
                    <Text
                        style={[styles.actionLabel, styles.actionLabelPrimary]}
                    >
                        Adjust
                    </Text>
                </Pressable>
                {account.kind === "online" && account.archived ? (
                    <Pressable
                        style={styles.actionChip}
                        onPress={() => {
                            void unarchiveOnlineAccount(account.id);
                        }}
                        accessibilityRole="button"
                    >
                        <Text style={styles.actionLabel}>Unarchive</Text>
                    </Pressable>
                ) : null}
                {onlineActive && !account.isPrimary ? (
                    <Pressable
                        style={styles.actionChip}
                        onPress={() => {
                            void setPrimaryOnline(account.id);
                        }}
                        accessibilityRole="button"
                    >
                        <Text style={styles.actionLabel}>Set primary</Text>
                    </Pressable>
                ) : null}
                {canArchive ? (
                    <Pressable
                        style={styles.actionChip}
                        onPress={() => {
                            confirmDestructive(
                                `Archive ${account.name}?`,
                                "It leaves pickers, but history stays.",
                                () => {
                                    void archiveOnlineAccount(account.id).then(
                                        () => router.back()
                                    );
                                },
                                "Archive"
                            );
                        }}
                        accessibilityRole="button"
                    >
                        <Text style={styles.actionLabel}>Archive</Text>
                    </Pressable>
                ) : null}
            </View>

            <SettingsSection title="Activity">
                {activity.length === 0 ? (
                    <Text style={styles.empty}>
                        No tagged activity on this pot yet.
                    </Text>
                ) : (
                    activity.map((row, index) => (
                        <View key={row.id}>
                            {index > 0 ? <SettingsDivider /> : null}
                            <Pressable
                                style={styles.row}
                                onPress={() => onActivityPress(row)}
                                disabled={
                                    row.kind !== "adjustment" &&
                                    row.kind !== "transfer-in" &&
                                    row.kind !== "transfer-out"
                                }
                                accessibilityRole={
                                    row.kind === "adjustment" ||
                                    row.kind === "transfer-in" ||
                                    row.kind === "transfer-out"
                                        ? "button"
                                        : undefined
                                }
                            >
                                <View style={styles.copy}>
                                    <Text style={styles.title} numberOfLines={1}>
                                        {row.title}
                                    </Text>
                                    <Text style={styles.subtitle}>
                                        {row.date} · {activityKindLabel(row.kind)}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.amount,
                                        row.amount >= 0
                                            ? styles.amountIn
                                            : styles.amountOut,
                                    ]}
                                >
                                    {formatMoney(row.amount, { compact: true })}
                                </Text>
                            </Pressable>
                        </View>
                    ))
                )}
            </SettingsSection>

            <FormDialog
                visible={adjustOpen}
                onClose={() => setAdjustOpen(false)}
                kicker="Balance"
                title={`Adjust ${account.name}`}
                saveLabel="Set balance"
                onSave={() => {
                    if (!busy) {
                        void saveAdjust();
                    }
                }}
            >
                <View style={form.field}>
                    <Text style={form.label}>New balance</Text>
                    <View
                        style={[
                            form.amountWrap,
                            focusedInput === "target" && form.inputFocused,
                            showErrors &&
                                moneyFieldError(targetDraft, {
                                    allowZero: true,
                                }) &&
                                form.inputError,
                        ]}
                    >
                        <TextInput
                            style={form.amountInput}
                            placeholder="0.00"
                            placeholderTextColor={formColors.placeholder}
                            value={targetDraft}
                            onChangeText={setTargetDraft}
                            keyboardType="decimal-pad"
                            onFocus={() => setFocusedInput("target")}
                            onBlur={() => setFocusedInput(null)}
                        />
                    </View>
                    {showErrors &&
                    moneyFieldError(targetDraft, { allowZero: true }) ? (
                        <Text style={form.error}>
                            {moneyFieldError(targetDraft, { allowZero: true })}
                        </Text>
                    ) : (
                        <Text style={form.helper}>
                            Current {formatMoney(balance)}. Saves a ledger
                            adjustment (not a silent overwrite).
                        </Text>
                    )}
                </View>
                <View style={form.field}>
                    <DateField
                        label="Date"
                        value={dateDraft}
                        onChange={setDateDraft}
                    />
                </View>
                <View style={form.field}>
                    <Text style={form.label}>Note (optional)</Text>
                    <TextInput
                        style={[
                            form.input,
                            focusedInput === "note" && form.inputFocused,
                        ]}
                        placeholder="Opening balance, ATM count…"
                        placeholderTextColor={formColors.placeholder}
                        value={noteDraft}
                        onChangeText={setNoteDraft}
                        onFocus={() => setFocusedInput("note")}
                        onBlur={() => setFocusedInput(null)}
                    />
                </View>
            </FormDialog>
        </SettingsSubpage>
    );
}
