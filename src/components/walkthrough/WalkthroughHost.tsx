import { useSegments } from "expo-router";
import { useEffect } from "react";
import { WalkthroughOffer } from "./WalkthroughOffer";
import { WalkthroughOverlay } from "./WalkthroughOverlay";
import { useWalkthrough } from "./WalkthroughContext";

/**
 * Shows the offer / spotlight only after Welcome, while the user is in tabs.
 */
export function WalkthroughHost() {
    const segments = useSegments();
    const { openOfferIfNeeded } = useWalkthrough();
    const onTabs = segments[0] === "(tabs)";

    useEffect(() => {
        if (!onTabs) return;
        void openOfferIfNeeded();
    }, [onTabs, openOfferIfNeeded]);

    if (!onTabs) {
        return null;
    }

    return (
        <>
            <WalkthroughOffer />
            <WalkthroughOverlay />
        </>
    );
}
