import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { Bill } from "@/types/bill";
import { Debt } from "@/types/debt";
import { todayIsoDate } from "@/utils/date";
import { getDueNowItems, type DueNowItem } from "@/utils/due-now";
import { useMemo } from "react";

function hasTrackedPlans(bills: Bill[], debts: Debt[]): boolean {
    if (bills.length > 0) {
        return true;
    }
    return debts.some((debt) => debt.balance > 0 && !debt.paidOffDate);
}

export type DueNowInbox = {
    items: DueNowItem[];
    count: number;
    showClear: boolean;
    asOfIso: string;
};

/** Shared Due now data for badge count + modal / list. */
export function useDueNowInbox(soonWithinDays?: number): DueNowInbox {
    const { bills, payments: billPayments } = useBills();
    const { debts, payments: debtPayments } = useDebt();

    const items = useMemo(
        () =>
            getDueNowItems(
                bills,
                billPayments,
                debts,
                debtPayments,
                new Date(),
                soonWithinDays
            ),
        [bills, billPayments, debts, debtPayments, soonWithinDays]
    );

    const showClear = items.length === 0 && hasTrackedPlans(bills, debts);

    return {
        items,
        count: items.length,
        showClear,
        asOfIso: todayIsoDate(),
    };
}
