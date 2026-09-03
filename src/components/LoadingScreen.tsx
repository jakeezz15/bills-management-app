import { screenStyles } from "@/styles/screen";
import { Text, View } from "react-native";


export function LoadingScreen() {
    return (
        <View style={screenStyles.loading}>
            <Text style={screenStyles.loadingText}>
                Loading...
            </Text>
        </View>
    )
}