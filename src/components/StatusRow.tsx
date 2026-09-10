import { StatusChip } from "@/components/Chip";
import { StatusTone, statusStrip, theme } from "@/theme";
import { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type StatusRowProps = {
    title: string;
    amount: string;
    subtitle?: string;
    tone?: StatusTone;
    chipLabel?: string;
    showChip?: boolean;
    amountTone?: "ink" | "positive" | "negative" | "muted";
    onPress?: () => void;
    isLast?: boolean;
};

/**
 * Grouped-list row with a 4px status strip on the leading edge.
 * Paid rows use the sunken surface and quieter type.
 */
export function StatusRow({
    title,
    amount,
    subtitle,
    tone = "default",
    chipLabel,
    showChip = tone !== "default",
    amountTone = "ink",
    onPress,
    isLast = false,
}: StatusRowProps) {
    const paid = tone === "paid";

    const amountColor =
        amountTone === "positive"
            ? theme.color.successText
            : amountTone === "negative"
              ? theme.color.danger
              : amountTone === "muted"
                ? theme.color.soft
                : paid
                  ? theme.color.muted
                  : theme.color.ink;

    const body = (
        <>
            <View style={[styles.strip, { backgroundColor: statusStrip[tone] }]} />
            <View style={styles.copy}>
                <Text
                    style={[styles.title, paid && styles.titlePaid]}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                {subtitle ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                        {subtitle}
                    </Text>
                ) : null}
            </View>
            {showChip ? <StatusChip tone={tone} label={chipLabel} /> : null}
            <Text
                style={[styles.amount, { color: amountColor }]}
                numberOfLines={1}
            >
                {amount}
            </Text>
        </>
    );

    const rowStyle = [
        styles.row,
        paid && styles.rowPaid,
        !isLast && styles.rowBorder,
    ];

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [
                    rowStyle,
                    pressed && styles.rowPressed,
                ]}
            >
                {body}
            </Pressable>
        );
    }

    return <View style={rowStyle}>{body}</View>;
}

type GroupProps = {
    children: ReactNode;
};

/** White grouped list — hairline dividers, 16 radius. */
export function RowGroup({ children }: GroupProps) {
    return <View style={styles.group}>{children}</View>;
}

const styles = StyleSheet.create({
    group: {
        backgroundColor: theme.color.surface,
        borderRadius: theme.radius.lg,
        overflow: "hidden",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        minHeight: theme.size.tap,
        backgroundColor: theme.color.surface,
        paddingVertical: 12,
        paddingRight: theme.space.lg,
        gap: theme.space.sm,
    },
    rowPaid: {
        backgroundColor: theme.color.sunken,
    },
    rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.color.border,
    },
    rowPressed: {
        backgroundColor: theme.color.sunken,
    },
    strip: {
        width: theme.size.strip,
        alignSelf: "stretch",
    },
    copy: {
        flex: 1,
        minWidth: 0,
        paddingLeft: theme.space.sm,
    },
    title: {
        color: theme.color.ink,
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
    },
    titlePaid: {
        color: theme.color.muted,
        fontWeight: theme.font.weight.regular,
    },
    subtitle: {
        color: theme.color.muted,
        fontSize: theme.font.kicker,
        marginTop: 2,
    },
    amount: {
        fontSize: theme.font.title,
        fontWeight: theme.font.weight.semibold,
        textAlign: "right",
        minWidth: 72,
    },
});
