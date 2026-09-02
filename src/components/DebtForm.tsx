import { useDebt } from "@/app/contexts/DebtsContext";
import { modalForm } from "@/styles/modal-form";
import { Debt } from "@/types/debt";
import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";

type DebtFormProps = {
    visible: boolean,
    onClose: () => void;
}

export default function DebtForm({ visible, onClose }: DebtFormProps) {
    const LOAN_TYPES = ["Credit Card", "Student Loan", "Mortgage", "Car Loan", "Personal Loan"] as const;

    const { addDebt } = useDebt();
    const [debtInfo, setDebtInfo] = useState<Debt>({
        id: "",
        name: "",
        balance: 0,
        dueDay: 0,
        isPaid: false,
        type: "",
        minimumPayment: 0,
    });

    const handleSubmit = async () => {
        if (!debtInfo.name.trim() || !debtInfo.type) return;
        if (debtInfo.balance <= 0 || debtInfo.minimumPayment <= 0) return;
        if (debtInfo.dueDay < 1 || debtInfo.dueDay > 31) return;

        await addDebt(debtInfo);

        setDebtInfo({
            ...debtInfo,
            id: Date.now().toString(),
            name: "",
            balance: 0,
            dueDay: 0,
            type: "",
            minimumPayment: 0,
        })
        onClose();
    }

    return (
        <Modal visible={visible} animationType="slide" transparent>
            <View style={modalForm.overlay}>
                <View style={modalForm.card}>
                    <Text style={modalForm.title}>Add Debt</Text>
                    <TextInput
                        style={modalForm.input}
                        placeholder="Debt name"
                        placeholderTextColor="#888"
                        value={debtInfo.name}
                        onChangeText={(text) => setDebtInfo((prev) => ({ ...prev, name: text }))}
                    />
                    <TextInput
                        style={modalForm.input}
                        placeholder="Balance"
                        placeholderTextColor="#888"
                        value={debtInfo.balance ? debtInfo.balance.toString() : ""}
                        onChangeText={(text) =>
                            setDebtInfo((prev) => ({ ...prev, balance: Number(text) || 0 }))
                        }
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={modalForm.input}
                        placeholder="Minimum Payment"
                        placeholderTextColor="#888"
                        value={debtInfo.minimumPayment ? debtInfo.minimumPayment.toString() : ""}
                        onChangeText={(text) =>
                            setDebtInfo((prev) => ({ ...prev, minimumPayment: Number(text) || 0 }))
                        }
                        keyboardType="numeric"
                    />
                    <TextInput
                        style={modalForm.input}
                        placeholder="Due Day"
                        placeholderTextColor="#888"
                        value={debtInfo.dueDay ? debtInfo.dueDay.toString() : ""}
                        onChangeText={(text) =>
                            setDebtInfo((prev) => ({ ...prev, dueDay: Number(text) || 0 }))
                        }
                        keyboardType="numeric"
                    />
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                        {LOAN_TYPES.map((t) => (
                            <Pressable
                                key={t}
                                onPress={() => setDebtInfo((prev) => ({ ...prev, type: t }))}
                                style={{
                                    padding: 8,
                                    borderWidth: 1,
                                    borderColor: debtInfo.type === t ? "#208AEF" : "#ccc",
                                    borderRadius: 8,
                                }}
                            >
                                <Text>{t}</Text>
                            </Pressable>
                        ))}
                    </View>

                    <Pressable onPress={handleSubmit} style={modalForm.submitButton}>
                        <Text style={modalForm.submitButton}>Add Debt</Text>
                    </Pressable>
                    <Pressable onPress={onClose} style={modalForm.cancel}>
                        <Text style={modalForm.cancel}>Cancel</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );

}

