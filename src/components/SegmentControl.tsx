import { theme } from "@/theme";
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
        backgroundColor: theme.color.segmentTrack,
        borderRadius: 10,
        padding: 3,
        marginBottom: 4,
    },
    segment: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 10,
        borderRadius: theme.radius.sm,
    },
    segmentSelected: {
        backgroundColor: theme.color.surface,
        shadowColor: theme.color.ink,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    label: {
        fontSize: 14,
        fontWeight: theme.font.weight.regular,
        color: theme.color.muted,
    },
    labelSelected: {
        color: theme.color.ink,
        fontWeight: theme.font.weight.bold,
    },
    trackCompact: {
        marginBottom: 0,
        borderRadius: theme.radius.sm,
        padding: 2,
    },
    segmentCompact: {
        paddingVertical: 7,
        borderRadius: 6,
    },
    labelCompact: {
        fontSize: 12,
    },
});
