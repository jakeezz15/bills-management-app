import { CompactPlanRow, PlanGroup } from "@/components/CompactPlanRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { SearchField } from "@/components/SearchField";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { PageHeader } from "@/components/ui";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import SavingsForm from "@/components/SavingsForm";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { SavingsGoal } from "@/types/savings";
import { filterBySearch } from "@/utils/filters";
import {
    isSavingsGoalReached,
    savingsMonthsRemaining,
    savingsProgressPercent,
} from "@/utils/savings";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocale } from "../contexts/LocaleContext";
import { useSavings } from "../contexts/SavingsContext";

type SavingsScreenProps = {
    embedded?: boolean;
};

function goalMeta(goal: SavingsGoal): string {
    if (isSavingsGoalReached(goal)) {
        return "Goal reached";
    }
    const pct = Math.round(savingsProgressPercent(goal));
    const months = savingsMonthsRemaining(goal);
    if (months === 1) {
        return `${pct}% · about 1 month`;
    }
    if (months !== null) {
        return `${pct}% · about ${months} months`;
    }
    return `${pct}% saved`;
}

export default function SavingsScreen({
    embedded = false,
}: SavingsScreenProps) {
    // Standalone deep link shows the dark hero band; when embedded the
    // host tab owns the bar.
    useStatusBarStyle(embedded ? null : "light");
    const topPadding = useScreenTopPadding();

    const { formatMoney } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const { savings, loading } = useSavings();
    const [query, setQuery] = useState("");

    const listed = useMemo(
        () => filterBySearch(savings, query),
        [savings, query]
    );
    const inProgress = listed.filter((goal) => !isSavingsGoalReached(goal));
    const reached = listed.filter(isSavingsGoalReached);

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
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(totals.saved, { compact: true });
    const showHero = savings.length > 0;
    const heroCaption = `${formatMoney(totals.monthly, { compact: true })} planned / mo · across ${savings.length} ${
        savings.length === 1 ? "goal" : "goals"
    }`;

    const renderGoal = (goal: SavingsGoal) => {
        const done = isSavingsGoalReached(goal);

        return (
            <CompactPlanRow
                key={goal.id}
                title={goal.name}
                meta={goalMeta(goal)}
                amountLabel={formatMoney(goal.currentAmount, { compact: true })}
                amountHint="saved"
                done={done}
                onPress={() => router.push(`/goal/${goal.id}`)}
            />
        );
    };

    return (
        <View style={dashboard.screen}>
            {showHero && collapsed ? (
                <StickyHeroBar>
                    <DashboardHeroCompact
                        kicker="Saved so far"
                        value={heroValue}
                    />
                </StickyHeroBar>
            ) : null}

            <ScrollView
                style={dashboard.list}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={[
                    dashboard.listContent,
                    !embedded && { paddingTop: topPadding },
                ]}
                {...scrollProps}
            >
                {!embedded ? (
                    <PageHeader
                        title="Savings"
                        subtitle="Goals — tap one to log or edit"
                    />
                ) : null}

                {loading ? (
                    <DashboardSkeleton />
                ) : showHero ? (
                    <DashboardHero
                        kicker="Saved so far"
                        value={heroValue}
                        caption={`of ${formatMoney(totals.target, { compact: true })} · ${heroCaption}`}
                        percent={totals.percent}
                    />
                ) : null}

                <SavingsForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                    }}
                />

                {showHero && !loading ? (
                    <SearchField
                        value={query}
                        onChange={setQuery}
                        placeholder="Search goals"
                        accessibilityLabel="Search savings goals"
                    />
                ) : null}

                {savings.length === 0 && !loading && (
                    <DashboardEmpty
                        icon="flag-outline"
                        title="No goals yet"
                        text="Track an emergency fund or a trip. Log contributions on the goal page — leftover drops when you do."
                        actionLabel="Create first goal"
                        onAction={openAdd}
                    />
                )}

                {savings.length > 0 && listed.length === 0 && (
                    <DashboardEmpty
                        icon="search-outline"
                        title="No matching goals"
                        text="Nothing matches that search."
                        actionLabel="Clear search"
                        onAction={() => setQuery("")}
                    />
                )}

                {inProgress.length > 0 ? (
                    <View>
                        <Text style={dashboard.sectionLabel}>In progress</Text>
                        <PlanGroup>{inProgress.map(renderGoal)}</PlanGroup>
                    </View>
                ) : null}

                {reached.length > 0 ? (
                    <View>
                        <Text style={dashboard.sectionLabel}>Reached</Text>
                        <PlanGroup>{reached.map(renderGoal)}</PlanGroup>
                    </View>
                ) : null}
            </ScrollView>
            {!loading ? (
                <FloatingAddButton
                    onPress={openAdd}
                    accessibilityLabel="Add savings goal"
                />
            ) : null}
        </View>
    );
}
