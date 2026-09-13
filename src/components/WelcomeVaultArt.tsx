import { theme } from "@/design";
import Ionicons from "@react-native-vector-icons/ionicons";
import { useEffect, useState } from "react";
import {
    AccessibilityInfo,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    ReduceMotion,
    cancelAnimation,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";

type FloatSpec = {
    icon: "cash-outline" | "logo-usd" | "wallet-outline" | "card-outline";
    left: number;
    top: number;
    size: number;
    delay: number;
    drift: number;
    color: string;
    tint: string;
    tip: string;
    /** Where the tip sits relative to the chip (avoids clipping). */
    bubbleAnchor: "top" | "bottom";
};

const FLOATS: FloatSpec[] = [
    {
        icon: "cash-outline",
        left: 4,
        top: 36,
        size: 20,
        delay: 0,
        drift: 11,
        color: theme.chart[1],
        tint: "rgba(5, 150, 105, 0.22)",
        tip: "Manage your income and profits",
        bubbleAnchor: "bottom",
    },
    {
        icon: "logo-usd",
        left: 168,
        top: 28,
        size: 18,
        delay: 220,
        drift: 13,
        color: theme.chart[2],
        tint: "rgba(217, 119, 6, 0.22)",
        tip: "See what’s left after bills",
        bubbleAnchor: "bottom",
    },
    {
        icon: "wallet-outline",
        left: 156,
        top: 118,
        size: 18,
        delay: 480,
        drift: 10,
        color: theme.chart[0],
        tint: "rgba(37, 99, 235, 0.22)",
        tip: "Keep wallets and balances clear",
        bubbleAnchor: "top",
    },
    {
        icon: "card-outline",
        left: 18,
        top: 124,
        size: 18,
        delay: 700,
        drift: 9,
        color: theme.chart[5],
        tint: "rgba(8, 145, 178, 0.22)",
        tip: "Stay ahead of payments",
        bubbleAnchor: "top",
    },
];

const TIP_VISIBLE_MS = 4200;
const TIP_GAP_MS = 1100;
const TIP_START_DELAY_MS = 1200;

function TipBubble({
    tip,
    visible,
    anchor,
    accent,
}: {
    tip: string;
    visible: boolean;
    anchor: "top" | "bottom";
    accent: string;
}) {
    const scale = useSharedValue(0.55);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (visible) {
            // Grow up: soft spring with a little overshoot, then settle.
            scale.value = withSequence(
                withSpring(1.08, {
                    damping: 11,
                    stiffness: 140,
                    mass: 0.9,
                }),
                withSpring(1, {
                    damping: 14,
                    stiffness: 180,
                    mass: 0.8,
                })
            );
            opacity.value = withTiming(1, { duration: 220 });
        } else {
            scale.value = withTiming(0.55, {
                duration: 240,
                easing: Easing.in(Easing.quad),
            });
            opacity.value = withTiming(0, { duration: 220 });
        }
    }, [opacity, scale, visible]);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [
            { scale: scale.value },
            {
                translateY:
                    anchor === "bottom"
                        ? (1 - scale.value) * -10
                        : (1 - scale.value) * 10,
            },
        ],
    }));

    return (
        <Animated.View
            style={[
                styles.bubble,
                anchor === "bottom" ? styles.bubbleBelow : styles.bubbleAbove,
                style,
            ]}
            pointerEvents="none"
        >
            {anchor === "bottom" ? (
                <View
                    style={[styles.tailUp, { borderBottomColor: accent }]}
                />
            ) : null}
            <View style={[styles.bubbleBody, { borderColor: accent }]}>
                <Text style={styles.bubbleText}>{tip}</Text>
            </View>
            {anchor === "top" ? (
                <View style={[styles.tailDown, { borderTopColor: accent }]} />
            ) : null}
        </Animated.View>
    );
}

function FloatingGlyph({
    icon,
    left,
    top,
    size,
    delay,
    drift,
    color,
    tint,
    tip,
    bubbleAnchor,
    active,
}: FloatSpec & { active: boolean }) {
    const y = useSharedValue(0);
    const opacity = useSharedValue(0.55);
    const chipScale = useSharedValue(1);

    useEffect(() => {
        y.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(-drift, {
                        duration: 1700,
                        easing: Easing.inOut(Easing.sin),
                    }),
                    withTiming(drift * 0.35, {
                        duration: 1700,
                        easing: Easing.inOut(Easing.sin),
                    })
                ),
                -1,
                true
            )
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: 1500 }),
                    withTiming(0.55, { duration: 1500 })
                ),
                -1,
                true
            )
        );
        return () => {
            cancelAnimation(y);
            cancelAnimation(opacity);
        };
    }, [delay, drift, opacity, y]);

    useEffect(() => {
        chipScale.value = withSpring(active ? 1.18 : 1, {
            damping: 16,
            stiffness: 220,
        });
    }, [active, chipScale]);

    const style = useAnimatedStyle(() => ({
        transform: [{ translateY: y.value }, { scale: chipScale.value }],
        opacity: active ? 1 : opacity.value,
        zIndex: active ? 8 : 2,
    }));

    return (
        <Animated.View
            style={[styles.float, { left, top }, style]}
            pointerEvents="none"
        >
            <TipBubble
                tip={tip}
                visible={active}
                anchor={bubbleAnchor}
                accent={color}
            />
            <View style={[styles.floatChip, { backgroundColor: tint }]}>
                <Ionicons name={icon} size={size} color={color} />
            </View>
        </Animated.View>
    );
}

/**
 * Colorful vault cluster for welcome — multi-accent orbs + floating money chips
 * that take turns showing tip bubbles.
 */
export function WelcomeVaultArt() {
    const pulse = useSharedValue(1);
    const spin = useSharedValue(0);
    const [activeIndex, setActiveIndex] = useState(-1);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        let mounted = true;
        void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
            if (mounted) setReduceMotion(enabled);
        });
        const sub = AccessibilityInfo.addEventListener(
            "reduceMotionChanged",
            setReduceMotion
        );
        return () => {
            mounted = false;
            sub.remove();
        };
    }, []);

    useEffect(() => {
        if (reduceMotion) {
            setActiveIndex(0);
            return;
        }

        let cancelled = false;
        let hideTimer: ReturnType<typeof setTimeout> | undefined;
        let nextTimer: ReturnType<typeof setTimeout> | undefined;
        let index = 0;

        const showNext = () => {
            if (cancelled) return;
            setActiveIndex(index);
            hideTimer = setTimeout(() => {
                if (cancelled) return;
                setActiveIndex(-1);
                nextTimer = setTimeout(() => {
                    index = (index + 1) % FLOATS.length;
                    showNext();
                }, TIP_GAP_MS);
            }, TIP_VISIBLE_MS);
        };

        const startTimer = setTimeout(showNext, TIP_START_DELAY_MS);

        return () => {
            cancelled = true;
            clearTimeout(startTimer);
            if (hideTimer) clearTimeout(hideTimer);
            if (nextTimer) clearTimeout(nextTimer);
        };
    }, [reduceMotion]);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.05, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                }),
                withTiming(1, {
                    duration: 1500,
                    easing: Easing.inOut(Easing.quad),
                })
            ),
            -1,
            true
        );
        spin.value = withRepeat(
            withTiming(1, {
                duration: 14000,
                easing: Easing.linear,
            }),
            -1,
            false
        );
        return () => {
            cancelAnimation(pulse);
            cancelAnimation(spin);
        };
    }, [pulse, spin]);

    const vaultStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulse.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${spin.value * 360}deg` }],
    }));

    return (
        <Animated.View
            entering={FadeIn.duration(520).reduceMotion(ReduceMotion.System)}
            style={styles.stage}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <View style={[styles.orb, styles.orbEmerald]} />
            <View style={[styles.orb, styles.orbBlue]} />
            <View style={[styles.orb, styles.orbAmber]} />
            <View style={[styles.orb, styles.orbCyan]} />

            <Animated.View style={[styles.orbitRing, ringStyle]}>
                <View style={styles.orbitDot} />
                <View style={[styles.orbitDot, styles.orbitDotAlt]} />
            </Animated.View>

            {FLOATS.map((spec, index) => (
                <FloatingGlyph
                    key={`${spec.icon}-${spec.left}`}
                    {...spec}
                    active={activeIndex === index}
                />
            ))}

            <Animated.View style={[styles.vaultRing, vaultStyle]}>
                <View style={styles.vaultInner}>
                    <Ionicons
                        name="safe-outline"
                        size={48}
                        color={theme.text.inverse}
                    />
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const STAGE = 220;

const styles = StyleSheet.create({
    stage: {
        width: STAGE,
        height: STAGE,
        alignSelf: "center",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
        zIndex: 2,
    },
    orb: {
        position: "absolute",
        borderRadius: 999,
    },
    orbEmerald: {
        width: 150,
        height: 150,
        top: 20,
        left: 28,
        backgroundColor: "rgba(52, 211, 153, 0.28)",
    },
    orbBlue: {
        width: 110,
        height: 110,
        top: 8,
        right: 8,
        backgroundColor: "rgba(59, 130, 246, 0.32)",
    },
    orbAmber: {
        width: 90,
        height: 90,
        bottom: 18,
        left: 8,
        backgroundColor: "rgba(245, 158, 11, 0.28)",
    },
    orbCyan: {
        width: 70,
        height: 70,
        bottom: 28,
        right: 22,
        backgroundColor: "rgba(34, 211, 238, 0.26)",
    },
    orbitRing: {
        position: "absolute",
        width: 168,
        height: 168,
        borderRadius: 84,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.18)",
        borderStyle: "dashed",
    },
    orbitDot: {
        position: "absolute",
        top: -5,
        left: 78,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: theme.chart[1],
    },
    orbitDotAlt: {
        top: undefined,
        bottom: -5,
        backgroundColor: theme.chart[2],
    },
    vaultRing: {
        width: 108,
        height: 108,
        borderRadius: 54,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(30, 41, 59, 0.92)",
        borderWidth: 2,
        borderColor: "rgba(52, 211, 153, 0.55)",
        zIndex: 1,
    },
    vaultInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.bg.inverse,
    },
    float: {
        position: "absolute",
        zIndex: 2,
        alignItems: "center",
    },
    floatChip: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255, 255, 255, 0.2)",
    },
    bubble: {
        position: "absolute",
        width: 176,
        alignItems: "center",
    },
    bubbleBelow: {
        top: 48,
        left: -68,
    },
    bubbleAbove: {
        bottom: 48,
        left: -68,
    },
    bubbleBody: {
        backgroundColor: "rgba(15, 23, 42, 0.96)",
        borderRadius: 14,
        borderWidth: 1.5,
        paddingHorizontal: 12,
        paddingVertical: 10,
        maxWidth: 176,
    },
    bubbleText: {
        color: theme.text.inverse,
        fontSize: 13,
        lineHeight: 18,
        fontWeight: theme.fontWeight.medium,
        textAlign: "center",
    },
    tailUp: {
        width: 0,
        height: 0,
        marginTop: -1,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 9,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: theme.text.inverse,
    },
    tailDown: {
        width: 0,
        height: 0,
        marginBottom: -1,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 9,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: theme.text.inverse,
    },
});
