import { StatusTone, statusChip, theme } from "@/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";

type ChipProps = {
    label: string;
    selected?: boolean;
    onPress?: () => void;
    /** Dark hero chips vs light canvas chips. */
    appearance?: "hero" | "light";
};

/** Segment / filter chip. Min tap 44. Not a status pill — see StatusChip. */
export function Chip({
    label,
    selected = false,
    onPress,
    appearance = "light",
}: ChipProps) {
    const hero = appearance === "hero";

    return (
        <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
                styles.chip,
                hero ? styles.chipHero : styles.chipLight,
                selected && (hero ? styles.chipHeroSelected : styles.chipLightSelected),
                pressed && onPress && { opacity: 0.88 },
            ]}
        >
            <Text
                style={[
                    styles.label,
                    hero ? styles.labelHero : styles.labelLight,
                    selected &&
                        (hero ? styles.labelHeroSelected : styles.labelLightSelected),
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

type ChipRowProps = {
    options: readonly string[];
    selected: string;
    onSelect: (value: string) => void;
    appearance?: "hero" | "light";
};

export function ChipRow({
    options,
    selected,
    onSelect,
    appearance = "light",
}: ChipRowProps) {
    return (
        <View style={styles.row} accessibilityRole="tablist">
            {options.map((option) => (
                <Chip
                    key={option}
                    label={option}
                    selected={option === selected}
                    appearance={appearance}
                    onPress={() => onSelect(option)}
                />
            ))}
        </View>
    );
}

type StatusChipProps = {
    tone: StatusTone;
    label?: string;
};

/** Status pill whose colors match the 4px row strip. */
export function StatusChip({ tone, label }: StatusChipProps) {
    const chip = statusChip[tone];
    const text = label ?? chip.label;
    if (!text) {
        return null;
    }

    return (
        <View style={[styles.status, { backgroundColor: chip.bg }]}>
            <Text style={[styles.statusText, { color: chip.fg }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: theme.space.sm,
    },
    chip: {
        minHeight: theme.size.tap,
        paddingHorizontal: theme.space.lg,
        borderRadius: theme.radius.sm,
        alignItems: "center",
        justifyContent: "center",
    },
    chipLight: {
        backgroundColor: theme.color.sunken,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.color.border,
    },
    chipLightSelected: {
        backgroundColor: theme.color.accentSoft,
        borderColor: theme.color.primary,
    },
    chipHero: {
        backgroundColor: theme.color.raised,
    },
    chipHeroSelected: {
        backgroundColor: theme.color.primary,
    },
    label: {
        fontSize: theme.font.body,
        fontWeight: theme.font.weight.semibold,
    },
    labelLight: {
        color: theme.color.muted,
    },
    labelLightSelected: {
        color: theme.color.accentText,
    },
    labelHero: {
        color: theme.color.onHeroMuted,
    },
    labelHeroSelected: {
        color: theme.color.inverse,
    },
    status: {
        paddingHorizontal: theme.space.sm,
        paddingVertical: 4,
        borderRadius: theme.radius.sm,
        flexShrink: 1,
    },
    statusText: {
        fontSize: theme.font.kicker,
        fontWeight: theme.font.weight.semibold,
    },
});
