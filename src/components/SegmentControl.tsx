import { text, theme } from "@/design";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SegmentControlProps<T extends string> = {
    options: readonly T[];
    selected: T;
    onSelect: (value: T) => void;
    compact?: boolean;
};

/** Full-width segmented control for section switching on mobile. */
export function SegmentControl<T extends string>({
    options,
    selected,
    onSelect,
    compact = false,
}: SegmentControlProps<T>) {
    return (
        <View
            style={[styles.track, compact && styles.trackCompact]}
            accessibilityRole="tablist"
        >
            {options.map((option) => {
                const isSelected = option === selected;
                return (
                    <Pressable
                        key={option}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: isSelected }}
                        onPress={() => onSelect(option)}
                        style={[
                            styles.segment,
                            compact && styles.segmentCompact,
                            isSelected && styles.segmentSelected,
                        ]}
                    >
                        <Text
                            style={[
                                styles.label,
                                compact && styles.labelCompact,
                                isSelected && styles.labelSelected,
                            ]}
                        >
                            {option}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    track: {
        flexDirection: "row",
        backgroundColor: theme.bg.canvas,
        borderRadius: theme.radius.sm,
        padding: theme.space.xs,
        marginBottom: theme.space.xs,
    },
    segment: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        minHeight: theme.size.tap,
        paddingVertical: theme.space.sm,
        borderRadius: theme.radius.sm,
    },
    segmentSelected: {
        backgroundColor: theme.bg.surface,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.border.subtle,
    },
    label: text.bodyMuted,
    labelSelected: {
        color: theme.text.primary,
        fontWeight: theme.fontWeight.bold,
    },
    trackCompact: {
        marginBottom: 0,
        borderRadius: theme.radius.sm,
        padding: theme.space.xs,
    },
    segmentCompact: {
        minHeight: theme.size.tap,
        paddingVertical: theme.space.sm,
        borderRadius: theme.radius.sm,
    },
    labelCompact: {
        fontSize: theme.fontSize.xs,
        lineHeight: theme.lineHeight.xs,
    },
});
