import { text, theme } from "@/design";
import { StyleSheet } from "react-native";

export const screenStyles = StyleSheet.create({
    title: text.pageTitle,
    screenDescription: {
        ...text.caption,
        marginTop: theme.space.xs,
    },
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: theme.space.md,
        backgroundColor: theme.bg.canvas,
    },
    loadingText: text.bodyMuted,
});
