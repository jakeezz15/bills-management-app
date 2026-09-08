import { Alert } from "react-native";

/** Confirm before destructive actions (delete, overwrite, etc.). */
export function confirmDestructive(
    title: string,
    message: string,
    onConfirm: () => void,
    confirmLabel = "Delete"
): void {
    Alert.alert(title, message, [
        { text: "Cancel", style: "cancel" },
        { text: confirmLabel, style: "destructive", onPress: onConfirm },
    ]);
}
