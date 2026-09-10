import { form } from "@/styles/form";
import { Pressable, Text, View } from "react-native";

type CategoryPickerProps = {
    options: readonly string[];
    selected: string | null;
    onSelect: (value: string | null) => void;
    /**
     * Label for the "no category" chip. Pass `null` to hide it — tapping the
     * active chip still clears the selection.
     */
    noneLabel?: string | null;
};

/**
 * Single-select chips for an optional category. Every option is visible at
 * once, so this is only suitable for a small fixed set.
 */
export function CategoryPicker({
    options,
    selected,
    onSelect,
    noneLabel = "None",
}: CategoryPickerProps) {
    return (
        <View style={form.chipRow}>
            {noneLabel ? (
                <Chip
                    label={noneLabel}
                    selected={selected === null}
                    onPress={() => onSelect(null)}
                />
            ) : null}

            {options.map((option) => (
                <Chip
                    key={option}
                    label={option}
                    selected={selected === option}
                    onPress={() =>
                        onSelect(selected === option ? null : option)
                    }
                />
            ))}
        </View>
    );
}

type ChipProps = {
    label: string;
    selected: boolean;
    onPress: () => void;
};

function Chip({ label, selected, onPress }: ChipProps) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={({ pressed }) => [
                form.chip,
                selected && form.chipSelected,
                pressed && form.chipPressed,
            ]}
        >
            <Text style={[form.chipText, selected && form.chipTextSelected]}>
                {label}
            </Text>
        </Pressable>
    );
}
