# On Hand — public release packet

Copy from this file into Play Console (and later App Store). Do not use `PLAN.md` as listing copy.

**Launcher / icon name:** On Hand  
**Store title:** On Hand: What's left?  
**Package:** `com.durantetechsolutions.onhand` (do not change this after first public listing)  
**Public version:** `2.0.1` (from `app.json`; Settings → About reads the same value)

---

## One sentence

See what’s left after the money you’ve actually logged — on this phone by default, with optional Google sync when you want another device.

## Short description (Play: 80 characters max)

```
See what’s left this month. Track income, bills, savings & debts on your phone.
```

Character count: 79.

---

## Full description (Play)

**See what’s left this month.**

On Hand answers one question: after the money you’ve actually received and spent, what’s left?

Add paychecks and everyday spending. Keep rent, utilities, and subscriptions as bills. Track savings goals and loan payments. Home shows leftover as of today, this week, this month, or this year.

**What’s inside**

• Home — leftover, income vs outflows, and a simple month trend  
• Activity — money in (income) and everyday spending  
• Plans — bills, savings goals, and debts  
• Settings — currency, reminders, backup, optional Google account & sync  

**How leftover works**

Leftover is a running balance as of the end of the period you picked. It only subtracts money you have logged: everyday spending, bill payments, debt payments, and savings contributions. An unpaid bill does not reduce leftover. A planned monthly savings amount is a pace target, not an automatic deduction.

Variable bills (water, electricity) stay at $0 until you log that month’s payment.

**Your data, your choice**

Works fully without an account — everything stays on this device.  
Optional **Sign in with Google** unlocks **cloud sync** so you can upload or download your finance backup across phones. There is no bank login. You can still export or import a JSON file anytime.

This app is a personal tracker, not a bank, tax tool, or financial advice.

---

## In this version

- Four tabs: Home, Activity, Plans, Settings
- Welcome: continue as guest or sign in with Google
- Home leftover for day / week / month / year (chevrons to move; tap the label to jump to today)
- First-run empty Home with “Add first paycheck”
- Income: source, net amount, date
- Everyday spending: name, amount, date, category
- Bills: due day, paid / unpaid, categories, recurring; optional “amount varies” (log the real amount when you pay)
- Savings goals: target, start date, optional planned monthly (ETA only); log contributions with amount and date; undo latest contribution in the viewed month
- Debts: balance, minimum, due day; log installment payments
- Due status on bills and debts vs today (overdue / due soon)
- Optional local due-day reminders (you pick the hour and lead days in Settings)
- Display currency (formatting only — not FX conversion)
- Export / import JSON backup; reset all finance data (stays empty)
- Optional Google sign-in + Firestore cloud sync (upload / download; first-link keep device or use cloud)
- Settings hub with Account, Notifications, General, Data, About

---

## Not in this version

- Bank or card sync
- Automatic background sync every change (sync is user-driven in Settings / after sign-in link)
- A website dashboard or multi-user household sharing
- Unpaid bills or planned savings auto-subtracted from leftover
- Budgets with envelopes / “you’re over category X”
- In-app “delete my cloud account” button (request deletion via support — see Privacy)
- Tablet / large-screen layout (phone-first in 2.0.0; planned for a later 2.x)
- Seed demo data (Metro / `__DEV__` only — not in production Settings)

---

## Later ideas (after 2.0.0 — not building yet)

Agreed direction for a future reminders pass (local notifications; optional toggles):

1. **Leftover at risk** — user-set threshold; use **this month’s leftover**; warn when an upcoming unpaid bill/debt would push leftover under the threshold (push). If a logged payment/spend drops leftover to/under the threshold while in-app → **banner only** (no extra push).
2. **Evening due catch-up** — optional night check; if items **due today and/or overdue** are still unpaid → one soft nudge (“not marked paid yet…”), not a guilt trip; separate toggle from leftover-at-risk.

Daily “log spending?” habit nudge is lower priority than the two above.

3. **Check for updates (Settings)** — after closed testing settles: EAS Update for JS/UI OTA + Settings row; optional Play store version check for mandatory binary bumps. Skip while closed-test AABs are the update channel.
4. **About: what’s new** — when an update ships, surface those release notes on the Settings **About** page so users can see what changed (version + short changelog), not only that an update exists.
5. **Swipe to delete on list rows** — Income, Spending, Bills, Savings, and Debts: swipe a row to delete (with confirm), so cleanup doesn’t require opening the detail screen every time.
6. **Monthly financial summary** — end-of-month (or on-demand) recap of income, spending, bills/debts paid, savings progress, and leftover; **professionally formatted** for reading or sharing (clean layout, clear hierarchy — not a raw data dump).

---

## Screenshot shot list

Use a **production** build (not the development client). Capture phone screenshots in the store’s required sizes.

1. **Home leftover** — month view, leftover hero, a few rows of in/out
2. **Home empty** — first-run, “Add first paycheck” (shows it is not a demo app)
3. **Activity → Income** — a paycheck list
4. **Activity → Spending** — everyday expenses
5. **Plans → Bills** — mix of paid and unpaid, one variable bill
6. **Plans → Savings** — a goal with progress
7. **Plans → Debts** — a loan with a logged payment
8. **Settings / Account** — guest vs signed-in, or Data backup (no Development section in production)

**Feature graphic (Play):** dark slate `#0F172A`, leftover amount, short line “What’s left?”

---

## Play Console — Data safety (draft)

Update the questionnaire for this version. Guest-only use stays on-device; signed-in sync stores data with Google Firebase.

| Question | Answer |
| --- | --- |
| Collects user data? | **Yes, when the user opts in** to Google sign-in / sync. Guest mode keeps finance data on device only. |
| Account? | **Optional** — Google Sign-In via Firebase Authentication |
| Personal info collected? | Email (and related Google account identifiers) **if** the user signs in |
| Finance data? | Yes — user-entered amounts. On device always; **also in Firestore** if they use sync |
| Shared with third parties? | **Service providers only** — Google / Firebase for auth and optional sync storage. Not sold or used for ads by this app. |
| Encrypted in transit? | **Yes** for sign-in and sync (HTTPS to Firebase) |
| Encrypted at rest? | On device: OS storage. Cloud: Firebase/Google infrastructure |
| Users can request deletion? | Reset / uninstall for device data; **contact support** to delete cloud account + sync snapshot |
| Children? | Not directed at children |

**Permissions / features to declare:** notifications (optional due-day reminders); Google account (optional); files/sharing when the user exports or imports a backup.

---

## Pre-ship (do not skip)

Done in the app: seed hidden in production, version `2.0.1`, Firestore rules published.

Still on you:

1. Upload the **production** AAB to Play closed testing (EAS build when finished)
2. Add **Play App signing** and **Upload** key **SHA-1** fingerprints in Firebase (Android) so production Google Sign-In works  
   - Expo upload/production keystore: [Expo → Credentials](https://expo.dev/accounts/jakeezz15/projects/bills-management-app/credentials) → Android package → copy **SHA-1**  
   - Play App signing key: Play Console → **Test and release** (or Setup) → **App integrity** → **App signing** → copy **SHA-1** (and Upload key SHA-1 if shown)  
   - Firebase Console → Project settings → Android app → **Add fingerprint** for each (or paste here and we add via CLI)  
   - Already in Firebase today: `5ced5dbe189ffc34e62ee5cdb45e481f7090beea` (dev/EAS-related). Add any **missing** Play fingerprints.
3. Privacy URL on `main` stays old until you merge `version-2.0` (deferred on purpose)
4. Refresh Play **Data safety** answers using the draft above (click path below)
5. Support email you actually check (also linked from Settings → Contact support via GitHub Issues until you set a mailto)
6. Test: guest path → sign-in → first-link sync → upload/download → sign-out (cloud backup then clear device) → sign-in restore → export backup → reset → import
7. Dogfood one real payday cycle before inviting strangers

### Play Data safety — click path (2.0.1)

Play Console → your app → **App content** → **Data safety** → **Start** / **Edit**

Answer in this spirit (match the form’s wording as closely as you can):

1. **Does your app collect or share user data?** → **Yes** (because optional Google sign-in / sync)
2. **Data collected** (when user opts in):
   - **Personal info → Email address** — collected, not shared for ads; required for account feature / optional
   - **Financial info → User payment info / Other financial info** (or closest: finance amounts the user types) — collected for app functionality; stored in Firebase if they sync; not sold
3. **Is data encrypted in transit?** → **Yes**
4. **Can users request deletion?** → **Yes** — in-app reset/uninstall for device; contact support for cloud account/sync deletion
5. **Data shared with third parties?** → Declare **Google / Firebase** as service providers for auth + cloud storage (not for advertising)
6. Save / submit Data safety

Guest-only use still keeps finance data on-device; the form is about what the app *can* collect when features are used.

---

## Support replies (keep handy)

**“Why didn’t rent drop leftover?”**  
Leftover only counts money you marked paid / logged. Unpaid bills stay on Plans so you still see them due.

**“I uninstalled and everything is gone.”**  
Local data lives on the phone. Export a backup or use Google sync before you switch devices.

**“Is this connected to my bank?”**  
No. You enter amounts yourself.

**“Do I need a Google account?”**  
No. Guest mode works fully on one device. Sign in only if you want cloud sync.

**“How do I delete my cloud data?”**  
Sign-out alone does not wipe the cloud copy. Contact support with the Google email you used and ask for account / sync deletion.
