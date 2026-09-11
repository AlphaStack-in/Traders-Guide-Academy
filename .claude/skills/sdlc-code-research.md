---
name: sdlc-researching-code
description: "Understand minimum codebase context needed for planning. Use before implementation or when analyzing unfamiliar code areas. Triggers: research, investigate codebase, analyze architecture, find patterns."
model: claude-sonnet-4-6
tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
  - Agent
---

# Code Research

**Mindset:** Understand just enough to plan effectively. Skip comprehensive documentation.

**Tool rule:** Use `Read` (not `cat`), `Glob` (not `find`/`ls`), `Grep` (not `grep`/`rg`) for all file operations. Never use Bash for reading or searching files.

## Goal

Find the minimum context needed to answer:
1. What files will this touch?
2. What patterns should we follow?
3. What are the main risks?

## Inputs
- `issue_name`: Kebab-case identifier
- `feature_description`: What to build

## Output
- `docs/{issue_name}/RESEARCH.md`
- `docs/{issue_name}/STATUS.md` (updated)

## Procedure

### 1. Parallel Discovery

**IMPORTANT: Make all independent searches in parallel.** Issue multiple Glob, Grep, and Read calls in the same response rather than sequentially. This is the primary performance lever in research.

For larger codebases, spawn parallel Agent subagents to search different aspects simultaneously:

```
Parallel Agent invocations (if codebase is large):
- Agent 1: "Find files related to {feature_area}. List files to touch and why."
- Agent 2: "Find existing patterns for {pattern_type} in this codebase. Show examples."
- Agent 3: "Identify risks: find shared utilities, tight coupling, and test coverage gaps around {feature_area}."
```

For smaller codebases, issue parallel tool calls directly:

```
In one response, call all of these simultaneously:
- Glob pattern="**/*{related_term}*"
- Grep pattern="{related_term}" output_mode="files_with_matches"
- Grep pattern="{similar_feature}" output_mode="files_with_matches"
```

**What files will this touch?**
- Grep for the feature area, entry points, configuration
- Glob for files by name convention

**What patterns should we follow?**
- Find similar existing implementations
- Read 1-2 reference files to understand conventions

**What are the main risks?**
- Check test coverage in related areas
- Look for shared utilities/dependencies that could break
- Identify tight coupling

### 2. Create RESEARCH.md

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
- `path/to/file.ts` - {why}

### Patterns to Follow
- `{pattern}` from `path/to/reference.ts`
- `{convention}` used in this codebase

### Key Dependencies
- `{package}` - existing | needed
- `{shared_module}` - existing

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

### 3. Update STATUS.md

```markdown
# Status: {issue_name}

**Risk:** {level} | **Updated:** {timestamp}

## Progress
- [x] Research | [ ] Planning | [ ] Implementation | [ ] Review

## Phase: Research ✓
- **Finding:** {key finding}
- **Risk:** {level}
- **Next:** Planning

## Artifacts
- RESEARCH.md ✓
```

## What NOT to Do

- Don't document the entire architecture
- Don't trace full data flows
- Don't analyze git history (rarely needed)
- Don't create 30+ file analyses
- Don't make sequential tool calls when parallel calls work
- Don't write any files outside the project — all writes go to `docs/{issue_name}/`. Never use `/tmp`.
- Don't use Bash for file operations — use `Read` not `cat`, `Glob` not `find`/`ls`, `Grep` not `grep`/`rg`, `Write`/`Edit` not `echo`/`sed`/`awk`. Reserve Bash for shell commands only.

## Quality Check

Before marking complete:
- [ ] Answered: What files to touch?
- [ ] Answered: What patterns to follow?
- [ ] Answered: What are the risks?
- [ ] RESEARCH.md created
- [ ] STATUS.md updated
