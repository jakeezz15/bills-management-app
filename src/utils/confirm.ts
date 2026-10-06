import { Alert, Platform } from "react-native";

/** Confirm before destructive actions (delete, overwrite, etc.). */
export function confirmDestructive(
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = "Delete"
): void {
    // RN Web: Alert.alert is a no-op — use the browser confirm dialog.
    if (Platform.OS === "web") {
        const ok =
            typeof globalThis !== "undefined" &&
            typeof (globalThis as { confirm?: (msg: string) => boolean })
                .confirm === "function"
                ? (globalThis as { confirm: (msg: string) => boolean }).confirm(
                      `${title}\n\n${message}`
                  )
                : true;
        if (ok) {
            onConfirm();
        }
        return;
    }

    Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: confirmLabel, style: "destructive", onPress: onConfirm },
    ]);
}

/** Block a debit when the pot cannot cover it. */
export function alertInsufficientFunds(message: string): void {
    if (Platform.OS === "web") {
        const alertFn = (globalThis as { alert?: (msg: string) => void }).alert;
        if (typeof alertFn === "function") {
            alertFn(`Not enough balance\n\n${message}`);
            return;
        }
    }
    Alert.alert("Not enough balance", message);
}
