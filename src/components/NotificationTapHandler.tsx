import { useDateRange } from "@/app/contexts/DateRangeContext";
import { useDueAction } from "@/app/contexts/DueActionContext";
import { subscribeToDueReminderTaps } from "@/services/reminders";
import { useEffect } from "react";

/** Opens the matching bill/debt form when the user taps a due-day notification. */
export function NotificationTapHandler() {
    const { openDueItem } = useDueAction();
    const { resetToToday } = useDateRange();

    useEffect(() => {
        return subscribeToDueReminderTaps((payload) => {
            resetToToday();
            openDueItem({ kind: payload.type, id: payload.id });
        });
    }, [openDueItem, resetToToday]);

    return null;
}
