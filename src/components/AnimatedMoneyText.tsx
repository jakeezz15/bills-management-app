import { useCallback, useEffect, useRef, useState } from "react";
import { StyleProp, TextProps, TextStyle } from "react-native";
import Animated, {
    Easing,
    ReduceMotion,
    runOnJS,
    useAnimatedReaction,
    useAnimatedStyle,
    useReducedMotion,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";

type AnimatedMoneyTextProps = Omit<TextProps, "children"> & {
    amount: number;
    format: (amount: number) => string;
    style?: StyleProp<TextStyle>;
};

/**
 * Formats `amount` on each frame so leftover/available can count to the
 * new figure. A small scale bump plays only when the number goes up.
 * Reduced motion snaps with no bump.
 */
export function AnimatedMoneyText({
    amount,
    format,
    style,
    ...textProps
}: AnimatedMoneyTextProps) {
    const reduceMotion = useReducedMotion();
    const progress = useSharedValue(amount);
    const bump = useSharedValue(1);
    const formatRef = useRef(format);
    const skipBump = useRef(true);
    const [formatFn, setFormatFn] = useState(() => format);
    const [label, setLabel] = useState(() => format(amount));

    if (format !== formatFn) {
        setFormatFn(() => format);
        setLabel(format(amount));
    }

    useEffect(() => {
        formatRef.current = formatFn;
    }, [formatFn]);

    const applyLabel = useCallback((next: number) => {
        setLabel(formatRef.current(next));
    }, []);

    useEffect(() => {
        if (reduceMotion) {
            progress.value = amount;
            bump.value = 1;
            applyLabel(amount);
            skipBump.current = false;
            return;
        }

        const goingUp = amount > progress.value + 0.5;
        progress.value = withTiming(amount, {
            duration: 280,
            easing: Easing.out(Easing.cubic),
            reduceMotion: ReduceMotion.System,
        });

        if (goingUp && !skipBump.current) {
            bump.value = withSequence(
                withTiming(1.04, {
                    duration: 120,
                    reduceMotion: ReduceMotion.System,
                }),
                withTiming(1, {
                    duration: 160,
                    reduceMotion: ReduceMotion.System,
                })
            );
        }
        skipBump.current = false;
    }, [amount, applyLabel, bump, progress, reduceMotion]);

    useAnimatedReaction(
        () => progress.value,
        (current) => {
            runOnJS(applyLabel)(current);
        }
    );

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: bump.value }],
    }));

    return (
        <Animated.Text style={[style, animatedStyle]} {...textProps}>
            {label}
        </Animated.Text>
    );
}
