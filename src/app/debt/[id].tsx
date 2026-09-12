import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { DashboardHero } from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import DebtForm from "@/components/DebtForm";
import { DetailHeroNav } from "@/components/DetailHeroNav";
import { SettingsDivider, SettingsRow, SettingsSection } from "@/components/SettingsList";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { buttonStyle } from "@/styles/button-style";
import { dashboard } from "@/styles/dashboard";
import { form } from "@/styles/form";
import { text, theme } from "@/design";
import { confirmDestructive } from "@/utils/confirm";
import {
    formatDisplayDate,
    ordinalDay,
    todayIsoDate,
} from "@/utils/date";
import {
    getDebtTotalPaid,
    isDebtFullyPaidOff,
    isDebtInstallmentPaidAsOf,
    isDebtNotStartedAsOf,
    dueCatalogLabel,
    dueCatalogStatus,
} from "@/utils/filters";
import { hapticConfirm, hapticUndo } from "@/utils/haptics";
import { goBackOrReplace, paramFlag, paramId } from "@/utils/navigation";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function DebtDetailScreen() {
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

    const { formatMoney } = useLocale();
    const {
        debts,
        payments,
        loading,
        recordPayment,
        undoPayment,
        undoPaymentById,
    } = useDebt();
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);

    const debt = debts.find((item) => item.id === id);
    const today = useMemo(() => new Date(), []);
    const todayIso = todayIsoDate();

    const ledger = useMemo(() => {
        if (!id) {
            return [];
        }
        return payments
            .filter((payment) => payment.debtId === id)
            .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
    }, [id, payments]);

    const paidThisMonth = debt
        ? isDebtInstallmentPaidAsOf(debt, today, payments)
        : false;
    const paidOff = debt ? isDebtFullyPaidOff(debt) : false;
    const notStarted = debt ? isDebtNotStartedAsOf(debt, today) : false;
    const totalPaid = id ? getDebtTotalPaid(id, payments) : 0;
    const remaining = Math.max(debt?.balance ?? 0, 0);
    const original = remaining + totalPaid;
    const percent =
        original > 0 ? Math.round((totalPaid / original) * 100) : paidOff ? 100 : 0;

    useEffect(() => {
        if (loading || !id) {
            return;
        }
        if (debt) {
            return;
        }
        if (fromReminder) {
            leaveFromReminder();
            return;
        }
        goBackOrReplace("/(tabs)/plans");
    }, [loading, debt, id, fromReminder]);

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

    if (loading && !debt) {
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

    if (!debt) {
        return null;
    }

    const captionParts = [
        `Due the ${ordinalDay(debt.dueDay)}`,
        debt.type,
    ].filter(Boolean);
    const status =
        paidOff || notStarted
            ? null
            : dueCatalogStatus(debt.dueDay, paidThisMonth, today);
    const heroCaption = paidOff
        ? debt.paidOffDate
            ? `Paid off ${formatDisplayDate(debt.paidOffDate)}`
            : "Paid off"
        : notStarted
          ? `Starts ${formatDisplayDate(debt.startDate)}`
          : [status ? dueCatalogLabel(status) : null, ...captionParts]
                .filter(Boolean)
                .join(" · ");
    const statusTone = paidOff ? "paid" : (status ?? undefined);

    const handleRecord = async () => {
        if (paidOff || paidThisMonth || busy) {
            return;
        }
        setBusy(true);
        try {
            hapticConfirm();
            await recordPayment(debt.id, undefined, todayIso);
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
            await undoPayment(debt.id, todayIso);
        } finally {
            setBusy(false);
        }
    };

    return (
        <View style={dashboard.screen}>
            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    { paddingTop: topPadding },
                ]}
            >
                <DashboardHero
                    title={debt.name}
                    kicker="Remaining"
                    value={formatMoney(remaining, { compact: true })}
                    caption={heroCaption}
                    percent={percent}
                    statusTone={statusTone}
                    header={
                        <DetailHeroNav
                            backLabel="Debts"
                            fallbackHref="/(tabs)/plans"
                            onBack={fromReminder ? leaveFromReminder : undefined}
                            onEdit={() => setEditing(true)}
                            editAccessibilityLabel="Edit debt"
                        />
                    }
                />

                {paidOff ? (
                    <View style={form.banner}>
                        <Text style={form.bannerText}>
                            This plan is paid off. History stays on the device.
                        </Text>
                    </View>
                ) : paidThisMonth ? (
                    <View style={[form.actionCard, form.actionCardLead]}>
                        <Text style={form.actionCardTitle}>Paid this month</Text>
                        <Text style={form.actionCardCaption}>
                            This month’s installment is on the ledger. Undo if
                            you marked it by mistake.
                        </Text>
                        <Pressable
                            style={({ pressed }) => [
                                form.actionCardButton,
                                pressed && buttonStyle.buttonPressed,
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
                            Record installment
                        </Text>
                        <Text style={form.actionCardCaption}>
                            Lowers remaining by{" "}
                            {formatMoney(debt.minimumPayment)}. You can log this
                            any day — not only when it is due.
                        </Text>
                        <Pressable
                            style={({ pressed }) => [
                                form.actionCardButton,
                                pressed && buttonStyle.buttonPressed,
                                busy && { opacity: 0.6 },
                            ]}
                            disabled={busy}
                            onPress={() => {
                                void handleRecord();
                            }}
                            accessibilityRole="button"
                            accessibilityLabel={`Record ${formatMoney(debt.minimumPayment)}`}
                        >
                            <Text style={buttonStyle.buttonText}>
                                Record {formatMoney(debt.minimumPayment)}
                            </Text>
                        </Pressable>
                    </View>
                )}

                <Text style={styles.paidSoFar}>
                    {totalPaid > 0
                        ? `${formatMoney(totalPaid)} paid so far`
                        : "No payments yet"}
                </Text>

                {ledger.length > 0 ? (
                    <SettingsSection title="Payments">
                        {ledger.map((payment, index) => (
                            <Fragment key={payment.id}>
                                {index > 0 ? <SettingsDivider /> : null}
                                <SettingsRow
                                    title={formatDisplayDate(payment.date)}
                                    value={formatMoney(payment.amount)}
                                    onPress={() => {
                                        confirmDestructive(
                                            "Remove this payment?",
                                            "The amount is added back to remaining.",
                                            () => {
                                                hapticUndo();
                                                void undoPaymentById(payment.id);
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
                        Payments you record show up here until the balance hits
                        zero.
                    </Text>
                )}
            </ScrollView>

            <DebtForm
                visible={editing}
                onClose={() => setEditing(false)}
                debt={debt}
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
