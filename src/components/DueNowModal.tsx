import { useBills } from "@/app/contexts/BillsContext";
import { useDebt } from "@/app/contexts/DebtsContext";
import { useLocale } from "@/app/contexts/LocaleContext";
import { CompactPlanRow } from "@/components/CompactPlanRow";
import { elevation, text, theme } from "@/design";
import { useDueNowInbox } from "@/hooks/useDueNowInbox";
import { hapticConfirm } from "@/utils/haptics";
import { dueNowLabel, dueNowTone } from "@/utils/due-now";
import Ionicons from "@react-native-vector-icons/ionicons";
import { router } from "expo-router";
import {
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    FadeIn,
    FadeInDown,
    FadeOutRight,
    LinearTransition,
    ReduceMotion,
    ZoomIn,
} from "react-native-reanimated";

const layout = LinearTransition.duration(220).reduceMotion(ReduceMotion.System);
const rowEnter = FadeIn.duration(180).reduceMotion(ReduceMotion.System);
const rowExit = FadeOutRight.duration(260).reduceMotion(ReduceMotion.System);
const clearEnter = FadeInDown.duration(280).reduceMotion(ReduceMotion.System);
const badgeEnter = ZoomIn.springify()
    .damping(14)
    .reduceMotion(ReduceMotion.System);

type DueNowModalProps = {
    visible: boolean;
    onClose: () => void;
    title?: string;
    caption?: string;
    clearCaption?: string;
    soonWithinDays?: number;
};

export function DueNowModal({
    visible,
    onClose,
    title = "Due now",
    caption = "Log these to drop leftover. Overdue, due today, and due in 3 days.",
    clearCaption = "Nothing waiting in the next 3 days.",
    soonWithinDays,
}: DueNowModalProps) {
    const { formatMoney } = useLocale();
    const { toggleBillPaid } = useBills();
    const { recordPayment } = useDebt();
    const { items, showClear, asOfIso } = useDueNowInbox(soonWithinDays);

    const openPlan = (kind: "bill" | "debt", id: string) => {
        onClose();
        router.push(kind === "debt" ? `/debt/${id}` : `/bill/${id}`);
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.header}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.kicker}>Plans</Text>
                            <Text
                                style={styles.title}
                                accessibilityRole="header"
                            >
                                {title}
                            </Text>
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={({ pressed }) => [
                                styles.close,
                                pressed && styles.closePressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel="Close"
                            hitSlop={8}
                        >
                            <Ionicons
                                name="close"
                                size={20}
                                color={theme.text.inverse}
                            />
                        </Pressable>
                    </View>

                    <ScrollView
                        style={{ flexShrink: 1 }}
                        contentContainerStyle={styles.body}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Text style={styles.caption}>
                            {showClear ? clearCaption : caption}
                        </Text>

                        <View
                            style={[
                                styles.list,
                                items.length === 0 && styles.listIdle,
                            ]}
                        >
                            {items.map((item) => (
                                <Animated.View
                                    key={`${item.kind}-${item.id}`}
                                    layout={layout}
                                    entering={rowEnter}
                                    exiting={rowExit}
                                >
                                    <CompactPlanRow
                                        title={item.name}
                                        meta={dueNowLabel(item)}
                                        amountLabel={formatMoney(
                                            item.remaining ?? item.amount,
                                            { compact: true }
                                        )}
                                        amountHint={
                                            item.kind === "debt"
                                                ? "balance"
                                                : "due"
                                        }
                                        actionAmountLabel={
                                            item.kind === "debt"
                                                ? formatMoney(item.amount, {
                                                      compact: true,
                                                  })
                                                : undefined
                                        }
                                        metaTone={dueNowTone(item)}
                                        onPress={() => {
                                            openPlan(item.kind, item.id);
                                        }}
                                        onToggle={() => {
                                            if (item.kind === "bill") {
                                                if (item.amountVaries) {
                                                    openPlan("bill", item.id);
                                                    return;
                                                }
                                                hapticConfirm();
                                                void toggleBillPaid(
                                                    item.id,
                                                    asOfIso
                                                );
                                                return;
                                            }
                                            hapticConfirm();
                                            void recordPayment(
                                                item.id,
                                                undefined,
                                                asOfIso
                                            );
                                        }}
                                        toggleAccessibilityLabel={
                                            item.kind === "bill" &&
                                            item.amountVaries
                                                ? "Enter this month’s amount"
                                                : item.kind === "bill"
                                                  ? "Mark as paid"
                                                  : `Record ${formatMoney(item.amount, { compact: true })}`
                                        }
                                    />
                                </Animated.View>
                            ))}
                        </View>

                        {showClear ? <DueClearCard /> : null}
                        {!showClear && items.length === 0 ? (
                            <Text style={styles.emptyHint}>
                                No bills or debts are waiting right now.
                            </Text>
                        ) : null}
                    </ScrollView>

                    <View style={styles.footer}>
                        <Pressable
                            onPress={onClose}
                            accessibilityRole="button"
                            style={({ pressed }) => [
                                styles.done,
                                pressed && { opacity: 0.9 },
                            ]}
                        >
                            <Text style={styles.doneText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

type DueNowBadgeButtonProps = {
    count: number;
    onPress: () => void;
    /** Dark hero uses inverse colors. */
    tone?: "inverse" | "default";
};

/** Bell / checklist control with optional count badge for the Home hero. */
export function DueNowBadgeButton({
    count,
    onPress,
    tone = "inverse",
}: DueNowBadgeButtonProps) {
    const inverse = tone === "inverse";
    const label =
        count > 0
            ? `Due now, ${count} ${count === 1 ? "item" : "items"}`
            : "Due now";

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            hitSlop={8}
            style={({ pressed }) => [
                styles.badgeButton,
                inverse ? styles.badgeButtonInverse : styles.badgeButtonDefault,
                pressed && { opacity: 0.85 },
            ]}
        >
            <Ionicons
                name="notifications-outline"
                size={20}
                color={
                    inverse ? theme.text.inverse : theme.text.primary
                }
            />
            {count > 0 ? (
                <View
                    style={styles.countPill}
                    accessibilityElementsHidden
                >
                    <Text style={styles.countText}>
                        {count > 99 ? "99+" : String(count)}
                    </Text>
                </View>
            ) : null}
        </Pressable>
    );
}

function DueClearCard() {
    return (
        <Animated.View
            entering={clearEnter}
            accessibilityRole="summary"
            accessibilityLabel="You're clear for now. Nothing overdue, due today, or due in 3 days."
            style={styles.clearCard}
        >
            <Animated.View entering={badgeEnter} style={styles.clearBadge}>
                <View style={styles.clearBadgeRing} />
                <View style={styles.clearBadgeCore}>
                    <Ionicons
                        name="checkmark"
                        size={28}
                        color={theme.intent.positive.fg}
                    />
                </View>
            </Animated.View>
            <Text style={styles.clearTitle}>You’re clear for now</Text>
            <Text style={styles.clearText}>
                Nothing overdue, due today, or due in the next 3 days.
            </Text>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        padding: theme.space.md,
        backgroundColor: theme.overlay,
    },
    card: {
        backgroundColor: theme.bg.surface,
        borderRadius: theme.radius.lg,
        maxHeight: "88%",
        overflow: "hidden",
        width: "100%",
        flexShrink: 1,
        maxWidth: 440,
        alignSelf: "center",
        ...elevation.dialog,
    },
    header: {
        backgroundColor: theme.bg.inverse,
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.md,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: theme.space.md,
    },
    kicker: {
        ...text.kicker,
        marginBottom: theme.space.xs,
    },
    title: text.dialogTitle,
    close: {
        width: theme.size.control,
        height: theme.size.control,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.action.onInverse.bg,
        alignItems: "center",
        justifyContent: "center",
    },
    closePressed: {
        opacity: 0.7,
    },
    body: {
        paddingHorizontal: theme.space.md,
        paddingTop: theme.space.md,
        paddingBottom: theme.space.lg,
    },
    caption: {
        ...text.caption,
        marginBottom: theme.space.md,
    },
    list: {
        gap: theme.space.sm,
        marginBottom: theme.space.md,
    },
    listIdle: {
        marginBottom: 0,
        gap: 0,
    },
    emptyHint: {
        ...text.bodyMuted,
        textAlign: "center",
        paddingVertical: theme.space.lg,
    },
    footer: {
        paddingHorizontal: theme.space.md,
        paddingTop: theme.space.sm,
        paddingBottom: theme.space.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: theme.border.subtle,
        backgroundColor: theme.bg.surface,
    },
    done: {
        minHeight: theme.size.tap,
        borderRadius: theme.radius.sm,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.action.primary.bg,
    },
    doneText: text.button,
    badgeButton: {
        width: theme.size.control,
        height: theme.size.control,
        borderRadius: theme.radius.pill,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeButtonInverse: {
        backgroundColor: theme.action.onInverse.bg,
    },
    badgeButtonDefault: {
        backgroundColor: theme.bg.sunken,
    },
    countPill: {
        position: "absolute",
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        paddingHorizontal: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.intent.negative.fg,
        alignItems: "center",
        justifyContent: "center",
    },
    countText: {
        color: theme.text.inverse,
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
        fontWeight: theme.fontWeight.bold,
    },
    clearCard: {
        backgroundColor: theme.intent.positive.bg,
        borderRadius: theme.radius.md,
        paddingVertical: theme.space.lg,
        paddingHorizontal: theme.space.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.intent.positive.strong,
        alignItems: "center",
    },
    clearBadge: {
        width: 72,
        height: 72,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: theme.space.md,
    },
    clearBadgeRing: {
        ...StyleSheet.absoluteFill,
        borderRadius: theme.radius.pill,
        borderWidth: 3,
        borderColor: theme.intent.positive.strong,
        opacity: 0.55,
    },
    clearBadgeCore: {
        width: 56,
        height: 56,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.bg.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    clearTitle: {
        ...text.itemTitle,
        color: theme.intent.positive.fg,
        textAlign: "center",
    },
    clearText: {
        ...text.bodyMuted,
        marginTop: theme.space.sm,
        textAlign: "center",
    },
});
