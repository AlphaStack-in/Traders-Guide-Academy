# Example: PLAN.md

**Issue:** add-oauth-login
**Feature:** Add OAuth2 authentication with Google and GitHub providers

---

# Plan: add-oauth-login

**What:** Add OAuth2 authentication with Google and GitHub providers
**When:** 2026-01-12T11:15:00Z

---

## Scope

**Building:**
- Google OAuth2 strategy using `passport-google-oauth20`
- `/auth/google` and `/auth/google/callback` routes
- Session provider tracking (`provider: 'google' | 'github'`)
- Tests: unit for strategy + integration for OAuth flow

**NOT Building:**
- Token refresh (Google tokens expire in 1hr — re-auth acceptable for now)
- Database storage for OAuth tokens (session storage matches existing GitHub pattern)
- Additional OAuth providers (scope is Google + GitHub only)

---

## Phases

### Phase 1: Google Strategy + Routes
**Goal:** Users can initiate and complete Google OAuth flow

Tasks:
- [ ] Create `src/auth/google-strategy.ts` following `github-strategy.ts` pattern
- [ ] Register Google strategy in `src/auth/passport.ts`
- [ ] Add `/auth/google` and `/auth/google/callback` routes to `src/routes/auth.ts`
- [ ] Add `OAuthProvider` type and session extension to `src/types/auth.ts`
- [ ] Add `passport-google-oauth20` to `package.json`

Validation:
- [ ] `npm install` completes without errors — show output
- [ ] `npx tsc --noEmit` — show output (0 errors)
- [ ] `node -e "require('./src/auth/google-strategy')"` — show output (no import errors)

### Phase 2: Session + Tests
**Goal:** Session tracks provider; all flows covered by tests

Tasks:
- [ ] Update `src/middleware/session.ts` to include `provider` field (optional, backward-compatible)
- [ ] Create `tests/mocks/oauth.ts` with Google profile mock (follow `tests/mocks/github.ts`)
- [ ] Write unit tests for Google strategy and session provider tracking
- [ ] Write integration tests: happy path, OAuth denial, network error

Validation:
- [ ] `npm test` — show full output (all tests passing, no regressions)
- [ ] `npx tsc --noEmit` — show output (0 errors)
- [ ] `npm run lint` — show output (0 errors)

---

## Acceptance Criteria

- [ ] User can authenticate via Google OAuth2
- [ ] Session includes `provider: 'google'` after Google auth
- [ ] Existing GitHub OAuth flow is unaffected
- [ ] OAuth denial returns a user-friendly error (not 500)
- [ ] All tests passing with no regressions

---

## Technical Notes

**Approach:** Mirror the existing `passport-github2` implementation. Google strategy has the same callback structure — only profile field names differ.

**Files:**
- Create: `src/auth/google-strategy.ts`
- Create: `tests/mocks/oauth.ts`
- Modify: `src/auth/passport.ts` (register strategy)
- Modify: `src/routes/auth.ts` (add routes)
- Modify: `src/middleware/session.ts` (add provider field)
- Modify: `src/types/auth.ts` (add OAuthProvider type)

**Dependencies:**
- `passport-google-oauth20` (new)
- `@types/passport-google-oauth20` (new, dev)

---

## Risks & Mitigations

| Risk | Plan |
|------|------|
| Session changes break existing GitHub OAuth | Make `provider` field optional; test backward compatibility explicitly |
| passport-google-oauth20 version conflict | Pin to `^2.0.0`; test with existing passport@0.6 |
