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
    },

    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    loading: {
        flex: 1,
        justifyContent: "center",
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 20,
    },

    // Suggested addition: summary card
    expenseSummary: {
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: "#DBEAFE",
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },

    // Suggested addition: summary label
    expenseSummaryLabel: {
        color: "#64748B",
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 4,
    },

    // Suggested addition: prominent total
    // Reference for your existing style; only adjust if you approve
    expenseSummaryAmount: {
        color: "#B45309",
        fontSize: 14,
        fontWeight: "600",
    },

    // Suggested addition: supporting information
    expenseSummaryCaption: {
        color: "#64748B",
        fontSize: 12,
        marginTop: 4,
    },
    // Suggested addition: highlights the most important result
    leftoverSection: {
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        padding: 16,
        marginTop: 16,
        marginBottom: 20,
    },

    // Suggested addition: description above leftover amount
    leftoverLabel: {
        color: "#64748B",
        fontSize: 13,
        fontWeight: "500",
        marginBottom: 4,
    },

    // Suggested addition: explanation below leftover amount
    leftoverMessage: {
        color: "#64748B",
        fontSize: 12,
        lineHeight: 18,
        marginTop: 4,
    },

    // Suggested addition: contains the supporting totals
    summaryDetails: {
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        overflow: "hidden",
    },

    // Suggested addition: aligns each label and amount
    summaryRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 13,
    },

    // Suggested addition: secondary summary labels
    summaryLabel: {
        color: "#475569",
        fontSize: 14,
    },

    // Suggested addition: default amount appearance
    summaryValue: {
        color: "#0F172A",
        fontSize: 14,
        fontWeight: "600",
    },

    // Suggested addition: positive income color
    incomeSummaryAmount: {
        color: "#15803D",
        fontSize: 14,
        fontWeight: "600",
    },

    // Suggested addition: savings accent
    savingsSummaryAmount: {
        color: "#2563EB",
        fontSize: 14,
        fontWeight: "600",
    },

    // Suggested addition: separation between summary rows
    summaryDivider: {
        height: 1,
        backgroundColor: "#E2E8F0",
        marginHorizontal: 14,
    },

    // Suggested addition: safer destructive-action presentation
    resetButtonText: {
        color: "#DC2626",
        fontSize: 14,
        fontWeight: "500",
        textAlign: "center",
    },

    // Suggested addition: reset interaction feedback
    resetButtonPressed: {
        opacity: 0.65,
    },

});