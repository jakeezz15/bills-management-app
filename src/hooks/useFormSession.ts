import { useState } from "react";

export type FormSession = {
    visible: boolean;
    record: string;
    count: number;
};

export function formSessionKey(session: FormSession): string {
    return `${session.record}:${session.count}`;
}

/**
 * The session a dialog should be in, given what it is now being shown.
 *
 * Returns the same object when nothing should change, so the caller can use
 * identity to decide whether to store it.
 *
 * A new session starts when the dialog opens, or when a different record is
 * opened without closing first. Closing deliberately keeps the current
 * session: callers tend to clear the selected record in the same handler that
 * hides the dialog, and starting a new session then would blank the fields
 * midway through the closing animation.
 */
export function advanceFormSession(
    session: FormSession,
    visible: boolean,
    record: string
): FormSession {
    if (visible !== session.visible) {
        return visible
            ? { visible, record, count: session.count + 1 }
            : { ...session, visible };
    }

    if (visible && record !== session.record) {
        return { visible, record, count: session.count + 1 };
    }

    return session;
}

/**
 * Identity for a dialog's current editing session.
 *
 * Dialog forms stay mounted so the modal can animate, which otherwise forces
 * an effect to copy props into field state each time one opens. Keying the
 * editor on this value remounts it instead: fields initialise from props once,
 * and nothing later overwrites what the user has typed.
 */
export function useFormSession(visible: boolean, recordId?: string): string {
    const record = recordId ?? "new";
    const [session, setSession] = useState<FormSession>({
        visible,
        record,
        count: 0,
    });

    const next = advanceFormSession(session, visible, record);
    if (next !== session) {
        setSession(next);
    }

    return formSessionKey(next);
}
