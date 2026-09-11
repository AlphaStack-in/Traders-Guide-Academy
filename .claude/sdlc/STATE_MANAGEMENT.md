# State Management

How the SDLC workflow tracks and persists state across phases and agents.

---

## Core Principle

**Artifacts ARE the communication mechanism between phases. Each artifact is owned by exactly one agent — no duplication.**

- **STATE.json** = Machine-readable source of truth for resume logic (orchestrator only)
- **STATUS.md** = Human-readable progress display (written by each phase skill/agent)
- **Phase artifacts** = Persistent outputs read by the next phase in the chain

---

## File Layout

```
docs/{issue-name}/
├── STATE.json              ← machine state (orchestrator only, every transition)
├── STATUS.md               ← human-readable progress
├── RESEARCH.md             ← research findings (code-research)
├── ADR.md                  ← architecture decisions (architect agent)
├── PLAN.md                 ← implementation plan (solution-planning)
├── IMPLEMENTATION.md       ← what was built + actual test output (code-implementation)
├── SECURITY.md             ← security verdict (security-reviewer agent)
├── QA.md                   ← QA verdict (qa-reviewer agent)
├── SRE.md                  ← SRE verdict + runbook if needed (sre-reviewer agent)
├── REVIEW.md               ← aggregated expert verdict (orchestrator)
└── PRODUCTION_READINESS.md ← final gate checklist (orchestrator)
```

---

## STATE.json — Mandatory

Written by the orchestrator at every phase transition. **Skills and expert agents do NOT write STATE.json.**

### Key Fields

| Field | Purpose |
|-------|---------|
| `current_phase` | Which phase to resume from |
| `phase_status` | Status within current phase |
| `review_iteration` | How many fix iterations have run (0-3) |
| `failing_experts` | Which experts returned NEEDS_FIX (scopes fix loop re-reviews) |
| `artifacts` | Status of each artifact file |

### Phase Sequence

```
research → architecture → planning → implementation → review → documentation → complete
                                                          ↓
                                              fix (review_iteration 1-3)
                                                          ↓
                                                        review
                                                          ↓ (if still blocked at 3)
                                                        blocked
```

---

## Information Flow (DRY principle)

Each phase reads only what it needs. No artifact duplicates information from another.

| Phase | Reads | Writes |
|-------|-------|--------|
| Research | nothing | RESEARCH.md |
| Architecture | RESEARCH.md | ADR.md |
| Planning | RESEARCH.md, ADR.md | PLAN.md |
| Implementation | PLAN.md, RESEARCH.md, ADR.md | code, IMPLEMENTATION.md |
| Security Review | IMPLEMENTATION.md, git diff | SECURITY.md |
| QA Review | PLAN.md, IMPLEMENTATION.md, tests | QA.md |
| SRE Review | IMPLEMENTATION.md, git diff | SRE.md |
| Orchestrator merge | SECURITY.md, QA.md, SRE.md | REVIEW.md |
| Fix | REVIEW.md (consolidated), git diff | fixed code |
| Tech Writer | IMPLEMENTATION.md, PLAN.md, CHANGELOG, README | updated docs |
| Orchestrator | all verdicts | PRODUCTION_READINESS.md |

---

## Resume Logic

**Step 1:** Read `docs/{issue_name}/STATE.json`

**Step 2:** Map `current_phase` → spawn the appropriate agent

**Step 3 (fix loop):** Read `failing_experts` array — only spawn those expert agents

**Fallback:** If STATE.json missing, read STATUS.md `[x]`/`[~]`/`[ ]` checkboxes. Create STATE.json after reading.

---

## STATUS.md — Human-Readable

Written by each phase skill/agent. Progress notation: `[x]` = done, `[~]` = in progress, `[ ]` = pending.

```markdown
# Status: {issue_name}

**Risk:** {level} | **Updated:** {timestamp}

## Progress
- [x] Research | [x] Architecture | [x] Planning | [x] Implementation | [~] Review | [ ] Docs

## Phase: {current}
- **Status:** {status}
- **Next:** {next phase}

## Artifacts
- RESEARCH.md ✓
- ADR.md ✓
- PLAN.md ✓
- IMPLEMENTATION.md ✓
- SECURITY.md ✓
- QA.md ✓
- SRE.md (in progress)
- REVIEW.md
- PRODUCTION_READINESS.md
```
