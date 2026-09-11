import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import IncomeForm from "@/components/IncomeForm";
import {
    LedgerDayGroup,
    LedgerRow,
    accentForLabel,
    groupByLedgerDate,
} from "@/components/LedgerList";
import { SearchField } from "@/components/SearchField";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import { PageHeader } from "@/components/ui";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { isIsoInRange } from "@/utils/date";
import { filterBySearch } from "@/utils/filters";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useDateRange } from "../contexts/DateRangeContext";
import { useIncome } from "../contexts/IncomeContext";
import { useLocale } from "../contexts/LocaleContext";

type IncomeScreenProps = {
    embedded?: boolean;
};

export default function IncomeScreen({ embedded = false }: IncomeScreenProps) {
    // Standalone deep link shows the dark hero band; when embedded the
    // host tab owns the bar.
    useStatusBarStyle(embedded ? null : "light");
    const topPadding = useScreenTopPadding();

    const { formatMoney } = useLocale();
    const { income, loading } = useIncome();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");

    const inPeriod = useMemo(
        () =>
            income
                .filter((entry) => isIsoInRange(entry.date, range))
                .sort((a, b) => b.date.localeCompare(a.date)),
        [income, range]
    );

    const listed = useMemo(
        () => filterBySearch(inPeriod, query),
        [inPeriod, query]
    );

    const net = inPeriod.reduce((sum, entry) => sum + entry.net, 0);
    const gross = inPeriod.reduce((sum, entry) => sum + entry.gross, 0);
    const takeHome = gross > 0 ? Math.round((net / gross) * 100) : 0;

    const dayGroups = useMemo(() => groupByLedgerDate(listed), [listed]);

    const openAdd = () => {
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
            {showHero && collapsed ? (
                <StickyHeroBar>
                    <DashboardHeroCompact
                        kicker="Take-home"
                        value={heroValue}
                        pace={periodNav(true)}
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
                        title="Income"
                        subtitle="Paychecks by date, newest first"
                    />
                ) : null}

                {loading ? (
                    <DashboardSkeleton />
                ) : showHero ? (
                    <DashboardHero
                        kicker="Take-home"
                        value={heroValue}
                        caption={
                            inPeriod.length === 0
                                ? "Nothing recorded in this period"
                                : `of ${formatMoney(gross, { compact: true })} gross · ${inPeriod.length} ${inPeriod.length === 1
                                    ? "paycheck"
                                    : "paychecks"
                                }`
                        }
                        percent={inPeriod.length > 0 ? takeHome : 0}
                        pace={periodNav(false)}
                    />
                ) : null}

                <IncomeForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                    }}
                />

                {showHero && !loading ? (
                    <SearchField
                        value={query}
                        onChange={setQuery}
                        placeholder="Search source"
                        accessibilityLabel="Search income"
                    />
                ) : null}

                {income.length === 0 && !loading && (
                    <DashboardEmpty
                        icon="cash-outline"
                        title="No income yet"
                        text="Add a paycheck with its pay date so Home can include it in the selected period."
                        actionLabel="Add first income"
                        onAction={openAdd}
                    />
                )}

                {income.length > 0 && inPeriod.length === 0 && (
                    <DashboardEmpty
                        icon="calendar-outline"
                        title="Nothing in this period"
                        text="Step the date, or jump back to this month, to find paychecks you already logged."
                        actionLabel="Back to current month"
                        onAction={resetToToday}
                    />
                )}

                {inPeriod.length > 0 && listed.length === 0 && (
                    <DashboardEmpty
                        icon="search-outline"
                        title="No matching income"
                        text="Nothing in this period matches that search."
                        actionLabel="Clear search"
                        onAction={() => setQuery("")}
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
                                        router.push(`/paycheck/${entry.id}`);
                                    }}
                                />
                            );
                        })}
                    </LedgerDayGroup>
                ))}
            </ScrollView>
            {!loading ? (
                <FloatingAddButton
                    onPress={openAdd}
                    accessibilityLabel="Add income"
                />
            ) : null}
        </View>
    );
}
