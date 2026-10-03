import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { remindersSupported, syncDueReminders } from "@/services/reminders";
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";

/**
 * Keeps the next unpaid reminder window in sync when plans, payments, or
 * currency change — and when the app returns to the foreground.
 */
export function ReminderSync() {
    const { bills, payments: billPayments, loading: billsLoading } = useBills();
    const {
        debts,
        payments: debtPayments,
        loading: debtsLoading,
    } = useDebt();
    const { currency, loading: localeLoading } = useLocale();
    const appState = useRef(AppState.currentState);

    useEffect(() => {
        if (
            billsLoading ||
            debtsLoading ||
            localeLoading ||
            !remindersSupported()
        ) {
            return;
        }
        void syncDueReminders({
            bills,
            debts,
            billPayments,
            debtPayments,
        });
    }, [
        bills,
        debts,
        billPayments,
        debtPayments,
        billsLoading,
        debtsLoading,
        localeLoading,
        currency,
    ]);

    useEffect(() => {
        if (!remindersSupported()) {
            return;
        }

        const onChange = (next: AppStateStatus) => {
            const wasBackground =
                appState.current === "background" ||
                appState.current === "inactive";
            appState.current = next;
            if (
                wasBackground &&
                next === "active" &&
                !billsLoading &&
                !debtsLoading &&
                !localeLoading
            ) {
                void syncDueReminders({
                    bills,
                    debts,
                    billPayments,
                    debtPayments,
                });
            }
        };

        const sub = AppState.addEventListener("change", onChange);
        return () => sub.remove();
    }, [
        bills,
        debts,
        billPayments,
        debtPayments,
        billsLoading,
        debtsLoading,
        localeLoading,
    ]);

    return null;
}
