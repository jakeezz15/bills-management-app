import { useSavings } from "@/app/contexts/SavingsContext";
import { modalForm } from "@/styles/modal-form";
import { SavingsGoal } from "@/types/savings";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type SavingsFormProps = {
    visible: boolean,
    onClose: () => void;
}

export default function SavingsForm({ visible, onClose }: SavingsFormProps) {

    const { addSavings } = useSavings();
    const [savingsInfo, setSavingsInfo] = useState<SavingsGoal>({
        id: "",
        name: "",
        currentAmount: 0,
        targetAmount: 0,
        monthlyContribution: 0
    });

    const handleSubmit = async () => {

        await addSavings({
            id: Date.now().toString(),
            name: savingsInfo.name,
            currentAmount: Number(savingsInfo.currentAmount),
            targetAmount: Number(savingsInfo.targetAmount),
            monthlyContribution: Number(savingsInfo.monthlyContribution),
        });

        setSavingsInfo({
            id: "",
            name: "",
            currentAmount: 0,
            targetAmount: 0,
            monthlyContribution: 0

        })
        onClose();
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalForm.overlay}>
                <View style={modalForm.card}>
                    <Text style={modalForm.title}>Add Savings</Text>
                    <TextInput
                        style={modalForm.input}
                        placeholder="Savings Name"
                        placeholderTextColor="#888"
                        value={savingsInfo.name}
                        onChangeText={(savingName) => setSavingsInfo((prev) => ({ ...prev, name: savingName }))}

                    />

                    <TextInput
                        style={modalForm.input}
                        placeholder="Target Amount"
                        placeholderTextColor="#888"
                        value={savingsInfo.targetAmount ? savingsInfo.targetAmount.toString() : ""}
                        onChangeText={(targetAmount) => setSavingsInfo((prev) => ({ ...prev, targetAmount: Number(targetAmount) || 0 }))}
                    />

                    <TextInput
                        style={modalForm.input}
                        placeholder="Current Amount"
                        placeholderTextColor="#888"
                        value={savingsInfo.currentAmount ? savingsInfo.currentAmount.toString() : ""}
                        onChangeText={(currentAmount) => setSavingsInfo((prev) => ({ ...prev, currentAmount: Number(currentAmount) || 0 }))}
                    />

                    <TextInput
                        style={modalForm.input}
                        placeholder="Monthly Contribution"
                        placeholderTextColor="#888"
                        value={savingsInfo.monthlyContribution ? savingsInfo.monthlyContribution.toString() : ""}
                        onChangeText={(monthlyContribution) => setSavingsInfo((prev) => ({ ...prev, monthlyContribution: Number(monthlyContribution) || 0 }))}
                    />

                    <Pressable style={modalForm.submitButton} onPress={handleSubmit}><Text style={modalForm.submitButton}>Add Savings</Text></Pressable>
                    <Pressable onPress={onClose} style={modalForm.cancel}>
                        <Text style={modalForm.cancel}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );

}

