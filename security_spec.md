# Security Specification: Tradexium

## Data Invariants
1. A user cannot modify their own `balance` or `role`.
2. A payment must be linked to a valid user ID.
3. Only admins can confirm or reject payments.
4. User balances can only be updated by admins (specifically when confirming payments).

## The Dirty Dozen Payloads (Target: Rejection)

1. **Identity Spoofing**: Create a user profile with a UID that doesn't match `auth.uid`.
2. **Privilege Escalation**: Update a user profile to set `role: "ADMIN"`.
3. **Shadow Update**: Update a user profile adding a `total_withdrawn` field not in schema.
4. **Illegal Deposit**: Update own `balance` directly via client SDK.
5. **Orphaned Payment**: Create a payment without a `userId`.
6. **Self-Confirmation**: Update a payment `status` from `PENDING` to `CONFIRMED` as a non-admin.
7. **Negative Deposit**: Create a payment with `amount: -1000`.
8. **ID Poisoning**: Create a user with a 2MB string as document ID.
9. **Terminal State Bypass**: Update a `CONFIRMED` payment back to `PENDING`.
10. **Auth Bypass**: Attempt to read `/users` collection without being signed in.
11. **Cross-User Leak**: Attempt to read another user's private profile.
12. **Timestamp Fraud**: Create a user with a `createdAt` date in the future (not `request.time`).

## Firestore Security Rules (Draft)
Rules will be implemented in `firestore.rules`.
