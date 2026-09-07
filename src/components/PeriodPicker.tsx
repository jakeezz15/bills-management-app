import { modalForm } from "@/styles/modal-form";
import { screenStyles } from "@/styles/screen";
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
};

export function PeriodPicker({
    periodUnit,
    label,
    onChangeUnit,
    onShift,
    onResetToToday,
}: PeriodPickerProps) {
    return (
        <View style={styles.container}>
            <View style={styles.unitRow}>
                {PERIOD_UNITS.map((unit) => {
                    const selected = periodUnit === unit;

                    return (
                        <Pressable
                            key={unit}
                            onPress={() => onChangeUnit(unit)}
                            style={[
                                modalForm.typeChip,
                                selected && modalForm.typeChipSelected,
                            ]}
                        >
                            <Text
                                style={[
                                    modalForm.typeChipText,
                                    selected && modalForm.typeChipTextSelected,
                                ]}
                            >
                                {PERIOD_UNIT_LABELS[unit]}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <View style={styles.navRow}>
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
                    <Ionicons name="chevron-back" size={22} color="#0F172A" />
                </Pressable>

                <Pressable
                    onPress={onResetToToday}
                    style={styles.labelWrap}
                    accessibilityRole="button"
                    accessibilityLabel="Reset to current month"
                >
                    <Text style={styles.label}>{label}</Text>
                    <Text style={screenStyles.screenDescription}>
                        Balance as of this point · tap to reset
                    </Text>
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
                    <Ionicons name="chevron-forward" size={22} color="#0F172A" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
    },

    unitRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },

    navRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 10,
    },

    navButton: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 20,
    },

    navButtonPressed: {
        backgroundColor: "#E2E8F0",
    },

    labelWrap: {
        flex: 1,
        alignItems: "center",
        paddingHorizontal: 8,
    },

    label: {
        color: "#0F172A",
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
    },
});
