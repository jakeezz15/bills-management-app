import { form } from "@/styles/form";
import { Pressable, Text, View } from "react-native";

type ChoiceChipsProps<T extends string> = {
    options: readonly T[];
    selected: T;
    onSelect: (value: T) => void;
};

/**
 * Always-one-selected chips. Unlike CategoryPicker, tapping the active
 * option does not clear it — used for required choices like reminder time.
 */
export function ChoiceChips<T extends string>({
    options,
    selected,
    onSelect,
}: ChoiceChipsProps<T>) {
    return (
        <View style={form.chipRow}>
            {options.map((option) => {
                const isSelected = option === selected;
                return (
                    <Pressable
                        key={option}
                        onPress={() => onSelect(option)}
                        accessibilityRole="button"
                        accessibilityLabel={option}
                        accessibilityState={{ selected: isSelected }}
                        style={({ pressed }) => [
                            form.chip,
                            isSelected && form.chipSelected,
                            pressed && form.chipPressed,
                        ]}
                    >
                        <Text
                            style={[
                                form.chipText,
                                isSelected && form.chipTextSelected,
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
