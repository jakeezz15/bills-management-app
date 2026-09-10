import { AddListRow } from "@/components/AddListRow";
import BillForm from "@/components/BillForm";
import { DashboardEmpty } from "@/components/DashboardEmpty";
import { LoadingScreen } from "@/components/LoadingScreen";
import { RowGroup, StatusRow } from "@/components/StatusRow";
import { dashboard } from "@/styles/dashboard";
import { StatusTone } from "@/theme";
import { Bill } from "@/types/bill";
import { toIsoDate } from "@/utils/date";
import {
    billDueStatusReference,
    getBillDueStatus,
    getBillPaymentInMonth,
    isBillPaidAsOf,
} from "@/utils/filters";
import { useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { useBills } from "../contexts/BillsContext";
import { useDateRange } from "../contexts/DateRangeContext";
import { useLocale } from "../contexts/LocaleContext";

type BillsScreenProps = {
    embedded?: boolean;
};

function statusTone(status: string): StatusTone {
    if (status === "paid") {
        return "paid";
    }
    if (status === "overdue") {
        return "overdue";
    }
    if (status === "due-soon") {
        return "due-soon";
    }
    if (status === "upcoming") {
        return "upcoming";
    }
    return "default";
}

function chipLabel(status: string): string {
    if (status === "due-soon") {
        return "Due soon";
    }
    if (status === "paid") {
        return "Paid";
    }
    if (status === "overdue") {
        return "Overdue";
    }
    if (status === "upcoming") {
        return "Upcoming";
    }
    return status;
}

export default function BillsScreen({ embedded = false }: BillsScreenProps) {
    const { formatMoney } = useLocale();
    const { bills, payments, loading } = useBills();
    const { range } = useDateRange();
    const [isOpen, setIsOpen] = useState(false);
    const [editingBill, setEditingBill] = useState<Bill | null>(null);
    const asOf = range.end;
    const asOfIso = toIsoDate(asOf);

    const sorted = useMemo(() => {
        const dueRef = billDueStatusReference(asOf);
        const rank = (bill: Bill) => {
            const paid = isBillPaidAsOf(bill, payments, asOf);
            if (paid) {
                return 4;
            }
            const status = getBillDueStatus(bill, payments, 3, dueRef);
            if (status === "overdue") {
                return 0;
            }
            if (status === "due-soon") {
                return 1;
            }
            return 2;
        };
        return [...bills].sort((a, b) => {
            const diff = rank(a) - rank(b);
            if (diff !== 0) {
                return diff;
            }
            return a.dueDay - b.dueDay;
        });
    }, [bills, payments, asOf]);

    const openAdd = () => {
        setEditingBill(null);
        setIsOpen(true);
    };

    const renderBill = (bill: Bill, isLast: boolean) => {
        const isPaid = isBillPaidAsOf(bill, payments, asOf);
        const dueRef = billDueStatusReference(asOf);
        const status = isPaid
            ? "paid"
            : getBillDueStatus(bill, payments, 3, dueRef);
        const tone = statusTone(status);
        const monthPayment = getBillPaymentInMonth(bill.id, payments, asOf);
        const displayAmount = isPaid
            ? (monthPayment?.amount ?? 0)
            : bill.amountVaries
              ? 0
              : bill.amount;

        return (
            <StatusRow
                key={bill.id}
                title={bill.name}
                subtitle={`Due day ${bill.dueDay}`}
                amount={formatMoney(displayAmount)}
                tone={tone}
                chipLabel={chipLabel(status)}
                onPress={() => {
                    setEditingBill(bill);
                    setIsOpen(true);
                }}
                isLast={isLast}
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
                <BillForm
                    visible={isOpen}
                    onClose={() => {
                        setIsOpen(false);
                        setEditingBill(null);
                    }}
                    bill={editingBill ?? undefined}
                    asOfIso={asOfIso}
                />

                {bills.length === 0 && !loading ? (
                    <DashboardEmpty
                        title="No bills yet"
                        text="Add rent, utilities, or subscriptions. Unpaid bills stay on this list and do not reduce leftover."
                        actionLabel="Add first bill"
                        onAction={openAdd}
                    />
                ) : (
                    <>
                        <AddListRow label="Add bill" onPress={openAdd} />
                        <RowGroup>
                            {sorted.map((bill, index) =>
                                renderBill(bill, index === sorted.length - 1)
                            )}
                        </RowGroup>
                    </>
                )}
            </ScrollView>
        </View>
    );
}
