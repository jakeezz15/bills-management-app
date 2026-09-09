import BillForm from "@/components/BillForm";
import { CompactPlanRow, PlanGroup } from "@/components/CompactPlanRow";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import {
    DashboardHero,
    DashboardHeroCompact,
} from "@/components/DashboardHero";
import { FloatingAddButton } from "@/components/FloatingAddButton";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { useStickyHero } from "@/hooks/useStickyHero";
import { dashboard } from "@/styles/dashboard";
import { Bill } from "@/types/bill";
import { toIsoDate } from "@/utils/date";
import {
    getBillDueStatus,
    billDueStatusReference,
    getBillPaymentInMonth,
    isBillPaidAsOf,
} from "@/utils/filters";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useLocale } from "../contexts/LocaleContext";

type BillsScreenProps = {
    embedded?: boolean;
};

type DueDayGroup = {
    dueDay: number;
    label: string;
    bills: Bill[];
};

const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

function billMeta(paid: boolean, status: string, amountVaries?: boolean) {
    if (paid) {
        return "Paid";
    }
    if (amountVaries) {
        return "Needs amount";
    }
    if (status === "overdue") {
        return "Overdue";
    }
    if (status === "due-soon") {
        return "Soon";
    }
    // Due day is already in the section header — keep the pill as status only.
    return "Upcoming";
}

function metaTone(
    paid: boolean,
    status: string
): "overdue" | "due-soon" | "default" {
    if (paid) {
        return "default";
    }
    if (status === "overdue") {
        return "overdue";
    }
    if (status === "due-soon") {
        return "due-soon";
    }
    return "default";
}

function dueDayLabel(dueDay: number, asOf: Date) {
    const daysInMonth = new Date(
        asOf.getFullYear(),
        asOf.getMonth() + 1,
        0
    ).getDate();
    const day = Math.min(Math.max(dueDay, 1), daysInMonth);
    return `${MONTHS[asOf.getMonth()]} ${day}`;
}

function groupBillsByDueDay(
    bills: Bill[],
    payments: Parameters<typeof isBillPaidAsOf>[1],
    asOf: Date
): DueDayGroup[] {
    const map = new Map<number, Bill[]>();

    for (const bill of bills) {
        const day = Math.min(Math.max(bill.dueDay, 1), 31);
        const list = map.get(day) ?? [];
        list.push(bill);
        map.set(day, list);
    }

    return [...map.entries()]
        .sort(([a], [b]) => a - b)
        .map(([dueDay, groupBills]) => {
            const sorted = [...groupBills].sort((a, b) => {
                const aPaid = isBillPaidAsOf(a, payments, asOf) ? 1 : 0;
                const bPaid = isBillPaidAsOf(b, payments, asOf) ? 1 : 0;
                if (aPaid !== bPaid) {
                    return aPaid - bPaid;
                }
                return a.name.localeCompare(b.name);
            });

            return {
                dueDay,
                label: dueDayLabel(dueDay, asOf),
                bills: sorted,
            };
        });
}

export default function BillsScreen({ embedded = false }: BillsScreenProps) {
    const { formatMoney } = useLocale();
    const { bills, payments, loading, toggleBillPaid } = useBills();
    const { range, label, shiftPeriod, resetToToday } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const asOf = range.end;
    const asOfIso = toIsoDate(asOf);

    const unpaid = useMemo(
        () => bills.filter((bill) => !isBillPaidAsOf(bill, payments, asOf)),
        [bills, payments, asOf]
    );
    const paid = useMemo(
        () => bills.filter((bill) => isBillPaidAsOf(bill, payments, asOf)),
        [bills, payments, asOf]
    );

    const dueDayGroups = useMemo(
        () => groupBillsByDueDay(bills, payments, asOf),
        [bills, payments, asOf]
    );

    const unpaidTotal = unpaid.reduce(
        (sum, bill) => sum + (bill.amountVaries ? 0 : bill.amount),
        0
    );
    const variableUnpaid = unpaid.filter((bill) => bill.amountVaries).length;
    const paidShare =
        bills.length > 0 ? Math.round((paid.length / bills.length) * 100) : 0;

    const openAdd = () => {
        setEditingBill(null);
        setIsOpen(true);
    };

    const { collapsed, scrollProps } = useStickyHero();
    const heroValue = formatMoney(unpaidTotal, { compact: true });
    const showHero = bills.length > 0;
    const periodNav = (forCompact: boolean) => (
        <HeroPeriodNav
            label={label}
            onShift={shiftPeriod}
            onResetToToday={resetToToday}
            style={forCompact ? { marginTop: 8 } : undefined}
        />
    );

    const renderBill = (bill: Bill) => {
        const isPaid = isBillPaidAsOf(bill, payments, asOf);
        // Overdue/soon vs real today in the current month — not month-end (which
        // made every due-day before the 30th look overdue).
        const dueRef = billDueStatusReference(asOf);
        const status = isPaid
            ? "paid"
            : getBillDueStatus(bill, payments, 3, asOf, dueRef);

        const monthPayment = getBillPaymentInMonth(bill.id, payments, asOf);
        const displayAmount = isPaid
            ? (monthPayment?.amount ?? 0)
            : bill.amountVaries
              ? 0
              : bill.amount;

        return (
            <CompactPlanRow
                key={bill.id}
                title={bill.name}
                meta={billMeta(isPaid, status, bill.amountVaries)}
                amountLabel={formatMoney(displayAmount, { compact: true })}
                amountHint={isPaid ? undefined : "due"}
                done={isPaid}
                metaTone={metaTone(isPaid, status)}
                onPress={() => {
                    setEditingBill(bill);
                    setIsOpen(true);
                }}
                onToggle={() => {
                    if (bill.amountVaries && !isPaid) {
                        setEditingBill(bill);
                        setIsOpen(true);
                        return;
                    }
                    void toggleBillPaid(bill.id, asOfIso);
                }}
                toggleAccessibilityLabel={
                    bill.amountVaries && !isPaid
                        ? "Enter this month’s amount"
                        : undefined
                }
            />
        );
    };

    return (
        <View style={dashboard.screen}>
            {loading && <LoadingScreen />}

            {showHero && collapsed ? (
                <View style={dashboard.heroCompactSticky}>
                    <DashboardHeroCompact
                        kicker="Still to pay"
                        value={heroValue}
                        pace={periodNav(true)}
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
                        title="Bills"
                        subtitle="Grouped by due day this period"
                    />
                ) : null}

                {showHero ? (
                    <DashboardHero
                        kicker="Still to pay"
                        value={heroValue}
                        caption={
                            unpaid.length === 0
                                ? `All ${bills.length} bills paid`
                                : variableUnpaid > 0
                                  ? `${unpaid.length} unpaid · ${formatMoney(unpaidTotal, { compact: true })} known · ${variableUnpaid} waiting on this month’s amount`
                                  : `${unpaid.length} of ${bills.length} unpaid · ${formatMoney(unpaidTotal, { compact: true })} total`
                        }
                        percent={paidShare}
                        pace={periodNav(false)}
                    />
                ) : null}

                <BillForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingBill(null);
                    }}
                    bill={editingBill ?? undefined}
                    asOfIso={asOfIso}
                />

                {bills.length === 0 && !loading && (
                    <DashboardEmpty
                        icon="receipt-outline"
                        title="No bills yet"
                        text="Add rent, utilities, or subscriptions. Variable bills (water, electricity) ask for this month’s amount when you mark them paid."
                        actionLabel="Add first bill"
                        onAction={openAdd}
                    />
                )}

                {dueDayGroups.map((group) => (
                    <View key={group.dueDay}>
                        <Text style={dashboard.sectionLabel}>{group.label}</Text>
                        <PlanGroup>
                            {group.bills.map(renderBill)}
                        </PlanGroup>
                    </View>
                ))}
            </ScrollView>
            <FloatingAddButton
                onPress={openAdd}
                accessibilityLabel="Add bill"
            />
        </View>
    );
}
