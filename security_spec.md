# MarketMind AI — Security Specification & Hardening Blueprint

## 1. Data Invariants & Zero-Trust Architecture

1. **Identity & Authentication Invariant**:
   - All state mutations (Watchlists, Alerts, Predictions, Tickets) must belong strictly to the authenticated `request.auth.uid`.
   - Auth tokens are verified with `email_verified == true` for critical administrative access.
   - Admin access is restricted to verified administrators via secure RBAC documents in `/admins/{uid}` or authenticated root admin verification.

2. **User Profile Invariant**:
   - Normal users cannot escalate their role to `admin` or modify their `role` field.
   - Users cannot modify immutable keys (`id`, `createdAt`) upon updates.
   - PII (email, subscription tokens) are only readable by the document owner or an authenticated admin.

3. **Subcollection Relational Invariant**:
   - A Watchlist, Alert, or Prediction document under `/users/{userId}/...` must have `incoming().userId == request.auth.uid` and path `userId == request.auth.uid`.
   - Maximum bounds enforced on all lists (`tickers.size() <= 500`) and strings to guard against Denial-of-Wallet and resource exhaustion attacks.

4. **Community Content & Moderation Invariant**:
   - `CommunityPost` authorId must match `request.auth.uid`.
   - `CommunityReport` reporterId must match `request.auth.uid`.
   - Only admins can read community reports and moderate or delete third-party posts.

---

## 2. The "Dirty Dozen" Adversarial Payloads (TDD Test Suite)

| Test ID | Target Path | Attack Type | Malicious Payload / Condition | Expected Result |
|---|---|---|---|---|
| **DD-01** | `/users/{targetUid}` | Privilege Escalation | `{ id: "targetUid", role: "admin", plan: "institutional" }` by normal user | `PERMISSION_DENIED` |
| **DD-02** | `/users/{targetUid}` | Identity Spoofing | Unauthenticated write to user profile | `PERMISSION_DENIED` |
| **DD-03** | `/users/{targetUid}` | PII Data Leak | Authenticated User B attempts `get()` on `/users/{UserA_Uid}` | `PERMISSION_DENIED` |
| **DD-04** | `/users/{uid}/watchlists/{id}` | Foreign Parent Injection | User A attempts `setDoc` under `/users/{UserB_Uid}/watchlists/{id}` | `PERMISSION_DENIED` |
| **DD-05** | `/users/{uid}/watchlists/{id}` | Denial-of-Wallet (10k Tickers) | `{ tickers: Array(10000).fill("SPY"), name: "Overload" }` | `PERMISSION_DENIED` |
| **DD-06** | `/users/{uid}/alerts/{id}` | Invalid Status State Bypass | `{ status: "SUPER_ADMIN_TRIGGERED", ticker: "SPY" }` | `PERMISSION_DENIED` |
| **DD-07** | `/users/{uid}/predictions/{id}` | Immutability Tampering | Modifying `userId` or historical `entryPrice` post-creation | `PERMISSION_DENIED` |
| **DD-08** | `/supportTickets/{id}` | Unauthorized Ticket Snooping | User B attempts `list` on all `/supportTickets` without filter | `PERMISSION_DENIED` |
| **DD-09** | `/community_posts/{id}` | Author Identity Forgery | `{ authorId: "victimUid", content: "Spam", status: "PUBLISHED" }` | `PERMISSION_DENIED` |
| **DD-10** | `/community_reports/{id}` | Report Tampering / Deletion | Non-admin user attempts `delete` or `update` on `/community_reports/{id}` | `PERMISSION_DENIED` |
| **DD-11** | `/system_health/{id}` | Health Status Tampering | Non-admin user attempts write to `/system_health/connection` | `PERMISSION_DENIED` |
| **DD-12** | `/{anyCollection}/{id}` | Path Variable ID Poisoning | Injected document ID containing SQL/XSS characters `../../../etc/passwd` | `PERMISSION_DENIED` |

---

## 3. RBAC Hierarchy

1. `USER`: Standard retail trader (Access to own watchlists, alerts, predictions, support tickets).
2. `PREMIUM_USER`: Enhanced entitlements (Real-time options flow, Risk Guardian, advanced Gemini models).
3. `SUPPORT`: Customer service agent (Read support tickets, respond to inquiries).
4. `MODERATOR`: Community moderator (Review flagged community posts and compliance reports).
5. `ADMIN` / `SUPER_ADMIN`: Full system administration, billing metrics, service health monitors.
