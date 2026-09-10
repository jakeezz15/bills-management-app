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
        backgroundColor: theme.color.sunken,
        borderRadius: theme.radius.md,
        marginVertical: 2,
    },
    cancelButtonPressed: {
        opacity: 0.85,
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
        backgroundColor: theme.color.sunken,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border,
    },
    ghostButtonText: type.ghostButton,
    secondaryButton: {
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.lg,
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.color.borderStrong,
    },
    secondaryButtonText: {
        color: theme.color.ink,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
    },
    dangerText: {
        color: theme.color.danger,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
        textAlign: "center",
    },
});
