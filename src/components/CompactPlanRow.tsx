import { statusStrip, theme } from "@/theme";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type CompactPlanRowProps = {
    title: string;
    meta: string;
    amountLabel: string;
    done?: boolean;
    metaTone?: "overdue" | "due-soon" | "default";
    onPress: () => void;
    onToggle?: () => void;
    toggleAccessibilityLabel?: string;
};

/**
 * Dense one-line row for binary plan items (bills / debts):
 * check · name · status · amount.
 */
export function CompactPlanRow({
    title,
    meta,
    amountLabel,
    done = false,
    metaTone = "default",
    onPress,
    onToggle,
    toggleAccessibilityLabel,
}: CompactPlanRowProps) {
    const accent = done
        ? statusStrip.paid
        : metaTone === "overdue"
          ? statusStrip.overdue
          : metaTone === "due-soon"
            ? statusStrip["due-soon"]
            : statusStrip.upcoming;

    const pill = done
        ? {
              bg: "#ECFDF5",
              fg: theme.color.successText,
          }
        : metaTone === "overdue"
          ? {
                bg: theme.color.dangerSoft,
                fg: theme.color.danger,
            }
          : metaTone === "due-soon"
            ? {
                  bg: "#FFFBEB",
                  fg: theme.color.warning,
              }
            : {
                  bg: theme.color.accentSoft,
                  fg: theme.color.accentText,
              };

    return (
        <View style={[styles.row, done && styles.rowDone]}>
            <View style={[styles.accent, { backgroundColor: accent }]} />

            {onToggle ? (
                <Pressable
                    onPress={onToggle}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                        toggleAccessibilityLabel ??
                        (done ? "Mark as unpaid" : "Mark as paid")
                    }
                    style={[
                        styles.toggle,
                        done ? styles.toggleDone : styles.toggleIdle,
                    ]}
                >
                    <Ionicons
                        name={done ? "checkmark" : "ellipse-outline"}
                        size={done ? 16 : 20}
                        color={done ? theme.color.successText : theme.color.soft}
                    />
                </Pressable>
            ) : null}

            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    styles.main,
                    pressed && { opacity: 0.88 },
                ]}
            >
                <Text
                    style={[styles.title, done && styles.titleDone]}
                    numberOfLines={1}
                >
                    {title}
                </Text>

                <View style={[styles.pill, { backgroundColor: pill.bg }]}>
                    <Text
                        style={[styles.pillText, { color: pill.fg }]}
                        numberOfLines={1}
                    >
                        {meta}
                    </Text>
                </View>

                <Text
                    style={[styles.amount, done && styles.amountDone]}
                    numberOfLines={1}
                >
                    {amountLabel}
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.md,
        paddingVertical: 11,
        paddingRight: theme.space.md,
        paddingLeft: theme.space.sm,
        marginBottom: theme.space.sm,
        minHeight: 48,
        overflow: "hidden",
    },
    rowDone: {
        backgroundColor: theme.color.surfaceMuted,
    },
    accent: {
        width: theme.size.strip,
        alignSelf: "stretch",
        borderRadius: theme.radius.pill,
        marginRight: theme.space.sm,
        marginVertical: 6,
    },
    toggle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        marginRight: theme.space.sm,
    },
    toggleIdle: {
        backgroundColor: theme.color.segmentTrack,
    },
    toggleDone: {
        backgroundColor: "#D1FAE5",
    },
    main: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.sm,
        minWidth: 0,
    },
    title: {
        flex: 1,
        minWidth: 64,
        color: theme.color.ink,
        fontSize: 15,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.2,
    },
    titleDone: {
        color: theme.color.muted,
        textDecorationLine: "line-through",
        fontWeight: theme.font.weight.semibold,
    },
    pill: {
        flexShrink: 1,
        maxWidth: "42%",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: theme.radius.pill,
    },
    pillText: {
        fontSize: 11,
        fontWeight: theme.font.weight.bold,
        letterSpacing: 0.1,
    },
    amount: {
        color: theme.color.ink,
        fontSize: 15,
        fontWeight: theme.font.weight.bold,
        letterSpacing: -0.2,
        minWidth: 52,
        textAlign: "right",
    },
    amountDone: {
        color: theme.color.soft,
    },
});
