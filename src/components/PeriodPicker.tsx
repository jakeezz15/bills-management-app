import { SegmentControl } from "@/components/SegmentControl";
import { screenStyles } from "@/styles/screen";
import { theme } from "@/theme";
import {
    PERIOD_UNITS,
    PERIOD_UNIT_LABELS,
    PeriodUnit,
} from "@/utils/date";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type PeriodPickerProps = {
    periodUnit: PeriodUnit;
    label: string;
    onChangeUnit: (unit: PeriodUnit) => void;
    onShift: (delta: -1 | 1) => void;
    onResetToToday?: () => void;
    /** Compact date-first layout for list screens like Debts. */
    variant?: "default" | "compact";
    caption?: string;
    showUnits?: boolean;
    showCaption?: boolean;
};

const UNIT_OPTIONS = PERIOD_UNITS.map((unit) => PERIOD_UNIT_LABELS[unit]);

export function PeriodPicker({
    periodUnit,
    label,
    onChangeUnit,
    onShift,
    onResetToToday,
    variant = "default",
    caption,
    showUnits = true,
    showCaption = true,
}: PeriodPickerProps) {
    const hint =
        caption ??
        (variant === "compact"
            ? "Tap the date to jump to today"
            : "Balance as of this point · tap to reset");

    const selectUnit = (value: string) => {
        const next = PERIOD_UNITS.find(
            (unit) => PERIOD_UNIT_LABELS[unit] === value
        );
        if (next) {
            onChangeUnit(next);
        }
    };

    const unitsVisible = showUnits;
    const captionVisible = showCaption && Boolean(hint);

    return (
        <View style={variant === "compact" ? styles.compactWrap : styles.container}>
            {variant === "default" && unitsVisible && (
                <View style={styles.unitRow}>
                    <SegmentControl
                        options={UNIT_OPTIONS}
                        selected={PERIOD_UNIT_LABELS[periodUnit]}
                        onSelect={selectUnit}
                        compact
                    />
                </View>
            )}

            <View style={[styles.navRow, variant === "compact" && styles.navRowBare]}>
                <Pressable
                    onPress={() => onShift(-1)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Previous period"
                    style={({ pressed }) => [
                        styles.navButton,
                        pressed && styles.navButtonPressed,
                    ]}
                >
                    <Ionicons name="chevron-back" size={20} color={theme.color.ink} />
                </Pressable>

                <Pressable
                    onPress={onResetToToday}
                    style={styles.labelWrap}
                    accessibilityRole="button"
                    accessibilityLabel="Jump to today"
                >
                    <Text
                        style={[
                            styles.label,
                            variant === "compact" && styles.labelCompact,
                        ]}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                    {captionVisible ? (
                        <Text style={styles.hint}>{hint}</Text>
                    ) : null}
                </Pressable>

                <Pressable
                    onPress={() => onShift(1)}
                    hitSlop={10}
                    accessibilityRole="button"
                    accessibilityLabel="Next period"
                    style={({ pressed }) => [
                        styles.navButton,
                        pressed && styles.navButtonPressed,
                    ]}
                >
                    <Ionicons name="chevron-forward" size={20} color={theme.color.ink} />
                </Pressable>
            </View>

            {variant === "compact" && unitsVisible && (
                <View style={styles.compactUnits}>
                    <SegmentControl
                        options={UNIT_OPTIONS}
                        selected={PERIOD_UNIT_LABELS[periodUnit]}
                        onSelect={selectUnit}
                        compact
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },
    compactWrap: {
        marginBottom: 0,
    },
    unitRow: {
        marginBottom: 12,
    },
    compactUnits: {
        marginTop: 10,
    },
    navRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.color.surface,
        borderWidth: 1,
        borderColor: theme.color.border,
        borderRadius: theme.radius.md,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },
    navRowBare: {
        backgroundColor: "transparent",
        borderWidth: 0,
        borderRadius: 0,
        paddingHorizontal: 0,
        paddingVertical: 0,
    },
    navButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
        backgroundColor: theme.color.canvas,
    },
    navButtonPressed: {
        backgroundColor: theme.color.border,
    },
    labelWrap: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 8,
    },
    label: {
        color: theme.color.ink,
        fontSize: 16,
        fontWeight: "700",
        textAlign: "center",
    },
    labelCompact: {
        fontSize: 15,
        fontWeight: "600",
    },
    hint: {
        ...screenStyles.screenDescription,
        textAlign: "center",
        marginTop: 2,
    },
});
