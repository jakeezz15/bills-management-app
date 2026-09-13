import * as Haptics from "expo-haptics";

/**
 * Money-action feedback. Failures are ignored: web, simulators, and
 * Low Power Mode often have no Taptic Engine, and a tap must still work.
 */
function play(task: () => Promise<void>) {
    void task().catch(() => undefined);
}

/** A payment, contribution, or paid toggle landed. */
export function hapticConfirm() {
    play(() =>
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    );
}

/** Soft tap — Welcome / chrome controls so the press is felt, not just seen. */
export function hapticTap() {
    play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** An undo — lighter than confirm so it does not feel like a new charge. */
export function hapticUndo() {
    play(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}
