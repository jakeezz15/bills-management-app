import { StyleSheet } from "react-native";

export const modalForm = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        padding: 24,
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 12,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "600",
        marginBottom: 16,
    },
    input: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
    },
    cancel: {
        textAlign: "center",
        alignItems: "center",
        padding: 4,
        color: "#ffffff",
        backgroundColor: "#b5b9bd",
        borderRadius: 4,
        marginVertical: 2
    },
    submitButton: {
        textAlign: "center",
        alignItems: "center",
        padding: 4,
        color: "#ffffff",
        backgroundColor: "#3096fc",
        borderRadius: 4,
        marginVertical: 2

    },
    // Suggested addition: keeps the card responsive
    cardResponsive: {
        width: "100%",
        maxWidth: 480,
        alignSelf: "center",
    },

    // Suggested addition: gives the modal depth
    cardShadow: {
        shadowColor: "#000000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.18,
        shadowRadius: 10,
        elevation: 6,
    },

    // Suggested addition: input focus state
    inputFocused: {
        borderColor: "#3096FC",
        borderWidth: 2,
    },

    // Suggested addition: invalid input state
    inputError: {
        borderColor: "#DC2626",
    },

    // Suggested addition: validation message
    errorText: {
        color: "#DC2626",
        fontSize: 12,
        marginTop: -8,
        marginBottom: 12,
    },
});