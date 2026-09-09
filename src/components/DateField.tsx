import { theme } from "@/design";
import { form } from "@/styles/form";
import { parseIsoDate, toIsoDate } from "@/utils/date";
import DateTimePicker, {
    DateTimePickerEvent,
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

    const handleChange = (event: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === "android") {
            setOpen(false);
        }

        if (event.type === "dismissed") {
            setOpen(false);
            return;
        }

        if (date) {
            onChange(toIsoDate(date));
        }
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

            {open && (
                <View style={styles.picker}>
                    <DateTimePicker
                        value={selected}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleChange}
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
            )}
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
