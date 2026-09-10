import { buttonStyle } from "@/styles/button-style";
import { Pressable, Text } from "react-native";

type AppButtonProps = {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "ghost" | "danger";
    disabled?: boolean;
};

export function AppButton({
    label,
    onPress,
    variant = "primary",
    disabled = false,
}: AppButtonProps) {
    const isDanger = variant === "danger";
    const isGhost = variant === "ghost";
    const isSecondary = variant === "secondary";

    return (
        <Pressable
            disabled={disabled}
            onPress={onPress}
            accessibilityRole="button"
            style={({ pressed }) => [
                isGhost || isDanger
                    ? buttonStyle.ghostButton
                    : isSecondary
                      ? buttonStyle.secondaryButton
                      : buttonStyle.normalButton,
                disabled && buttonStyle.disabledButton,
                pressed && buttonStyle.buttonPressed,
            ]}
        >
            <Text
                style={
                    isDanger
                        ? buttonStyle.dangerText
                        : isGhost
                          ? buttonStyle.ghostButtonText
                          : isSecondary
                            ? buttonStyle.secondaryButtonText
                            : buttonStyle.buttonText
                }
            >
                {label}
            </Text>
        </Pressable>
    );
}
