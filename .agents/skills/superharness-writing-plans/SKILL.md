---
name: superharness-writing-plans
description: "Use when you have a spec or requirements for a multi-step task, before touching code. Creates implementation plans with bite-sized TDD tasks for superharness workflows."
---

# Writing Plans

## Overview

Write comprehensive implementation plans assuming the engineer has zero context for our codebase and questionable taste. Document everything they need to know: which files to touch for each task, code, testing, docs they might need to check, how to test it. Give them the whole plan as bite-sized tasks. DRY. YAGNI. TDD. Frequent commits.

Assume they are a skilled developer, but know almost nothing about our toolset or problem domain. Assume they don't know good test design very well.

**Announce at start:** "I'm using the writing-plans skill to create the implementation plan."

**Context:** This should be run after the brainstorming skill has produced a spec in the task directory.

**Save plans to:** `.superharness/tasks/{MM}-{DD}-{name}/plan.md`
- The task directory should already exist (created by brainstorm skill)
- If it doesn't exist, create it with the same naming convention: `{MM}-{DD}` is zero-padded current date, `{name}` is a short kebab-case identifier

## Scope Check

If the spec covers multiple independent subsystems, it should have been broken into sub-project specs during brainstorming. If it wasn't, suggest breaking this into separate plans — one per subsystem. Each plan should produce working, testable software on its own.

## File Structure

Before defining tasks, map out which files will be created or modified and what each one is responsible for. This is where decomposition decisions get locked in.

- Design units with clear boundaries and well-defined interfaces. Each file should have one clear responsibility.
- You reason best about code you can hold in context at once, and your edits are more reliable when files are focused. Prefer smaller, focused files over large ones that do too much.
- Files that change together should live together. Split by responsibility, not by technical layer.
- In existing codebases, follow established patterns. If the codebase uses large files, don't unilaterally restructure - but if a file you're modifying has grown unwieldy, including a split in the plan is reasonable.

This structure informs the task decomposition. Each task should produce self-contained changes that make sense independently.

## Bite-Sized Task Granularity

**Each step is one action (2-5 minutes):**
- "Write the failing test" - step
- "Run it to make sure it fails" - step
- "Implement the minimal code to make the test pass" - step
- "Run the tests and make sure they pass" - step
- "Commit" - step

## Task Right-Sizing

A task is the smallest unit that carries its own test cycle and is worth a
fresh reviewer's gate. Steps stay bite-sized (2-5 minutes each), but don't
split a task just to make it look smaller — a reviewer must be able to
meaningfully reject one task while approving its neighbor. Fold setup,
configuration, scaffolding, and documentation steps into the task whose
deliverable needs them.

- **Too small:** "Task 3: rename `getUser` to `fetchUser`" as its own task —
  a one-function rename doesn't need its own independent review cycle; fold
  it into the task that actually depends on the new name.
- **Too large:** "Task 1: implement the entire billing subsystem" — a
  reviewer can't approve or reject that as one unit; split it along its
  real seams (e.g., pricing calculation, invoice generation, payment
  webhook) so each piece has an independently testable deliverable.
- **Right-sized:** "Task 2: add retry logic to the payment webhook handler"
  — one deliverable, one test cycle, one thing a reviewer can pass or fail.

## Plan Document Header

**Every plan MUST start with this header:**

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superharness-subagent-driven-development (recommended) or superharness-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** [One sentence describing what this builds]

**Architecture:** [2-3 sentences about approach]

**Tech Stack:** [Key technologies/libraries]

## Global Constraints

[Project-wide hard constraints that apply to every task — copied verbatim
from the spec/prd: coding-standard red lines, platform limits, performance
floors, etc. The SDD controller references this section in every task-brief
and copies it verbatim into the review-package for the reviewer. If the spec
states none, write "None".]

---
```

## Task Structure

````markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/file.py`
- Modify: `exact/path/to/existing.py:123-145`
- Test: `tests/exact/path/to/test.py`

**Interfaces:**
- Consumes: [exact function/type signatures this task depends on from earlier tasks]
- Produces: [exact function/type signatures this task exposes for later tasks —
  the implementer sees only their own task; this block is how they learn the
  names and types neighboring tasks use. If there are no cross-task
  interfaces, write "none".]

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest tests/path/test.py::test_name -v`
Expected: FAIL with "function not defined"

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest tests/path/test.py::test_name -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/path/test.py src/path/file.py
git commit -m "feat: add specific feature"
```
````

## No Placeholders

Every step must contain the actual content an engineer needs. These are **plan failures** — never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "add validation" / "handle edge cases"
- "Write tests for the above" (without actual test code)
- "Similar to Task N" (repeat the code — the engineer may be reading tasks out of order)
- Steps that describe what to do without showing how (code blocks required for code steps)
- References to types, functions, or methods not defined in any task

## Updating Task Artifacts

After writing the plan, update the task directory:

1. **Update task.json** with sprint count and task list:
   ```json
   {
     "name": "{name}",
     "title": "Human-readable title",
     "status": "planning",
     "phase": "plan",
     "worktree_path": null,
     "sprint": {
       "current": 0,
       "total": 5
     },
     "tasks": [
       {"id": 1, "name": "Task 1 name", "status": "pending"},
       {"id": 2, "name": "Task 2 name", "status": "pending"},
       {"id": 3, "name": "Task 3 name", "status": "pending"},
       {"id": 4, "name": "Task 4 name", "status": "pending"},
       {"id": 5, "name": "Task 5 name", "status": "pending"}
     ],
     "created_at": "ISO date",
     "updated_at": "ISO date"
   }
   ```

   `sprint.current` is the sprint number currently in progress; `0` means
   not started yet (matches the `executing-plans` convention).

2. **Update contract.md** with refined Done Definition based on the plan's task structure.

   If E2E cases were generated (step "E2E Case Generation" above), ensure each acceptance criterion in the Done Definition has a corresponding E2E case — e2e-gen's Contract cross-check step handles this, but verify the contract criteria are specific enough to map to cases.

   - Log trace event:
     ```bash
     echo '{"ts":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'","phase":"plan","event":"plan:tasks_created","detail":"plan created: {N} tasks, {N} sprints"}' >> .superharness/tasks/{MM}-{DD}-{name}/trace.jsonl
     ```

3. **Commit all updated files to git.**

## Remember
- Exact file paths always
- Complete code in every step — if a step changes code, show the code
- Exact commands with expected output
- DRY, YAGNI, TDD, frequent commits

## E2E Case Generation

Before self-review, you MUST invoke the `superharness-e2e-gen` skill via the Skill tool. The skill itself determines whether to generate cases or skip — that is not your decision to make. Do not skip this step based on your own judgment about whether the project "needs" E2E or "has a UI". Just invoke it and record the skill's output (generated / skipped) for the handoff message below. Output file: `e2e-cases.yaml`.

**Anti-pattern — silent skip:** If you find yourself writing the handoff message without having invoked e2e-gen, you skipped this step. Go back and invoke it. The E2E cases status field in the handoff message is proof of invocation — an empty or missing field means the plan is not complete.

**Red flag — rationalized skip:** If you catch yourself thinking any of the following, STOP — you are rationalizing a skip:

| Thought | Why it's wrong |
|---------|---------------|
| "This is an internal tool, it doesn't need E2E" | Not your call. e2e-gen decides. |
| "The project has no E2E framework" | e2e-gen handles that. |
| "This is too simple for E2E" | Simplicity doesn't exempt you. |
| "I'll come back to it later" | No. It runs before self-review, not after. |
| "E2E generation requires [X] which isn't ready" | Invoke it anyway. It handles missing prerequisites. |

If you wrote plan.md without invoking e2e-gen, the plan is incomplete. The user-prompt-submit hook will flag this every turn until you fix it.

## Self-Review

After writing the complete plan, look at the spec with fresh eyes and check the plan against it. This is a checklist you run yourself — not a subagent dispatch.

**1. Spec coverage:** Skim each section/requirement in the spec (prd.md). Can you point to a task that implements it? List any gaps.

**2. Placeholder scan:** Search your plan for red flags — any of the patterns from the "No Placeholders" section above. Fix them.

**3. Type consistency:** Do the types, method signatures, and property names you used in later tasks match what you defined in earlier tasks? A function called `clearLayers()` in Task 3 but `clearFullLayers()` in Task 7 is a bug.

**4. E2E case coverage (if generated):** Each E2E case maps to a feature? Verification points specific?

**5. e2e-gen invocation check:** Did you actually invoke `superharness-e2e-gen`? If you cannot point to its output (generated cases or explicit "skipped — no UI" message), you skipped it. Go back and invoke it now.

If you find issues, fix them inline. No need to re-review — just fix and move on. If you find a spec requirement with no task, add the task.

## Execution Handoff

After saving the plan, offer execution choice:

**"Plan complete and saved to `.superharness/tasks/{MM}-{DD}-{name}/plan.md`. Two execution options:**

**E2E cases status:** {generated with path and count / skipped}

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session, batch execution with checkpoints

**Which approach?"**

**If Subagent-Driven chosen:**
- **REQUIRED SUB-SKILL:** Use `superharness-subagent-driven-development`
- Fresh subagent per task + single review with dual verdicts

**If Inline Execution chosen:**
- **REQUIRED SUB-SKILL:** Use `superharness-executing-plans`
- Batch execution with checkpoints for review
