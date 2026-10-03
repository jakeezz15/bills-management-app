import { useTheme } from "@/app/contexts/ThemeContext";
import { accountAvatarLetter } from "@/utils/accounts";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

type AccountAvatarProps = {
    name: string;
    color: string;
    /** Diameter in px. Defaults to 36. */
    size?: number;
};

/**
 * Letter avatar for a money pot — no brand logos, just the first
 * alphanumeric character on the account accent color.
 */
export function AccountAvatar({
    name,
    color,
    size = 36,
}: AccountAvatarProps) {
    const { theme } = useTheme();
    const letter = accountAvatarLetter(name);
    const styles = useMemo(
        () =>
            StyleSheet.create({
                wrap: {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: color,
                    alignItems: "center",
                    justifyContent: "center",
                },
                letter: {
                    color: theme.text.inverse,
                    fontSize: Math.round(size * 0.42),
                    fontWeight: "700",
                    lineHeight: Math.round(size * 0.5),
                },
            }),
        [color, size, theme.text.inverse]
    );

    return (
        <View
            style={styles.wrap}
            accessibilityLabel={`${name} avatar`}
            accessibilityRole="image"
        >
            <Text style={styles.letter}>{letter}</Text>
        </View>
    );
}
