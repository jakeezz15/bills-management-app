import { useCallback, useRef, useState } from "react";
import type {
    NativeScrollEvent,
    NativeSyntheticEvent,
} from "react-native";

type UseStickyHeroOptions = {
    /** Scroll offset where the compact bar appears. */
    collapseAt?: number;
    /** Scroll offset where the full hero returns (hysteresis). */
    expandAt?: number;
};

/**
 * Tracks vertical scroll so list screens can swap the full hero for a
 * compact sticky summary without fighting gesture handlers.
 */
export function useStickyHero(options: UseStickyHeroOptions = {}) {
    const collapseAt = options.collapseAt ?? 88;
    const expandAt = options.expandAt ?? 36;
    const [collapsed, setCollapsed] = useState(false);
    const collapsedRef = useRef(false);

    const onScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const y = event.nativeEvent.contentOffset.y;
            let next = collapsedRef.current;
            if (!next && y >= collapseAt) {
                next = true;
            } else if (next && y <= expandAt) {
                next = false;
            }
            if (next !== collapsedRef.current) {
                collapsedRef.current = next;
                setCollapsed(next);
            }
        },
        [collapseAt, expandAt]
    );

    return {
        collapsed,
        scrollProps: {
            onScroll,
            scrollEventThrottle: 16 as const,
        },
    };
}
