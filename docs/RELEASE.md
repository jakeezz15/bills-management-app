# On Hand — public release packet

Copy from this file into Play Console (and later App Store). Do not use `PLAN.md` as listing copy.

**Launcher / icon name:** On Hand  
**Store title:** On Hand: What's left?  
**Package:** `com.jakedurante.financemanager` (do not change this after first public listing)  
**Public version:** `1.0.0` (from `app.json`; Settings → About reads the same value)

---

## One sentence

See what’s left after the money you’ve actually logged — income, spending, bills, savings, and debts — on this device.

## Short description (Play: 80 characters max)

```
See what’s left this month. Track income, bills, savings, and debts on your phone.
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
• Settings — display currency, due-day reminders, backup, reset  

**How leftover works**

Leftover is a running balance as of the end of the period you picked. It only subtracts money you have logged: everyday spending, bill payments, debt payments, and savings contributions. An unpaid bill does not reduce leftover. A planned monthly savings amount is a pace target, not an automatic deduction.

Variable bills (water, electricity) stay at $0 until you log that month’s payment.

**Your data stays on your phone**

There is no account and no bank login. Nothing is uploaded to our servers. Export a JSON backup if you switch phones; uninstalling without a backup deletes your data.

This app is a personal tracker, not a bank, tax tool, or financial advice.

---

## In this version

- Four tabs: Home, Activity, Plans, Settings
- Home leftover for day / week / month / year (chevrons to move; tap the label to jump to today)
- First-run empty Home with “Add first paycheck”
- Income: source, net amount, date
- Everyday spending: name, amount, date, category
- Bills: due day, paid / unpaid, categories, recurring; optional “amount varies” (log the real amount when you pay)
- Savings goals: target, start date, optional planned monthly (ETA only); log contributions with amount and date; undo latest contribution in the viewed month
- Debts: balance, minimum, due day; log installment payments
- Due status on bills and debts vs today (overdue / due soon)
- Optional local reminders at 9:00 AM on bill and debt due days
- Display currency (formatting only — not FX conversion)
- Export / import JSON backup; reset all finance data (stays empty)

## Not in this version

- Bank or card sync
- Cloud backup or multi-device sync (manual JSON export only)
- Accounts, logins, or a website dashboard
- Unpaid bills or planned savings auto-subtracted from leftover
- Budgets with envelopes / “you’re over category X”
- Sharing a household with other users
- Seed demo data (Metro / `__DEV__` only — not in production Settings)

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
8. **Settings** — currency, reminders, export backup (no Development section in production)

**Feature graphic (Play):** dark slate `#0F172A`, leftover amount, short line “What’s left?”

---

## Play Console — Data safety (draft)

| Question | Answer |
|----------|--------|
| Collects user data? | No (not from your servers). Data stays on the device. |
| Account? | No |
| Finance data? | Yes, **on device only** — the user types it. You do not receive it. |
| Shared with third parties? | No |
| Encrypted in transit? | N/A (no backend). Backup is a file the user chooses to share. |
| Users can request deletion? | Reset in Settings, or uninstall |
| Children? | Not directed at children |

**Permissions to declare:** notifications (optional due-day reminders); files/sharing only when the user exports or imports a backup.

---

## Pre-ship (do not skip)

Done in the app: seed hidden in production, version `1.0.0`.

Still on you:

1. Ship **preview/production** APK/AAB, not `--profile development`
2. Host `docs/PRIVACY.md` at a public URL and paste that URL in Play Console
3. Support email you actually check
4. Test: empty first run → add income → log a bill payment → leftover moves → export backup → reset → import
5. Dogfood one real payday cycle before inviting strangers

---

## Support replies (keep handy)

**“Why didn’t rent drop leftover?”**  
Leftover only counts money you marked paid / logged. Unpaid bills stay on Plans so you still see them due.

**“I uninstalled and everything is gone.”**  
Data lives on the phone. Export a backup from Settings before you switch devices.

**“Is this connected to my bank?”**  
No. You enter amounts yourself.
