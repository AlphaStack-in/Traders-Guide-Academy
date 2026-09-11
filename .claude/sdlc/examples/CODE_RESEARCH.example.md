# Example: RESEARCH.md

**Issue:** add-oauth-login
**Feature:** Add OAuth2 authentication with Google and GitHub providers

---

# Research: add-oauth-login

**What:** Add OAuth2 authentication with Google and GitHub providers
**When:** 2026-01-12T10:30:00Z

---

## Summary

- **Risk:** Medium
- **Approach:** Add Google OAuth2 strategy following the existing GitHub OAuth pattern in `src/auth/`
- **Effort:** Moderate

---

## What We Found

### Files to Touch
- `src/auth/passport.ts` — register new Google strategy alongside existing GitHub strategy
- `src/auth/` — create `google-strategy.ts` following `github-strategy.ts` pattern
- `src/routes/auth.ts` — add `/auth/google` and `/auth/google/callback` routes
- `src/middleware/session.ts` — extend session to track OAuth provider
- `src/types/auth.ts` — add `OAuthProvider` union type
- `package.json` — add `passport-google-oauth20` dependency

### Patterns to Follow
- `src/auth/github-strategy.ts` — reference implementation: strategy config, profile extraction, verify callback
- `src/middleware/auth.ts` — session management pattern
- `tests/mocks/github.ts` — mock OAuth provider pattern for tests

### Key Dependencies
- `passport` — existing, already configured
- `passport-github2` — existing, reference for Google strategy
- `express-session` — existing, needs provider field extension
- `passport-google-oauth20` — new dependency needed

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Session changes break existing GitHub OAuth | Medium | Test backward compatibility; add provider field as optional |
| OAuth tokens stored unencrypted in session | Medium | Document production requirement for Redis + encryption |
| passport-google-oauth20 version compatibility | Low | Use latest stable; existing passport@0.6 should be compatible |

---

## Open Questions

1. **Should OAuth tokens be stored in session or database?**
   - Options: Session (simpler) or Database (supports token refresh)
   - Recommendation: Session storage for MVP — matches existing GitHub pattern

2. **Should we implement token refresh?**
   - Options: Yes (Google tokens expire in 1 hour) or No (re-auth on expiry)
   - Recommendation: No for now — users re-authenticate if token expires, revisit if needed
