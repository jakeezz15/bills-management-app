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

    // List-tab page description (under title)
    screenDescription: {
        color: "#64748B",
        fontSize: 13,
        lineHeight: 18,
        marginTop: 3,
    },

    // List heading + count
    listHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 12,
    },

    listTitle: {
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "600",
    },

    countBadge: {
        minWidth: 24,
        height: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 7,
        marginLeft: 8,
    },

    countBadgeText: {
        color: "#475569",
        fontSize: 12,
        fontWeight: "600",
    },

    // Empty list state
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F8FAFC",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 14,
        paddingHorizontal: 24,
        paddingVertical: 40,
        marginTop: 12,
    },

    emptyStateIcon: {
        width: 48,
        height: 48,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#DBEAFE",
        borderRadius: 24,
        marginBottom: 14,
    },

    emptyStateIconText: {
        color: "#2563EB",
        fontSize: 22,
        fontWeight: "700",
    },

    emptyStateTitle: {
        color: "#0F172A",
        fontSize: 17,
        fontWeight: "600",
        marginBottom: 6,
    },

    emptyStateText: {
        maxWidth: 280,
        color: "#64748B",
        fontSize: 14,
        lineHeight: 20,
        textAlign: "center",
        marginBottom: 18,
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