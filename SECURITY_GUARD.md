# Security Guard

> **WARNING**: This file documents security invariants that MUST NEVER be violated.  
> Breaking these will cause security vulnerabilities in production.

---

## Security-Critical Files

| File | Purpose | If Deleted/Modified Incorrectly |
|------|---------|--------------------------------|
| `src/pages/api/video/token.ts` | Main token endpoint | Anonymous video access, identity spoofing |
| `src/lib/auth/verifyFirebase.ts` | Firebase token verification | Forged tokens accepted, impersonation |
| `src/lib/security/rateLimit.ts` | UID-based rate limiting | API abuse, quota exhaustion, DDoS |
| `src/lib/security/csrf.ts` | Origin validation | CSRF attacks, cross-site token theft |
| `src/lib/security/sanitize.ts` | Input sanitization | XSS, injection attacks |
| `src/lib/video/daily.ts` | Daily.co token generation | Over-privileged tokens if `is_owner` changed |
| `src/lib/video/livekit.ts` | LiveKit token generation | Admin permissions if grants modified |

---

## Security Invariants

### INV-1: Server-Side Identity Only
```
❌ NEVER: Accept userId, userName, or role from client request body
✅ ALWAYS: Extract identity from verified Firebase token
```
**Location**: `token.ts:117-118`  
**Violation Impact**: Identity spoofing, impersonation

---

### INV-2: Short-Lived Tokens
```
❌ NEVER: Token TTL > 15 minutes
✅ ALWAYS: exp = now + 900 seconds, nbf = now
```
**Location**: `token.ts:124-147`, `daily.ts:112-113`  
**Violation Impact**: Token replay window extended

---

### INV-3: Minimal Permissions
```
❌ NEVER: is_owner = true, roomAdmin = true, recorder = true
✅ ALWAYS: is_owner = false, only roomJoin/canPublish/canSubscribe
```
**Location**: `daily.ts:118`, `livekit.ts:66-73`  
**Violation Impact**: Privilege escalation

---

### INV-4: Rate Limiting Enforced
```
❌ NEVER: Skip checkRateLimit() call
✅ ALWAYS: Rate limit BEFORE token generation
```
**Location**: `token.ts:91-97`  
**Violation Impact**: API abuse, free-tier quota exhaustion

---

### INV-5: CSRF Protection
```
❌ NEVER: Accept requests without Origin validation
✅ ALWAYS: Validate Origin header against ALLOWED_ORIGINS
```
**Location**: `token.ts:61-67`, `csrf.ts:40-53`  
**Violation Impact**: Cross-site token theft

---

### INV-6: Firebase Verification
```
❌ NEVER: Trust Authorization header without Admin SDK verification
✅ ALWAYS: Call verifyIdToken() with checkRevoked = true
```
**Location**: `token.ts:81`, `verifyFirebase.ts:50`  
**Violation Impact**: Forged/expired tokens accepted

---

### INV-7: Generic Error Messages
```
❌ NEVER: Return provider name, stack traces, or internal errors
✅ ALWAYS: Return generic "Video service temporarily unavailable"
```
**Location**: `token.ts:177-179`  
**Violation Impact**: Information disclosure

---

### INV-8: Client Only Sends RoomId
```
❌ NEVER: Send userId, userName, role, or permissions from client
✅ ALWAYS: Only { roomId } in request body
```
**Location**: `videoService.ts:61-63`  
**Violation Impact**: Backend security bypass attempt

---

## Breaking Change Alerts

| Change | Risk Level | Must Review |
|--------|------------|-------------|
| Modifying `token.ts` | 🔴 CRITICAL | Security team |
| Adding params to `/api/video/token` body | 🔴 CRITICAL | Never trust new fields |
| Changing token TTL | 🟡 HIGH | Must stay ≤15 min |
| Modifying rate limit threshold | 🟡 HIGH | Must stay ≤10 req/min |
| Adding new video provider | 🟡 HIGH | Must follow same invariants |
| Changing `is_owner` or admin grants | 🔴 CRITICAL | Never set to `true` |
