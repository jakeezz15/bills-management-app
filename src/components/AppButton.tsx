import { useButtonStyle } from "@/styles/button-style";
import { Pressable, Text } from "react-native";

type AppButtonProps = {
    label: string;
    onPress: () => void;
    variant?: "primary" | "ghost" | "danger";
    disabled?: boolean;
};

export function AppButton({
    label,
    onPress,
    variant = "primary",
    disabled = false,
}: AppButtonProps) {
    const buttonStyle = useButtonStyle();
    const isDanger = variant === "danger";
    const isGhost = variant === "ghost";

    return (
        <Pressable
            disabled={disabled}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            style={({ pressed }) => [
                isGhost || isDanger
                    ? buttonStyle.ghostButton
                    : buttonStyle.normalButton,
                disabled && buttonStyle.disabledButton,
                pressed && !disabled && buttonStyle.buttonPressed,
            ]}
        >
            <Text
                style={[
                    isDanger
                        ? buttonStyle.dangerText
                        : isGhost
                          ? buttonStyle.ghostButtonText
                          : buttonStyle.buttonText,
                    disabled && buttonStyle.disabledButtonText,
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}
