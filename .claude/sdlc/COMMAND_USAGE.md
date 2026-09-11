# Command Usage Reference

Quick reference for the `/sdlc` workflow command.

---

## `/sdlc <issue-name> [description] [flags]`

Execute the complete expert team pipeline:
Pre-flight → Research → Architecture → Plan → **[Human Review]** → Implement → Expert Review → Fix Loop → Documentation → Production Ready.

### Syntax

```bash
/sdlc <issue-name> [description] [--resume | --plan | --implement | --review]
```

### Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `issue-name` | Yes | Kebab-case identifier (1-50 chars) |
| `description` | Yes* | What to build (min 10, max 1000 chars) |
| `--resume` | No | Continue from `STATE.json` current phase |
| `--plan` | No | Start from Planning (needs `RESEARCH.md` + `ADR.md`) |
| `--implement` | No | Start from Implementation (needs `PLAN.md`) |
| `--review` | No | Start from Expert Review (needs `IMPLEMENTATION.md`) |

*Required for new workflows; not needed with `--resume`

### Examples

```bash
# Full workflow — research through production readiness
/sdlc add-oauth-auth "Implement OAuth2 with Google"

# Resume after interruption
/sdlc add-oauth-auth --resume

# Start from a specific phase
/sdlc add-oauth-auth --plan
/sdlc add-oauth-auth --implement
/sdlc add-oauth-auth --review
```

### Issue Name Format

- Kebab-case only: `add-oauth-auth`
- 1-50 characters, no path traversal

**Good:** `add-oauth-auth`, `fix-memory-leak`, `refactor-api-layer`
**Bad:** `AddOAuthAuth` (not kebab-case), `fix` (too vague), `../etc/passwd` (path traversal)

---

## Pre-Flight Checks

Before starting, the orchestrator validates:

| Check | What happens on failure |
|-------|------------------------|
| `STATE.json` exists and is complete | Warns "already complete" — use a new issue name |
| `STATE.json` exists and is in-progress | Warns "use `--resume` to continue" |
| Description is < 10 characters | Stops and asks for a description |
| Uncommitted changes in working tree | Warns (continues — changes will appear in reviewer diffs) |

---

## Human Checkpoints

Two points where the workflow pauses for your input:

1. **High-risk confirmation** — if Research returns `risk_level: "High"`, the orchestrator presents the research summary and asks you to confirm before proceeding to Architecture.
2. **Plan confirmation** — after Planning, the orchestrator shows the plan summary (scope, phases, acceptance criteria) and waits for your approval before implementation starts.

---

## Check Progress

```bash
# Current phase and machine state
cat docs/{issue-name}/STATE.json

# Human-readable progress
cat docs/{issue-name}/STATUS.md

# Final sign-off checklist
cat docs/{issue-name}/PRODUCTION_READINESS.md
```

---

## Fix Loop Behavior

When any expert returns `NEEDS_FIX`:
1. A fix agent addresses all blocking issues (non-blocking suggestions are skipped)
2. Only the experts that failed re-review (approved experts do not re-run)
3. Maximum 3 fix iterations — if still failing after 3, the workflow marks `BLOCKED` and escalates to you
4. Use `--resume` after manual intervention to continue

The `failing_experts` field in `STATE.json` shows exactly which reviewers are blocking progress.

---

For full workflow documentation, see `README.md`.
For architecture details, see `.claude/sdlc/ARCHITECTURE.md`.
For STATE.json format, see `.claude/sdlc/STATE_MANAGEMENT.md`.
For recovery from errors, see `.claude/sdlc/TROUBLESHOOTING.md`.
