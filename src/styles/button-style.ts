import { theme, type } from "@/theme";
import { StyleSheet } from "react-native";

export const buttonStyle = StyleSheet.create({
    normalButton: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.lg,
        paddingVertical: theme.space.sm,
        backgroundColor: theme.color.primary,
        borderRadius: theme.radius.md,
    },
    buttonText: type.button,
    buttonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    submitButton: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.lg,
        backgroundColor: theme.color.primary,
        borderRadius: theme.radius.md,
        marginVertical: 2,
    },
    deleteButton: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.lg,
        backgroundColor: theme.color.danger,
        borderRadius: theme.radius.md,
        marginVertical: 2,
    },
    cancelButton: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.lg,
        backgroundColor: theme.color.canvas,
        borderRadius: theme.radius.md,
        marginVertical: 2,
    },
    cancelButtonPressed: {
        opacity: 0.85,
        transform: [{ scale: 0.98 }],
    },
    disabledButton: {
        backgroundColor: theme.color.faint,
        opacity: 0.7,
        elevation: 0,
        shadowOpacity: 0,
    },
    disabledButtonText: {
        color: theme.color.muted,
    },
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    ghostButton: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.lg,
        backgroundColor: theme.color.canvas,
        borderRadius: theme.radius.md,
    },
    ghostButtonText: type.ghostButton,
    dangerText: {
        color: theme.color.danger,
        fontSize: 15,
        fontWeight: theme.font.weight.bold,
        textAlign: "center",
    },
});
