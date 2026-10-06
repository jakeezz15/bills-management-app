export type WalkthroughStepId =
    | "home-leftover"
    | "home-breakdown"
    | "calendar-period"
    | "home-due"
    | "activity-income"
    | "activity-add"
    | "plans-bills"
    | "plans-savings"
    | "plans-debts";

export type WalkthroughRoute =
    | "/(tabs)"
    | "/(tabs)/activity"
    | "/(tabs)/calendar"
    | "/(tabs)/plans"
    | "/(tabs)/bills"
    | "/(tabs)/savings"
    | "/(tabs)/debts";

export type WalkthroughStep = {
    id: WalkthroughStepId;
    route: WalkthroughRoute;
    title: string;
    body: string;
    /** Prefer bubble above or below the highlight when space allows. */
    preferBubble: "above" | "below";
    /** Soft “data landing” chip near the target — no real ledger writes. */
    showDemoChip?: boolean;
};

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
    {
        id: "home-leftover",
        route: "/(tabs)",
        title: "Your leftover",
        body: "This is what’s left after money you’ve actually logged — income in, then spending and payments.",
        preferBubble: "below",
    },
    {
        id: "home-breakdown",
        route: "/(tabs)",
        title: "Where it goes",
        body: "This breakdown shows income, everyday spending, bill payments, debt payments, and savings for the window you picked. Tap a row to jump to that area.",
        preferBubble: "above",
    },
    {
        id: "home-due",
        route: "/(tabs)",
        title: "What’s due",
        body: "Due now lists bills and debts that need attention soon. Log a payment here to drop leftover — unpaid plans stay visible until you do.",
        preferBubble: "below",
    },
    {
        id: "calendar-period",
        route: "/(tabs)/calendar",
        title: "Pick a window",
        body: "Use Calendar to switch day, week, month, year, or payday. That window drives leftover on Home and the lists in Activity.",
        preferBubble: "below",
    },
    {
        id: "activity-income",
        route: "/(tabs)/activity",
        title: "Your activity",
        body: "Paychecks and everyday spending share one list for the window you picked. Tap a row to open it.",
        preferBubble: "below",
    },
    {
        id: "activity-add",
        route: "/(tabs)/activity",
        title: "Add with +",
        body: "Tap + and choose Paycheck or Spending. Nothing is saved until you confirm the form.",
        preferBubble: "above",
        showDemoChip: true,
    },
    {
        id: "plans-bills",
        route: "/(tabs)/bills",
        title: "Bills",
        body: "Rent, utilities, and subscriptions. Adding a bill doesn’t cut leftover until you mark it paid.",
        preferBubble: "below",
    },
    {
        id: "plans-savings",
        route: "/(tabs)/savings",
        title: "Savings",
        body: "Goals and monthly pace targets. Contributions you log reduce leftover; the planned monthly amount is only a guide.",
        preferBubble: "below",
    },
    {
        id: "plans-debts",
        route: "/(tabs)/debts",
        title: "Debts",
        body: "Loans and balances. Record payments when you send money — unpaid installments stay due until then.",
        preferBubble: "below",
    },
];
