import { PeriodPicker } from "@/components/PeriodPicker";
import { PeriodUnit } from "@/utils/date";
import { StyleSheet, View } from "react-native";

type ListContextBarProps = {
    periodUnit: PeriodUnit;
    label: string;
    onChangeUnit: (unit: PeriodUnit) => void;
    onShift: (delta: -1 | 1) => void;
    onResetToToday?: () => void;
};

/** Sticky date context only — create actions live in the list, not beside the calendar. */
export function ListContextBar({
    periodUnit,
    label,
    onChangeUnit,
    onShift,
    onResetToToday,
}: ListContextBarProps) {
    return (
        <View style={styles.bar}>
            <PeriodPicker
                variant="compact"
                showUnits={false}
                showCaption={false}
                periodUnit={periodUnit}
                label={label}
                onChangeUnit={onChangeUnit}
                onShift={onShift}
                onResetToToday={onResetToToday}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    bar: {
        paddingHorizontal: 8,
        paddingTop: 6,
        paddingBottom: 8,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
});
