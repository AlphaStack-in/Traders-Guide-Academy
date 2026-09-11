# SDLC Retrospectives

Append-only log. One entry per completed workflow. Review periodically to identify recurring patterns.

---

<!-- Entries are prepended by the orchestrator after each completed workflow -->
<!-- Format: ## {issue_name} — {date} -->

## performance-email-digest -- 2026-08-24

**Phases:** Research, Architecture, Planning, Implementation, Review, Documentation -- all complete
**Fix iterations:** 1/3
**Blocked:** no
**Expert failures:** SRE flagged 1 blocking issue (NEXT_PUBLIC_BASE_URL missing from .env.example) + 4 non-blocking; QA flagged 4 non-blocking; Security flagged 3 non-blocking. All resolved in Fix Iteration 1.

**What slowed things down:** Planning agent hit a transient API error on first attempt and had to be re-spawned. Background review agents did not complete and had to be re-launched synchronously.
**Suggested improvement:** Launch review agents with run_in_background: false to guarantee completion within the orchestrator turn, or implement a timeout-and-retry pattern for background agents.

---
