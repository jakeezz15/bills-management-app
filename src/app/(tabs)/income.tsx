import { DashboardEmpty } from "@/components/DashboardEmpty";
import IncomeForm from "@/components/IncomeForm";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RowGroup, StatusRow } from "@/components/StatusRow";
import { dashboard } from "@/styles/dashboard";
import { Income } from "@/types/income";
import { isIsoInRange } from "@/utils/date";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";

type IncomeScreenProps = {
    embedded?: boolean;
    requestAdd?: number;
};

export default function IncomeScreen({
    embedded = false,
    requestAdd = 0,
}: IncomeScreenProps) {
    const { formatMoney } = useLocale();
    const { income, loading } = useIncome();
    const { range } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<Income | null>(null);
    const lastRequest = useRef(0);

    const inPeriod = useMemo(
        () =>
            income
                .filter((entry) => isIsoInRange(entry.date, range))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [income, range]
    );

    useEffect(() => {
        if (requestAdd > 0 && requestAdd !== lastRequest.current) {
            lastRequest.current = requestAdd;
            setEditingEntry(null);
            setIsOpen(true);
        }
    }, [requestAdd]);

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
                        text="Add a paycheck with its pay date so Home can include it in leftover."
                        actionLabel="Add first paycheck"
                        onAction={() => {
                            setEditingEntry(null);
                            setIsOpen(true);
                        }}
                    />
                )}

                {income.length > 0 && inPeriod.length === 0 && (
                    <DashboardEmpty
                        title="Nothing in this period"
                        text="Step the date, or jump to today, to find paychecks you already logged."
                        actionLabel="Add paycheck"
                        onAction={() => {
                            setEditingEntry(null);
                            setIsOpen(true);
                        }}
                    />
                )}

                {inPeriod.length > 0 ? (
                    <RowGroup>
                        {inPeriod.map((entry, index) => (
                            <StatusRow
                                key={entry.id}
                                title={entry.source}
                                subtitle={entry.date}
                                amount={formatMoney(entry.net, { sign: "+" })}
                                amountTone="positive"
                                showChip={false}
                                isLast={index === inPeriod.length - 1}
                                onPress={() => {
                                    setEditingEntry(entry);
                                    setIsOpen(true);
                                }}
                            />
                        ))}
                    </RowGroup>
                ) : null}
            </ScrollView>
        </View>
    );
}
