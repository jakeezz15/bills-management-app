import { useDateRange } from "@/app/contexts/DateRangeContext";
import { subscribeToDueReminderTaps } from "@/services/reminders";
import {
    openDueNowFromReminder,
    openPlanFromReminder,
} from "@/utils/navigation";
import { useEffect } from "react";

/**
 * Tapping a due-day alert opens that plan (or Due now for digests).
 * Stack resets to Home first; closing a plan opens Home’s dues modal.
 */
export function NotificationTapHandler() {
    const { resetToToday } = useDateRange();

    useEffect(() => {
        return subscribeToDueReminderTaps((payload) => {
            resetToToday();
            if (payload.type === "digest") {
                openDueNowFromReminder();
                return;
            }
            openPlanFromReminder(payload.type, payload.id);
        });
    }, [resetToToday]);

    return null;
}
