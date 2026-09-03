import { StyleSheet } from "react-native";

export const expensesStyle = StyleSheet.create({
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
    // Expenses page description
    screenDescription: {
        color: "#64748B",
        fontSize: 13,
        lineHeight: 18,
        marginTop: 3,
    },

    // Expense-list heading
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

    // Expense-count badge
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

    // Empty expense-list container
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
});