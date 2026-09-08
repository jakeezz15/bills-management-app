import { modalForm } from "@/styles/modal-form";
import { TextInput } from "react-native";

type SearchFieldProps = {
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
};

export function SearchField({
    value,
    onChangeText,
    placeholder = "Search",
}: SearchFieldProps) {
    return (
        <TextInput
            style={[modalForm.input, { marginBottom: 8 }]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#888"
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
        />
    );
}
