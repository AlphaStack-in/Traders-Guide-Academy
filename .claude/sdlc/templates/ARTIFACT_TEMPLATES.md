# Artifact Templates

Templates for all SDLC artifacts. One file per phase, owned by one agent.

---

## RESEARCH.md
*Owner: code-research skill*

```markdown
# Research: {issue_name}

**What:** {feature_description}
**When:** {timestamp}

---

## Summary

- **Risk:** Low | Medium | High
- **Approach:** {Brief approach recommendation}
- **Effort:** Quick | Moderate | Significant

---

## What We Found

### Files to Touch
- `path/to/file.ts` - {why}

### Patterns to Follow
- `{pattern}` from `path/to/reference.ts`

### Key Dependencies
- `{package}` - existing | needed

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| {risk} | Low/Med/High | {how to address} |

---

## Open Questions

1. **{Question}?**
   - Options: {A or B}
   - Recommendation: {A because...}
```

---

## ADR.md
*Owner: architect agent*

```markdown
# ADR: {issue_name}

**Decision:** {one sentence — what we decided | No new architectural decisions required}
**Status:** Accepted | N/A
**When:** {timestamp}

---

## Context

{2-3 sentences: what problem, what constraints forced the decision}

## Decision

{What we will do and why}

## Alternatives Rejected

- **{Alternative A}** — rejected because {reason}

## Consequences

**Better:** {what improves}
**Harder:** {what becomes more complex}

---

## Constraints for Planning

- {constraint the planning agent must respect}
- {constraint the planning agent must respect}
```

---

## PLAN.md
*Owner: solution-planning skill*

```markdown
# Plan: {issue_name}

**What:** {feature_description}
**When:** {timestamp}

---

## Scope

**Building:**
- {Feature 1}
- {Feature 2}

**NOT Building:**
- {Out of scope 1}

---

## Phases

### Phase 1: {Name}
**Goal:** {what this phase accomplishes}

Tasks:
- [ ] {task 1}
- [ ] {task 2}

Validation:
- [ ] `{command}` — show actual output
- [ ] `{command}` — show actual output

### Phase 2: {Name}
**Goal:** {what this phase accomplishes}

Tasks:
- [ ] {task 1}

Validation:
- [ ] `{command}` — show actual output

---

## Acceptance Criteria

- [ ] {criterion 1}
- [ ] {criterion 2}
- [ ] All tests passing
- [ ] No regressions

---

## Technical Notes

**Approach:** {high-level approach}

**Files:**
- Create: `path/to/new-file.ts`
- Modify: `path/to/existing.ts`

**Dependencies:**
- {package} (new | existing)

---

## Risks & Mitigations

| Risk | Plan |
|------|------|
| {risk} | {mitigation} |
```

---

## IMPLEMENTATION.md
*Owner: code-implementation skill*

```markdown
# Implementation: {issue_name}

**What:** {feature_description}
**When:** {timestamp}

---

## Summary

Built {brief description}. {N}/{N} phases completed.

---

## Changes

### Files Created
- `path/to/file.ts` - {purpose}

### Files Modified
- `path/to/file.ts` - {what changed}

---

## Phases Completed

- [x] Phase 1: {name} - {brief result}
- [x] Phase 2: {name} - {brief result}

---

## Test Results

### Full Suite
```
{actual output of test command}
```

### Type Check
```
{actual output}
```

### Lint
```
{actual output}
```

---

## Deviations from Plan

{None | table of deviations}

---

## Known Limitations

- {limitation} (impact: low/medium)
```

---

## SECURITY.md
*Owner: security-reviewer agent*

```markdown
# Security Review: {issue_name}

**When:** {timestamp}

---

## Verdict

**Status:** APPROVED | NEEDS_FIX

---

## Dependency Audit

| Tool | Status | Notes |
|------|--------|-------|
| {npm audit} | ✓/✗ | {output summary} |

---

## OWASP Checks

| Check | Status | Notes |
|-------|--------|-------|
| Injection | ✓/✗ | |
| Broken Auth | ✓/✗ | |
| Sensitive Data Exposure | ✓/✗ | |
| Broken Access Control | ✓/✗ | |
| XSS | ✓/✗ | |
| Security Misconfiguration | ✓/✗ | |
| Secrets Detected | ✓ None / ✗ Found | |

---

## Threat Assessment

- **Spoofing:** {finding or "No risk identified"}
- **Tampering:** {finding or "No risk identified"}
- **Information Disclosure:** {finding or "No risk identified"}
- **Elevation of Privilege:** {finding or "No risk identified"}

---

## Issues

### Blocking (must fix)
- `path/to/file.ts:line` — {issue}

### Non-Blocking
- {suggestion}

---

## Decision

{APPROVED | NEEDS_FIX: See blocking issues above}
```

---

## QA.md
*Owner: qa-reviewer agent*

```markdown
# QA Review: {issue_name}

**When:** {timestamp}

---

## Verdict

**Status:** APPROVED | NEEDS_FIX

---

## Test Run

```
{actual test output}
```

**Result:** {N} passing, {M} failing, {K} skipped

---

## Acceptance Criteria Coverage

| Criterion | Tested? | Location |
|-----------|---------|----------|
| {from PLAN.md} | ✓/✗ | `tests/file.ts:line` |

---

## Case Coverage

| Case | Status | Notes |
|------|--------|-------|
| Happy path | ✓/✗ | |
| Invalid input | ✓/✗ | |
| Error path | ✓/✗ | |
| Edge cases | ✓/✗ | |

---

## Regression Risk

| Modified file | Existing coverage | Risk |
|--------------|------------------|------|
| `path/to/file.ts` | ✓/✗ | Low/Med/High |

---

## Issues

### Blocking
- {missing test or failing test}

### Non-Blocking
- {suggestion}

---

## Decision

{APPROVED | NEEDS_FIX: See blocking issues above}
```

---

## SRE.md
*Owner: sre-reviewer agent*

```markdown
# SRE Review: {issue_name}

**When:** {timestamp}

---

## Verdict

**Status:** APPROVED | NEEDS_FIX

---

## Operational Surface

| Category | Change | Notes |
|----------|--------|-------|
| New endpoints | Yes/No | |
| New env vars | Yes/No | {names} |
| External dependencies | Yes/No | |
| Data migrations | Yes/No | |

---

## Observability

| Check | Status | Notes |
|-------|--------|-------|
| Error logging | ✓/✗ | |
| No PII in logs | ✓/✗ | |
| Metrics | ✓/✗/N/A | |

---

## Configuration

| Variable | Purpose | Default | Required |
|----------|---------|---------|---------|
| `{ENV_VAR}` | {purpose} | `{default}` | Yes/No |

---

## Rollback

**Complexity:** Low | Medium | High
**Plan:** {steps}

---

## Runbook

{Only if new operational surface}

### Health check
{How to verify in production}

### Failure modes
| Symptom | Cause | Resolution |
|---------|-------|-----------|
| {symptom} | {cause} | {fix} |

---

## Issues

### Blocking
- {issue}

### Non-Blocking
- {suggestion}

---

## Decision

{APPROVED | NEEDS_FIX: See blocking issues above}
```

---

## REVIEW.md
*Owner: orchestrator (aggregated from expert verdicts)*

```markdown
# Review: {issue_name}

**When:** {timestamp}
**Iteration:** {N}/3

---

## Verdict

**Status:** APPROVED | NEEDS_FIX

---

## Expert Verdicts

| Expert | Status | Blocking Issues |
|--------|--------|----------------|
| Security | ✓ APPROVED / ✗ NEEDS_FIX | {N} |
| QA | ✓ APPROVED / ✗ NEEDS_FIX | {N} |
| SRE | ✓ APPROVED / ✗ NEEDS_FIX | {N} |

---

## Consolidated Blocking Issues

**From Security:**
- {issue}

**From QA:**
- {issue}

**From SRE:**
- {issue}
```

---

## PRODUCTION_READINESS.md
*Owner: orchestrator*

```markdown
# Production Readiness: {issue_name}

**Date:** {timestamp}

---

## Expert Sign-offs

- [x] Security: APPROVED (SECURITY.md)
- [x] QA: APPROVED (QA.md)
- [x] SRE: APPROVED (SRE.md)

## Code Quality

- [x] All tests pass
- [x] Type check passes
- [x] Lint passes

## Documentation

- [x] CHANGELOG updated
- [x/·] README updated
- [x/·] API docs updated
- [x/·] ADR written
- [x/·] Runbook written (SRE.md)

## Breaking Changes

{None | {description}}

## Rollback

**Complexity:** {from SRE.md}
**Plan:** {from SRE.md}

---

## Final Verdict

**Status:** PRODUCTION_READY

Ready to commit and deploy.
```

---

## STATUS.md
*Owner: all phase skills (updated each phase)*

```markdown
# Status: {issue_name}

**Risk:** {level} | **Updated:** {timestamp}

## Progress
- [x] Research | [x] Architecture | [x] Planning | [x] Implementation | [~] Review | [ ] Docs

## Phase: {current}
- **Status:** {in_progress|complete|blocked}
- **Next:** {next phase}

## Artifacts
- RESEARCH.md ✓
- ADR.md ✓
- PLAN.md ✓
- IMPLEMENTATION.md ✓
- SECURITY.md ✓
- QA.md ✓
- SRE.md ✓
- REVIEW.md ✓
- PRODUCTION_READINESS.md
```

---

## STATE.json
*Owner: orchestrator only*

See `.claude/schemas/STATE.json.schema` for full schema and lifecycle examples.
