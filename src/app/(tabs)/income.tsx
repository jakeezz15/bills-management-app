import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import IncomeForm from "@/components/IncomeForm";
import {
    LedgerDayGroup,
    LedgerRow,
    accentForLabel,
    groupByLedgerDate,
} from "@/components/LedgerList";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { Income } from "@/types/income";
import { isIsoInRange } from "@/utils/date";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";

type IncomeScreenProps = {
    embedded?: boolean;
};

export default function IncomeScreen({ embedded = false }: IncomeScreenProps) {
    const { formatMoney } = useLocale();
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

    const dayGroups = useMemo(() => groupByLedgerDate(inPeriod), [inPeriod]);

    const openAdd = () => {
        setEditingEntry(null);
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(net, { compact: true });
    const showHero = income.length > 0;

    const periodNav = (forCompact: boolean) => (
        <HeroPeriodNav
            label={label}
            onShift={shiftPeriod}
            onResetToToday={resetToToday}
            style={forCompact ? { marginTop: 8 } : undefined}
        />
    );

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            {showHero && collapsed ? (
                <View style={dashboard.heroCompactSticky}>
                    <DashboardHeroCompact
                        kicker="Take-home"
                        value={heroValue}
                        pace={periodNav(true)}
                        onAdd={openAdd}
                        addAccessibilityLabel="Add income"
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
                        title="Income"
                        subtitle="Paychecks by date, newest first"
                    />
                ) : null}

                {showHero ? (
                    <DashboardHero
                        kicker="Take-home"
                        value={heroValue}
                        caption={
                            inPeriod.length === 0
                                ? "Nothing recorded in this period"
                                : `of ${formatMoney(gross, { compact: true })} gross · ${inPeriod.length} ${
                                      inPeriod.length === 1
                                          ? "paycheck"
                                          : "paychecks"
                                  }`
                        }
                        percent={inPeriod.length > 0 ? takeHome : 0}
                        pace={periodNav(false)}
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

                {dayGroups.map((group) => (
                    <LedgerDayGroup key={group.date} label={group.label}>
                        {group.items.map((entry, index) => {
                            const percent =
                                entry.gross > 0
                                    ? Math.round((entry.net / entry.gross) * 100)
                                    : 100;
                            return (
                                <LedgerRow
                                    key={entry.id}
                                    title={entry.source}
                                    meta={`${percent}% take-home`}
                                    amountLabel={formatMoney(entry.net, {
                                        compact: true,
                                    })}
                                    accentColor={accentForLabel(entry.source)}
                                    isLast={index === group.items.length - 1}
                                    onPress={() => {
                                        setEditingEntry(entry);
                                        setIsOpen(true);
                                    }}
                                />
                            );
                        })}
                    </LedgerDayGroup>
                ))}
            </ScrollView>
        </View>
    );
}
