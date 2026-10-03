import { AppButton } from "@/components/AppButton";
import { useTheme } from "@/app/contexts/ThemeContext";
import { text } from "@/design";
import { useEffect, useMemo } from "react";
import {
    Dimensions,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeInDown,
    FadeInUp,
    FadeOut,
    ReduceMotion,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalkthrough } from "./WalkthroughContext";

const PAD = 10;
const VEIL = "rgba(15, 23, 42, 0.58)";

/**
 * Game-style spotlight with Welcome-page pacing:
 * fade out → settle on the next target → fade the hole + bubble back in.
 */
export function WalkthroughOverlay() {
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const {
        phase,
        step,
        stepIndex,
        totalSteps,
        target,
        targetStepId,
        transitioning,
        next,
        skip,
    } = useWalkthrough();

    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(0.72, {
                    duration: 1100,
                    easing: Easing.inOut(Easing.sin),
                }),
                withTiming(1, {
                    duration: 1100,
                    easing: Easing.inOut(Easing.sin),
                })
            ),
            -1,
            false
        );
    }, [pulse, step?.id]);

    const ringStyle = useAnimatedStyle(() => ({
        opacity: pulse.value,
    }));

    const styles = useMemo(
        () =>
            StyleSheet.create({
                root: {
                    flex: 1,
                },
                dim: {
                    position: "absolute",
                    backgroundColor: VEIL,
                },
                fullDim: {
                    ...StyleSheet.absoluteFill,
                    backgroundColor: VEIL,
                },
                hole: {
                    position: "absolute",
                    borderRadius: theme.radius.lg,
                    borderWidth: 2,
                    borderColor: theme.action.primary.bg,
                    backgroundColor: "transparent",
                },
                bubble: {
                    position: "absolute",
                    left: theme.space.screenX,
                    right: theme.space.screenX,
                    backgroundColor: theme.bg.surface,
                    borderRadius: theme.radius.lg,
                    padding: theme.space.lg,
                    gap: theme.space.sm,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.border.subtle,
                },
                kicker: text.sectionLabel,
                title: {
                    color: theme.text.primary,
                    fontSize: theme.fontSize.xl,
                    lineHeight: theme.lineHeight.xl,
                    fontWeight: theme.fontWeight.bold,
                    letterSpacing: -0.4,
                },
                body: {
                    ...text.body,
                    color: theme.text.secondary,
                },
                footer: {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: theme.space.sm,
                    marginTop: theme.space.sm,
                },
                nextWrap: {
                    flexShrink: 0,
                },
                skip: {
                    paddingVertical: theme.space.sm,
                    paddingHorizontal: theme.space.xs,
                },
                skipText: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.semibold,
                },
                progress: {
                    color: theme.text.tertiary,
                    fontSize: theme.fontSize.xs,
                    fontWeight: theme.fontWeight.semibold,
                    flex: 1,
                    textAlign: "center",
                },
                chip: {
                    position: "absolute",
                    paddingHorizontal: theme.space.sm,
                    paddingVertical: theme.space.xs,
                    borderRadius: theme.radius.pill,
                    backgroundColor: theme.intent.positive.solid,
                },
                chipText: {
                    color: theme.action.primary.fg,
                    fontSize: theme.fontSize.sm,
                    fontWeight: theme.fontWeight.bold,
                },
            }),
        [theme]
    );

    if (phase !== "running" || !step) {
        return null;
    }

    if (step.id === "home-due") {
        return null;
    }

    const { width: winW, height: winH } = Dimensions.get("window");
    const holeReady =
        !transitioning && target != null && targetStepId === step.id;
    const hole = holeReady
        ? {
              left: Math.max(0, target.x - PAD),
              top: Math.max(0, target.y - PAD),
              width: Math.min(winW, target.width + PAD * 2),
              height: Math.min(winH, target.height + PAD * 2),
          }
        : null;

    const bubbleApproxH = 210;
    let bubbleTop = insets.top + theme.space.xl;
    if (hole) {
        const spaceBelow = winH - (hole.top + hole.height) - insets.bottom;
        const spaceAbove = hole.top - insets.top;
        const preferBelow = step.preferBubble === "below";
        if (preferBelow && spaceBelow > bubbleApproxH) {
            bubbleTop = hole.top + hole.height + theme.space.md;
        } else if (!preferBelow && spaceAbove > bubbleApproxH) {
            bubbleTop = Math.max(
                insets.top + theme.space.sm,
                hole.top - bubbleApproxH - theme.space.md
            );
        } else if (spaceBelow >= spaceAbove) {
            bubbleTop = hole.top + hole.height + theme.space.md;
        } else {
            bubbleTop = Math.max(
                insets.top + theme.space.sm,
                hole.top - bubbleApproxH - theme.space.md
            );
        }
    }

    const isLast = stepIndex >= totalSteps - 1;
    const BubbleEnter =
        step.preferBubble === "below" ? FadeInUp : FadeInDown;

    return (
        <Modal
            visible
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={skip}
        >
            <View style={styles.root} pointerEvents="box-none">
                {hole ? (
                    <Animated.View
                        key={`spot-${step.id}`}
                        entering={FadeIn.duration(440)
                            .delay(40)
                            .reduceMotion(ReduceMotion.System)}
                        exiting={FadeOut.duration(220).reduceMotion(
                            ReduceMotion.System
                        )}
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                    >
                        <View
                            style={[
                                styles.dim,
                                {
                                    left: 0,
                                    top: 0,
                                    right: 0,
                                    height: hole.top,
                                },
                            ]}
                        />
                        <View
                            style={[
                                styles.dim,
                                {
                                    left: 0,
                                    top: hole.top + hole.height,
                                    right: 0,
                                    bottom: 0,
                                },
                            ]}
                        />
                        <View
                            style={[
                                styles.dim,
                                {
                                    left: 0,
                                    top: hole.top,
                                    width: hole.left,
                                    height: hole.height,
                                },
                            ]}
                        />
                        <View
                            style={[
                                styles.dim,
                                {
                                    left: hole.left + hole.width,
                                    top: hole.top,
                                    right: 0,
                                    height: hole.height,
                                },
                            ]}
                        />
                        <Animated.View
                            style={[styles.hole, hole, ringStyle]}
                        />
                        {step.showDemoChip ? (
                            <Animated.View
                                entering={FadeIn.duration(480)
                                    .delay(240)
                                    .reduceMotion(ReduceMotion.System)}
                                pointerEvents="none"
                                style={[
                                    styles.chip,
                                    {
                                        left: Math.max(8, hole.left - 12),
                                        top: Math.max(8, hole.top - 28),
                                    },
                                ]}
                            >
                                <Text style={styles.chipText}>+$120</Text>
                            </Animated.View>
                        ) : null}
                    </Animated.View>
                ) : (
                    <Animated.View
                        key="veil"
                        entering={FadeIn.duration(280).reduceMotion(
                            ReduceMotion.System
                        )}
                        exiting={FadeOut.duration(180).reduceMotion(
                            ReduceMotion.System
                        )}
                        pointerEvents="none"
                        style={styles.fullDim}
                    />
                )}

                {hole ? (
                    <Animated.View
                        key={step.id}
                        entering={BubbleEnter.duration(480)
                            .delay(100)
                            .reduceMotion(ReduceMotion.System)}
                        exiting={FadeOut.duration(200).reduceMotion(
                            ReduceMotion.System
                        )}
                        style={[styles.bubble, { top: bubbleTop }]}
                    >
                        <Text style={styles.kicker}>Walkthrough</Text>
                        <Text style={styles.title} accessibilityRole="header">
                            {step.title}
                        </Text>
                        <Text style={styles.body}>{step.body}</Text>
                        <View style={styles.footer}>
                            <Pressable
                                onPress={skip}
                                accessibilityRole="button"
                                accessibilityLabel="Skip walkthrough"
                                style={styles.skip}
                                hitSlop={8}
                            >
                                <Text style={styles.skipText}>Skip</Text>
                            </Pressable>
                            <Text style={styles.progress}>
                                {stepIndex + 1} / {totalSteps}
                            </Text>
                            <View style={styles.nextWrap}>
                                <AppButton
                                    label={isLast ? "Done" : "Next"}
                                    onPress={next}
                                    disabled={transitioning}
                                />
                            </View>
                        </View>
                    </Animated.View>
                ) : null}
            </View>
        </Modal>
    );
}
