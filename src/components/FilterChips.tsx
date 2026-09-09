import { theme } from "@/design";
import { form } from "@/styles/form";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";

type FilterChipsProps = {
    options: readonly string[];
    selected: string | null;
    onSelect: (value: string | null) => void;
    /** When true, selecting the active chip clears the filter (for optional category). */
    allowClear?: boolean;
    allLabel?: string;
};

export function FilterChips({
    options,
    selected,
    onSelect,
    allowClear = true,
    allLabel = "All",
}: FilterChipsProps) {
    const showAll = allowClear;

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[form.chipRow, styles.row]}
        >
            {showAll && (
                <Pressable
                    onPress={() => onSelect(null)}
                    style={[form.chip, selected === null && form.chipSelected]}
                >
                    <Text
                        style={[
                            form.chipText,
                            selected === null && form.chipTextSelected,
                        ]}
                    >
                        {allLabel}
                    </Text>
                </Pressable>
            )}

            {options.map((option) => {
                const isSelected = selected === option;

                return (
                    <Pressable
                        key={option}
                        onPress={() => {
                            if (allowClear && isSelected) {
                                onSelect(null);
                                return;
                            }
                            onSelect(option);
                        }}
                        style={[form.chip, isSelected && form.chipSelected]}
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
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    row: {
        marginBottom: theme.space.md,
    },
});
