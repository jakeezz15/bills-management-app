import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PlanItemCard } from "@/components/PlanItemCard";
import SavingsForm from "@/components/SavingsForm";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { SavingsGoal } from "@/types/savings";
import { toIsoDate } from "@/utils/date";
import { getLatestSavingsContributionInMonth } from "@/utils/filters";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";
import type { FormatMoneyOptions } from "@/utils/money";

type SavingsScreenProps = {
    embedded?: boolean;
};

function progressPercent(goal: SavingsGoal) {
    if (goal.targetAmount <= 0) {
        return 0;
    }
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

function isGoalReached(goal: SavingsGoal) {
    return goal.targetAmount > 0 && goal.currentAmount >= goal.targetAmount;
}

function monthsRemaining(goal: SavingsGoal) {
    const leftover = Math.max(0, goal.targetAmount - goal.currentAmount);
    const monthly = goal.monthlyContribution ?? 0;
    if (leftover <= 0) {
        return 0;
    }
    if (monthly <= 0) {
        return null;
    }
    return Math.ceil(leftover / monthly);
}

function goalPace(
    goal: SavingsGoal,
    formatMoney: (amount: number, options?: FormatMoneyOptions) => string
) {
    const reached = isGoalReached(goal);
    const months = monthsRemaining(goal);
    const monthly = goal.monthlyContribution ?? 0;
    const started = goal.startDate
        ? `Started ${goal.startDate.slice(5).replace("-", "/")}`
        : null;

    if (reached) {
        return started ? `Goal reached · ${started}` : "Goal reached";
    }
    if (months === 1) {
        return `About 1 month at ${formatMoney(monthly, { compact: true })} / mo when you log it`;
    }
    if (months !== null) {
        return `About ${months} months at ${formatMoney(monthly, { compact: true })} / mo when you log it`;
    }
    return started
        ? `${started} · set a planned monthly to estimate finish`
        : "Set a planned monthly to estimate a finish date";
}

export default function SavingsScreen({
    embedded = false,
}: SavingsScreenProps) {
    const { formatMoney } = useLocale();
    const { range } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const { savings, contributions, loading, undoContribution } = useSavings();
    const [editSavingsInfo, setEditSavingsInfo] = useState<SavingsGoal | null>(
        null
    );

    const inProgress = savings.filter((goal) => !isGoalReached(goal));
    const reached = savings.filter((goal) => isGoalReached(goal));

    const totals = useMemo(() => {
        const saved = savings.reduce((sum, goal) => sum + goal.currentAmount, 0);
        const target = savings.reduce((sum, goal) => sum + goal.targetAmount, 0);
        const monthly = savings.reduce(
            (sum, goal) => sum + (goal.monthlyContribution ?? 0),
            0
        );
        const percent =
            target > 0 ? Math.min(100, (saved / target) * 100) : 0;
        return { saved, target, monthly, percent };
    }, [savings]);

    const openAdd = () => {
        setEditSavingsInfo(null);
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(totals.saved, { compact: true });
    const showHero = savings.length > 0;
    const heroPace = `${formatMoney(totals.monthly, { compact: true })} planned / mo · log to deduct`;

    const asOf = range.end;
    const asOfIso = toIsoDate(asOf);

    const renderGoal = (goal: SavingsGoal) => {
        const percent = progressPercent(goal);
        const done = isGoalReached(goal);
        const loggedThisMonth = Boolean(
            getLatestSavingsContributionInMonth(goal.id, contributions, asOf)
        );

        return (
            <PlanItemCard
                key={goal.id}
                title={goal.name}
                subtitle={goalPace(goal, formatMoney)}
                rightLabel={`${Math.round(percent)}%`}
                percent={percent}
                done={done}
                amounts={formatMoney(goal.currentAmount, { compact: true })}
                amountsMuted={` / ${formatMoney(goal.targetAmount, { compact: true })}`}
                chipLabel={loggedThisMonth ? "Undo" : "Log"}
                onPress={() => {
                    setEditSavingsInfo(goal);
                    setIsOpen(true);
                }}
                onChip={() => {
                    if (loggedThisMonth) {
                        void undoContribution(goal.id, asOfIso);
                        return;
                    }
                    setEditSavingsInfo(goal);
                    setIsOpen(true);
                }}
            />
        );
    };

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            {showHero && collapsed ? (
                <View style={dashboard.heroCompactSticky}>
                    <DashboardHeroCompact
                        kicker="Saved so far"
                        value={heroValue}
                        pace={heroPace}
                    />
                </View>
            ) : null}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
                {...scrollProps}
            >
                {!embedded ? (
                    <PageHeader
                        title="Savings"
                        subtitle="Goals with progress, not a checklist"
                    />
                ) : null}

                {showHero ? (
                    <DashboardHero
                        kicker="Saved so far"
                        value={heroValue}
                        caption={`of ${formatMoney(totals.target, { compact: true })} across ${savings.length} ${
                            savings.length === 1 ? "goal" : "goals"
                        }`}
                        percent={totals.percent}
                        pace={heroPace}
                    />
                ) : null}

                <SavingsForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditSavingsInfo(null);
                    }}
                    savingsInfo={editSavingsInfo ?? undefined}
                    asOfIso={asOfIso}
                />

                {savings.length === 0 && !loading && (
                    <DashboardEmpty
                        icon="flag-outline"
                        title="No goals yet"
                        text="Track an emergency fund or a trip. Each goal shows how far you are and how long the remaining amount should take."
                        actionLabel="Create first goal"
                        onAction={openAdd}
                    />
                )}

                {inProgress.length > 0 && (
                    <Text style={dashboard.sectionLabel}>In progress</Text>
                )}
                {inProgress.map(renderGoal)}

                {reached.length > 0 && (
                    <Text style={dashboard.sectionLabel}>Reached</Text>
                )}
                {reached.map(renderGoal)}
            </ScrollView>
            <FloatingAddButton
                onPress={openAdd}
                accessibilityLabel="Add savings goal"
            />
        </View>
    );
}
