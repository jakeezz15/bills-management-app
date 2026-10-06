import { useTheme } from "@/app/contexts/ThemeContext";
import { useCallback, useEffect, useRef, type ReactNode } from "react";
import { View, type ViewStyle } from "react-native";
import {
    useWalkthroughAnchorApi,
    type AnchorRect,
} from "./WalkthroughContext";
import type { WalkthroughStepId } from "./steps";

type WalkthroughAnchorProps = {
    id: WalkthroughStepId;
    children: ReactNode;
    style?: ViewStyle;
};

/**
 * Registers on-screen bounds for a walkthrough spotlight target.
 * Subscribes only to anchor API (not target) to avoid measure → render loops.
 */
export function WalkthroughAnchor({
    id,
    children,
    style,
}: WalkthroughAnchorProps) {
    const api = useWalkthroughAnchorApi();
    const ref = useRef<View>(null);
    const { theme } = useTheme();
    const registerAnchor = api?.registerAnchor;
    const activeId = api?.activeId ?? null;
    const phase = api?.phase ?? "idle";

    const publish = useCallback(() => {
        if (!registerAnchor) return;
        ref.current?.measureInWindow((x, y, width, height) => {
            if (width <= 0 || height <= 0) {
                return;
            }
            const rect: AnchorRect = { x, y, width, height };
            registerAnchor(id, rect);
        });
    }, [id, registerAnchor]);

    useEffect(() => {
        if (phase !== "running" || activeId !== id) return;
        const t1 = setTimeout(publish, 140);
        const t2 = setTimeout(publish, 420);
        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
        };
    }, [phase, activeId, id, publish]);

    const highlighted = phase === "running" && activeId === id;

    return (
        <View
            ref={ref}
            collapsable={false}
            onLayout={() => {
                if (phase === "running" && activeId === id) {
                    publish();
                }
            }}
            style={[
                style,
                highlighted
                    ? {
                          zIndex: 40,
                          borderRadius: theme.radius.md,
                      }
                    : null,
            ]}
            pointerEvents="box-none"
        >
            {children}
        </View>
    );
}
