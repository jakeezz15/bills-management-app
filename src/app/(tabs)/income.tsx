import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardHero } from "@/components/DashboardHero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import IncomeForm from "@/components/IncomeForm";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PlanItemCard } from "@/components/PlanItemCard";
import { dashboard } from "@/styles/dashboard";
import { Income } from "@/types/income";
import { formatDisplayDate, isIsoInRange } from "@/utils/date";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useIncome } from "../contexts/IncomeContext";

type IncomeScreenProps = {
    embedded?: boolean;
};

export default function IncomeScreen({ embedded = false }: IncomeScreenProps) {
    const { income, loading } = useIncome();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Income | null>(null);

    const inPeriod = useMemo(
        () =>
            income
                .filter((entry) => isIsoInRange(entry.date, range))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [income, range]
    );

    const net = inPeriod.reduce((sum, entry) => sum + entry.net, 0);
    const gross = inPeriod.reduce((sum, entry) => sum + entry.gross, 0);
    const takeHome = gross > 0 ? Math.round((net / gross) * 100) : 0;

    const openAdd = () => {
        setEditingEntry(null);
        setIsOpen(true);
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
                        title="Income"
                        subtitle="Paychecks and other money in"
                    />
                ) : null}

                {income.length > 0 ? (
                    <DashboardHero
                        kicker="Take-home"
                        value={`$${net.toFixed(0)}`}
                        caption={
                            inPeriod.length === 0
                                ? "Nothing recorded in this period"
                                : `of $${gross.toFixed(0)} gross · ${inPeriod.length} ${
                                      inPeriod.length === 1
                                          ? "paycheck"
                                          : "paychecks"
                                  }`
                        }
                        percent={inPeriod.length > 0 ? takeHome : 0}
                        pace={
                            <HeroPeriodNav
                                label={label}
                                onShift={shiftPeriod}
                                onResetToToday={resetToToday}
                            />
                        }
                        onAdd={openAdd}
                        addAccessibilityLabel="Add income"
                    />
                ) : null}

                <IncomeForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingEntry(null);
                    }}
                    entry={editingEntry ?? undefined}
                />

                {income.length === 0 && !loading && (
                    <DashboardEmpty
                        title="No income yet"
                        text="Add a paycheck with its pay date so Home can include it in the selected period."
                        actionLabel="Add first income"
                        onAction={openAdd}
                    />
                )}

                {income.length > 0 && inPeriod.length === 0 && (
                    <DashboardEmpty
                        title="Nothing in this period"
                        text="Step the date, or jump to today, to find paychecks you already logged."
                        actionLabel="Jump to today"
                        onAction={resetToToday}
                    />
                )}

                {inPeriod.length > 0 && (
                    <Text style={dashboard.sectionLabel}>This period</Text>
                )}
                {inPeriod.map((entry) => {
                    const percent =
                        entry.gross > 0
                            ? Math.min(100, (entry.net / entry.gross) * 100)
                            : 100;

                    return (
                        <PlanItemCard
                            key={entry.id}
                            title={entry.source}
                            subtitle={formatDisplayDate(entry.date)}
                            rightLabel={`$${entry.net.toFixed(0)}`}
                            percent={percent}
                            done={percent >= 100}
                            amounts={`$${entry.net.toFixed(0)}`}
                            amountsMuted={` / $${entry.gross.toFixed(0)} gross`}
                            onPress={() => {
                                setEditingEntry(entry);
                                setIsOpen(true);
                            }}
                        />
                    );
                })}
            </ScrollView>
        </View>
    );
}
