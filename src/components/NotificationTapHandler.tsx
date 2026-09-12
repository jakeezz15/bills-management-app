import { useDateRange } from "@/app/contexts/DateRangeContext";
import { subscribeToDueReminderTaps } from "@/services/reminders";
import { openPlanFromReminder } from "@/utils/navigation";
import { useEffect } from "react";

/**
 * Tapping a due-day alert opens that plan’s page (log + history).
 * Stack resets to Home first; closing the plan opens Home’s dues modal.
 */
export function NotificationTapHandler() {
    const { resetToToday } = useDateRange();

    useEffect(() => {
        return subscribeToDueReminderTaps((payload) => {
            resetToToday();
            openPlanFromReminder(payload.type, payload.id);
        });
    }, [resetToToday]);

    return null;
}
