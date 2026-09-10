import { useLocale } from "@/app/contexts/LocaleContext";
import { useSavings } from "@/app/contexts/SavingsContext";
import { DashboardHero } from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { DateField } from "@/components/DateField";
import { DetailHeroNav } from "@/components/DetailHeroNav";
import SavingsForm from "@/components/SavingsForm";
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
import {
    formatDisplayDate,
    isSameCalendarMonth,
    parseIsoDate,
    todayIsoDate,
} from "@/utils/date";
import { getLatestSavingsContributionInMonth } from "@/utils/filters";
import { hapticConfirm, hapticUndo } from "@/utils/haptics";
import { currencySymbol } from "@/utils/money";
import { goBackOrReplace, paramId } from "@/utils/navigation";
import {
    isSavingsGoalReached,
    savingsMonthsRemaining,
    savingsProgressPercent,
} from "@/utils/savings";
import { useLocalSearchParams } from "expo-router";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export default function SavingsGoalScreen() {
    useStatusBarStyle("light");
    const topPadding = useScreenTopPadding();
    const { id: rawId } = useLocalSearchParams<{ id: string }>();
    const id = paramId(rawId);

    const { currency, formatMoney } = useLocale();
    const symbol = currencySymbol(currency);
    const {
        savings,
        contributions,
        loading,
        addContribution,
        undoContribution,
        removeContribution,
    } = useSavings();
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState(false);
    const [logAmount, setLogAmount] = useState("");
    const [logDate, setLogDate] = useState(todayIsoDate());
    const [logError, setLogError] = useState(false);
    const [focused, setFocused] = useState(false);

    const goal = savings.find((item) => item.id === id);
    const today = useMemo(() => new Date(), []);
    const todayIso = todayIsoDate();

    const ledger = useMemo(() => {
        if (!id) {
            return [];
        }
        return contributions
            .filter((item) => item.savingsId === id)
            .sort(
                (a, b) =>
                    b.date.localeCompare(a.date) || b.id.localeCompare(a.id)
            );
    }, [id, contributions]);

    const latestThisMonth = goal
        ? getLatestSavingsContributionInMonth(goal.id, contributions, today, {
              anyDayInMonth: true,
          })
        : undefined;

    useEffect(() => {
        if (loading || !id) {
            return;
        }
        if (goal) {
            return;
        }
        goBackOrReplace("/(tabs)/plans");
    }, [loading, goal, id]);

    useEffect(() => {
        if (!goal) {
            return;
        }
        if (latestThisMonth) {
            setLogAmount(String(latestThisMonth.amount));
            return;
        }
        if (goal.monthlyContribution && goal.monthlyContribution > 0) {
            setLogAmount(String(goal.monthlyContribution));
        }
    }, [goal, latestThisMonth]);

    if (loading && !goal) {
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

    if (!goal) {
        return null;
    }

    const reached = isSavingsGoalReached(goal);
    const percent = Math.round(savingsProgressPercent(goal));
    const months = savingsMonthsRemaining(goal);
    const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
    const heroCaption = reached
        ? `of ${formatMoney(goal.targetAmount, { compact: true })} · goal reached`
        : months === 1
          ? `of ${formatMoney(goal.targetAmount, { compact: true })} · about 1 month`
          : months !== null
            ? `of ${formatMoney(goal.targetAmount, { compact: true })} · about ${months} months`
            : `of ${formatMoney(goal.targetAmount, { compact: true })} · ${formatMoney(remaining, { compact: true })} to go`;

    const handleLog = async () => {
        if (busy) {
            return;
        }
        const amount = Number(logAmount);
        if (!(amount > 0) || parseIsoDate(logDate) === null) {
            setLogError(true);
            return;
        }
        setBusy(true);
        try {
            hapticConfirm();
            await addContribution(goal.id, amount, logDate.trim());
            setLogError(false);
            setLogDate(todayIso);
        } finally {
            setBusy(false);
        }
    };

    const handleUndoMonth = async () => {
        if (!latestThisMonth || busy) {
            return;
        }
        setBusy(true);
        try {
            hapticUndo();
            await undoContribution(goal.id, todayIso);
        } finally {
            setBusy(false);
        }
    };

    const monthLogs = ledger.filter((item) => {
        const loggedOn = parseIsoDate(item.date);
        return loggedOn ? isSameCalendarMonth(loggedOn, today) : false;
    });

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
                    title={goal.name}
                    kicker="Saved"
                    value={formatMoney(goal.currentAmount, { compact: true })}
                    caption={heroCaption}
                    percent={percent}
                    header={
                        <DetailHeroNav
                            backLabel="Savings"
                            fallbackHref="/(tabs)/plans"
                            onEdit={() => setEditing(true)}
                            editAccessibilityLabel="Edit goal"
                        />
                    }
                />

                {reached ? (
                    <View style={form.banner}>
                        <Text style={form.bannerText}>
                            This jar is full. You can still log more if you want
                            to keep going.
                        </Text>
                    </View>
                ) : null}

                <View style={[form.actionCard, form.actionCardLead]}>
                    <Text style={form.actionCardTitle}>
                        {latestThisMonth
                            ? "Logged this month"
                            : "Log a contribution"}
                    </Text>
                    <Text style={form.actionCardCaption}>
                        {latestThisMonth
                            ? `Recorded ${formatMoney(latestThisMonth.amount)} this month. Undo if that was a mistake, or log another.`
                            : "This amount reduces leftover, like marking a bill paid."}
                    </Text>
                    <View
                        style={[
                            form.amountWrap,
                            focused && form.inputFocused,
                            logError && form.inputError,
                            { marginBottom: theme.space.md },
                        ]}
                    >
                        <Text style={form.amountPrefix}>{symbol}</Text>
                        <TextInput
                            style={form.amountInput}
                            placeholder="0.00"
                            placeholderTextColor={formColors.placeholder}
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
                        <Text style={form.error}>Enter an amount to log.</Text>
                    ) : null}
                    <View style={form.field}>
                        <DateField
                            label="Date"
                            value={logDate}
                            onChange={setLogDate}
                            hasError={logError && parseIsoDate(logDate) === null}
                            errorMessage="Choose a valid date."
                        />
                    </View>
                    <Pressable
                        style={({ pressed }) => [
                            form.actionCardButton,
                            pressed && buttonStyle.buttonPressed,
                            latestThisMonth && form.actionCardButtonSpacer,
                            busy && { opacity: 0.6 },
                        ]}
                        disabled={busy}
                        onPress={() => {
                            void handleLog();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={
                            Number(logAmount) > 0
                                ? `Log ${formatMoney(Number(logAmount))}`
                                : "Log contribution"
                        }
                    >
                        <Text style={buttonStyle.buttonText}>
                            {Number(logAmount) > 0
                                ? `Log ${formatMoney(Number(logAmount))}`
                                : "Log contribution"}
                        </Text>
                    </Pressable>
                    {latestThisMonth ? (
                        <Pressable
                            style={({ pressed }) => [
                                form.actionCardButton,
                                form.actionCardButtonMuted,
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
                    ) : null}
                </View>

                <Text style={styles.paidSoFar}>
                    {monthLogs.length > 0
                        ? `${formatMoney(
                              monthLogs.reduce((sum, item) => sum + item.amount, 0)
                          )} logged this month`
                        : ledger.length > 0
                          ? "No contribution this month yet"
                          : "No contributions yet"}
                </Text>

                {ledger.length > 0 ? (
                    <SettingsSection title="Contributions">
                        {ledger.map((item, index) => (
                            <Fragment key={item.id}>
                                {index > 0 ? <SettingsDivider /> : null}
                                <SettingsRow
                                    title={formatDisplayDate(item.date)}
                                    value={formatMoney(item.amount)}
                                    onPress={() => {
                                        confirmDestructive(
                                            "Remove this contribution?",
                                            "Saved so far goes down by that amount. Leftover for that month goes back up.",
                                            () => {
                                                hapticUndo();
                                                void removeContribution(item.id);
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
                        Amounts you put aside show up here until the jar is
                        full — and after, if you keep going.
                    </Text>
                )}
            </ScrollView>

            <SavingsForm
                visible={editing}
                onClose={() => setEditing(false)}
                savingsInfo={goal}
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
