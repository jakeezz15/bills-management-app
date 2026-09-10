import { text, theme } from "@/design";
import { StyleSheet } from "react-native";

export const screenStyles = StyleSheet.create({
    title: text.pageTitle,
    screenDescription: {
        ...text.caption,
        marginTop: theme.space.xs,
    },
});
