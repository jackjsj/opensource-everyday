---
name: superharness-go
description: "Main entry point: end-to-end workflow for building features. Use superharness-go 'requirement' to start. Entry point and phase map: brainstorm → plan → implement → complete."
---

# Superharness Workflow

<HARD-RULE>
## First Action Constraint

After receiving a `$superharness-go` trigger, your **very first action** MUST be to read and follow the `superharness-brainstorm` skill. Before that, you are NOT allowed to:

- `apply_patch` any source code file
- `exec_command` any command that writes/creates source code files
- Write implementation code of any kind

The ONLY permitted actions before brainstorm completes are: reading files for context (cat, rg, ls), reading skill files, and asking the user questions.

"The requirement is already detailed enough" is NOT a valid reason to skip brainstorm. Even with a complete PRD, brainstorm ensures: (1) the user confirms the design interpretation, (2) task artifacts are created with user approval, (3) the phase gate in task.json is set correctly for downstream hooks.

Violation of this rule means ALL subsequent code will be reverted by the user.
</HARD-RULE>

Entry point + phase map for the superharness workflow: brainstorm → plan → implement (SDD, includes single review with dual verdicts) → complete.

This file is not an orchestrator. It tells you which skill owns each phase and what that phase must produce. In-phase discipline (what to do, in what order, what's required before moving on) is driven by the **workflow-state breadcrumb**: the `user-prompt-submit` hook reads `task.json.phase`, extracts the matching `[workflow-state:{phase}]` block from `workflow.md`, and injects it into context each turn. Do not duplicate that discipline here — if it changes, only `workflow.md` needs updating.

## Note on Recovery

There is no automatic unfinished-task detection. Recovery is user-driven: when the user asks to continue a task (e.g. "继续 xxx"), scan `.superharness/tasks/*/task.json` for entries with `status != completed`, locate the matching task, switch to its `worktree_path` if set, read git diff and task.json, and resume from the current phase.

If the user starts something new, they invoke `superharness-go "new requirement"` which proceeds with the normal flow below.

## Lite Profile

> **⚠️ The ONLY way to activate lite: user explicitly writes `[lite]` (with brackets) in the args.**
> The model must NEVER self-switch to lite based on perceived task simplicity, file count, or effort.
> No `[lite]` → Normal Flow, no exceptions.

`superharness-go [lite] "requirement"` — when args start with the literal token `[lite]` (brackets included), run the lite profile. This is the only trigger form: bare `lite` without brackets, or `[lite]` appearing later in the args, does not activate it.

**Suggestion guidance:** If the user writes `[lite]` but the requirement mentions pages, routes, components, or UI interactions, gently remind them: "This task involves UI changes — E2E verification will be skipped in lite mode. If you want E2E regression coverage, consider using full profile instead. Proceed with lite anyway? (y/n)". This is a suggestion, not a block — the user's choice is final.

Lite trims ceremony. Never discipline. All verification stays. Only ritual dies.

### Persistence

ACTIVE FOR THE WHOLE TASK. brainstorm writes `"profile": "lite"` into task.json at creation; the breadcrumb hook re-injects the matching `@lite` block every turn. No drifting back to full ceremony as the session grows. No dropping discipline as the session grows. Still lite if unsure about ceremony; still full-strict if unsure about verification. Never switch the profile mid-task on your own. Ends only when the task completes.

### Rules

- Skip: spec-discover, mindmap, plan.md, per-task implement-subagent dispatch, broad review, four-option finish menu.
- Keep: clarifying questions, design approval, prd.md, tests, the single task-reviewer pass, verification evidence, `status → completed` at the end.
- Unsure whether a step can be skipped: follow full.
- Per-phase `[required]` detail lives in the `[workflow-state:{phase}@lite]` blocks in `workflow.md` — the blocks are the SoT; this list is the overview.

Not: "It's lite, so I'll skip the review and just tell the user it's done."
Yes: "Lite: prd.md approved → fix + tests from prd acceptance criteria → task-reviewer PASS → fresh verification evidence → status completed → commit."

### Phase Flow

Lite dispatches no implement subagents, so pre-tool-use never auto-advances the phase. Advance `task.json.phase` by hand: brainstorm → implement → check (auto-written when dispatching task-reviewer) → complete. The plan phase does not exist in lite — inline 1-3 tasks into task.json at the end of brainstorm.

### Boundaries

- Tests, review, verification: required in every profile. Lite has no exemption.
- Task exceeds lite scope mid-way (schema/API changes, file-count growth): tell the user explicitly, let them decide. Never re-profile on your own.
- Code and commit standards: profile-independent.
- Isolation was decided at brainstorm — `worktree_path` already set means decided; do not create another worktree.

## Normal Flow

> **⚠️ Phase order is non-negotiable (Full Profile)**
> brainstorm → plan → implement → complete — each phase MUST be executed via its corresponding skill invocation, not merely mentioned and skipped.
> "The task is simple", "only one file to change", or "time is short" are NOT valid reasons to skip any phase.
> The only way to shorten the ceremony is for the user to explicitly use `[lite]`.
> **This is now enforced by a hard gate in the pre-tool-use hook**: dispatching an implement subagent without `plan.md` (full profile) or `prd.md` will cause the subagent to abort immediately.

### Brainstorm

Invoke `superharness-brainstorm` to clarify requirements and get the design approved.

**Produces:** brainstorm creates the task directory and writes `prd.md` / `task.json` / `contract.md` — all after the user approves the design (not before).

In-phase discipline comes from the `[workflow-state:brainstorm]` breadcrumb block; not repeated here.

### Plan

Invoke `superharness-writing-plans` to turn the approved spec into an implementation plan.

**Produces:** writing-plans writes `plan.md` and updates `task.json` (`tasks` list, `sprint.total`) and `contract.md`.

In-phase discipline comes from the `[workflow-state:plan]` breadcrumb block; not repeated here.

### Implement

Invoke `superharness-subagent-driven-development` to execute the plan: one fresh subagent per task, TDD, a single task-reviewer pass per task (one dual-verdict report: spec compliance + code quality), and a broad whole-branch review at the end.

**Worktree:** created by SDD's own Step 0, not by this skill — SDD checks `task.json.worktree_path`, creates the worktree if empty, and writes the path back. There is no separate worktree stage here.

**Note on `check`:** per-task review dispatches transiently set `task.json.phase` to `"check"` (see SDD's Hook Automation section) — this is a sub-state inside the implement phase, not a separately invoked stage.

In-phase discipline comes from the `[workflow-state:implement]` and `[workflow-state:check]` breadcrumb blocks; not repeated here.

### QA

QA is no longer a standalone phase gate — it is an **inline option** in the finishing menu (Step 6 of `superharness-finishing-a-development-branch`).

**How it works:** When `e2e-cases.yaml` exists in the task directory and QA has not yet passed, the finishing skill automatically adds a "Run QA verification" option (recommended) at the top of its option list. The qa command (`superharness qa --task <taskDir>`) auto-detects e2e-cases.yaml and triggers e2e-verify internally — you never invoke e2e-verify directly. If issues are found, use `superharness-fix` to address them, then re-run QA.

**When no e2e-cases.yaml exists:** The finishing menu presents only the standard 4 options (merge/PR/keep/discard). No QA step is needed.

### Complete

Invoke `superharness-finishing-a-development-branch`: verify tests, review `trace.jsonl`, present merge/PR/keep/discard options, clean up the isolated development environment if merging.

In-phase discipline comes from the `[workflow-state:complete]` breadcrumb block; not repeated here.

## Task State Management

Throughout the workflow, keep task.json updated:

```json
{
  "name": "task-name",
  "title": "Human-readable title",
  "status": "planning | in_progress | review | completed",
  "phase": "brainstorm | plan | implement | check | complete",
  "worktree_path": "/path/to/worktree",
  "sprint": {
    "current": 1,
    "total": 5
  },
  "created_at": "ISO date",
  "updated_at": "ISO date"
}
```

The five `phase` values above match the five base-form `[workflow-state:{phase}]` blocks in `workflow.md` exactly (the lite profile adds `@lite`-suffixed variants for three of them). QA is not a standalone phase — it is an inline option in the finishing menu. Subagent dispatches for other types (e.g. `debug`, `research`) may cause the pre-tool-use hook to write a `phase` value outside this list temporarily — those phases have no breadcrumb block, so the breadcrumb hook stays silent for that turn. This is expected, not a bug.

## Trace Logging

All trace.jsonl events are machine-written by hooks (pre-tool-use / subagent-stop / user-prompt-submit). Skills and models never write events manually. Event list:

- `{implement|check|task-reviewer|debug}:start` — written at dispatch time, carrying `task`/`round`/`ref` (extracted from task-brief-N / review-package-N paths in the dispatch prompt)
- `task-reviewer:verdict` — extracts SPEC/QUALITY verdict and findings count when reviewer finishes; writes `task-reviewer:verdict_unparsed` on extraction failure
- `implement:status` — extracts DONE/DONE_WITH_CONCERNS/NEEDS_CONTEXT/BLOCKED when implementer finishes; writes `implement:status_unparsed` on extraction failure
- `check:verify` / `check:markers` — SubagentStop verification results
- `user:prompt` — user intervention moment (detail truncated to 200 characters)

Phase boundaries (end of brainstorm/plan) do not write events; they are reconstructed by `superharness trace` from git log (first commit of prd.md / plan.md).

## Red Flags

- **Never** switch to lite profile on your own — lite is activated ONLY when the user writes `[lite]` in the command args. "The task is small/simple" is NOT a reason to use lite. If the user didn't write `[lite]`, run the full Normal Flow.
- **Never** skip brainstorm phase, even for "simple" tasks
- **Never** start implementation without a plan (full profile; lite inlines 1-3 tasks into task.json at the end of brainstorm)
- **Never** skip the single review with dual verdicts (spec compliance + code quality) — this is `subagent-driven-development`'s job, not a separate step here
- **Never** declare completion without running tests
- **Never** skip from brainstorm directly to implement — plan phase is mandatory in full profile. You must call `superharness-writing-plans` between brainstorm and implement.
- **Never** skip plan/review/complete phases even if you "intend to come back later" — each phase must complete before advancing.
- **Never** skip `superharness-finishing-a-development-branch` at the end — declaring "done" in chat is not completing the task.

Note: enforcing isolation before implementation begins is `subagent-driven-development`'s Step 0 responsibility, not gated by this skill.
