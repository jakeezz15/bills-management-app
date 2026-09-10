import { AppButton } from "@/components/AppButton";
import { Hero } from "@/components/Hero";
import { RowGroup, StatusRow } from "@/components/StatusRow";
import SavingsForm from "@/components/SavingsForm";
import { dashboard } from "@/styles/dashboard";
import { theme } from "@/theme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocale } from "../../contexts/LocaleContext";
import { useSavings } from "../../contexts/SavingsContext";

export default function SavingsDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { formatMoney } = useLocale();
    const { savings, contributions } = useSavings();
    const [formOpen, setFormOpen] = useState(false);

    const goal = savings.find((item) => item.id === id);
    const history = useMemo(
        () =>
            contributions
                .filter((item) => item.savingsId === id)
                .sort((a, b) => b.date.localeCompare(a.date)),
        [contributions, id]
    );

    if (!goal) {
        return (
            <View style={dashboard.screen}>
                <Text style={styles.missing}>Goal not found.</Text>
            </View>
        );
    }

    const percent =
        goal.targetAmount > 0
            ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
            : 0;

    return (
        <View style={dashboard.screen}>
            <StatusBar style="light" />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
                <Hero
                    kicker={goal.name}
                    value={formatMoney(goal.currentAmount)}
                    caption={`of ${formatMoney(goal.targetAmount)} · ${Math.round(percent)}%`}
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
                    <View style={styles.progressCard}>
                        <Text style={styles.progressLabel}>Progress</Text>
                        <View style={styles.track}>
                            <View
                                style={[
                                    styles.fill,
                                    { width: `${percent}%` },
                                ]}
                            />
                        </View>
                        <Text style={styles.progressCaption}>
                            {formatMoney(goal.currentAmount)} of{" "}
                            {formatMoney(goal.targetAmount)}
                            {goal.monthlyContribution
                                ? ` · ${formatMoney(goal.monthlyContribution)} planned / mo`
                                : ""}
                        </Text>
                    </View>

                    <Text style={dashboard.sectionLabel}>
                        Contribution history
                    </Text>
                    <RowGroup>
                        {history.length === 0 ? (
                            <StatusRow
                                title="No contributions logged"
                                subtitle="Opening balance is on the goal — leftover only moves when you log a contribution"
                                amount=""
                                showChip={false}
                                isLast
                            />
                        ) : (
                            history.map((item, index) => (
                                <StatusRow
                                    key={item.id}
                                    title="Contribution"
                                    subtitle={item.date}
                                    amount={formatMoney(item.amount, {
                                        sign: "+",
                                    })}
                                    amountTone="positive"
                                    tone="paid"
                                    showChip={false}
                                    isLast={index === history.length - 1}
                                />
                            ))
                        )}
                    </RowGroup>

                    <View style={styles.actions}>
                        <AppButton
                            label="Add contribution"
                            onPress={() => setFormOpen(true)}
                        />
                    </View>
                </View>
            </ScrollView>

            <SavingsForm
                visible={formOpen}
                onClose={() => setFormOpen(false)}
                savingsInfo={goal}
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
    progressCard: {
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        padding: theme.space.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border,
    },
    progressLabel: {
        color: theme.color.muted,
        fontSize: theme.font.kicker,
        fontWeight: theme.font.weight.semibold,
        letterSpacing: 0.4,
        textTransform: "uppercase",
        marginBottom: theme.space.sm,
    },
    track: {
        height: theme.size.bar,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.sunken,
        overflow: "hidden",
    },
    fill: {
        height: theme.size.bar,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.color.success,
    },
    progressCaption: {
        color: theme.color.muted,
        fontSize: theme.font.body,
        marginTop: theme.space.sm,
    },
    actions: {
        marginTop: theme.space.xl,
    },
});
