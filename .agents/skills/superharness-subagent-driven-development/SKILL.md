---
name: superharness-subagent-driven-development
description: Use when executing implementation plans with independent tasks in the current session
---

# Subagent-Driven Development

Execute plan by dispatching a fresh implementer subagent per task, a single task-reviewer pass (spec compliance + code quality, one dual-verdict report) after each, and a broad whole-branch review at the end.

**Why subagents:** You delegate tasks to specialized agents with isolated context. By precisely crafting their instructions and context, you ensure they stay focused and succeed at their task. They should never inherit your session's context or history — you construct exactly what they need. This also preserves your own context for coordination work.

**Core principle:** Fresh subagent per task + single-reviewer dual verdict + broad final review = high quality, fast iteration.

**Announce at start:** "I'm using the subagent-driven-development skill to execute tasks from the plan."

**Continuous execution:** Do not pause to check in with the user between tasks. Execute all tasks from the plan without stopping. The only reasons to stop are: BLOCKED status you cannot resolve, ambiguity that genuinely prevents progress, or all tasks complete.

## When to Use

Decision tree: see [references/when-to-use.dot](references/when-to-use.dot).

Use this skill when you have an implementation plan with mostly-independent tasks and want to stay in the current session. For tightly coupled tasks or parallel sessions, use executing-plans or manual execution instead.

**vs. Executing Plans (parallel session):**
- Same session (no context switch)
- Fresh subagent per task (no context pollution)
- Single task-reviewer pass per task (dual verdict: spec compliance + code quality), broad review at the end
- Faster iteration (no human-in-loop between tasks)

Lite-profile tasks do not use this skill's main loop — the controller edits on the main thread directly (see the `@lite` blocks in workflow.md). Only the single task-reviewer dispatch at the end applies.

## Step 0: Worktree

Before touching the plan, check `.superharness/tasks/{task}/task.json` → `worktree_path`:

- **Set and the directory exists:** work there. `cd` into it (or confirm your shell is already positioned there) before dispatching Task 1.
- **Empty/null:** ask the user whether to create an isolated worktree:
  > "Create a git worktree for isolated development?
  > - **Yes** — safer for larger changes, allows easy discard/reset
  > - **No** — work directly on the current branch (simpler for small changes)
  >
  > Most tasks don't need a worktree unless you want to keep the current branch clean."

  If yes → invoke **superharness-using-git-worktrees** to create one (it copies the task directory and writes `worktree_path` back into `task.json`). Confirm `worktree_path` is set before dispatching any implementer.

  If no → set `worktree_path` to the current checkout's absolute path in task.json. Work in place on a feature branch (create one with `git checkout -b superharness/{name}` if not already on one).
- **Set to the base checkout itself (lite profile):** isolation was already decided at brainstorm time — work in place, do not create a worktree.

Never dispatch implementation subagents without a resolved `worktree_path` in task.json.

## The Process

Full process flowchart: see [references/process.dot](references/process.dot).

Summary: Step 0 (worktree setup) → Pre-flight plan scan → Per-task loop (brief → implement → review → fix-loop → progress ledger → optional E2E checkpoint) → Broad whole-branch review → finishing-a-development-branch.

## Pre-Flight Plan Review

Before dispatching Task 1, read the plan once and scan for:

- tasks that contradict each other or the plan's Global Constraints
- anything the plan explicitly mandates that a reviewer would flag as a defect (a test that asserts nothing, verbatim duplication of a logic block)

Present everything you find as **one batched question** to the user — each finding next to the plan text that mandates it, asking which governs — before execution begins, not one interrupt per discovery mid-plan. If the scan is clean, proceed without comment. The review loop remains the net for conflicts that only emerge from implementation.

## File Handoffs

Everything you paste into a dispatch prompt — and everything a subagent prints back — stays resident in your context for the rest of the session and is re-read on every later turn. Hand artifacts over as files under `.superharness/tasks/{task}/sdd/`:

- **`task-brief-{n}.md`** (controller writes) — the task's full text, scene-setting context (where it fits, interfaces/decisions from earlier tasks), and a reference to the plan's Global Constraints. This is the implementer's single source of requirements.
- **`report-{n}.md`** (implementer writes) — what was built, test results, files changed, self-review notes, concerns. The implementer's dispatch reply is only a short status + pointer to this file.
- **`review-package-{n}.md`** (controller writes, after the implementer reports DONE/DONE_WITH_CONCERNS) — a path list plus one verbatim block: the brief path, the report path, the diff range (base SHA recorded before dispatching the implementer, and head SHA — never `HEAD~1`, which silently drops all but the last commit of a multi-commit task), and the Global Constraints copied verbatim from the plan. The task-reviewer fetches the actual diff itself with `git show`/`git diff`; this file never contains pasted diff content.

Dispatch prompts reference these paths — never paste their contents. **Red flag:** a dispatch prompt containing pasted file contents instead of a path is a sign you are re-introducing push-based context.

## Durable Progress

Conversation memory does not survive compaction. Track progress in a ledger file, not only in TodoWrite.

- At skill start, read `.superharness/tasks/{task}/sdd/progress.md` if it exists. Tasks listed there as complete are DONE — do not re-dispatch them; resume at the first task not marked complete.
- Every dispatch is preceded by re-reading progress.md — not only the first one. It is the one check that survives compaction.
- When a task's review comes back clean (both verdicts PASS, all UNVERIFIABLE items resolved), append one line:
  `- [x] Task N: {name} — commit {sha}`
- The ledger is your recovery map: the commits it names exist in git even when your context no longer remembers creating them. After compaction, trust the ledger and `git log` over your own recollection.

## Task Review

Each task gets exactly one review dispatch:

```
Task(
  subagent_type: "task-reviewer",
  prompt: "Review .superharness/tasks/{task}/sdd/review-package-{n}.md"
)
```

The task-reviewer returns a single report with two verdicts (`SPEC_VERDICT`, `QUALITY_VERDICT`), a `FINDINGS` list (each Critical/Major/Minor, some possibly prefixed `PLAN_ISSUE:`), and an `UNVERIFIABLE` list. Handle it as one gate:

- **Either verdict FAIL:** dispatch the implementer (same subagent, same context) to fix the listed FINDINGS, then re-generate `review-package-{n}.md` and re-dispatch task-reviewer. Repeat until both verdicts PASS.
- **`PLAN_ISSUE:` findings:** never self-approve or resolve on the plan's behalf — present the finding and the plan text to the user and ask which governs.
- **`UNVERIFIABLE` items:** these are not optional. The task-reviewer could not confirm them from the diff alone (cross-task dependency, unchanged code, environment it cannot inspect). You hold context it lacks — check each one yourself (Read the file, run the command) before marking the task complete. If an item turns out to be a real gap, treat it as a failed spec review: send it back to the implementer and re-review.
- **Both verdicts PASS and all UNVERIFIABLE items resolved:** append the progress ledger line and move to the next task.

**Broad final review:** after all tasks are complete, dispatch task-reviewer once more against the whole branch's diff (`git merge-base main HEAD` as base, current HEAD), on the most capable available model. This is the only broad, cross-task review — per-task reviews stay task-scoped gates.

**Constructing the review-package / dispatch prompt:**
- Do not add open-ended directives ("check all uses", "run race tests if useful") without a concrete, task-specific reason.
- Do not ask the reviewer to re-run tests the implementer already ran on the same code — the report carries the test evidence.
- The Global Constraints you hand the reviewer are copied verbatim from the plan — exact values, exact formats, stated relationships between components. Never paraphrase them.

## Per-Task E2E Checkpoint (Batched)

After the task-reviewer returns both verdicts PASS and all UNVERIFIABLE items are resolved, check whether to offer early E2E verification.

**Trigger conditions (ALL must be true):**
1. `e2e-cases.yaml` exists in the task directory
2. The completed task modified frontend files (*.tsx, *.vue, *.jsx, *.svelte, *.css, *.scss, *.html)

**These are the ONLY conditions.** Do NOT add your own feasibility checks (e.g., "dev server won't start", "clam environment unavailable", "build failed earlier"). You are not allowed to skip the user prompt based on environment assumptions.

**Batching rule — reduce interruptions:**
- Prompt the user on the **first eligible task** (the first task that triggers both conditions above).
- After that, only prompt again every **3 eligible tasks** (i.e., 1st, 4th, 7th eligible task).
- **Always prompt on the last task** if it is eligible — this is the final chance before finishing.
- If the user skips, do not re-ask until the next batch boundary.

**If triggered, ask the user:**

> Tasks {list of eligible task numbers since last prompt} complete.
> Modified frontend files: {aggregated list}
> This project has E2E cases ({N} cases).
>
> Run E2E verification now?
> - **Yes**: catch regressions early while context is fresh
> - **Skip**: verify later in the finishing menu

**If user says yes:**
- Run `superharness qa --task .superharness/tasks/{task}` (the qa command auto-detects e2e-cases.yaml and triggers e2e-verify internally)
- If all pass → continue to next task
- If any fail → fix the failing cases (dispatch implementer), then re-verify until pass

**If user says skip:**
- Continue to next task
- QA remains available as an option in the finishing menu (the finishing skill detects pending QA automatically)

**Why this matters:**
- Catching a regression early is cheaper than discovering it after all tasks
- Batching prevents interrupt fatigue while preserving the early-detection benefit
- User retains control — the finishing menu always offers QA if it hasn't been run

## After All Tasks Complete

After the broad whole-branch review passes, you MUST invoke `superharness-finishing-a-development-branch` directly — this is a **hard requirement**, not a suggestion. Declaring completion in chat, merging manually, or skipping to any other action without going through the finishing skill is a violation. Do NOT run QA here — the finishing skill handles QA as an inline option in its menu (Step 5/6). If `e2e-cases.yaml` exists and QA hasn't passed yet, the finishing menu will automatically include a "Run QA verification (recommended)" option for the user.

**Announce to user:**
> "All tasks implemented and reviewed. Proceeding to the finishing workflow."

Then invoke superharness-finishing-a-development-branch

**Red flag:** If you find yourself about to merge, push, or tell the user "done" without having invoked the finishing skill, STOP — you are skipping the required completion gate.

## Do Not Pre-Judge Findings

Never instruct a reviewer what not to flag or pre-rate a finding's severity. If a dispatch prompt you're writing contains any of these, stop — you are pre-judging, usually to spare yourself a review loop:

- "do not flag ..."
- "at most Minor"
- "the plan chose ..." (as justification to skip a check)
- any preset severity ceiling ("treat everything here as Minor")

If you believe a finding would be a false positive, let the reviewer raise it and adjudicate it in the review loop instead.

## Model Selection

Use the least powerful model that can handle each role to conserve cost and increase speed. **Always specify the model explicitly when dispatching a subagent** — an omitted model inherits your session's model, often the most capable and most expensive, which silently defeats this section.

| Task shape | Model tier |
|---|---|
| Plan text contains the complete code to write (transcription + testing) | cheapest tier |
| Single-file mechanical fix, 1-2 files, complete spec | cheapest tier |
| Multi-file integration, pattern matching, debugging | standard/mid tier |
| Task review (per-task gate) | mid tier, scaled to diff size/risk |
| Architecture/design judgment, broad whole-branch review | most capable available model |

**Turn count beats token price.** Wall-clock and context cost scale with how many turns a subagent takes, and the cheapest models routinely take 2-3× the turns on multi-step work — costing more overall. Use a mid-tier model as the floor for reviewers and for implementers working from prose descriptions; drop to the cheapest tier only when the plan text is itself the code to transcribe.

## Handling Implementer Status

Implementer subagents report one of four statuses. Handle each appropriately:

**DONE:** Record the base SHA if you haven't already, then write `review-package-{n}.md` and dispatch task-reviewer.

**DONE_WITH_CONCERNS:** The implementer completed the work but flagged doubts. Read the concerns before proceeding. If the concerns are about correctness or scope, address them before review. If they're observations (e.g., "this file is getting large"), note them and proceed to review.

**NEEDS_CONTEXT:** The implementer needs information that wasn't provided. Provide the missing context and re-dispatch.

**BLOCKED:** The implementer cannot complete the task. Assess the blocker:
1. If it's a context problem, provide more context and re-dispatch with the same model
2. If the task requires more reasoning, re-dispatch with a more capable model
3. If the task is too large, break it into smaller pieces
4. If the plan itself is wrong, escalate to the user

**Never** ignore an escalation or force the same model to retry without changes. If the implementer said it's stuck, something needs to change.

## Hook Automation (No Manual Action Needed)

PreToolUse and SubagentStop hooks handle the following automatically in the background — you do **NOT** need to do these manually:

- **Phase tracking:** task.json `phase` field updates on each subagent dispatch (implement → check). `task-reviewer` dispatches also update phase to `"check"` — there is no separate task-reviewer workflow-state entry.
- **Trace logging:** hooks write all trace.jsonl events automatically — dispatch events carry task/round/ref extracted from the brief/review-package path in your prompt (one more reason File Handoffs discipline matters), and SubagentStop records reviewer verdicts and implementer statuses. Neither you nor subagents ever write trace events by hand.
- **Pointer injection:** the PreToolUse hook injects a small `## Task Context (pull-based)` block into the dispatch prompt, naming the manifest file (implement.jsonl / check.jsonl) and prd.md/contract.md paths the subagent should Read itself. The hook never pastes file contents into the prompt — the subagent fetches them.

Your only job: **dispatch subagents with the correct `subagent_type`** (`implement`, `task-reviewer`, `debug`, `research`) and reference file paths in the prompt — never paste their contents.

**Cross-platform degradation:** if a dispatched subagent's first response does not indicate it read the injected manifest/context files (it asks about something already covered, or says it hasn't read the pointer files), the current platform's hook likely doesn't support pointer injection for Task/Agent tools. In this case, supplement the dispatch prompt with the same path list the hook would have injected (brief/report/review-package paths, manifest path) — still only paths, never pasted content.

## Prompt Templates

- [implementer-prompt.md](implementer-prompt.md) - Dispatch implementer subagent (brief-path based)
- Task review: dispatch `subagent_type: "task-reviewer"` with the review-package path (see [agents/task-reviewer.md](../../agents/task-reviewer.md) for its input contract and output format) — no separate template needed
- Broad final review: same `task-reviewer` agent, dispatched once against the whole-branch diff

## Example Workflow

**See [references/example-workflow.md](references/example-workflow.md) for a complete walkthrough.**

Key phases: worktree setup → pre-flight → per-task (brief/implement/review/E2E) → broad review → finishing skill with QA option.

## Advantages

**vs. Manual execution:**
- Subagents follow TDD naturally
- Fresh context per task (no confusion)
- Parallel-safe (subagents don't interfere)
- Subagent can ask questions (before AND during work)

**vs. Executing Plans:**
- Same session (no handoff)
- Continuous progress (no waiting)
- Review checkpoints automatic

**Efficiency gains:**
- Controller curates exactly what context is needed; artifacts move as files, never pasted text
- Single review pass per task instead of two (dual verdict, one dispatch)
- Subagent gets complete information upfront
- Questions surfaced before work begins (not after)

**Quality gates:**
- Self-review catches issues before handoff
- Task review carries two verdicts in one pass: spec compliance and code quality
- Review loops ensure fixes actually work
- UNVERIFIABLE items force the controller to close cross-task gaps a diff-only reviewer can't see
- Broad final review catches drift the per-task gates couldn't (single-reviewer risk mitigation)

**Cost:**
- One subagent invocation per review instead of two
- Controller does more prep work (writing briefs, review packages)
- Review loops add iterations
- But catches issues early (cheaper than debugging later)

## Red Flags

**Never:**
- Start implementation on main/master branch without explicit user consent
- Skip Step 0 (dispatching implementers without a resolved `worktree_path`)
- Skip task review, or accept a report missing either verdict (SPEC_VERDICT AND QUALITY_VERDICT are both required)
- Ignore UNVERIFIABLE items or mark a task complete without resolving them yourself
- Proceed with unfixed FINDINGS
- Skip the per-task E2E checkpoint prompt on its first eligible task or on the last eligible task — batching rules apply to intermediate tasks only
- Dispatch multiple implementation subagents in parallel (conflicts)
- Paste task text, report content, or diff content into a dispatch prompt (hand over the file path instead)
- Skip scene-setting context (subagent needs to understand where task fits)
- Ignore subagent questions (answer before letting them proceed)
- Accept "close enough" on spec compliance (a FAIL verdict means not done)
- Skip review loops (FINDINGS found = implementer fixes = review again)
- Let implementer self-review replace actual review (both are needed)
- Perform self-review on the main thread instead of dispatching task-reviewer — the controller reviewing its own implementation is NOT a substitute for the task-reviewer subagent. Self-review is inherently biased; always dispatch a fresh task-reviewer subagent
- Tell a reviewer what not to flag, or pre-rate a finding's severity in the dispatch prompt (see "Do Not Pre-Judge Findings")
- Move to next task while the review has open Critical/Major findings or unresolved UNVERIFIABLE items
- Re-dispatch a task the progress ledger already marks complete — check the ledger (and `git log`) after any compaction or resume
- Omit `subagent_type` when dispatching subagents (hooks won't inject context without it)
- Attempt to call multiple tools in a single tool-use block when the platform doesn't support it — if a tool call returns a JSON parse error, retry with ONE tool call per block. Do not retry the same multi-call pattern

**If subagent asks questions:**
- Answer clearly and completely
- Provide additional context if needed
- Don't rush them into implementation

**If reviewer finds issues:**
- Implementer (same subagent) fixes them
- Reviewer reviews again
- Repeat until approved
- Don't skip the re-review

**If subagent fails task:**
- Dispatch fix subagent with specific instructions
- Don't try to fix manually (context pollution)

## Integration

**Required workflow skills:**
- **superharness-using-git-worktrees** - Step 0: set up isolated workspace before starting
- **superharness-writing-plans** - Creates the plan this skill executes
- **superharness-finishing-a-development-branch** - Complete development after all tasks

**Subagents should use:**
- **superharness-test-driven-development** - Subagents follow TDD for each task

**Alternative workflow:**
- **superharness-executing-plans** - Use for parallel session instead of same-session execution
