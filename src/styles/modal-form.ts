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
        fontSize: 20,
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
        fontSize: 16

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

    // Debt type chip row
    typeRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },

    typeChip: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#ccc",
        borderRadius: 8,
        backgroundColor: "#fff",
    },

    typeChipSelected: {
        borderColor: "#3096FC",
        borderWidth: 2,
        backgroundColor: "#EFF6FF",
    },

    typeChipText: {
        color: "#0F172A",
        fontSize: 13,
        fontWeight: "500",
    },

    typeChipTextSelected: {
        color: "#1D4ED8",
        fontWeight: "600",
    },
});