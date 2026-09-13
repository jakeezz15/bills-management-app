export type WalkthroughStepId =
    | "home-leftover"
    | "home-breakdown"
    | "home-period"
    | "home-due"
    | "activity-income"
    | "activity-spending"
    | "activity-add"
    | "plans-bills"
    | "plans-savings"
    | "plans-debts";

export type WalkthroughRoute =
    | "/(tabs)"
    | "/(tabs)/activity"
    | "/(tabs)/plans";

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
        id: "home-period",
        route: "/(tabs)",
        title: "Pick a window",
        body: "Switch between today, this week, this month, this year, or payday to change the leftover window.",
        preferBubble: "below",
    },
    {
        id: "home-due",
        route: "/(tabs)",
        title: "What’s due",
        body: "Due now lists bills and debts that need attention soon. Log a payment here to drop leftover — unpaid plans stay visible until you do.",
        preferBubble: "below",
    },
    {
        id: "activity-income",
        route: "/(tabs)/activity",
        title: "Income",
        body: "Log paychecks and other money in here. Home leftover grows from what you record.",
        preferBubble: "below",
    },
    {
        id: "activity-spending",
        route: "/(tabs)/activity",
        title: "Spending",
        body: "Everyday purchases live under Spending. They reduce leftover once you log them.",
        preferBubble: "below",
    },
    {
        id: "activity-add",
        route: "/(tabs)/activity",
        title: "Add with +",
        body: "Tap + to add income or spending, depending on which tab you’re on. Nothing is saved until you confirm the form.",
        preferBubble: "above",
        showDemoChip: true,
    },
    {
        id: "plans-bills",
        route: "/(tabs)/plans",
        title: "Bills",
        body: "Rent, utilities, and subscriptions. Adding a bill doesn’t cut leftover until you mark it paid.",
        preferBubble: "below",
    },
    {
        id: "plans-savings",
        route: "/(tabs)/plans",
        title: "Savings",
        body: "Goals and monthly pace targets. Contributions you log reduce leftover; the planned monthly amount is only a guide.",
        preferBubble: "below",
    },
    {
        id: "plans-debts",
        route: "/(tabs)/plans",
        title: "Debts",
        body: "Loans and balances. Record payments when you send money — unpaid installments stay due until then.",
        preferBubble: "below",
    },
];
