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
import { CashAccount } from "@/types/account";
import { getAccountSplitThrough } from "@/utils/account-balances";
import { onlineAccounts } from "@/utils/accounts";
import { confirmDestructive } from "@/utils/confirm";
import { rangeThrough } from "@/utils/date";
import Ionicons from "@react-native-vector-icons/ionicons";
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
        addOnlineAccount,
        renameAccount,
        setPrimaryOnline,
        archiveOnlineAccount,
    } = useAccounts();
    const { income } = useIncome();
    const { expenses } = useExpenses();
    const { payments: billPayments } = useBills();
    const { payments: debtPayments } = useDebt();
    const { contributions: savingsContributions } = useSavings();

    const online = useMemo(() => onlineAccounts(accounts), [accounts]);
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
                transfers
            ),
        [
            accounts,
            income,
            expenses,
            billPayments,
            debtPayments,
            savingsContributions,
            transfers,
        ]
    );

    const balanceById = useMemo(() => {
        const map = new Map<string, number>();
        for (const row of split.byAccount) {
            map.set(row.accountId, row.balance);
        }
        return map;
    }, [split.byAccount]);

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

    const openOnlineActions = (account: CashAccount) => {
        setEditor({ mode: "rename", account })
        const buttons: {
            text: string;
            style?: "cancel" | "destructive" | "default";
            onPress?: () => void;
        }[] = [
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
                    onPress={() => openRename(cashAccount)}
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
                                onPress={() => openOnlineActions(account)}
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
                Balances as of today. Names and letter avatars only — no bank
                connection.
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
