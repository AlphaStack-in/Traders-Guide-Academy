# SDLC Workflow Troubleshooting

**For:** Users of the `/sdlc` command
**Purpose:** Recover from common workflow issues

---

## Quick Diagnosis

### Step 1: Check STATE.json (machine state)

```bash
cat docs/{issue-name}/STATE.json
```

Look at `current_phase`, `phase_status`, `review_iteration`, and `failing_experts`.

### Step 2: Check STATUS.md (human-readable)

```bash
cat docs/{issue-name}/STATUS.md
```

### Step 3: List artifacts

```bash
ls -la docs/{issue-name}/
```

**Expected artifacts per phase:**

| After phase completes | Expected files |
|-----------------------|---------------|
| Research | `RESEARCH.md`, `STATUS.md`, `STATE.json` |
| Architecture | `+ ADR.md` |
| Planning | `+ PLAN.md` |
| Implementation | `+ IMPLEMENTATION.md`, code files |
| Expert Review | `+ SECURITY.md`, `QA.md`, `SRE.md`, `REVIEW.md` |
| Documentation | `+ PRODUCTION_READINESS.md`, updated `CHANGELOG.md` |

---

## Resuming a Workflow

Always try `--resume` first:
```bash
/sdlc {issue-name} --resume
```

This reads `STATE.json` → finds `current_phase` → spawns the right agent.

To jump to a specific phase (previous artifacts must exist):
```bash
/sdlc {issue-name} --plan        # needs RESEARCH.md + ADR.md
/sdlc {issue-name} --implement   # needs PLAN.md
/sdlc {issue-name} --review      # needs IMPLEMENTATION.md
```

---

## Common Issues by Phase

### Research Phase

**RESEARCH.md not created:**
```bash
/sdlc {issue-name} "More specific description"
```

---

### Architecture Phase

**ADR.md not created:**
```bash
/sdlc {issue-name} --resume
```
The architect always creates ADR.md — even if no decision was needed, it writes "No new architectural decisions required."

---

### Planning Phase

**Missing RESEARCH.md or ADR.md when starting planning:**
```bash
❌ Cannot start from Planning: RESEARCH.md not found
```
Run the full workflow: `/sdlc {issue-name} "description"`

**PLAN.md has no per-phase validation commands:**
```bash
/sdlc {issue-name} --plan
```
The planning agent regenerates PLAN.md with proper per-phase validation checklists.

---

### Implementation Phase

**Stopped after Phase 1:**
```bash
/sdlc {issue-name} --implement
```
Check PLAN.md phase count: `grep "### Phase" docs/{issue-name}/PLAN.md`

**IMPLEMENTATION.md has no actual test output (just claims):**
```bash
/sdlc {issue-name} --review
```
The QA reviewer runs tests independently and will flag the gap.

---

### Expert Review Phase

**Only one or two of SECURITY.md / QA.md / SRE.md created:**

The three reviewers should spawn in parallel. If one is missing, the orchestrator didn't complete the parallel spawn. Resume:
```bash
/sdlc {issue-name} --resume
```
STATE.json `current_phase` should be `review`. The orchestrator will re-spawn all three reviewers.

**REVIEW.md exists but has no consolidated blocking issues:**
```bash
/sdlc {issue-name} --resume
```
The orchestrator reads all three expert files and regenerates REVIEW.md.

---

### Fix Loop

**STATE.json shows `failing_experts: ["qa"]` but orchestrator is re-running all three:**

This is a bug in the orchestrator. Manual recovery:
1. Check which experts actually failed: `grep "Verdict" docs/{issue-name}/SECURITY.md docs/{issue-name}/QA.md docs/{issue-name}/SRE.md`
2. Edit STATE.json to correct `failing_experts`
3. Resume: `/sdlc {issue-name} --resume`

**Maximum iterations (3) reached — BLOCKED:**
```
⚠️ Blocked at fix after 3 iterations
```

Recovery options:

1. **Manual fix** — fix the remaining issues yourself, then:
   ```bash
   /sdlc {issue-name} --review
   ```

2. **Read remaining issues:**
   ```bash
   cat docs/{issue-name}/REVIEW.md
   # Read "Consolidated Blocking Issues"
   ```

3. **Restart with better description:**
   ```bash
   /sdlc {issue-name} "More specific description"
   ```

---

### Documentation Phase

**CHANGELOG.md not updated:**
```bash
/sdlc {issue-name} --resume
```
STATE.json `current_phase` should be `documentation`.

**README.md was updated unnecessarily (pure refactor):**
The tech writer should only update README for user-facing changes. If it over-updated, revert those changes manually: `git checkout -- README.md` and re-run `/sdlc {issue-name} --resume`.

---

### General Issues

**STATE.json shows wrong phase:**

Manually edit STATE.json to the correct phase:
```bash
# Edit docs/{issue-name}/STATE.json
# Correct: current_phase, phase_status, failing_experts
/sdlc {issue-name} --resume
```

**Workflow stopped mid-execution (context overflow):**
```bash
/sdlc {issue-name} --resume
```
STATE.json indicates the last completed phase.

**Wrong issue name used:**
```bash
ls docs/
mv docs/{wrong-name} docs/{correct-name}
# Edit STATE.json: change issue_name field
/sdlc {correct-name} --resume
```

---

## Reset (Last Resort)

```bash
# Backup
mv docs/{issue-name} docs/{issue-name}.backup

# Restart
/sdlc {issue-name} "Feature description"

# Optionally reuse research
cp docs/{issue-name}.backup/RESEARCH.md docs/{issue-name}/
/sdlc {issue-name} --plan
```

---

## Quick Reference

### Flags

| Flag | Starts from | Requires |
|------|-------------|---------|
| *(none)* | Research | Nothing |
| `--resume` | STATE.json `current_phase` | STATE.json or STATUS.md |
| `--plan` | Planning | RESEARCH.md, ADR.md |
| `--implement` | Implementation | PLAN.md |
| `--review` | Expert Review (parallel) | IMPLEMENTATION.md |

### All Artifacts

| File | Owner | Purpose |
|------|-------|---------|
| `STATE.json` | Orchestrator | Machine state for `--resume` |
| `STATUS.md` | Each phase | Human-readable progress |
| `RESEARCH.md` | code-research | Files, patterns, risks |
| `ADR.md` | architect | Architectural decisions + constraints |
| `PLAN.md` | solution-planning | Scope, phases, acceptance criteria |
| `IMPLEMENTATION.md` | code-implementation | What was built + actual test output |
| `SECURITY.md` | security-reviewer | Security verdict |
| `QA.md` | qa-reviewer | Test coverage verdict |
| `SRE.md` | sre-reviewer | Operational readiness + runbook |
| `REVIEW.md` | Orchestrator | Aggregated expert verdict |
| `PRODUCTION_READINESS.md` | Orchestrator | Final gate checklist |
