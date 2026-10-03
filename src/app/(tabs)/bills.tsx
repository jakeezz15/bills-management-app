import { useAccounts } from "@/app/contexts/AccountsContext";
import { useBills } from "@/app/contexts/BillsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import BillForm from "@/components/BillForm";
import { CompactPlanRow, PlanGroup } from "@/components/CompactPlanRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { QuickPayAccountDialog } from "@/components/QuickPayAccountDialog";
import { SearchField } from "@/components/SearchField";
import { StickyHeroBar } from "@/components/StickyHeroBar";
import { PageHeader } from "@/components/ui";
import { WalkthroughAnchor } from "@/components/walkthrough/WalkthroughAnchor";
import {
    useWalkthroughPlansDemo,
    walkthroughBillDemo,
} from "@/components/walkthrough";
import { PAID_FILTERS, type PaidFilter } from "@/constants/categories";
import { ensureCanDebit, useDebitLedger } from "@/hooks/useDebitLedger";
import { useScreenTopPadding } from "@/hooks/useScreenTopPadding";
import { useStatusBarStyle } from "@/hooks/useStatusBarStyle";
import { useStickyHero } from "@/hooks/useStickyHero";
import { text, theme } from "@/design";
import { useDashboardStyles } from "@/styles/dashboard";
import { Bill } from "@/types/bill";
import { formatDisplayDate, ordinalDay, todayIsoDate } from "@/utils/date";
import {
    dueCatalogLabel,
    dueCatalogStatus,
    filterBillsByPaidStatus,
    filterBySearch,
    getLastBillPayment,
    isBillNotStartedAsOf,
    isBillPaidAsOf,
    isBillSkippedAsOf,
} from "@/utils/filters";
import { hapticConfirm } from "@/utils/haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

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
    useStatusBarStyle(embedded ? null : "light");
    const topPadding = useScreenTopPadding();
    const { theme: accentTheme } = useTheme();

    const { formatMoney } = useLocale();
    const { accounts } = useAccounts();
    const debitLedger = useDebitLedger();
    const { bills: storedBills, payments, loading, toggleBillPaid } =
        useBills();
    const demoMode = useWalkthroughPlansDemo("bills");
    const bills = useMemo(
        () => (demoMode ? walkthroughBillDemo() : storedBills),
        [demoMode, storedBills]
    );
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [paidFilter, setPaidFilter] = useState<PaidFilter>("All");
    const [pendingPayBill, setPendingPayBill] = useState<Bill | null>(null);
    const params = useLocalSearchParams<{ add?: string }>();
    const today = useMemo(() => new Date(), []);

    useEffect(() => {
        if (params.add === "1") {
            setIsOpen(true);
            router.setParams({ add: undefined });
        }
    }, [params.add]);

    const searched = useMemo(
        () => filterBySearch(bills, query),
        [bills, query]
    );
    const filtered = useMemo(
        () =>
            filterBillsByPaidStatus(searched, paidFilter, payments, today).sort(
                sortByDueDayThenName
            ),
        [searched, paidFilter, payments, today]
    );

    const openBills = useMemo(
        () =>
            filtered.filter((bill) => {
                if (demoMode) return true;
                return !isBillPaidAsOf(bill, payments, today, {
                    anyDayInMonth: true,
                });
            }),
        [filtered, payments, today, demoMode]
    );
    const paidBills = useMemo(
        () =>
            demoMode
                ? []
                : filtered.filter((bill) =>
                      isBillPaidAsOf(bill, payments, today, {
                          anyDayInMonth: true,
                      })
                  ),
        [filtered, payments, today, demoMode]
    );

    const typicalMonthly = bills.reduce(
        (sum, bill) => sum + (bill.amountVaries ? 0 : bill.amount),
        0
    );
    const variableCount = bills.filter((bill) => bill.amountVaries).length;

    const openAdd = () => setIsOpen(true);

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(typicalMonthly, { compact: true });
    const showHero = bills.length > 0;

    const heroCaption =
        variableCount > 0
            ? `${bills.length} bill${bills.length === 1 ? "" : "s"} · ${formatMoney(typicalMonthly, { compact: true })} recurring · ${variableCount} open`
            : `${bills.length} bill${bills.length === 1 ? "" : "s"} · ${formatMoney(typicalMonthly, { compact: true })} / month`;

    const renderBill = (bill: Bill) => {
        const dueLabel = `Due the ${ordinalDay(bill.dueDay)}`;
        const notStarted = demoMode
            ? false
            : isBillNotStartedAsOf(bill, today);
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
        const status = notStarted
            ? null
            : dueCatalogStatus(bill.dueDay, paid, today, 3, skipped);
        const statusLabel = status ? dueCatalogLabel(status) : null;
        const meta = notStarted
            ? `Starts ${formatDisplayDate(bill.startDate!)}`
            : paid
              ? dueLabel
              : [statusLabel || null, dueLabel].filter(Boolean).join(" · ") ||
                bill.category ||
                dueLabel;

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
                done={paid}
                metaTone={
                    notStarted ? "default" : status ?? "default"
                }
                onPress={() => {
                    if (demoMode) return;
                    openBill(bill.id);
                }}
                onToggle={
                    demoMode
                        ? undefined
                        : () => {
                              if (bill.amountVaries && !paid) {
                                  openBill(bill.id);
                                  return;
                              }
                              if (paid) {
                                  hapticConfirm();
                                  void toggleBillPaid(
                                      bill.id,
                                      todayIsoDate()
                                  );
                                  return;
                              }
                              setPendingPayBill(bill);
                          }
                }
                toggleAccessibilityLabel={
                    bill.amountVaries && !paid
                        ? "Enter this month’s amount"
                        : paid
                          ? "Mark as unpaid"
                          : "Mark as paid"
                }
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
                        backLabel="Plans"
                        onBack={() => router.push("/(tabs)/plans")}
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
                    <>
                        <SearchField
                            value={query}
                            onChange={setQuery}
                            placeholder="Search bills"
                            accessibilityLabel="Search bills"
                        />
                        <View style={chipStyles.row}>
                            {PAID_FILTERS.map((filter) => {
                                const selected = paidFilter === filter;
                                return (
                                    <Pressable
                                        key={filter}
                                        onPress={() => setPaidFilter(filter)}
                                        accessibilityRole="button"
                                        accessibilityState={{ selected }}
                                        accessibilityLabel={`Filter ${filter}`}
                                        style={[
                                            chipStyles.chip,
                                            selected && {
                                                backgroundColor:
                                                    accentTheme.intent.info.bg,
                                                borderColor:
                                                    accentTheme.action.primary
                                                        .bg,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                chipStyles.chipLabel,
                                                selected && {
                                                    color: accentTheme.text
                                                        .accent,
                                                },
                                            ]}
                                        >
                                            {filter === "Unpaid"
                                                ? "Open"
                                                : filter}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </>
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

                {bills.length > 0 && filtered.length === 0 && (
                    <DashboardEmpty
                        icon="search-outline"
                        title="No matching bills"
                        text="Nothing matches that search or filter."
                        actionLabel="Clear filters"
                        onAction={() => {
                            setQuery("");
                            setPaidFilter("All");
                        }}
                    />
                )}

                <WalkthroughAnchor id="plans-bills">
                    {openBills.length > 0 ? (
                        <View>
                            <Text style={dashboard.sectionLabel}>Open</Text>
                            <PlanGroup>{openBills.map(renderBill)}</PlanGroup>
                        </View>
                    ) : null}
                    {paidBills.length > 0 ? (
                        <View>
                            <Text style={dashboard.sectionLabel}>
                                Paid this month
                            </Text>
                            <PlanGroup>{paidBills.map(renderBill)}</PlanGroup>
                        </View>
                    ) : null}
                </WalkthroughAnchor>
            </ScrollView>
            {!loading || demoMode ? (
                <FloatingAddButton
                    onPress={openAdd}
                    accessibilityLabel="Add bill"
                />
            ) : null}

            <QuickPayAccountDialog
                visible={pendingPayBill !== null}
                title={
                    pendingPayBill
                        ? `Pay ${pendingPayBill.name}`
                        : "Pay bill"
                }
                onCancel={() => setPendingPayBill(null)}
                onConfirm={(accountId) => {
                    if (!pendingPayBill) {
                        return;
                    }
                    const potName =
                        accounts.find((account) => account.id === accountId)
                            ?.name ?? "Account";
                    if (
                        !ensureCanDebit({
                            accountId,
                            amount: pendingPayBill.amount,
                            asOfIso: todayIsoDate(),
                            accountName: potName,
                            ledger: debitLedger,
                            formatMoney: (value) =>
                                formatMoney(value, { compact: true }),
                        })
                    ) {
                        return;
                    }
                    hapticConfirm();
                    void toggleBillPaid(
                        pendingPayBill.id,
                        todayIsoDate(),
                        undefined,
                        accountId
                    );
                    setPendingPayBill(null);
                }}
            />
        </View>
    );
}

const chipStyles = StyleSheet.create({
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.space.sm,
        marginBottom: theme.space.md,
    },
    chip: {
        minHeight: theme.size.control,
        paddingHorizontal: theme.space.md,
        borderRadius: theme.radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
        backgroundColor: theme.bg.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    chipLabel: {
        ...text.caption,
        color: theme.text.secondary,
        fontWeight: theme.fontWeight.semibold,
    },
});
