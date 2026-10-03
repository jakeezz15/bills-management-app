import { useAccounts } from "@/app/contexts/AccountsContext";
import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useExpenses } from "@/app/contexts/ExpensesContext";
import { useIncome } from "@/app/contexts/IncomeContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { AccountAvatar } from "@/components/AccountAvatar";
import { FormDialog } from "@/components/FormDialog";
import {
    SettingsDivider,
    SettingsSection,
} from "@/components/SettingsList";
import { SettingsSubpage } from "@/components/SettingsSubpage";
import { useFormColors, useFormStyles } from "@/styles/form";
import { CASH_ACCOUNT_ID, CashAccount } from "@/types/account";
import { Transfer } from "@/types/transfer";
import { getAccountSplitThrough } from "@/utils/account-balances";
import { onlineAccounts } from "@/utils/accounts";
import { confirmDestructive } from "@/utils/confirm";
import { rangeThrough } from "@/utils/date";
import { hapticConfirm } from "@/utils/haptics";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

type NameEditor =
    | { mode: "add" }
    | { mode: "rename"; account: CashAccount }
    | null;

export default function SettingsAccountsScreen() {
    const { theme } = useTheme();
    const form = useFormStyles();
    const formColors = useFormColors();
    const { formatMoney } = useLocale();
    const {
        cashAccount,
        accounts,
        transfers,
        adjustments,
        addOnlineAccount,
        renameAccount,
        setPrimaryOnline,
        archiveOnlineAccount,
        unarchiveOnlineAccount,
        deleteTransfer,
    } = useAccounts();
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { payments: billPayments } = useBills();
    const { payments: debtPayments } = useDebt();
    const { contributions: savingsContributions } = useSavings();

    const online = useMemo(() => onlineAccounts(accounts), [accounts]);
    const archivedOnline = useMemo(
        () =>
            accounts.filter(
                (account) => account.kind === "online" && account.archived === true
            ),
        [accounts]
    );
    const canArchive = online.length > 1;

    const split = useMemo(
        () =>
            getAccountSplitThrough(
                rangeThrough(new Date()),
                accounts,
                income,
                expenses,
                billPayments,
                debtPayments,
                savingsContributions,
                transfers,
                adjustments
            ),
        [
            accounts,
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
            adjustments,
        ]
    );

    const balanceById = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of split.byAccount) {
            map.set(row.accountId, row.balance);
        }
        return map;
    }, [split.byAccount]);

    const accountNameById = useMemo(() => {
        const map = new Map<string, string>();
        for (const account of accounts) {
            map.set(account.id, account.name);
        }
        return map;
    }, [accounts]);

    const recentTransfers = useMemo(() => {
        return [...transfers].sort((a, b) => {
            if (a.date !== b.date) {
                return a.date < b.date ? 1 : -1;
            }
            return a.id < b.id ? 1 : -1;
        });
    }, [transfers]);

    const [editor, setEditor] = useState<NameEditor>(null);
    const [nameDraft, setNameDraft] = useState("");
    const [nameFocused, setNameFocused] = useState(false);
    const [showNameError, setShowNameError] = useState(false);
    const [busy, setBusy] = useState(false);

    const styles = useMemo(
        () =>
            StyleSheet.create({
                row: {
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: 56,
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.sm,
                    gap: theme.space.md,
                },
                rowPressed: {
                    backgroundColor: theme.bg.sunken,
                },
                copy: {
                    flex: 1,
                    minWidth: 0,
                },
                title: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.md,
                    lineHeight: theme.lineHeight.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                subtitle: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.xs,
                    lineHeight: theme.lineHeight.xs,
                    marginTop: 2,
                },
                balance: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.md,
                    lineHeight: theme.lineHeight.md,
                    fontWeight: theme.fontWeight.semibold,
                    fontVariant: ["tabular-nums"],
                },
                balanceNegative: {
                    color: theme.intent.negative.fg,
                },
                addRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 48,
                    paddingHorizontal: theme.space.md,
                    gap: theme.space.sm,
                },
                addLabel: {
                    color: theme.text.accent,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                totalCard: {
                    marginTop: theme.space.md,
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.md,
                    borderRadius: theme.radius.md,
                    backgroundColor: theme.bg.surface,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border.subtle,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: theme.space.md,
                },
                totalLabel: {
                    color: theme.text.secondary,
                    fontSize: theme.fontSize.md,
                    fontWeight: theme.fontWeight.semibold,
                },
                totalValue: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.lg,
                    lineHeight: theme.lineHeight.lg,
                    fontWeight: theme.fontWeight.bold,
                    fontVariant: ["tabular-nums"],
                },
                hint: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.xs,
                    lineHeight: theme.lineHeight.xs,
                    marginTop: theme.space.sm,
                    marginHorizontal: theme.space.md,
                },
                transferRow: {
                    flexDirection: "row",
                    alignItems: "center",
                    minHeight: theme.size.tap,
                    paddingHorizontal: theme.space.md,
                    paddingVertical: theme.space.sm,
                    gap: theme.space.sm,
                },
                undo: {
                    minHeight: theme.size.tap,
                    minWidth: theme.size.tap,
                    paddingHorizontal: theme.space.sm,
                    alignItems: "center",
                    justifyContent: "center",
                },
                undoLabel: {
                    color: theme.intent.negative.fg,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                },
            }),
        [theme]
    );

    const openAdd = () => {
        setNameDraft("");
        setShowNameError(false);
        setEditor({ mode: "add" });
    };

    const openRename = (account: CashAccount) => {
        setNameDraft(account.name);
        setShowNameError(false);
        setEditor({ mode: "rename", account });
    };

    const closeEditor = () => {
        setEditor(null);
        setNameDraft("");
        setShowNameError(false);
        setNameFocused(false);
    };

    const saveEditor = async () => {
        const trimmed = nameDraft.trim();
        if (!trimmed) {
            setShowNameError(true);
            return;
        }
        setBusy(true);
        try {
            if (editor?.mode === "add") {
                await addOnlineAccount(trimmed);
            } else if (editor?.mode === "rename") {
                await renameAccount(editor.account.id, trimmed);
            }
            closeEditor();
        } finally {
            setBusy(false);
        }
    };

    const openPot = (accountId: string) => {
        router.push(`/settings/accounts/${accountId}`);
    };

    const openOnlineActions = (account: CashAccount) => {
        const buttons: {
            text: string;
            style?: "cancel" | "destructive" | "default";
            onPress?: () => void;
        }[] = [
            {
                text: "Open",
                onPress: () => openPot(account.id),
            },
            {
                text: "Rename",
                onPress: () => openRename(account),
            },
        ];

        if (!account.isPrimary) {
            buttons.push({
                text: "Set as primary",
                onPress: () => {
                    void setPrimaryOnline(account.id);
                },
            });
        }

        if (canArchive) {
            buttons.push({
                text: "Archive",
                style: "destructive",
                onPress: () => {
                    confirmDestructive(
                        `Archive ${account.name}?`,
                        "It leaves pickers, but history stays on the device. You need at least one Online pot.",
                        () => {
                            void archiveOnlineAccount(account.id);
                        },
                        "Archive"
                    );
                },
            });
        }

        buttons.push({ text: "Cancel", style: "cancel" });

        Alert.alert(
            account.name,
            account.isPrimary
                ? "Primary Online — used for new income and bill defaults."
                : "Online pot — labels only, no bank login.",
            buttons
        );
    };

    const openArchivedActions = (account: CashAccount) => {
        Alert.alert(account.name, "Archived — restore to use in pickers again.", [
            {
                text: "Unarchive",
                onPress: () => {
                    void unarchiveOnlineAccount(account.id);
                },
            },
            {
                text: "Open",
                onPress: () => openPot(account.id),
            },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    const undoTransfer = (transfer: Transfer) => {
        const fromName =
            accountNameById.get(transfer.fromAccountId) ?? "Account";
        const toName = accountNameById.get(transfer.toAccountId) ?? "Account";
        confirmDestructive(
            "Undo transfer?",
            `Removes ${formatMoney(transfer.amount, { compact: true })} from ${fromName} → ${toName}.`,
            () => {
                void (async () => {
                    await deleteTransfer(transfer.id);
                    hapticConfirm();
                })();
            },
            "Undo"
        );
    };

    const formatBalance = (amount: number) =>
        formatMoney(amount, { compact: true });

    return (
        <SettingsSubpage title="Wallet Accounts">
            <SettingsSection title="Cash">
                <Pressable
                    style={({ pressed }) => [
                        styles.row,
                        pressed && styles.rowPressed,
                    ]}
                    onPress={() => openPot(CASH_ACCOUNT_ID)}
                    onLongPress={() => openRename(cashAccount)}
                    accessibilityRole="button"
                    accessibilityLabel={`${cashAccount.name}, ${formatBalance(split.cash)}`}
                >
                    <AccountAvatar
                        name={cashAccount.name}
                        color={cashAccount.color}
                    />
                    <View style={styles.copy}>
                        <Text style={styles.title} numberOfLines={1}>
                            {cashAccount.name}
                        </Text>
                        <Text style={styles.subtitle}>Physical money</Text>
                    </View>
                    <Text
                        style={[
                            styles.balance,
                            split.cash < 0 && styles.balanceNegative,
                        ]}
                    >
                        {formatBalance(split.cash)}
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={theme.text.tertiary}
                    />
                </Pressable>
            </SettingsSection>

            <SettingsSection title="Online">
                {online.map((account, index) => {
                    const balance = balanceById.get(account.id) ?? 0;
                    return (
                        <View key={account.id}>
                            {index > 0 ? <SettingsDivider /> : null}
                            <Pressable
                                style={({ pressed }) => [
                                    styles.row,
                                    pressed && styles.rowPressed,
                                ]}
                                onPress={() => openPot(account.id)}
                                onLongPress={() => openOnlineActions(account)}
                                accessibilityRole="button"
                                accessibilityLabel={`${account.name}, ${formatBalance(balance)}${account.isPrimary ? ", primary" : ""}`}
                            >
                                <AccountAvatar
                                    name={account.name}
                                    color={account.color}
                                />
                                <View style={styles.copy}>
                                    <Text style={styles.title} numberOfLines={1}>
                                        {account.name}
                                    </Text>
                                    {account.isPrimary ? (
                                        <Text style={styles.subtitle}>
                                            Primary
                                        </Text>
                                    ) : null}
                                </View>
                                <Text
                                    style={[
                                        styles.balance,
                                        balance < 0 && styles.balanceNegative,
                                    ]}
                                >
                                    {formatBalance(balance)}
                                </Text>
                                <Ionicons
                                    name="chevron-forward"
                                    size={18}
                                    color={theme.text.tertiary}
                                />
                            </Pressable>
                        </View>
                    );
                })}
                <SettingsDivider />
                <Pressable
                    style={({ pressed }) => [
                        styles.addRow,
                        pressed && styles.rowPressed,
                    ]}
                    onPress={openAdd}
                    accessibilityRole="button"
                    accessibilityLabel="Add Online account"
                >
                    <Text style={styles.addLabel}>+ Add Online account</Text>
                </Pressable>
            </SettingsSection>

            {archivedOnline.length > 0 ? (
                <SettingsSection title="Archived">
                    {archivedOnline.map((account, index) => {
                        const balance = balanceById.get(account.id) ?? 0;
                        return (
                            <View key={account.id}>
                                {index > 0 ? <SettingsDivider /> : null}
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.row,
                                        pressed && styles.rowPressed,
                                    ]}
                                    onPress={() => openArchivedActions(account)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${account.name}, archived, ${formatBalance(balance)}`}
                                >
                                    <AccountAvatar
                                        name={account.name}
                                        color={account.color}
                                    />
                                    <View style={styles.copy}>
                                        <Text
                                            style={styles.title}
                                            numberOfLines={1}
                                        >
                                            {account.name}
                                        </Text>
                                        <Text style={styles.subtitle}>
                                            Archived
                                        </Text>
                                    </View>
                                    <Text
                                        style={[
                                            styles.balance,
                                            balance < 0 &&
                                                styles.balanceNegative,
                                        ]}
                                    >
                                        {formatBalance(balance)}
                                    </Text>
                                </Pressable>
                            </View>
                        );
                    })}
                </SettingsSection>
            ) : null}

            {recentTransfers.length > 0 ? (
                <SettingsSection title="Transfers">
                    {recentTransfers.map((transfer, index) => {
                        const fromName =
                            accountNameById.get(transfer.fromAccountId) ??
                            "Account";
                        const toName =
                            accountNameById.get(transfer.toAccountId) ??
                            "Account";
                        return (
                            <View key={transfer.id}>
                                {index > 0 ? <SettingsDivider /> : null}
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.transferRow,
                                        pressed && styles.rowPressed,
                                    ]}
                                    onPress={() => undoTransfer(transfer)}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Undo transfer ${fromName} to ${toName}`}
                                >
                                    <View style={styles.copy}>
                                        <Text
                                            style={styles.title}
                                            numberOfLines={1}
                                        >
                                            {fromName} → {toName}
                                        </Text>
                                        <Text style={styles.subtitle}>
                                            {transfer.date}
                                            {transfer.note
                                                ? ` · ${transfer.note}`
                                                : ""}
                                        </Text>
                                    </View>
                                    <Text style={styles.balance}>
                                        {formatBalance(transfer.amount)}
                                    </Text>
                                    <View style={styles.undo}>
                                        <Text style={styles.undoLabel}>
                                            Undo
                                        </Text>
                                    </View>
                                </Pressable>
                            </View>
                        );
                    })}
                </SettingsSection>
            ) : null}

            <View
                style={styles.totalCard}
                accessibilityRole="summary"
                accessibilityLabel={`Total leftover ${formatBalance(split.total)}`}
            >
                <Text style={styles.totalLabel}>Total leftover</Text>
                <Text
                    style={[
                        styles.totalValue,
                        split.total < 0 && styles.balanceNegative,
                    ]}
                >
                    {formatBalance(split.total)}
                </Text>
            </View>

            <Text style={styles.hint}>
                Tap a pot for balance, adjust, and activity. Long-press for
                rename, primary, or archive.
            </Text>

            <FormDialog
                visible={editor !== null}
                onClose={closeEditor}
                kicker="Accounts"
                title={
                    editor?.mode === "rename"
                        ? "Rename account"
                        : "New Online account"
                }
                saveLabel={editor?.mode === "rename" ? "Save name" : "Add"}
                onSave={() => {
                    if (!busy) {
                        void saveEditor();
                    }
                }}
            >
                <View style={form.field}>
                    <Text style={form.label}>Name</Text>
                    <TextInput
                        style={[
                            form.input,
                            nameFocused && form.inputFocused,
                            showNameError && form.inputError,
                        ]}
                        placeholder="GCash, BDO, PayMaya…"
                        placeholderTextColor={formColors.placeholder}
                        value={nameDraft}
                        onChangeText={setNameDraft}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        autoFocus
                        autoCapitalize="words"
                    />
                    {showNameError ? (
                        <Text style={form.error}>Name is required.</Text>
                    ) : (
                        <Text style={form.helper}>
                            First letter becomes the avatar.
                        </Text>
                    )}
                </View>
            </FormDialog>
        </SettingsSubpage>
    );
}
