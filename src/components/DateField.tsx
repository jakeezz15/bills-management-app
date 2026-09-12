import { theme } from "@/design";
import { form } from "@/styles/form";
import { parseIsoDate, toIsoDate } from "@/utils/date";
import DateTimePicker, {
    DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type DateFieldProps = {
    label: string;
    value: string;
    onChange: (isoDate: string) => void;
    hasError?: boolean;
    errorMessage?: string;
};

function displayLabel(iso: string): string {
    const parsed = parseIsoDate(iso);
    if (!parsed) {
        return "Select a date";
    }
    return parsed.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export function DateField({
    label,
    value,
    onChange,
    hasError = false,
    errorMessage,
}: DateFieldProps) {
    const [open, setOpen] = useState(false);
    const selected = parseIsoDate(value) ?? new Date();

    const handleValueChange = (
        _event: DateTimePickerChangeEvent,
        date: Date
    ) => {
        if (Platform.OS === "android") {
            setOpen(false);
        }
        onChange(toIsoDate(date));
    };

    const handleDismiss = () => {
        setOpen(false);
    };

    return (
        <View>
            <Text style={form.label}>{label}</Text>

            <Pressable
                onPress={() => setOpen((prev) => !prev)}
                style={[
                    form.input,
                    open && form.inputFocused,
                    hasError && form.inputError,
                ]}
                accessibilityRole="button"
                accessibilityLabel={label}
            >
                <Text style={styles.value}>{displayLabel(value)}</Text>
            </Pressable>

            {hasError && errorMessage ? (
                <Text style={form.error}>{errorMessage}</Text>
            ) : null}

            {open && Platform.OS !== "web" ? (
                <View style={styles.picker}>
                    <DateTimePicker
                        value={selected}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        // iOS follows the *device* appearance for spinner text.
                        // Dark-mode phones + our light form = invisible white text.
                        themeVariant="light"
                        textColor={theme.text.primary}
                        onValueChange={handleValueChange}
                        onDismiss={handleDismiss}
                    />
                    {Platform.OS === "ios" && (
                        <Pressable
                            onPress={() => setOpen(false)}
                            style={styles.done}
                        >
                            <Text style={styles.doneText}>Done</Text>
                        </Pressable>
                    )}
                </View>
            ) : null}

            {open && Platform.OS === "web" ? (
                <Text style={form.helper}>
                    Date picking isn’t supported in the browser. Use Expo Go or
                    a device build.
                </Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    value: {
        fontSize: theme.fontSize.md,
        color: theme.text.primary,
    },
    picker: {
        marginBottom: theme.space.md,
    },
    done: {
        alignSelf: "flex-end",
        paddingVertical: theme.space.sm,
    },
    doneText: {
        color: theme.text.accent,
        fontWeight: theme.fontWeight.semibold,
    },
});
