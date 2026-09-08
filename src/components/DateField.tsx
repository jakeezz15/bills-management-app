import { modalForm } from "@/styles/modal-form";
import { theme } from "@/theme";
import { parseIsoDate, toIsoDate } from "@/utils/date";
import DateTimePicker, {
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

type DateFieldProps = {
    label: string;
    value: string;
    onChange: (isoDate: string) => void;
    hasError?: boolean;
    errorMessage?: string;
    layout?: "stacked" | "row" | "dialog";
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
    layout = "stacked",
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
            {layout !== "row" ? (
                <Text
                    style={
                        layout === "dialog"
                            ? modalForm.dialogLabel
                            : modalForm.label
                    }
                >
                    {label}
                </Text>
            ) : null}

            <Pressable
                onPress={() => setOpen((prev) => !prev)}
                style={
                    layout === "row"
                        ? [modalForm.cell, { paddingHorizontal: 0, minHeight: 44 }]
                        : layout === "dialog"
                          ? [
                                modalForm.dialogInput,
                                open && modalForm.dialogInputFocused,
                                hasError && modalForm.dialogInputError,
                            ]
                          : [
                                modalForm.input,
                                open && modalForm.inputFocused,
                                hasError && modalForm.inputError,
                            ]
                }
                accessibilityRole="button"
                accessibilityLabel={label}
            >
                {layout === "row" ? (
                    <>
                        <Text style={modalForm.cellLabel}>{label}</Text>
                        <Text
                            style={[
                                modalForm.cellInput,
                                hasError && modalForm.cellInputError,
                                { paddingVertical: 0 },
                            ]}
                        >
                            {displayLabel(value)}
                        </Text>
                    </>
                ) : (
                    <Text style={{ fontSize: 16, color: theme.color.ink }}>
                        {displayLabel(value)}
                    </Text>
                )}
            </Pressable>

            {hasError && errorMessage ? (
                <Text style={modalForm.errorText}>{errorMessage}</Text>
            ) : null}

            {open && (
                <View style={{ marginBottom: layout === "row" ? 0 : 12 }}>
                    <DateTimePicker
                        value={selected}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleChange}
                    />
                    {Platform.OS === "ios" && (
                        <Pressable
                            onPress={() => setOpen(false)}
                            style={{ alignSelf: "flex-end", paddingVertical: 8 }}
                        >
                            <Text
                                style={{
                                    color: theme.color.accentText,
                                    fontWeight: "600",
                                }}
                            >
                                Done
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}
        </View>
    );
}
