import { modalForm } from "@/styles/modal-form";
import { ScrollView, Pressable, Text, View, StyleSheet } from "react-native";

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
            contentContainerStyle={styles.row}
        >
            {showAll && (
                <Pressable
                    onPress={() => onSelect(null)}
                    style={[
                        modalForm.typeChip,
                        selected === null && modalForm.typeChipSelected,
                    ]}
                >
                    <Text
                        style={[
                            modalForm.typeChipText,
                            selected === null && modalForm.typeChipTextSelected,
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
                        style={[
                            modalForm.typeChip,
                            isSelected && modalForm.typeChipSelected,
                        ]}
                    >
                        <Text
                            style={[
                                modalForm.typeChipText,
                                isSelected && modalForm.typeChipTextSelected,
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

/** Paid status chips that always keep one selection (All / Unpaid / Paid). */
type PaidFilterChipsProps = {
    options: readonly string[];
    selected: string;
    onSelect: (value: string) => void;
};

export function PaidFilterChips({
    options,
    selected,
    onSelect,
}: PaidFilterChipsProps) {
    return (
        <View style={styles.row}>
            {options.map((option) => {
                const isSelected = selected === option;

                return (
                    <Pressable
                        key={option}
                        onPress={() => onSelect(option)}
                        style={[
                            modalForm.typeChip,
                            isSelected && modalForm.typeChipSelected,
                        ]}
                    >
                        <Text
                            style={[
                                modalForm.typeChipText,
                                isSelected && modalForm.typeChipTextSelected,
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
    row: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 12,
    },
});
