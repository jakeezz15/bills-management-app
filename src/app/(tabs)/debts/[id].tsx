import { AppButton } from "@/components/AppButton";
import DebtForm from "@/components/DebtForm";
import { Hero } from "@/components/Hero";
import { RowGroup, StatusRow } from "@/components/StatusRow";
import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import { todayIsoDate } from "@/utils/date";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDebt } from "../../contexts/DebtsContext";
import { useLocale } from "../../contexts/LocaleContext";

export default function DebtDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { formatMoney } = useLocale();
    const { debts, payments, recordPayment } = useDebt();
    const [formOpen, setFormOpen] = useState(false);

    const debt = debts.find((item) => item.id === id);
    const history = useMemo(
        () =>
            payments
                .filter((item) => item.debtId === id)
                .sort((a, b) => b.date.localeCompare(a.date)),
        [payments, id]
    );

    if (!debt) {
        return (
            <View style={dashboard.screen}>
                <Text style={styles.missing}>Debt not found.</Text>
            </View>
        );
    }

    return (
        <View style={dashboard.screen}>
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <Hero
                    kicker={debt.name}
                    value={formatMoney(Math.max(debt.balance, 0))}
                    caption={`Min ${formatMoney(debt.minimumPayment)} · due day ${debt.dueDay}`}
                    leading={
                        <Pressable
                            onPress={() => router.back()}
                            style={styles.back}
                            accessibilityLabel="Back to Plans"
                        >
                            <Ionicons
                                name="chevron-back"
                                size={20}
                                color={theme.color.inverse}
                            />
                            <Text style={styles.backText}>Plans</Text>
                        </Pressable>
                    }
                />

                <View style={styles.body}>
                    <Text style={dashboard.sectionLabel}>Payment history</Text>
                    <RowGroup>
                        {history.length === 0 ? (
                            <StatusRow
                                title="No payments logged"
                                subtitle="Logging a payment lowers this balance and leftover"
                                amount=""
                                showChip={false}
                                isLast
                            />
                        ) : (
                            history.map((item, index) => (
                                <StatusRow
                                    key={item.id}
                                    title="Payment"
                                    subtitle={item.date}
                                    amount={formatMoney(item.amount, {
                                        sign: "−",
                                    })}
                                    showChip={false}
                                    isLast={index === history.length - 1}
                                />
                            ))
                        )}
                    </RowGroup>

                    <View style={styles.actions}>
                        <AppButton
                            label="Log payment"
                            onPress={() => {
                                void recordPayment(
                                    debt.id,
                                    undefined,
                                    todayIsoDate()
                                );
                            }}
                        />
                        <View style={{ height: 12 }} />
                        <AppButton
                            label="Edit debt"
                            variant="secondary"
                            onPress={() => setFormOpen(true)}
                        />
                    </View>
                </View>
            </ScrollView>

            <DebtForm
                visible={formOpen}
                onClose={() => setFormOpen(false)}
                debt={debt}
                paymentDate={todayIsoDate()}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    missing: {
        marginTop: 80,
        textAlign: "center",
        color: theme.color.muted,
    },
    back: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 44,
        marginBottom: theme.space.sm,
        marginLeft: -8,
        gap: 4,
        alignSelf: "flex-start",
    },
    backText: {
        color: theme.color.inverse,
        fontSize: 14,
        fontWeight: "600",
    },
    body: {
        paddingHorizontal: theme.space.lg,
        paddingTop: theme.space.lg,
    },
    actions: {
        marginTop: theme.space.xl,
    },
});
