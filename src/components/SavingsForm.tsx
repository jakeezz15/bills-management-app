import { useSavings } from "@/app/contexts/SavingsContext";
import { buttonStyle } from "@/styles/button-style";
import { modalForm } from "@/styles/modal-form";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type SavingsFormProps = {
    visible: boolean;
    onClose: () => void;
};

export default function SavingsForm({
    visible,
    onClose,
}: SavingsFormProps) {
    const { addSavings } = useSavings();

    const [name, setName] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("");
    const [monthlyContribution, setMonthlyContribution] = useState("");

    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    const nameHasError = showErrors && name.trim() === "";
    const targetHasError = showErrors && targetAmount.trim() === "";
    const currentHasError = showErrors && currentAmount.trim() === "";
    const contributionHasError = showErrors && monthlyContribution.trim() === "";

    const handleSubmit = async () => {
        if (!name || !targetAmount || !currentAmount || !monthlyContribution) {
            setShowErrors(true);
            return;
        }

        await addSavings({
            id: Date.now().toString(),
            name,
            targetAmount: Number(targetAmount),
            currentAmount: Number(currentAmount),
            monthlyContribution: Number(monthlyContribution),
        });

        setName("");
        setTargetAmount("");
        setCurrentAmount("");
        setMonthlyContribution("");
        setShowErrors(false);

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
                    <Text style={modalForm.title}>Add Savings</Text>

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "name" && modalForm.inputFocused,
                            nameHasError && modalForm.inputError,
                        ]}
                        placeholder="Savings name"
                        placeholderTextColor="#888"
                        value={name}
                        onChangeText={setName}
                        onFocus={() => setFocusedInput("name")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {nameHasError && (
                        <Text style={modalForm.errorText}>
                            Savings name is required.
                        </Text>
                    )}

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "targetAmount" && modalForm.inputFocused,
                            targetHasError && modalForm.inputError,
                        ]}
                        placeholder="Target amount"
                        placeholderTextColor="#888"
                        value={targetAmount}
                        onChangeText={setTargetAmount}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("targetAmount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {targetHasError && (
                        <Text style={modalForm.errorText}>
                            Target amount is required.
                        </Text>
                    )}

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "currentAmount" && modalForm.inputFocused,
                            currentHasError && modalForm.inputError,
                        ]}
                        placeholder="Current amount"
                        placeholderTextColor="#888"
                        value={currentAmount}
                        onChangeText={setCurrentAmount}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("currentAmount")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {currentHasError && (
                        <Text style={modalForm.errorText}>
                            Current amount is required.
                        </Text>
                    )}

                    <TextInput
                        style={[
                            modalForm.input,
                            focusedInput === "monthlyContribution" && modalForm.inputFocused,
                            contributionHasError && modalForm.inputError,
                        ]}
                        placeholder="Monthly contribution"
                        placeholderTextColor="#888"
                        value={monthlyContribution}
                        onChangeText={setMonthlyContribution}
                        keyboardType="numeric"
                        onFocus={() => setFocusedInput("monthlyContribution")}
                        onBlur={() => setFocusedInput(null)}
                    />
                    {contributionHasError && (
                        <Text style={modalForm.errorText}>
                            Monthly contribution is required.
                        </Text>
                    )}

                    <Pressable
                        style={({ pressed }) => [
                            buttonStyle.submitButton,
                            pressed && buttonStyle.buttonPressed,
                        ]}
                        onPress={handleSubmit}
                    >
                        <Text style={buttonStyle.buttonText}>
                            Add Savings
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
