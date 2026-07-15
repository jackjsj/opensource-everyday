# opensource-everyday Workflow

## Entry Points

| Command | Purpose |
|---|---|
| `superharness go "requirement"` | Start feature development (brainstorm → plan → implement → review) |
| `superharness qa --task <taskDir>` | Run all verification (configured services + built-in E2E) |

These are the two primary commands. `go` drives development; `qa` drives verification. Users never invoke `e2e-verify` directly — `qa` handles it automatically when `e2e-cases.yaml` exists.

> **Context note:** The session-start hook injects only the relevant section of this file into your context. Do NOT read the full workflow.md — it wastes context tokens. If you need a specific section, read only that section by heading.

## Development Flow

1. `/superharness:go "requirement"` to start a new feature
2. Brainstorm phase clarifies requirements with user
3. Planning phase creates task breakdown, Sprint Contract, and E2E cases (via e2e-gen)
4. Implementation uses TDD (Red-Green-Refactor) per task
5. Each task gets a single review with dual verdicts: spec compliance + code quality
6. QA evaluation (`superharness qa --task <taskDir>`) — auto-detects e2e-cases.yaml and runs E2E verification internally
7. Fix issues with `/superharness:fix` if needed
8. Merge worktree when all tasks pass

## Conventions

- Full profile: all code changes happen in isolated git worktrees; lite profile decides isolation by concurrency (see `@lite` blocks)
- Every task follows TDD: write failing test first, then implement
- No task is complete without fresh verification evidence
- Spec files in `.superharness/spec/` are the source of truth for conventions

## Task Lifecycle

```
planning → in_progress → review → completed
```

## Worktree

- Created automatically per feature
- Branch naming: `superharness/{feature-name}`
- Merge back to base branch when complete

## Workflow State Blocks (hook-managed, do not delete)

<!-- [workflow-state:brainstorm]
Current phase: requirements clarification (brainstorm)
- [required] Do not write code or invoke implementation skills until the design is approved by the user
- [required] When user confirmation is needed, ask via plain text message (do NOT rely on the request_user_input tool — it is unavailable in some modes). If request_user_input is rejected, immediately retry with a plain text question; never skip the confirmation step.
- [required] After design approval, create the task directory (prd.md / task.json / contract.md), then write the brainstorm:start trace
- [required] After brainstorm completes, you MUST enter the plan phase (invoke superharness:writing-plans). Never skip straight to implementation. "The task is simple" is NOT a valid reason to skip plan.
- [required] Phase transitions must be actually executed — saying "next step is plan" and then writing code directly = violation.
- [required] Hard gate: the pre-tool-use hook checks for plan.md when dispatching an implement subagent; if missing, the subagent will be aborted.
- Next: superharness:writing-plans (mandatory, cannot be skipped)
-->

<!-- [workflow-state:plan]
Current phase: plan writing (plan)
- [required] Plan tasks must contain complete code and exact file paths (No Placeholders)
- [required] After writing the plan, invoke superharness:e2e-gen unconditionally (the skill decides internally whether UI exists), then update task.json (tasks list / sprint.total) and contract.md (including E2E entries) and commit
- [required] Pre-implementation self-check: does e2e-cases.yaml exist? If not and you cannot point to e2e-gen's "skipped" message, you skipped e2e-gen — invoke it immediately, do not continue
- [required] Present the plan to the user and wait for their explicit confirmation that the plan review is approved
- [required] After plan completes, you MUST enter the implement phase (invoke superharness:subagent-driven-development). Never skip implementation or declare completion directly.
- Next: superharness:subagent-driven-development (mandatory, cannot be skipped)
-->

<!-- [workflow-state:implement]
Current phase: implementation (implement)
- [required] Step 0: if worktree is not created, invoke superharness:using-git-worktrees first and write back to task.json.worktree_path
- [required] Read sdd/progress.md before dispatching each task; do not re-dispatch already completed tasks
- [required] Dispatch prompts pass file paths only (no inlined content), and explicitly declare the model
- Next: after all tasks complete, task-reviewer performs a branch-level broad review
-->

<!-- [workflow-state:check]
Current phase: review (check)
- [required] Review is executed once by task-reviewer, outputting dual verdicts for spec and quality
- [required] Controller must not pre-judge findings or pre-rate severity in the dispatch prompt
- Note: if pending-verification.json exists, the breadcrumb hook automatically appends a "previous verification failed" notice
-->

<!-- [workflow-state:complete]
Current phase: wrap-up (complete)
- [required] Fresh verification evidence is required before declaring completion (superharness:verification-before-completion)
- [required] When e2e-cases.yaml exists and QA has not yet passed, the finishing skill MUST include "Run QA verification" as the first option in Step 6. You MUST execute Step 5 (E2E Status Check) — the UserPromptSubmit hook independently validates this. Do NOT invoke superharness:e2e-verify directly — always route through qa.
- [required] Finalize via superharness:finishing-a-development-branch — this is a HARD GATE. Declaring "done" in chat, merging manually, or pushing without invoking the finishing skill is a violation. The finishing skill presents a structured option menu; you must go through it.
-->

<!-- [workflow-state:brainstorm@lite]
Current phase: requirements clarification (brainstorm, lite profile)
- [required] Skip spec-discover and mindmap; requirements inquiry and design approval proceed as normal
- [required] When user confirmation is needed, ask via plain text message (do NOT rely on the request_user_input tool — it is unavailable in some modes). If request_user_input is rejected, immediately retry with a plain text question; never skip the confirmation step.
- [required] After design approval, create the task directory (prd.md / task.json / contract.md), write profile: "lite" in task.json
- [required] Worktree decision (concurrency check): if an in-progress task already has worktree_path pointing to this checkout, invoke superharness:using-git-worktrees to create a worktree; otherwise set worktree_path to this checkout's absolute path
- Trimmed: no plan.md, no e2e-gen invocation, no e2e-cases.yaml — E2E is skipped entirely in lite profile
- Boundary: lite trims ceremony, not discipline — the verification trio (tests / task-reviewer / verification) cannot be skipped under any circumstance; when unsure whether a step can be trimmed, follow full profile
- Next: no plan.md — inline 1-3 tasks into task.json (tasks / sprint.total), set phase directly to implement
-->

<!-- [workflow-state:implement@lite]
Current phase: implementation (implement, lite profile)
- [required] Implement directly on the main thread; do not dispatch implement subagents or reintroduce plan.md or other full-profile ceremony
- [required] Derive tests from prd.md acceptance criteria in one pass, commit alongside implementation; strict red-green cycle not required
- [required] If worktree_path is already set, isolation decision is complete — do not create another worktree
- Boundary: lite trims ceremony, not discipline — the verification trio cannot be skipped; if the task exceeds lite scope mid-way (schema/API changes, file count growth), notify the user explicitly — do not switch profiles on your own
- Next: after all tasks complete, dispatch a single task-reviewer pass (dual verdicts); skip broad review
-->

<!-- [workflow-state:complete@lite]
Current phase: wrap-up (complete, lite profile)
- Trimmed: E2E verification (lite profile does not generate e2e-cases.yaml, no need to invoke e2e-verify)
- [required] Fresh verification evidence is required before declaring completion (superharness:verification-before-completion)
- [required] Finalize via superharness:finishing-a-development-branch Lite Profile Shortcut, set task.json.status to completed to release the task slot (otherwise resolveActiveTask will permanently match this task)
- [required] After verification passes, commit directly — do not use the merge four-option menu
- Boundary: lite trims ceremony, not discipline — do not declare completion when verification evidence is missing; when unsure, follow full profile
-->
