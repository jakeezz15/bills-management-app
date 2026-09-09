# On Hand

**Store title:** On Hand: What's left?

A personal money tracker for one question: **what's left this month?**

Home shows **leftover** — a running balance as of the period you picked — from income, everyday spending, logged bill payments, debt payments, and savings contributions. Data stays on the device. There is no account and no bank sync.

## What’s in the app

| Tab | What you do |
|-----|-------------|
| **Home** | See leftover for day / week / month / year |
| **Activity** | Log income and everyday spending |
| **Plans** | Bills, savings goals, and debts |
| **Settings** | Currency display, due-day reminders, backup, reset |

Leftover only subtracts **logged** cash. Unpaid bills and planned monthly savings do not auto-deduct.

Public store copy, screenshot list, and ship checklist: [`docs/RELEASE.md`](docs/RELEASE.md)  
Privacy policy (host this URL on the store): [`docs/PRIVACY.md`](docs/PRIVACY.md)

## Develop

Expo SDK 57. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/), not Expo Go, if you rely on native modules in this project.

```bash
npm install
npx expo start
```

Store / friend APKs: use EAS `preview` or `production`, not the `development` profile.

## License

Private project unless you add a license.
