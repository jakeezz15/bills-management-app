import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    clearFirstRunFlag,
    hasCompletedFirstRun,
    markFirstRunComplete,
} from "@/services/storage";
import {
    WALKTHROUGH_STEPS,
    type WalkthroughStep,
    type WalkthroughStepId,
} from "./steps";

export type AnchorRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type WalkthroughPhase = "idle" | "offer" | "running";

type WalkthroughContextValue = {
    phase: WalkthroughPhase;
    stepIndex: number;
    step: WalkthroughStep | null;
    totalSteps: number;
    activeId: WalkthroughStepId | null;
    target: AnchorRect | null;
    /** Only draw the hole when this matches the current step. */
    targetStepId: WalkthroughStepId | null;
    /** True while fading between steps — keep the UI calm. */
    transitioning: boolean;
    registerAnchor: (id: WalkthroughStepId, rect: AnchorRect | null) => void;
    start: () => void;
    next: () => void;
    skip: () => void;
    declineOffer: () => void;
    openOfferIfNeeded: () => Promise<void>;
    prepareReplay: () => Promise<void>;
};

/**
 * Anchors subscribe here only — excludes `target` so measure updates
 * do not re-render every highlighted view (that loop caused flickering).
 */
type WalkthroughAnchorContextValue = {
    phase: WalkthroughPhase;
    activeId: WalkthroughStepId | null;
    registerAnchor: (id: WalkthroughStepId, rect: AnchorRect | null) => void;
};

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);
const WalkthroughAnchorContext =
    createContext<WalkthroughAnchorContextValue | null>(null);

const ACTIVITY_SECTION_KEY = "activitySection";

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function roundRect(rect: AnchorRect): AnchorRect {
    return {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
    };
}

function rectsNearlyEqual(
    a: AnchorRect | null,
    b: AnchorRect | null,
    epsilon = 1
): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return (
        Math.abs(a.x - b.x) <= epsilon &&
        Math.abs(a.y - b.y) <= epsilon &&
        Math.abs(a.width - b.width) <= epsilon &&
        Math.abs(a.height - b.height) <= epsilon
    );
}

export function WalkthroughProvider({ children }: { children: ReactNode }) {
    const [phase, setPhase] = useState<WalkthroughPhase>("idle");
    const [stepIndex, setStepIndex] = useState(0);
    const [target, setTarget] = useState<AnchorRect | null>(null);
    const [targetStepId, setTargetStepId] = useState<WalkthroughStepId | null>(
        null
    );
    const [transitioning, setTransitioning] = useState(false);
    const anchorsRef = useRef<Partial<Record<WalkthroughStepId, AnchorRect>>>(
        {}
    );
    const finishingRef = useRef(false);
    const navigatingRef = useRef(false);
    const phaseRef = useRef(phase);
    const stepIndexRef = useRef(stepIndex);
    const activeIdRef = useRef<WalkthroughStepId | null>(null);

    const step = phase === "running" ? WALKTHROUGH_STEPS[stepIndex] ?? null : null;
    const activeId = step?.id ?? null;

    useEffect(() => {
        phaseRef.current = phase;
        stepIndexRef.current = stepIndex;
        activeIdRef.current = activeId;
    }, [phase, stepIndex, activeId]);

    const finish = useCallback(async () => {
        if (finishingRef.current) return;
        finishingRef.current = true;
        setPhase("idle");
        setStepIndex(0);
        setTarget(null);
        setTargetStepId(null);
        setTransitioning(false);
        await markFirstRunComplete();
        finishingRef.current = false;
        try {
            router.replace("/(tabs)");
        } catch {
            // Already on tabs or navigation mid-unmount.
        }
    }, []);

    const syncTarget = useCallback((id: WalkthroughStepId | null) => {
        if (!id) {
            setTarget(null);
            setTargetStepId(null);
            return;
        }
        const next = anchorsRef.current[id] ?? null;
        if (!next) return;
        setTarget((prev) => (rectsNearlyEqual(prev, next) ? prev : next));
        setTargetStepId(id);
    }, []);

    const registerAnchor = useCallback(
        (id: WalkthroughStepId, rect: AnchorRect | null) => {
            if (rect) {
                const rounded = roundRect(rect);
                const prev = anchorsRef.current[id] ?? null;
                if (rectsNearlyEqual(prev, rounded)) {
                    return;
                }
                anchorsRef.current[id] = rounded;
            } else {
                if (!anchorsRef.current[id]) return;
                delete anchorsRef.current[id];
            }
            if (id === activeIdRef.current) {
                syncTarget(id);
            }
        },
        [syncTarget]
    );

    const goToStep = useCallback(
        async (index: number, opts?: { softStart?: boolean }) => {
            const nextStep = WALKTHROUGH_STEPS[index];
            if (!nextStep) {
                await finish();
                return;
            }
            if (navigatingRef.current) return;
            navigatingRef.current = true;

            const softStart = opts?.softStart === true;
            if (!softStart) {
                setTransitioning(true);
                // Let the overlay fade the hole/bubble before we move.
                await delay(260);
            } else {
                setTransitioning(true);
            }

            if (nextStep.route === "/(tabs)/activity") {
                await AsyncStorage.setItem(ACTIVITY_SECTION_KEY, "Income");
            }

            const previousRoute =
                phaseRef.current === "running"
                    ? WALKTHROUGH_STEPS[stepIndexRef.current]?.route
                    : null;

            setStepIndex(index);
            setTarget(null);
            setTargetStepId(null);

            const needsNavigate =
                !softStart && previousRoute !== nextStep.route;
            if (needsNavigate) {
                try {
                    router.push(nextStep.route);
                } catch {
                    // ignore
                }
            }

            await delay(needsNavigate ? 560 : softStart ? 420 : 320);
            syncTarget(nextStep.id);
            await delay(140);
            setTransitioning(false);
            navigatingRef.current = false;
        },
        [finish, syncTarget]
    );

    const start = useCallback(() => {
        setPhase("running");
        void goToStep(0, { softStart: true });
    }, [goToStep]);

    const next = useCallback(() => {
        if (navigatingRef.current) return;
        if (stepIndexRef.current >= WALKTHROUGH_STEPS.length - 1) {
            void finish();
            return;
        }
        void goToStep(stepIndexRef.current + 1);
    }, [finish, goToStep]);

    const skip = useCallback(() => {
        void finish();
    }, [finish]);

    const declineOffer = useCallback(() => {
        void finish();
    }, [finish]);

    const openOfferIfNeeded = useCallback(async () => {
        if (phaseRef.current !== "idle") return;
        const done = await hasCompletedFirstRun();
        if (done) return;
        setPhase("offer");
    }, []);

    const prepareReplay = useCallback(async () => {
        await clearFirstRunFlag();
        setPhase("offer");
        setStepIndex(0);
        setTarget(null);
        setTargetStepId(null);
        try {
            router.replace("/(tabs)");
        } catch {
            // ignore
        }
    }, []);

    const anchorValue = useMemo<WalkthroughAnchorContextValue>(
        () => ({
            phase,
            activeId,
            registerAnchor,
        }),
        [phase, activeId, registerAnchor]
    );

    const value = useMemo<WalkthroughContextValue>(
        () => ({
            phase,
            stepIndex,
            step,
            totalSteps: WALKTHROUGH_STEPS.length,
            activeId,
            target,
            targetStepId,
            transitioning,
            registerAnchor,
            start,
            next,
            skip,
            declineOffer,
            openOfferIfNeeded,
            prepareReplay,
        }),
        [
            phase,
            stepIndex,
            step,
            activeId,
            target,
            targetStepId,
            transitioning,
            registerAnchor,
            start,
            next,
            skip,
            declineOffer,
            openOfferIfNeeded,
            prepareReplay,
        ]
    );

    return (
        <WalkthroughContext.Provider value={value}>
            <WalkthroughAnchorContext.Provider value={anchorValue}>
                {children}
            </WalkthroughAnchorContext.Provider>
        </WalkthroughContext.Provider>
    );
}

export function useWalkthrough(): WalkthroughContextValue {
    const ctx = useContext(WalkthroughContext);
    if (!ctx) {
        throw new Error("useWalkthrough must be used within WalkthroughProvider");
    }
    return ctx;
}

export function useWalkthroughOptional(): WalkthroughContextValue | null {
    return useContext(WalkthroughContext);
}

export function useWalkthroughAnchorApi(): WalkthroughAnchorContextValue | null {
    return useContext(WalkthroughAnchorContext);
}
