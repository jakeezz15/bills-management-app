import BillForm from "@/components/BillForm";
import { CompactPlanRow, PlanGroup } from "@/components/CompactPlanRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { SearchField } from "@/components/SearchField";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import { PageHeader } from "@/components/ui";
import { WalkthroughAnchor } from "@/components/walkthrough/WalkthroughAnchor";
import {
    useWalkthroughPlansDemo,
    walkthroughBillDemo,
} from "@/components/walkthrough";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { useDashboardStyles } from "@/styles/dashboard";
import { Bill } from "@/types/bill";
import { ordinalDay } from "@/utils/date";
import {
    dueCatalogLabel,
    dueCatalogStatus,
    filterBySearch,
    getLastBillPayment,
    isBillPaidAsOf,
    isBillSkippedAsOf,
} from "@/utils/filters";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useLocale } from "../contexts/LocaleContext";

type BillsScreenProps = {
    embedded?: boolean;
};

function sortByDueDayThenName(a: Bill, b: Bill) {
    const due = a.dueDay - b.dueDay;
    if (due !== 0) {
        return due;
    }
    return a.name.localeCompare(b.name);
}

function openBill(id: string) {
    router.push(`/bill/${id}`);
}

export default function BillsScreen({ embedded = false }: BillsScreenProps) {
    const dashboard = useDashboardStyles();
    // Standalone deep link shows the dark hero band; when embedded the
    // host tab owns the bar.
    useStatusBarStyle(embedded ? null : "light");
    const topPadding = useScreenTopPadding();

    const { formatMoney } = useLocale();
    const { bills: storedBills, payments, loading } = useBills();
    const demoMode = useWalkthroughPlansDemo("bills");
    const bills = useMemo(
        () => (demoMode ? walkthroughBillDemo() : storedBills),
        [demoMode, storedBills]
    );
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");

    const listedBills = useMemo(
        () => filterBySearch(bills, query).sort(sortByDueDayThenName),
        [bills, query]
    );
    const today = useMemo(() => new Date(), []);

    const typicalMonthly = bills.reduce(
        (sum, bill) => sum + (bill.amountVaries ? 0 : bill.amount),
        0
    );
    const variableCount = bills.filter((bill) => bill.amountVaries).length;

    const openAdd = () => {
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(typicalMonthly, { compact: true });
    const showHero = bills.length > 0;

    const heroCaption =
        variableCount > 0
            ? `${bills.length} bill${bills.length === 1 ? "" : "s"} · ${formatMoney(typicalMonthly, { compact: true })} recurring · ${variableCount} open`
            : `${bills.length} bill${bills.length === 1 ? "" : "s"} · ${formatMoney(typicalMonthly, { compact: true })} / month`;

    const renderBill = (bill: Bill) => {
        const dueLabel = `Due the ${ordinalDay(bill.dueDay)}`;
        const paid = demoMode
            ? false
            : isBillPaidAsOf(bill, payments, today, {
                  anyDayInMonth: true,
              });
        const lastPayment = demoMode
            ? bill.amountVaries
                ? { amount: 95 }
                : null
            : bill.amountVaries
              ? getLastBillPayment(bill.id, payments)
              : null;
        const skipped = demoMode
            ? false
            : isBillSkippedAsOf(bill.id, payments, today, {
                  anyDayInMonth: true,
              });
        const status = dueCatalogStatus(
            bill.dueDay,
            paid,
            today,
            3,
            skipped
        );
        const meta = [
            dueCatalogLabel(status),
            dueLabel,
            bill.category,
        ]
            .filter(Boolean)
            .join(" · ");

        return (
            <CompactPlanRow
                key={bill.id}
                title={bill.name}
                meta={meta}
                amountLabel={
                    bill.amountVaries
                        ? lastPayment
                            ? formatMoney(lastPayment.amount, { compact: true })
                            : "—"
                        : formatMoney(bill.amount, { compact: true })
                }
                amountHint={
                    bill.amountVaries
                        ? lastPayment
                            ? "previous payment"
                            : "when paid"
                        : "recurring"
                }
                metaTone={status}
                onPress={() => {
                    if (demoMode) return;
                    openBill(bill.id);
                }}
            />
        );
    };

    return (
        <View style={dashboard.screen}>
            {showHero && collapsed ? (
                <StickyHeroBar>
                    <DashboardHeroCompact
                        kicker="Recurring"
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
                        title="Bills"
                        subtitle="Recurring bills — tap one to log or edit"
                    />
                ) : null}

                {loading && !demoMode ? (
                    <DashboardSkeleton />
                ) : showHero ? (
                    <DashboardHero
                        kicker="Recurring"
                        value={heroValue}
                        caption={
                            demoMode
                                ? "Sample bills for this tour"
                                : heroCaption
                        }
                    />
                ) : null}

                <BillForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                    }}
                />

                {showHero && !loading ? (
                    <SearchField
                        value={query}
                        onChange={setQuery}
                        placeholder="Search bills"
                        accessibilityLabel="Search bills"
                    />
                ) : null}

                {bills.length === 0 && !loading && !demoMode && (
                    <DashboardEmpty
                        icon="receipt-outline"
                        title="No bills yet"
                        text="Add rent, utilities, or subscriptions. Variable bills (water, electricity) ask for this month’s amount when you log them."
                        actionLabel="Add first bill"
                        onAction={openAdd}
                    />
                )}

                {bills.length > 0 && listedBills.length === 0 && (
                    <DashboardEmpty
                        icon="search-outline"
                        title="No matching bills"
                        text="Nothing matches that search."
                        actionLabel="Clear search"
                        onAction={() => setQuery("")}
                    />
                )}

                {listedBills.length > 0 ? (
                    <WalkthroughAnchor id="plans-bills">
                        <PlanGroup>{listedBills.map(renderBill)}</PlanGroup>
                    </WalkthroughAnchor>
                ) : null}
            </ScrollView>
            {!loading || demoMode ? (
                <FloatingAddButton
                    onPress={openAdd}
                    accessibilityLabel="Add bill"
                />
            ) : null}
        </View>
    );
}
