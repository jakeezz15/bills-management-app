import { useDateRange } from "@/app/contexts/DateRangeContext";
import { subscribeToDueReminderTaps } from "@/services/reminders";
import { router } from "expo-router";
import { useEffect } from "react";

/**
 * Tapping a due-day alert opens that plan’s page (log + history).
 * Home’s period resets to this month so leftover/available stay in sync.
 */
export function NotificationTapHandler() {
    const { resetToToday } = useDateRange();

    useEffect(() => {
        return subscribeToDueReminderTaps((payload) => {
            resetToToday();
            if (payload.type === "debt") {
                router.navigate(`/debt/${payload.id}`);
                return;
            }
            router.navigate(`/bill/${payload.id}`);
        });
    }, [resetToToday]);

    return null;
}
