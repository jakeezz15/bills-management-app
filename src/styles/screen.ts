import { StyleSheet } from "react-native";

export const screenStyles = StyleSheet.create({
    sectionTitle: {
        fontSize: 18,
        fontWeight: "600",
        marginTop: 16,
        marginBottom: 8,
    },

    summaryCard: {
        backgroundColor: "#f0f4f8",
        padding: 16,
        borderRadius: 12,
        marginBottom: 24
    },
    title: {
        fontSize: 20,
        fontWeight: "600",
        marginBottom: 24
    },
    leftover: {
        fontSize: 18,
        fontWeight: "700",
        marginTop: 8,

    },
    content: {
        paddingBottom: 32
    },
    section: {
        flex: 1,
        padding: 16,
        paddingTop: 48
    },
    expenseTextInput: {
        backgroundColor: "#fff",
        borderWidth: 1,
        borderColor: "#ccc",
        padding: 12,
        borderRadius: 8,
        marginBottom: 12,
    }
});