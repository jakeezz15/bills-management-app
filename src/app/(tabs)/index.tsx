import { screenStyles } from "@/styles/screen";
import { ScrollView, Text } from "react-native";

export default function HomeScreen() {
    return (
        <ScrollView style={screenStyles.section} contentContainerStyle={screenStyles.content}>
            <Text style={screenStyles.title}>Home</Text>

        </ScrollView>
    );
}

