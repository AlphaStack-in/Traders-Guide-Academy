# Architecture Overview

Expert agentic team workflow aligned with Claude Code 2026 best practices.

## Visual Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                             │
│                      /sdlc command                                │
│               Model: claude-haiku-4-5-20251001                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                                 │
│                  sdlc-orchestrator agent                          │
│                  Model: claude-opus-4-6                           │
│  • Spawns each phase as isolated Agent subagent                   │
│  • Writes STATE.json at every phase transition                    │
│  • Parallel expert review, scoped fix loop                        │
│  • Aggregates expert verdicts → REVIEW.md                         │
│  • Assembles PRODUCTION_READINESS.md                              │
└──────────┬──────────┬──────────┬──────────┬──────────┬───────────┘
           │          │          │          │          │
     Agent tool  (each phase isolated, fresh 200K context)
           │          │          │          │          │
     ┌─────▼──┐  ┌────▼───┐ ┌───▼────┐ ┌───▼──┐ ┌────▼──────┐
     │Research│  │Architect│ │Planner │ │Develo│ │Tech Writer│
     │sonnet  │  │opus     │ │opus    │ │ per  │ │sonnet     │
     └────────┘  └─────────┘ └────────┘ │sonnet│ └───────────┘
                                         └──────┘
                                              │
                              ┌───────────────┼───────────────┐
                              │ (parallel)    │               │
                         ┌────▼────┐   ┌─────▼──┐   ┌────────▼──┐
                         │Security │   │  QA    │   │   SRE     │
                         │opus     │   │ sonnet │   │  sonnet   │
                         └─────────┘   └────────┘   └───────────┘
```

---

## Model Strategy

| Component | Model | Rationale |
|-----------|-------|-----------|
| `/sdlc` command | `claude-haiku-4-5-20251001` | Pure parsing — no reasoning needed |
| Orchestrator | `claude-opus-4-6` | Gate decisions, expert merge, coordination |
| `architect` | `claude-opus-4-6` | Design judgment, trade-off analysis |
| `solution-planning` | `claude-opus-4-6` | Critical planning with edge cases |
| `security-reviewer` | `claude-opus-4-6` | Security judgment, threat modeling |
| `code-research` | `claude-sonnet-4-6` | Exploration, pattern recognition |
| `code-implementation` | `claude-sonnet-4-6` | Implementation throughput |
| `qa-reviewer` | `claude-sonnet-4-6` | Test coverage analysis |
| `sre-reviewer` | `claude-sonnet-4-6` | Operational readiness checklist |
| `tech-writer` | `claude-sonnet-4-6` | Documentation generation |
| `review-fix` | `claude-sonnet-4-6` | Targeted, narrow fixes |

---

## Workflow Phases

| Phase | Agent/Skill | Output | Gate |
|-------|-------------|--------|------|
| Pre-flight | Orchestrator (inline) | — | No conflicting state, valid description |
| Research | `code-research` skill | `RESEARCH.md` | 3 questions answered; High-risk triggers user confirmation |
| Architecture | `architect` agent | `ADR.md` | Constraints for planner defined |
| Planning | `solution-planning` skill | `PLAN.md` | Scope + phases + validation cmds + criteria |
| Human Review | Orchestrator (inline) | — | User confirms plan before implementation starts |
| Implementation | `code-implementation` skill | `IMPLEMENTATION.md` + code | All phases done + actual test output |
| Review (parallel) | `security-reviewer` + `qa-reviewer` + `sre-reviewer` | `SECURITY.md`, `QA.md`, `SRE.md` | All three APPROVED |
| Orchestrator merge | Orchestrator | `REVIEW.md` | Aggregated verdict |
| Fix (scoped) | `review-fix` skill + failing experts only | Fixed code + `IMPLEMENTATION.md` update | Failing experts APPROVED |
| Documentation | `tech-writer` agent | CHANGELOG, README, API docs | Docs updated |
| Gate | Orchestrator | `PRODUCTION_READINESS.md` | All sign-offs + docs |

---

## Subagent Context Isolation

Each phase runs as a separate Agent subagent — never inline in the orchestrator. This gives each phase a clean 200K context window, preventing overflow across a long workflow.

**Parallel expert review** is the primary use of simultaneous Agent spawns — Security, QA, and SRE agents run at the same time in a single orchestrator response.

**Scoped fix loop** — only agents that returned NEEDS_FIX are re-spawned after fixes. An expert that already approved does not re-review.

---

## Artifact Ownership (DRY principle)

Each artifact is written by exactly one agent. The orchestrator reads outputs but does not rewrite them.

| Artifact | Owner |
|----------|-------|
| `STATE.json` | Orchestrator only |
| `RESEARCH.md` | code-research skill |
| `ADR.md` | architect agent |
| `PLAN.md` | solution-planning skill |
| `IMPLEMENTATION.md` | code-implementation skill |
| `SECURITY.md` | security-reviewer agent |
| `QA.md` | qa-reviewer agent |
| `SRE.md` | sre-reviewer agent |
| `REVIEW.md` | Orchestrator (aggregated) |
| `PRODUCTION_READINESS.md` | Orchestrator |
| `STATUS.md` | Each phase skill/agent |

---

## Human Checkpoint at Planning

After the Planning phase completes, the orchestrator reads `PLAN.md` and presents a summary to the user — scope, phase names, key acceptance criteria — and waits for confirmation before spawning the Implementation agent. This is the primary human-in-the-loop gate in the workflow.

If `risk_level` from `RESEARCH.md` is `"High"`, an additional checkpoint fires after Research: the orchestrator presents the research summary and asks for confirmation before proceeding to Architecture.

---

## No Worktrees

This workflow operates entirely in the main working directory. The `isolation: "worktree"` flag is never used when spawning agents. All implementation changes are made directly in the working tree so that `git diff HEAD` correctly reflects the full changeset for reviewers.

---

## Hooks Integration

Claude Code hooks (`.claude/settings.local.json`) can enhance the workflow:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{ "type": "command", "command": "echo 'Written: $TOOL_INPUT_FILE_PATH'" }]
      }
    ]
  }
}
```

Useful hooks for this workflow:
- **PostToolUse(Bash):** Surface test failures immediately
- **PostToolUse(Write):** Log artifact creation with timestamps
- **PreToolUse(Bash):** Guard against destructive commands during autonomous execution

---

## DRY / KISS / YAGNI Applied to the Workflow

**DRY:**
- Shared codebase context flows through RESEARCH.md — subsequent agents read it, never rediscover it
- Test runner commands defined once in PLAN.md validation section — all agents that run tests use those exact commands
- PRODUCTION_READINESS.md aggregates from expert artifacts — no information is duplicated

**KISS:**
- Each expert agent has one output artifact and one verdict
- Orchestrator merge is trivial: any expert NEEDS_FIX = REVIEW NEEDS_FIX
- No nested agent spawning — orchestrator is the only coordinator; all experts are leaves
- RETROSPECTIVES.md is a plain append-only file, not a database

**YAGNI:**
- Architect writes ADR only if decision is non-obvious
- SRE writes runbook only if new operational surface was added
- Tech writer updates README only if user-facing behavior changed
- API docs updated only if public interface changed
- Worktree used only for long/risky implementations

---

## Extended Thinking Note

Skills use prompt instructions to invoke deeper reasoning ("think carefully about..."). In API-based agents, extended thinking should be set via the `thinking` parameter (`{ "type": "enabled", "budget_tokens": 10000 }`). Prompt-based invocation is a workaround for markdown-based skill files.

---

## Quality Invariants

1. **No logic in command** — only parse and invoke
2. **Agent for every phase** — no inline execution in orchestrator
3. **Parallel expert review** — Security, QA, SRE simultaneously
4. **Scoped fix loop** — only failing experts re-review
5. **STATE.json is the source of truth** — resume reads it, not STATUS.md
6. **Verified validation** — implementation shows actual command output
7. **Single artifact owner** — no duplication across files
8. **Max 3 fix iterations** — escalate if stuck
9. **Human checkpoint at planning** — user confirms plan before implementation starts
10. **High-risk confirmation** — High risk_level triggers user confirmation after Research
11. **No worktrees** — all work in main working directory
12. **Scoped Bash permissions** — settings.json uses command patterns, never global Bash allow
13. **Production readiness gate** — all expert sign-offs before declaring complete
