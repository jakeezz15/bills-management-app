import { formColors } from "@/styles/form";
import { theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type SearchFieldProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    accessibilityLabel?: string;
};

/**
 * Filter field for ledgers. Lives below the hero so the money figure stays
 * period-wide; typing only changes which rows you see.
 */
export function SearchField({
    value,
    onChange,
    placeholder,
    accessibilityLabel = "Search",
}: SearchFieldProps) {
    return (
        <View style={styles.wrap}>
            <Ionicons
                name="search-outline"
                size={18}
                color={theme.text.tertiary}
                accessibilityElementsHidden
            />
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor={formColors.placeholder}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
                accessibilityLabel={accessibilityLabel}
            />
            {value.length > 0 ? (
                <Pressable
                    onPress={() => onChange("")}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search"
                    hitSlop={8}
                    style={({ pressed }) => [
                        styles.clear,
                        pressed && { opacity: 0.7 },
                    ]}
                >
                    <Ionicons
                        name="close-circle"
                        size={18}
                        color={theme.text.tertiary}
                    />
                </Pressable>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    wrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: theme.space.sm,
        marginBottom: theme.space.sm,
        paddingHorizontal: theme.space.md,
        backgroundColor: theme.bg.sunken,
        borderWidth: 1,
        borderColor: theme.border.subtle,
        borderRadius: theme.radius.sm,
    },
    input: {
        flex: 1,
        color: theme.text.primary,
        fontSize: theme.fontSize.md,
        minHeight: theme.size.tap,
        paddingVertical: theme.space.sm,
    },
    clear: {
        minWidth: theme.size.control,
        minHeight: theme.size.control,
        alignItems: "center",
        justifyContent: "center",
    },
});
