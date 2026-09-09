import { screenStyles } from "@/styles/screen";
import { theme } from "@/design";
import { ActivityIndicator, Text, View } from "react-native";

export function LoadingScreen() {
    return (
        <View
            style={screenStyles.loading}
            accessibilityRole="progressbar"
            accessibilityLabel="Loading"
        >
            <ActivityIndicator size="large" color={theme.text.primary} />
            <Text style={screenStyles.loadingText}>Loading</Text>
        </View>
    );
}
