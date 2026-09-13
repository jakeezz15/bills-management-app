import { useDashboardStyles } from "@/styles/dashboard";
import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";
import Animated, {
    FadeInDown,
    FadeOutUp,
    ReduceMotion,
} from "react-native-reanimated";

type StickyHeroBarProps = {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
};

const enter = FadeInDown.duration(180).reduceMotion(ReduceMotion.System);
const exit = FadeOutUp.duration(140).reduceMotion(ReduceMotion.System);

/**
 * Compact summary that pins to the top once the full hero scrolls away.
 * Mount it to play enter; unmount it to play exit. Reduced motion is system.
 */
export function StickyHeroBar({ children, style }: StickyHeroBarProps) {
    const dashboard = useDashboardStyles();
    return (
        <Animated.View
            entering={enter}
            exiting={exit}
            style={[dashboard.heroCompactSticky, style]}
        >
            {children}
        </Animated.View>
    );
}
