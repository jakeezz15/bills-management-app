# Privacy Policy — On Hand

**Last updated:** 13 September 2026  
**Developer:** Jake Durante  
**App:** On Hand (`com.durantetechsolutions.onhand`)  
**Store listing title:** On Hand: What's left?

This policy is for the mobile app On Hand. It is written for a public store listing. Host this page at a stable URL (GitHub, a personal site, or similar) and paste that URL into Play Console / App Store Connect.

## Summary

On Hand is a personal leftover tracker. **By default, your financial entries stay on your device.** You can use the app fully as a guest with no account.

**Optional Google sign-in** unlocks **cloud sync** so the same finance backup can follow you across devices. Sync only happens after you sign in and choose to link or upload. We do not connect to your bank.

## What the app stores on your device

Using on-device storage (whether or not you sign in):

- Income, everyday spending, bills, savings goals, debts, and payment / contribution history you enter
- Display currency and whether due-day reminders are on
- Simple UI preferences (for example, which Plans or Activity section you last opened)
- Local flags such as whether you finished Welcome, chose guest mode, or linked cloud sync on this device

## Optional Google account

Signing in is **optional**. If you continue as a guest, no Google account is linked and nothing is uploaded for sync.

If you choose **Sign in with Google**:

- Google handles the sign-in screen
- We receive a Firebase Authentication session for your Google account (typically including a stable user id and the email Google associates with that account)
- That identity is used only to protect your sync data so other users cannot read it

We do not use your Google account for advertising.

## Optional cloud sync

When you are signed in, you can upload or download a **finance snapshot** (the same kind of data as the JSON backup file) to Google’s **Firebase / Firestore** service, stored under your user id.

That snapshot may include:

- Income, spending, bills, debts, savings goals, and related payment / contribution history
- Display and reminder preferences included in the backup

Sync is **user-driven** in this version (for example, first-time link choice, then upload / download from Settings → Account). Signing out keeps your local data on the phone and pauses sync from that device; it does not automatically wipe the cloud copy.

We do not sell this data. Firebase stores it so you can restore or continue on another device you sign into with the same Google account.

## What we do not collect

- Bank, card, or brokerage credentials
- Location, contacts, or your photo library (except a backup file you explicitly pick for import / export)
- Analytics, advertising IDs, or crash reports sent to us by this app as of this policy date

If a store or OS shows a system dialog (notifications, Google sign-in, file picker), that is the system helping you use a feature you turned on.

## Notifications

Optional **due-day reminders** are scheduled **locally** on your device. In Settings you choose the alert time and how many days before the due date to warn (plus a ping on the due day itself). They are not push messages from our servers. You can turn them off in Settings.

## Manual backups

**Export backup** writes a JSON file of your finance data that you can save or share yourself (email, Drive, Files, etc.).  
**Import backup** replaces the data on this device with a file you choose.

If you share that file, whoever you send it to can read it. We never receive a manual export unless you send it to us for support.

## Who processes data when you opt in

| Service | Why |
| --- | --- |
| Google Sign-In / Firebase Authentication | Optional account |
| Cloud Firestore (Firebase) | Optional sync snapshot for your user id |

Data in transit to Google/Firebase uses encrypted connections (HTTPS). Google’s own terms and privacy policy also apply to those services.

## Deleting your data

**On this device**

- Settings → Data → **Reset all data** clears finance entries on this device  
- Uninstalling the app removes on-device app data (unless your OS backs up app storage)

**Cloud copy (if you used sync)**

- Signing out does **not** delete the cloud snapshot by itself  
- To request deletion of account-linked sync data, contact us using the support channel below (include the Google email you used to sign in). We will delete the Firebase Auth user and associated sync documents for that account when you ask

## Children

The app is not directed at children under 13 (or the equivalent age in your country).

## Not financial advice

Figures in the app are what you typed. The app does not provide banking, investment, tax, or legal advice.

## Changes

If how we handle accounts, sync, or other data changes in a meaningful way, we will update this policy and the store listing before that version ships.

## Contact

For privacy questions or deletion requests, use the support email on the app’s store listing, or open an issue at [jakeezz15/bills-management-app](https://github.com/jakeezz15/bills-management-app/issues).
