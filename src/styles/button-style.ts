import { StyleSheet } from "react-native";

export const buttonStyle = StyleSheet.create({
    normalButton: {
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        padding: 8,
        backgroundColor: "#2563EB",
        borderRadius: 8,
    },

    buttonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "#FFFFFF",
    },

    buttonPressed: {
        backgroundColor: "#1D4ED8",
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },

    submitButton: {
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        padding: 8,
        color: "#FFFFFF",
        backgroundColor: "#2563EB",
        borderRadius: 8,
        marginVertical: 2,

        shadowColor: "#1E3A8A",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.18,
        shadowRadius: 3,
        elevation: 3,
    },

    deleteButton: {
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        padding: 8,
        color: "#FFFFFF",
        backgroundColor: "#f74f4f",
        borderRadius: 8,
        marginVertical: 2,

        shadowColor: "#7F1D1D",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.16,
        shadowRadius: 3,
        elevation: 3,
    },

    cancelButton: {
        textAlign: "center",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 44,
        padding: 8,
        color: "#FFFFFF",
        backgroundColor: "#aba9a9",
        borderRadius: 8,
        marginVertical: 2,

        shadowColor: "#7F1D1D",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.16,
        shadowRadius: 3,
        elevation: 3,
    },

    cancelButtonPressed: {
        backgroundColor: "#919191",
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },

    // Additional optional styles
    disabledButton: {
        backgroundColor: "#CBD5E1",
        opacity: 0.7,
        elevation: 0,
        shadowOpacity: 0,
    },

    disabledButtonText: {
        color: "#64748B",
    },
});