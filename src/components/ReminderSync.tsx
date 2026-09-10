import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { remindersSupported, syncDueReminders } from "@/services/reminders";
import { useEffect } from "react";

/**
 * Keeps the rolling due-day reminder window in sync when plans or currency
 * change. Time and lead live in AsyncStorage and are read inside
 * `syncDueReminders`.
 */
export function ReminderSync() {
    const { bills, loading: billsLoading } = useBills();
    const { debts, loading: debtsLoading } = useDebt();
    const { currency, loading: localeLoading } = useLocale();

    useEffect(() => {
        if (
            billsLoading ||
            debtsLoading ||
            localeLoading ||
            !remindersSupported()
        ) {
            return;
        }
        void syncDueReminders(bills, debts);
    }, [bills, debts, billsLoading, debtsLoading, localeLoading, currency]);

    return null;
}
