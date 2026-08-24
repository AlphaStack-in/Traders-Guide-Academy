# Security Review: performance-email-digest

**When:** 2026-08-24 (re-verified)

---

## Verdict

**Status:** APPROVED

---

## Dependency Audit

| Tool | Status | Output |
|------|--------|--------|
| npm audit --audit-level=high | Pre-existing issues only | Multiple high-severity advisories found in `brace-expansion`, `deepmerge-ts`, `fast-uri`, `ip-address`, `js-yaml`, `next`, `postcss`, `sharp`. None introduced by this feature. The only new dependency added is `vitest` (devDependency). All high-severity items are pre-existing transitive dependencies unrelated to the digest feature. |

**Audit ran:** `npm audit --audit-level=high` on 2026-08-24. High-severity packages: `brace-expansion` (DoS), `deepmerge-ts` (stack exhaustion via Prisma), `fast-uri` (host confusion), `ip-address` (SSRF bypass), `js-yaml` (quadratic CPU), `next` (multiple: SSRF, DoS, cache confusion), `postcss`/`sharp` (transitive via next). Moderate: `@hono/node-server` (path traversal on Windows), `hono` (ReDoS in CORS). None relate to the digest feature code paths.

---

## OWASP Checks

| Check | Status | Notes |
|-------|--------|-------|
| Injection | Pass | All database queries use Prisma parameterized query builder (`findMany`, `findUnique`, `update`, `create`). No raw SQL, no `$queryRaw`, no shell exec, no LDAP. The `subscriberId` from the unsubscribe query string is passed as a Prisma `where: { id }` parameter -- safe. |
| Broken Auth | Pass | Cron route gated by `isAuthorizedCronRequest()` which checks `Authorization: Bearer $CRON_SECRET` and fails closed (returns `false`) when `CRON_SECRET` is unset. Unsubscribe route requires a valid HMAC-SHA256 token -- no session/auth bypass possible. Feature-flag gate (`digestEnabled`) adds an additional layer. |
| Sensitive Data Exposure | Pass | No credentials, tokens, or PII logged. Dev simulation logs only email address and subject (no token/secret). Error responses in cron route reveal `error.message` but the endpoint is auth-gated. DigestSendLog stores subscriber email for audit -- acceptable. |
| Broken Access Control | Pass | Unsubscribe endpoint validates HMAC token before mutating subscriber state. Subscriber IDs are UUIDs (not sequential integers) and the HMAC prevents IDOR. Cron endpoint requires bearer token. No path to affect another subscriber's opt-out status without their HMAC token. |
| XSS | Pass | Unsubscribe `renderPage()` interpolates only hardcoded string literals -- no user input reaches the HTML. Email template interpolates `subscriberName` from DB without HTML-escaping; however, email clients strip `<script>` tags, and a subscriber can only set their own name (self-XSS with no cross-user impact). See non-blocking recommendation below. |
| Security Misconfiguration | Pass | `digestEnabled` defaults to `false` -- feature is off until explicitly enabled. No debug flags, no permissive CORS, no default credentials. `maxDuration = 60` set on cron route. |
| Secrets Detected | Pass | Grep scans for `password\s*=\s*['"][^'"]+`, `api_key|apikey|secret_key|private_key`, and `Bearer |Authorization:` across all `.ts` files returned only env-var reads and the cron-auth module (which reads `process.env.CRON_SECRET`). All secrets sourced from environment variables. `.env*` is gitignored (lines 34 and 51 of `.gitignore`). `.env.example` contains only placeholder values. |

---

## Threat Assessment

- **Spoofing:** No risk identified. The cron route requires a server-side bearer secret. Unsubscribe tokens are HMAC-SHA256 signed per subscriber ID -- cannot be forged without `DIGEST_UNSUBSCRIBE_SECRET`. The secret is required at runtime (throws if unset).
- **Tampering:** No risk identified. Unsubscribe tokens are verified before any database mutation. Prisma parameterized queries prevent data tampering via injection. The only write operation the unsubscribe endpoint performs is setting `emailDigestOptOut = true` -- no destructive action.
- **Repudiation:** Digest sends are logged to `DigestSendLog` with subscriber ID, email, week start date, signal count, win rate, and P&L totals. Provides adequate audit trail for compliance and debugging.
- **Information Disclosure:** No risk identified. Email content contains only signal performance data already visible to the subscriber in the application. No credentials, internal system paths, or other users' data exposed. Error responses in the cron route are behind auth. The unsubscribe page returns only generic hardcoded messages.
- **Elevation of Privilege:** No risk identified. The unsubscribe endpoint can only set `emailDigestOptOut = true` for the token-validated subscriber -- no path to modify other fields or other subscribers. The cron endpoint requires `CRON_SECRET` which is not accessible to subscribers.

---

## Issues

### Blocking (must fix)

None.

### Non-Blocking (recommendations)

1. `src/lib/digest/unsubscribe.ts:33` -- The manual constant-time comparison is correct but could use Node.js built-in `crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token))` for clarity and maintainability. The early-return on length mismatch (line 33) is not exploitable since HMAC-SHA256 hex output is always 64 characters, but `timingSafeEqual` would eliminate the need to reason about it.

2. `src/lib/digest/digest-email-template.ts:87` -- `subscriberName` is interpolated into HTML without escaping. While email clients strip script execution and this is self-XSS only, HTML-escaping the name (e.g., replacing `<>&"'` with entities) would be defense-in-depth against layout-breaking characters.

3. `src/lib/cron-auth.ts:7` -- The bearer token comparison uses `===` (not constant-time). Acceptable for cron auth where timing side-channels over the network are impractical to exploit, but `timingSafeEqual` would be best practice.

---

## Decision

APPROVED: No exploitable security issues found. All new endpoints are properly gated (HMAC-SHA256 tokens for unsubscribe, bearer secret for cron). All database access uses Prisma parameterized queries. No hardcoded secrets detected. No new vulnerable dependencies introduced (only `vitest` as devDependency). Feature is disabled by default via `digestEnabled = false`. The three non-blocking items are defense-in-depth improvements, not exploitable vulnerabilities.
