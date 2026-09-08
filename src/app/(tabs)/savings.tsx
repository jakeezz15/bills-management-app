import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardHero } from "@/components/DashboardHero";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PlanItemCard } from "@/components/PlanItemCard";
import SavingsForm from "@/components/SavingsForm";
import { dashboard } from "@/styles/dashboard";
import { SavingsGoal } from "@/types/savings";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSavings } from "../contexts/SavingsContext";

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

function goalPace(goal: SavingsGoal) {
    const reached = isGoalReached(goal);
    const months = monthsRemaining(goal);
    const monthly = goal.monthlyContribution ?? 0;

    if (reached) {
        return "Goal reached";
    }
    if (months === 1) {
        return `About 1 month at $${monthly.toFixed(0)} / mo`;
    }
    if (months !== null) {
        return `About ${months} months at $${monthly.toFixed(0)} / mo`;
    }
    return "Set a monthly contribution to estimate a finish date";
}

export default function SavingsScreen({
    embedded = false,
}: SavingsScreenProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { savings, loading, addContribution } = useSavings();
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

    const renderGoal = (goal: SavingsGoal) => {
        const percent = progressPercent(goal);
        const done = isGoalReached(goal);
        const monthly = goal.monthlyContribution ?? 0;

        return (
            <PlanItemCard
                key={goal.id}
                title={goal.name}
                subtitle={goalPace(goal)}
                rightLabel={`${Math.round(percent)}%`}
                percent={percent}
                done={done}
                amounts={`$${goal.currentAmount.toFixed(0)}`}
                amountsMuted={` / $${goal.targetAmount.toFixed(0)}`}
                chipLabel={
                    !done && monthly > 0 ? `Log $${monthly.toFixed(0)}` : undefined
                }
                onPress={() => {
                    setEditSavingsInfo(goal);
                    setIsOpen(true);
                }}
                onChip={
                    !done && monthly > 0
                        ? () => {
                              void addContribution(goal.id, monthly);
                          }
                        : undefined
                }
            />
        );
    };

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            <ScrollView
                style={dashboard.list}
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: 48 },
                ]}
            >
                {!embedded ? (
                    <PageHeader
                        title="Savings"
                        subtitle="Goals with progress, not a checklist"
                    />
                ) : null}

                {savings.length > 0 ? (
                    <DashboardHero
                        kicker="Saved so far"
                        value={`$${totals.saved.toFixed(0)}`}
                        caption={`of $${totals.target.toFixed(0)} across ${savings.length} ${
                            savings.length === 1 ? "goal" : "goals"
                        }`}
                        percent={totals.percent}
                        pace={`$${totals.monthly.toFixed(0)} planned each month`}
                        onAdd={openAdd}
                        addAccessibilityLabel="Add savings goal"
                    />
                ) : null}

                <SavingsForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditSavingsInfo(null);
                    }}
                    savingsInfo={editSavingsInfo ?? undefined}
                />

                {savings.length === 0 && !loading && (
                    <DashboardEmpty
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
        </View>
    );
}
