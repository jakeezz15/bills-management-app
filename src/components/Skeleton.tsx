import { theme } from "@/design";
import { View, type StyleProp, type ViewStyle } from "react-native";

type BoneTone = "muted" | "inverse";

type BoneProps = {
    width: number | `${number}%`;
    height: number;
    radius?: number;
    tone?: BoneTone;
    style?: StyleProp<ViewStyle>;
};

const fill: Record<BoneTone, string> = {
    /** On canvas / surface. `track.base` reads as a placeholder, not a hole. */
    muted: theme.track.base,
    /** On `bg.inverse`. */
    inverse: theme.bg.inverseRaised,
};

/**
 * Static placeholder bar. No pulse: motion would fight `prefers-reduced-motion`
 * and a first-load flash is over in well under a second.
 */
export function Bone({
    width,
    height,
    radius = theme.radius.sm,
    tone = "muted",
    style,
}: BoneProps) {
    return (
        <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[
                {
                    width,
                    height,
                    borderRadius: radius,
                    backgroundColor: fill[tone],
                },
                style,
            ]}
        />
    );
}
