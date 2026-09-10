import { theme } from "@/theme";
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
        fontWeight: "800",
        marginBottom: 16,
    },
    input: {
        backgroundColor: theme.color.sunken,
        borderWidth: 1,
        borderColor: theme.color.border,
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        fontSize: 16,
        minHeight: 44,
        color: theme.color.ink,
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
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 44,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border,
        borderRadius: 8,
        backgroundColor: theme.color.sunken,
        justifyContent: "center",
    },

    typeChipSelected: {
        borderColor: theme.color.primary,
        backgroundColor: theme.color.accentSoft,
    },

    typeChipText: {
        color: theme.color.muted,
        fontSize: 14,
        fontWeight: "500",
    },

    typeChipTextSelected: {
        color: theme.color.accentText,
        fontWeight: "600",
    },
    // Suggested addition: input label
    label: {
        color: "#334155",
        fontSize: 14,
        fontWeight: "600",
        marginBottom: 6,
    },

    // Suggested addition: aligns icon and button text
    buttonContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    // Suggested addition: modal close icon
    closeButton: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 18,
    },

    // Suggested addition: close-button feedback
    closeButtonPressed: {
        backgroundColor: "#E2E8F0",
        opacity: 0.8,
    },

    sheetOverlay: {
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "rgba(15, 23, 42, 0.45)",
    },
    sheet: {
        backgroundColor: "#F2F2F7",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: "92%",
        overflow: "hidden",
    },
    sheetHandle: {
        alignSelf: "center",
        width: 36,
        height: 5,
        borderRadius: 3,
        backgroundColor: "#C7C7CC",
        marginTop: 8,
        marginBottom: 4,
    },
    sheetNav: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 8,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#C6C6C8",
        backgroundColor: "#F2F2F7",
    },
    sheetNavSide: {
        minWidth: 72,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    sheetNavCancel: {
        color: "#2563EB",
        fontSize: 17,
    },
    sheetNavTitle: {
        flex: 1,
        textAlign: "center",
        color: "#0F172A",
        fontSize: 17,
        fontWeight: "600",
    },
    sheetNavSave: {
        color: "#2563EB",
        fontSize: 17,
        fontWeight: "600",
        textAlign: "right",
    },
    sectionHeader: {
        color: "#6B7280",
        fontSize: 13,
        fontWeight: "600",
        letterSpacing: 0.4,
        textTransform: "uppercase",
        marginTop: 22,
        marginBottom: 8,
        marginHorizontal: 4,
    },
    group: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        overflow: "hidden",
    },
    cell: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: 48,
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
    },
    cellDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#C6C6C8",
        marginLeft: 16,
    },
    cellLabel: {
        width: 118,
        color: "#0F172A",
        fontSize: 16,
    },
    cellInput: {
        flex: 1,
        fontSize: 16,
        color: "#0F172A",
        paddingVertical: 12,
        textAlign: "right",
    },
    cellInputError: {
        color: "#DC2626",
    },
    prefix: {
        color: "#64748B",
        fontSize: 16,
        marginRight: 4,
    },
    helper: {
        color: "#8E8E93",
        fontSize: 13,
        lineHeight: 18,
        marginTop: 8,
        marginHorizontal: 4,
    },
    actionCard: {
        backgroundColor: "#ECFDF5",
        borderRadius: 12,
        padding: 16,
        marginTop: 22,
    },
    actionCardLead: {
        marginTop: 0,
        marginBottom: 20,
    },
    actionCardTitle: {
        color: "#14532D",
        fontSize: 16,
        fontWeight: "600",
    },
    actionCardCaption: {
        color: "#166534",
        fontSize: 13,
        lineHeight: 18,
        marginTop: 6,
        marginBottom: 14,
    },
    actionCardField: {
        marginBottom: 14,
    },
    actionCardButton: {
        backgroundColor: "#15803D",
        borderRadius: 10,
        minHeight: 44,
        alignItems: "center",
        justifyContent: "center",
    },
    actionCardButtonSpacer: {
        marginTop: 10,
    },
    paidBanner: {
        backgroundColor: "#F0FDF4",
        borderRadius: 12,
        padding: 14,
        marginTop: 16,
    },
    paidBannerText: {
        color: "#15803D",
        fontSize: 15,
        fontWeight: "600",
        textAlign: "center",
    },
    destroyButton: {
        alignItems: "center",
        paddingVertical: 16,
        marginTop: 12,
        marginBottom: 8,
    },
    destroyText: {
        color: "#DC2626",
        fontSize: 16,
        fontWeight: "500",
    },

    // Centered dialog (Material / Stripe contrast to the iOS sheet)
    dialogOverlay: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: theme.color.overlay,
    },
    dialogCard: {
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.xl,
        maxHeight: "88%",
        overflow: "hidden",
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
        shadowColor: theme.color.ink,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 24,
        elevation: 16,
    },
    dialogHeader: {
        backgroundColor: theme.color.hero,
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 16,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
    },
    dialogKicker: {
        color: theme.color.onHeroMuted,
        fontSize: 12,
        fontWeight: "600",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    dialogTitle: {
        color: theme.color.onHero,
        fontSize: 22,
        fontWeight: "700",
        letterSpacing: -0.3,
    },
    dialogClose: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    dialogBody: {
        paddingHorizontal: 20,
        paddingTop: 18,
        paddingBottom: 8,
    },
    dialogField: {
        marginBottom: 16,
    },
    dialogLabel: {
        color: theme.color.muted,
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
        letterSpacing: 0.2,
    },
    dialogInput: {
        backgroundColor: theme.color.sunken,
        borderWidth: 1,
        borderColor: theme.color.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 14,
        paddingVertical: 13,
        fontSize: 16,
        color: theme.color.ink,
        minHeight: 44,
    },
    dialogInputFocused: {
        borderColor: theme.color.accent,
        backgroundColor: theme.color.surface,
    },
    dialogInputError: {
        borderColor: theme.color.danger,
        backgroundColor: theme.color.dangerSoft,
    },
    dialogAmountWrap: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.color.surfaceMuted,
        borderWidth: 1,
        borderColor: theme.color.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 14,
    },
    dialogAmountPrefix: {
        color: theme.color.soft,
        fontSize: 22,
        fontWeight: "600",
        marginRight: 6,
    },
    dialogAmountInput: {
        flex: 1,
        fontSize: 28,
        fontWeight: "700",
        color: theme.color.ink,
        paddingVertical: 12,
    },
    dialogSwitchRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.color.surfaceMuted,
        borderRadius: theme.radius.md,
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 8,
    },
    dialogSwitchCopy: {
        flex: 1,
        marginRight: 12,
    },
    dialogSwitchTitle: {
        color: theme.color.ink,
        fontSize: 15,
        fontWeight: "600",
    },
    dialogSwitchCaption: {
        color: theme.color.muted,
        fontSize: 12,
        marginTop: 2,
    },
    dialogFooter: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 18,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.color.border,
        backgroundColor: theme.color.surface,
    },
    dialogGhost: {
        flex: 1,
        minHeight: 48,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.color.canvas,
    },
    dialogGhostText: {
        color: theme.color.ink,
        fontSize: 16,
        fontWeight: "600",
    },
    dialogPrimary: {
        flex: 1.3,
        minHeight: 48,
        borderRadius: theme.radius.md,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.color.primary,
    },
    dialogPrimaryText: {
        color: theme.color.primaryOn,
        fontSize: 16,
        fontWeight: "700",
    },
    dialogDelete: {
        alignItems: "center",
        paddingVertical: 8,
        marginBottom: 8,
    },
});