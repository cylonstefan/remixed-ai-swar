# Security Specification: Zero-Trust Firestore ABAC

This specification describes Security Rules and payloads for testing identity spoofing, state shortcuts, and resource poisoning attacks.

## 1. Data Invariants
- An authenticated user (`request.auth.uid`) can only access documents inside `/users/{userId}/*` path belonging to their own `uid`.
- No cross-user reads or writes are allowed.
- All timestamp formats are validated using `request.time`.
- Every creation must validate exact fields, types, and size constraints.
- Updates cannot mutate immutable fields like `id`, `userId`, `createdAt`.
- Updates must explicitly limit modified fields using `affectedKeys().hasOnly()`.

## 2. The "Dirty Dozen" Payloads (Attack Vectors)

### Attack Vector 1: Identity Impersonation (Spoofing ownerId)
Try to save `/users/user_victim/agents/agent1` with a `userId` field pointing to `attacker_uid`.

```json
{
  "id": "agent1",
  "userId": "attacker_uid",
  "name": "Malicious Agent",
  "role": "Hacker",
  "model": "gemini-2.5-pro"
}
```
*Expected Result:* `PERMISSION_DENIED` - The path parameter `userId` must strictly equal `request.auth.uid`.

---

### Attack Vector 2: Privilege Escalation (Setting admin flag)
Try to register a public profile and set `isAdmin` or similar admin capabilities.

```json
{
  "uid": "attacker_uid",
  "email": "attacker@spam.com",
  "displayName": "Injected Admin",
  "isAdmin": true
}
```
*Expected Result:* `PERMISSION_DENIED` - Users are prohibited from setting arbitrary administrative roles in their profile.

---

### Attack Vector 3: Resource Poisoning (ID character length overload)
Inserting a document with 1MB ID to exhaust and crash client applications.

```json
{
  "id": "A_REALLY_LONG_ID_OF_1000000_CHARACTERS_...",
  "userId": "attacker_uid",
  "name": "Overloaded Agent",
  "role": "Bloat",
  "model": "gemini-1.5-flash"
}
```
*Expected Result:* `PERMISSION_DENIED` - `isValidId()` restricts string ID sizes to max 128 characters.

---

### Attack Vector 4: Shadow Field Injection (Spoofing extra keys)
Create an agent document with an undocumented "ghost" field.

```json
{
  "id": "agent1",
  "userId": "attacker_uid",
  "name": "Ghost Agent",
  "role": "Infiltrator",
  "model": "gemini-2.5-pro",
  "ghost_field": "unvalidated_value"
}
```
*Expected Result:* `PERMISSION_DENIED` - Strictly enforced map keys limit length and keys explicitly via `keys().hasAll()` and size checking.

---

### Attack Vector 5: Out of Bound Value Injection (Type poisoning)
Setting an extremely large type or wrong format format to corrupt layout.

```json
{
  "id": "agent1",
  "userId": "attacker_uid",
  "name": 123456,
  "role": ["array", "where", "string", "expected"],
  "model": "gemini-2.5-pro"
}
```
*Expected Result:* `PERMISSION_DENIED` - `isValidAgent()` checks types strictly, such as `data.name is string` and `data.role is string`.

---

### Attack Vector 6: Bypassing Creation Timestamps (Client clock forgery)
Submitting custom `createdAt` representing a futuristic date.

```json
{
  "id": "agent1",
  "userId": "attacker_uid",
  "name": "Time Traveler",
  "role": "Past Agent",
  "model": "gemini-2.5-pro",
  "createdAt": "2050-01-01T00:00:00Z"
}
```
*Expected Result:* `PERMISSION_DENIED` - Must equal `request.time`.

---

### Attack Vector 7: Intercepting Cross-User Data (Blanket List Reads)
Attempting to list *all* users or *all* tasks globally as an unauthenticated or generic user.

```json
// Query: db.collectionGroup("tasks") without filters
```
*Expected Result:* `PERMISSION_DENIED` - Every read or list is secured under the user's specific path `/users/{userId}/tasks/{taskId}`, matching `request.auth.uid`.

---

### Attack Vector 8: Bypassing Immutable State Tiers
A user attempting to update `createdAt` of a task that has already been executed.

```json
{
  "title": "Modified Title",
  "createdAt": "2020-01-01T00:00:00Z"
}
```
*Expected Result:* `PERMISSION_DENIED` - Immutable fields must remain unchanged during updates.

---

### Attack Vector 9: Undocumented Status Shuffling
Trying to skip a task state transition or directly editing internal metrics.

```json
{
  "status": "done",
  "xp": 99999
}
```
*Expected Result:* `PERMISSION_DENIED` - Updates must enforce explicit keys using `affectedKeys().hasOnly()`.

---

### Attack Vector 10: Injecting Malicious UTF-8 Sequences in IDs
Submitting IDs with SQL Injection or directory traversal characters.

```json
{
  "id": "../../../etc/passwd",
  "userId": "attacker_uid"
}
```
*Expected Result:* `PERMISSION_DENIED` - ID string must match regex `'^[a-zA-Z0-9_\\-]+$'`.

---

### Attack Vector 11: Array Denial-of-Wallet Bloat
Attempting to create a team folder with 10,000 dummy elements in `agentIds`.

```json
{
  "id": "team1",
  "userId": "attacker_uid",
  "name": "Huge Team",
  "agentIds": ["a1", "a2", "a3", "...", "a10000"]
}
```
*Expected Result:* `PERMISSION_DENIED` - All arrays must have explicit size limits (e.g., `data.agentIds.size() <= 20`).

---

### Attack Vector 12: Anonymous Write Forgeries
Submitting write operations to collections with no auth context.

```json
// POST as unauthenticated request.auth == null
```
*Expected Result:* `PERMISSION_DENIED` - Mandatory check for `isSignedIn()`.

## 3. Test Runner Specification
The automated testing script `firestore.rules.test.ts` utilizes the Firebase Local Emulator Suite to run these 12 test payloads. Secure gates must ensure 100% block rate.
