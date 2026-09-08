import BillForm from "@/components/BillForm";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { DashboardHero } from "@/components/DashboardHero";
import { HeroPeriodNav } from "@/components/HeroPeriodNav";
import { PageHeader } from "@/components/ui";
import { LoadingScreen } from "@/components/LoadingScreen";
import { PlanItemCard } from "@/components/PlanItemCard";
import { dashboard } from "@/styles/dashboard";
import { Bill } from "@/types/bill";
import { toIsoDate } from "@/utils/date";
import { getBillDueStatus, isBillPaidAsOf } from "@/utils/filters";
import { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";

type BillsScreenProps = {
    embedded?: boolean;
};

function dueCaption(bill: Bill, paid: boolean, status: string) {
    const due = `Due day ${bill.dueDay}`;
    if (paid) {
        return bill.category ? `${bill.category} · Paid` : "Paid this period";
    }
    if (status === "overdue") {
        return `${due} · Overdue`;
    }
    if (status === "due-soon") {
        return `${due} · Due soon`;
    }
    return bill.category ? `${bill.category} · ${due}` : due;
}

export default function BillsScreen({ embedded = false }: BillsScreenProps) {
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

    const unpaidTotal = unpaid.reduce((sum, bill) => sum + bill.amount, 0);
    const allTotal = bills.reduce((sum, bill) => sum + bill.amount, 0);
    const paidShare =
        bills.length > 0 ? Math.round((paid.length / bills.length) * 100) : 0;

    const openAdd = () => {
        setEditingBill(null);
        setIsOpen(true);
    };

    const renderBill = (bill: Bill) => {
        const isPaid = isBillPaidAsOf(bill, payments, asOf);
        const status = getBillDueStatus(bill, payments, 3, asOf);

        return (
            <PlanItemCard
                key={bill.id}
                title={bill.name}
                subtitle={dueCaption(bill, isPaid, status)}
                rightLabel={`$${bill.amount.toFixed(0)}`}
                percent={isPaid ? 100 : 0}
                done={isPaid}
                amounts={
                    isPaid
                        ? "Paid this period"
                        : `$${bill.amount.toFixed(0)} still due`
                }
                chipLabel={isPaid ? undefined : "Mark paid"}
                onPress={() => {
                    setEditingBill(bill);
                    setIsOpen(true);
                }}
                onChip={
                    isPaid
                        ? undefined
                        : () => {
                              void toggleBillPaid(bill.id, asOfIso);
                          }
                }
            />
        );
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
                        title="Bills"
                        subtitle="Recurring payments for this period"
                    />
                ) : null}

                {bills.length > 0 ? (
                    <DashboardHero
                        kicker="Still to pay"
                        value={`$${unpaidTotal.toFixed(0)}`}
                        caption={
                            unpaid.length === 0
                                ? `All ${bills.length} bills paid`
                                : `${unpaid.length} of ${bills.length} unpaid · $${allTotal.toFixed(0)} total`
                        }
                        percent={paidShare}
                        pace={
                            <HeroPeriodNav
                                label={label}
                                onShift={shiftPeriod}
                                onResetToToday={resetToToday}
                            />
                        }
                        onAdd={openAdd}
                        addAccessibilityLabel="Add bill"
                    />
                ) : null}

                <BillForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingBill(null);
                    }}
                    bill={editingBill ?? undefined}
                />

                {bills.length === 0 && !loading && (
                    <DashboardEmpty
                        title="No bills yet"
                        text="Add rent, utilities, or subscriptions. Each one shows how much is still due this period."
                        actionLabel="Add first bill"
                        onAction={openAdd}
                    />
                )}

                {unpaid.length > 0 && (
                    <Text style={dashboard.sectionLabel}>Still due</Text>
                )}
                {unpaid.map(renderBill)}

                {paid.length > 0 && (
                    <Text style={dashboard.sectionLabel}>Paid this period</Text>
                )}
                {paid.map(renderBill)}
            </ScrollView>
        </View>
    );
}
