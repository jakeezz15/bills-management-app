import { useIncome } from "@/app/contexts/IncomeContext";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { Income } from "@/types/income";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type IncomeFormProps = {
    visible: boolean;
    onClose: () => void;
    entry?: Income;
};

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

export default function IncomeForm({
    visible,
    onClose,
    entry,
}: IncomeFormProps) {
    const { addIncome, updateIncome, deleteIncome } = useIncome();

    const [source, setSource] = useState("");
    const [net, setNet] = useState("");
    const [gross, setGross] = useState("");
    const [date, setDate] = useState(todayIsoDate());

    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const sourceHasError = showErrors && source.trim() === "";
    const netHasError = showErrors && net.trim() === "";
    const dateHasError =
        showErrors && !/^\d{4}-\d{2}-\d{2}$/.test(date.trim());

    useEffect(() => {
        if (entry) {
            setSource(entry.source);
            setNet(String(entry.net));
            setGross(String(entry.gross));
            setDate(entry.date);
        } else {
            setSource("");
            setNet("");
            setGross("");
            setDate(todayIsoDate());
        }
        setShowErrors(false);
    }, [entry, visible]);

    const handleSubmit = async () => {
        if (!source || !net || !/^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
            setShowErrors(true);
            return;
        }

        const netNumber = Number(net);
        const grossNumber = gross.trim() === "" ? netNumber : Number(gross);

        const payload = {
            source: source.trim(),
            net: netNumber,
            gross: grossNumber,
            date: date.trim(),
        };

        if (entry) {
            await updateIncome(entry.id, payload);
        } else {
            await addIncome({
                id: Date.now().toString(),
                ...payload,
            });
            setSource("");
            setNet("");
            setGross("");
            setDate(todayIsoDate());
        }

        setShowErrors(false);
        onClose();
    };

    const handleDelete = async (id: string) => {
        await deleteIncome(id);
        setSource("");
        setNet("");
        setGross("");
        setDate(todayIsoDate());
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onClose}
        >
            <View style={modalForm.overlay}>
                <View
                    style={[
                        modalForm.card,
                        modalForm.cardResponsive,
                        modalForm.cardShadow,
                    ]}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Text style={modalForm.title}>
                            {entry ? "Update" : "Add"} Income
                        </Text>

                        {entry && (
                            <Pressable
                                onPress={() => handleDelete(entry.id)}
                                accessibilityRole="button"
                                accessibilityLabel="Delete income"
                                hitSlop={8}
                                style={({ pressed }) => [
                                    modalForm.closeButton,
                                    pressed && modalForm.closeButtonPressed,
                                ]}
                            >
                                <Ionicons
                                    name="trash"
                                    size={22}
                                    color="#f74f4f"
                                />
                            </Pressable>
                        )}
                    </View>

                    <Text style={modalForm.label}>Source</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "source" && modalForm.inputFocused,
                            sourceHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. Salary"
                        placeholderTextColor="#888"
                        value={source}
                        onChangeText={setSource}
                        onFocus={() => setFocusedInput("source")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {sourceHasError && (
                        <Text style={modalForm.errorText}>
                            Source is required.
                        </Text>
                    )}

                    <Text style={modalForm.label}>Net (take-home)</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "net" && modalForm.inputFocused,
                            netHasError && modalForm.inputError,
                        ]}
                        placeholder="Ex. 1000"
                        placeholderTextColor="#888"
                        value={net}
                        onChangeText={setNet}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("net")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {netHasError && (
                        <Text style={modalForm.errorText}>
                            Net amount is required.
                        </Text>
                    )}

                    <Text style={modalForm.label}>Gross (optional)</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "gross" && modalForm.inputFocused,
                        ]}
                        placeholder="Defaults to net if empty"
                        placeholderTextColor="#888"
                        value={gross}
                        onChangeText={setGross}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("gross")}
                        onBlur={() => setFocusedInput(null)}
                    />

                    <Text style={modalForm.label}>Pay date</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "date" && modalForm.inputFocused,
                            dateHasError && modalForm.inputError,
                        ]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#888"
                        value={date}
                        onChangeText={setDate}
                        onFocus={() => setFocusedInput("date")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {dateHasError && (
                        <Text style={modalForm.errorText}>
                            Use a date like 2026-09-07.
                        </Text>
                    )}

                    <View style={{ marginBottom: 18 }} />

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.submitButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={handleSubmit}
                    >
                        <Text style={buttonStyle.buttonText}>
                            {entry ? "Update" : "Add"} Income
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            buttonStyle.cancelButton,
                            pressed && buttonStyle.cancelButtonPressed,
                        ]}
                    >
                        <Text style={buttonStyle.buttonText}>
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}
