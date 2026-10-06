import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { AddPlansChooser } from "@/components/AddPlansChooser";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { TabScaffold } from "@/components/ui";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { text, type Theme } from "@/design";
import { isDebtFullyPaidOff, isDebtNotStartedAsOf } from "@/utils/filters";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import { useMemo, useState, type ComponentProps } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

type HubTile = {
    id: "bills" | "savings" | "debts";
    title: string;
    value: string;
    caption: string;
    icon: ComponentProps<typeof Ionicons>["name"];
    href: "/(tabs)/bills" | "/(tabs)/savings" | "/(tabs)/debts";
};

export default function PlansScreen() {
    useStatusBarStyle("dark");
    const { theme } = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const { formatMoney } = useLocale();
    const { bills, loading: billsLoading } = useBills();
    const { savings, loading: savingsLoading } = useSavings();
    const { debts, loading: debtsLoading } = useDebt();
    const [chooserOpen, setChooserOpen] = useState(false);
    const today = useMemo(() => new Date(), []);

    const billsRecurring = bills.reduce(
        (sum, bill) => sum + (bill.amountVaries ? 0 : bill.amount),
        0
    );
    const savingsSaved = savings.reduce(
        (sum, goal) => sum + goal.currentAmount,
        0
    );
    const activeDebts = debts.filter(
        (debt) =>
            !isDebtFullyPaidOff(debt) && !isDebtNotStartedAsOf(debt, today)
    );
    const debtRemaining = activeDebts.reduce(
        (sum, debt) => sum + Math.max(debt.balance, 0),
        0
    );

    const tiles: HubTile[] = [
        {
            id: "bills",
            title: "Bills",
            value:
                bills.length === 0
                    ? "—"
                    : formatMoney(billsRecurring, { compact: true }),
            caption:
                bills.length === 0
                    ? "Add rent or utilities"
                    : `${bills.length} bill${bills.length === 1 ? "" : "s"} · / month`,
            icon: "receipt-outline",
            href: "/(tabs)/bills",
        },
        {
            id: "savings",
            title: "Savings",
            value:
                savings.length === 0
                    ? "—"
                    : formatMoney(savingsSaved, { compact: true }),
            caption:
                savings.length === 0
                    ? "Start a goal"
                    : `${savings.length} goal${savings.length === 1 ? "" : "s"} · saved`,
            icon: "flag-outline",
            href: "/(tabs)/savings",
        },
        {
            id: "debts",
            title: "Debts",
            value:
                debts.length === 0
                    ? "—"
                    : formatMoney(debtRemaining, { compact: true }),
            caption:
                debts.length === 0
                    ? "Track a loan or plan"
                    : activeDebts.length === 0
                      ? "No active balances"
                      : `${activeDebts.length} active · remaining`,
            icon: "card-outline",
            href: "/(tabs)/debts",
        },
    ];

    const loading = billsLoading || savingsLoading || debtsLoading;

    return (
        <TabScaffold
            title="Plans"
            subtitle="Bills, goals, and installment plans"
        >
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.tileList}>
                    {tiles.map((tile, index) => (
                        <Pressable
                            key={tile.id}
                            onPress={() => router.push(tile.href)}
                            accessibilityRole="button"
                            accessibilityLabel={`${tile.title}, ${tile.value}, ${tile.caption}`}
                            style={({ pressed }) => [
                                styles.tile,
                                index === tiles.length - 1 && styles.tileLast,
                                pressed && styles.tilePressed,
                            ]}
                        >
                            <View style={styles.tileIcon}>
                                <Ionicons
                                    name={tile.icon}
                                    size={22}
                                    color={theme.text.accent}
                                />
                            </View>
                            <View style={styles.tileCopy}>
                                <Text style={styles.tileTitle}>
                                    {tile.title}
                                </Text>
                                <Text style={styles.tileCaption}>
                                    {tile.caption}
                                </Text>
                            </View>
                            <Text style={styles.tileValue} numberOfLines={1}>
                                {tile.value}
                            </Text>
                            <Ionicons
                                name="chevron-forward"
                                size={18}
                                color={theme.text.tertiary}
                            />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            {!loading ? (
                <FloatingAddButton
                    onPress={() => setChooserOpen(true)}
                    accessibilityLabel="Add plan"
                />
            ) : null}

            <AddPlansChooser
                visible={chooserOpen}
                onClose={() => setChooserOpen(false)}
                onPickBill={() =>
                    router.push({
                        pathname: "/(tabs)/bills",
                        params: { add: "1" },
                    })
                }
                onPickSavings={() =>
                    router.push({
                        pathname: "/(tabs)/savings",
                        params: { add: "1" },
                    })
                }
                onPickDebt={() =>
                    router.push({
                        pathname: "/(tabs)/debts",
                        params: { add: "1" },
                    })
                }
            />
        </TabScaffold>
    );
}

function createStyles(theme: Theme) {
    return StyleSheet.create({
        content: {
            paddingHorizontal: theme.space.screenX,
            paddingTop: theme.space.md,
            paddingBottom: theme.space.xxl * 2,
            maxWidth: theme.size.readable,
            width: "100%",
            alignSelf: "center",
        },
        tileList: {
            backgroundColor: theme.bg.surface,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.border.subtle,
            overflow: "hidden",
        },
        tile: {
            flexDirection: "row",
            alignItems: "center",
            gap: theme.space.sm,
            minHeight: 72,
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.md,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: theme.border.subtle,
        },
        tileLast: {
            borderBottomWidth: 0,
        },
        tilePressed: {
            backgroundColor: theme.bg.sunken,
        },
        tileIcon: {
            width: theme.size.control,
            height: theme.size.control,
            borderRadius: theme.radius.pill,
            backgroundColor: theme.intent.info.bg,
            alignItems: "center",
            justifyContent: "center",
        },
        tileCopy: {
            flex: 1,
            minWidth: 0,
            gap: 2,
        },
        tileTitle: text.itemTitle,
        tileCaption: text.caption,
        tileValue: {
            ...text.money,
            fontSize: theme.fontSize.md,
            lineHeight: theme.lineHeight.md,
            flexShrink: 0,
        },
    });
}
