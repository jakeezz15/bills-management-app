import { AddListRow } from "@/components/AddListRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PlanItemCard } from "@/components/PlanItemCard";
import SavingsForm from "@/components/SavingsForm";
import { dashboard } from "@/styles/dashboard";
import { SavingsGoal } from "@/types/savings";
import { router } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";
import { useLocale } from "../../contexts/LocaleContext";
import { useSavings } from "../../contexts/SavingsContext";

type SavingsScreenProps = {
    embedded?: boolean;
};

function progressPercent(goal: SavingsGoal) {
    if (goal.targetAmount <= 0) {
        return 0;
    }
    return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
}

export default function SavingsScreen({
    embedded = false,
}: SavingsScreenProps) {
    const { formatMoney } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const { savings, loading } = useSavings();

    const openAdd = () => setIsOpen(true);

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
                <SavingsForm visible={isOpen} onClose={() => setIsOpen(false)} />

                {savings.length === 0 && !loading ? (
                    <DashboardEmpty
                        title="No goals yet"
                        text="Track an emergency fund or a trip. Contributions you log are the only amounts that reduce leftover."
                        actionLabel="Create first goal"
                        onAction={openAdd}
                    />
                ) : (
                    <>
                        <AddListRow label="Add savings goal" onPress={openAdd} />
                        {savings.map((goal) => {
                            const percent = progressPercent(goal);
                            return (
                                <PlanItemCard
                                    key={goal.id}
                                    title={goal.name}
                                    subtitle={`${Math.round(percent)}% of ${formatMoney(goal.targetAmount)}`}
                                    rightLabel={`${Math.round(percent)}%`}
                                    percent={percent}
                                    done={
                                        goal.targetAmount > 0 &&
                                        goal.currentAmount >= goal.targetAmount
                                    }
                                    fill="success"
                                    amounts={formatMoney(goal.currentAmount)}
                                    amountsMuted={` / ${formatMoney(goal.targetAmount)}`}
                                    onPress={() => {
                                        router.push(`/savings/${goal.id}`);
                                    }}
                                />
                            );
                        })}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
