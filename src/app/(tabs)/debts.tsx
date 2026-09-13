import { CompactPlanRow, PlanGroup } from "@/components/CompactPlanRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { SearchField } from "@/components/SearchField";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import DebtForm from "@/components/DebtForm";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { PageHeader } from "@/components/ui";
import {
    useWalkthroughPlansDemo,
    walkthroughDebtDemo,
    WalkthroughAnchor,
} from "@/components/walkthrough";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { useDashboardStyles } from "@/styles/dashboard";
import { Debt } from "@/types/debt";
import { formatDisplayDate, ordinalDay } from "@/utils/date";
import {
    dueCatalogLabel,
    dueCatalogStatus,
    filterBySearch,
    isDebtFullyPaidOff,
    isDebtInstallmentPaidAsOf,
    isDebtNotStartedAsOf,
} from "@/utils/filters";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useDebt } from "../contexts/DebtsContext";
import { useLocale } from "../contexts/LocaleContext";

type DebtsScreenProps = {
    embedded?: boolean;
};

function sortByDueDayThenName(a: Debt, b: Debt) {
    const due = a.dueDay - b.dueDay;
    if (due !== 0) {
        return due;
    }
    return a.name.localeCompare(b.name);
}

function openDebt(id: string) {
    router.push(`/debt/${id}`);
}

export default function DebtsScreen({ embedded = false }: DebtsScreenProps) {
    const dashboard = useDashboardStyles();
    // Standalone deep link shows the dark hero band; when embedded the
    // host tab owns the bar.
    useStatusBarStyle(embedded ? null : "light");
    const topPadding = useScreenTopPadding();

    const { formatMoney } = useLocale();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const { debts: storedDebts, payments, loading } = useDebt();
    const demoMode = useWalkthroughPlansDemo("debts");
    const debts = useMemo(
        () => (demoMode ? walkthroughDebtDemo() : storedDebts),
        [demoMode, storedDebts]
    );
    const today = useMemo(() => new Date(), []);

    const activeDebts = useMemo(
        () =>
            debts.filter(
                (debt) =>
                    !isDebtFullyPaidOff(debt) &&
                    !isDebtNotStartedAsOf(debt, today)
            ),
        [debts, today]
    );

    const listedDebts = useMemo(
        () => filterBySearch(debts, query),
        [debts, query]
    );

    const activeListed = listedDebts
        .filter(
            (debt) =>
                !isDebtFullyPaidOff(debt) && !isDebtNotStartedAsOf(debt, today)
        )
        .sort(sortByDueDayThenName);
    const upcomingListed = listedDebts
        .filter(
            (debt) =>
                isDebtNotStartedAsOf(debt, today) && !isDebtFullyPaidOff(debt)
        )
        .sort(sortByDueDayThenName);
    const paidOffListed = listedDebts
        .filter(isDebtFullyPaidOff)
        .sort((a, b) => a.name.localeCompare(b.name));

    const remaining = activeDebts.reduce(
        (sum, debt) => sum + Math.max(debt.balance, 0),
        0
    );
    const monthlyDue = activeDebts.reduce(
        (sum, debt) => sum + debt.minimumPayment,
        0
    );

    const openAdd = () => {
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(remaining, { compact: true });
    const showHero = debts.length > 0;

    const heroCaption =
        activeDebts.length > 0
            ? `${activeDebts.length} plan${activeDebts.length === 1 ? "" : "s"} · ${formatMoney(monthlyDue, { compact: true })} / month`
            : paidOffListed.length > 0 && upcomingListed.length === 0
              ? "All plans paid off"
              : upcomingListed.length > 0
                ? `${upcomingListed.length} starting later`
                : "No active installment plans";

    const renderDebt = (debt: Debt) => {
        const paidOff = isDebtFullyPaidOff(debt);
        const notStarted = isDebtNotStartedAsOf(debt, today);
        const dueLabel = `Due the ${ordinalDay(debt.dueDay)}`;
        const paidThisMonth =
            !paidOff &&
            !notStarted &&
            isDebtInstallmentPaidAsOf(debt, today, payments);
        const status =
            paidOff || notStarted
                ? null
                : dueCatalogStatus(debt.dueDay, paidThisMonth, today);
        const meta = paidOff
            ? "Paid off"
            : notStarted
              ? `Starts ${formatDisplayDate(debt.startDate)}`
              : [status ? dueCatalogLabel(status) : null, dueLabel, debt.type]
                    .filter(Boolean)
                    .join(" · ");

        return (
            <CompactPlanRow
                key={debt.id}
                title={debt.name}
                meta={meta}
                amountLabel={formatMoney(Math.max(debt.balance, 0), {
                    compact: true,
                })}
                amountHint="remaining"
                done={paidOff}
                metaTone={
                    paidOff
                        ? "paid"
                        : notStarted
                          ? "default"
                          : status ?? "default"
                }
                onPress={() => {
                    if (demoMode) return;
                    openDebt(debt.id);
                }}
            />
        );
    };

    return (
        <View style={dashboard.screen}>
            {showHero && collapsed ? (
                <StickyHeroBar>
                    <DashboardHeroCompact
                        kicker="Remaining"
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
                        title="Debts"
                        subtitle="Installment plans — tap one to log or edit"
                    />
                ) : null}

                {loading && !demoMode ? (
                    <DashboardSkeleton />
                ) : showHero ? (
                    <DashboardHero
                        kicker="Remaining"
                        value={heroValue}
                        caption={
                            demoMode
                                ? "Sample debts for this tour"
                                : heroCaption
                        }
                    />
                ) : null}

                <DebtForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                    }}
                />

                {showHero && !loading ? (
                    <SearchField
                        value={query}
                        onChange={setQuery}
                        placeholder="Search debts"
                        accessibilityLabel="Search debts"
                    />
                ) : null}

                {debts.length === 0 && !loading && !demoMode && (
                    <DashboardEmpty
                        icon="card-outline"
                        title="No debts yet"
                        text="Add a phone, laptop, or loan. Each payment lowers the remaining balance."
                        actionLabel="Add first debt"
                        onAction={openAdd}
                    />
                )}

                {debts.length > 0 && listedDebts.length === 0 && (
                    <DashboardEmpty
                        icon="search-outline"
                        title="No matching debts"
                        text="Nothing matches that search."
                        actionLabel="Clear search"
                        onAction={() => setQuery("")}
                    />
                )}

                <WalkthroughAnchor id="plans-debts">
                    {activeListed.length > 0 ? (
                        <View>
                            <Text style={dashboard.sectionLabel}>Active</Text>
                            <PlanGroup>
                                {activeListed.map(renderDebt)}
                            </PlanGroup>
                        </View>
                    ) : null}

                    {upcomingListed.length > 0 ? (
                        <View>
                            <Text style={dashboard.sectionLabel}>
                                Starts later
                            </Text>
                            <PlanGroup>
                                {upcomingListed.map(renderDebt)}
                            </PlanGroup>
                        </View>
                    ) : null}

                    {paidOffListed.length > 0 ? (
                        <View>
                            <Text style={dashboard.sectionLabel}>Paid off</Text>
                            <PlanGroup>
                                {paidOffListed.map(renderDebt)}
                            </PlanGroup>
                        </View>
                    ) : null}
                </WalkthroughAnchor>
            </ScrollView>
            {!loading || demoMode ? (
                <FloatingAddButton
                    onPress={openAdd}
                    accessibilityLabel="Add debt"
                />
            ) : null}
        </View>
    );
}
