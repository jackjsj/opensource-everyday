---
name: superharness-finishing-a-development-branch
description: Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by presenting structured options for merge, PR, or cleanup
---

# Finishing a Development Branch

## Overview

Guide completion of development work by presenting clear options and handling chosen workflow.

**Core principle:** Verify tests -> Review trace -> Update task state -> Present options -> Execute choice -> Clean up.

**Announce at start:** "I'm using the finishing-a-development-branch skill to complete this work."

## Lite Profile Shortcut

For tasks with `"profile": "lite"` in task.json: verify tests (Step 1) and verification evidence as usual, update task state (Step 3: status → completed — required, this releases the task's claim on the checkout for resolveActiveTask), then commit directly on the working branch — skip the option menu (Steps 5-7). Worktree cleanup (Step 8) applies only if a worktree was actually created.

## The Process

### Step 1: Verify Tests

**Before anything else, verify the project's unit/integration tests pass (NOT E2E — that is handled separately in Step 5/6 via the QA option):**

**Pre-Step 1: E2E environment cleanup check**

Before running tests, check for leftover E2E processes from a previous QA run:

```bash
# If a pid file exists, the dev server was not properly cleaned up
if [ -f ".superharness/tasks/{task}/.e2e-app.pid" ]; then
  superharness e2e stop-app --pid-file .superharness/tasks/{task}/.e2e-app.pid --port {port}
  agent-browser close 2>/dev/null || true
fi
```

This ensures orphaned dev servers from interrupted QA runs don't interfere with test execution or hold ports.

```bash
# Run project's test suite
npm test / cargo test / pytest / go test ./...
```

**If tests fail:**
```
Tests failing (<N> failures). Must fix before completing:

[Show failures]

Cannot proceed with merge/PR until tests pass.
```

Stop. Don't proceed to Step 2.

**If tests pass:** Continue to Step 2.

**Note:** Step 1 satisfies the `superharness-verification-before-completion` requirement referenced by the `[workflow-state:complete]` breadcrumb block. No separate invocation is needed.

### Step 2: Review Trace

When reporting to the user, read `.superharness/tasks/{task}/trace.jsonl` live and summarize per-task rounds, verdict results, user intervention count, and anomaly list:

```bash
cat .superharness/tasks/{task}/trace.jsonl
# or
superharness trace --task {task}
```

The output of `superharness trace --task {task}` serves as the report material. Do not generate any summary files.

### Step 3: Update Task State

Update `.superharness/tasks/{task}/task.json`:

```bash
jq '.status = "completed" | .phase = "complete" | .completed_at = "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'" | .updated_at = "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"' \
  .superharness/tasks/{task}/task.json > tmp.$$.json && mv tmp.$$.json .superharness/tasks/{task}/task.json
```

### Step 4: Determine Base Branch

```bash
# Try common base branches
git merge-base HEAD main 2>/dev/null || git merge-base HEAD master 2>/dev/null
```

Or ask: "This branch split from main -- is that correct?"

### Step 5: E2E Status Check (MANDATORY — do NOT skip)

**You MUST run these commands before presenting options.** Skipping this step is a violation — the UserPromptSubmit hook independently detects this and will flag you. If you present the option menu without first running these `ls` commands and reporting their output, you have violated this step.

```bash
# Check if e2e-cases.yaml exists in the task directory
ls .superharness/tasks/{task}/e2e-cases.yaml 2>/dev/null

# Check if QA has already produced qa-issues.json (e2e-verify runs inside qa)
ls .superharness/tasks/{task}/evals/*/qa-issues.json 2>/dev/null
```

This determines whether to include the QA option in Step 6:

**Decision table:**

- **e2e-cases.yaml does NOT exist:** No QA option needed. Proceed to Step 6 with 4 options.
- **e2e-cases.yaml exists AND qa-issues.json exists (all passed):** QA already done. Proceed to Step 6 with 4 options.
- **e2e-cases.yaml exists but no qa-issues.json (or has failing cases):** QA is pending. Proceed to Step 6 with 5 options (include QA option).

**Anti-skip verification:** Before you write the option menu in Step 6, check yourself: "Did I run the two `ls` commands above in this turn?" If the answer is no, go back and run them now. Present the QA option as **(recommended)** when it applies — it is the natural next step after implementation.

### Step 6: Present Options

**When QA is pending** (e2e-cases.yaml exists, QA not yet completed):

```
Implementation complete. Reviewed .superharness/tasks/{task}/trace.jsonl.

What would you like to do?

1. Run QA verification (recommended — includes E2E)
2. Merge back to <base-branch> locally
3. Push and create a Pull Request
4. Keep the branch as-is (I'll handle it later)
5. Discard this work

Which option?
```

**When QA is not needed** (no e2e-cases.yaml, or QA already passed):

```
Implementation complete. Reviewed .superharness/tasks/{task}/trace.jsonl.

What would you like to do?

1. Merge back to <base-branch> locally
2. Push and create a Pull Request
3. Keep the branch as-is (I'll handle it later)
4. Discard this work

Which option?
```

**Don't add explanation** -- keep options concise.

### Step 7: Execute Choice

#### Option: Run QA (only when QA option is presented)

Run `superharness qa --task .superharness/tasks/{task}`. The qa command auto-detects e2e-cases.yaml and triggers e2e-verify internally.

- **If all pass:** Return to Step 6 and re-present options (now without the QA option, since QA is complete).
- **If issues found:** Inform the user. They can run `superharness-fix` to address them, then re-run QA.

#### Option 1: Merge Locally

```bash
# Switch to base branch
git checkout <base-branch>

# Pull latest
git pull

# Merge feature branch
git merge <feature-branch>

# Verify tests on merged result
<test command>

# If tests pass
git branch -d <feature-branch>
```

Then: Cleanup worktree (Step 8)

#### Option 2: Push and Create PR

```bash
# Push branch
git push -u origin <feature-branch>

# Create PR
gh pr create --title "<title>" --body "$(cat <<'EOF'
## Summary
<2-3 bullets of what changed>

## Trace Summary
<key stats read from trace.jsonl: tasks completed, rework rounds, anomalies>

## Test Plan
- [ ] <verification steps>
EOF
)"
```

Then: Cleanup worktree (Step 8)

#### Option 3: Keep As-Is

Report: "Keeping branch <name>. Worktree preserved at <path>."

**Don't cleanup worktree.**

Note: task.json was already updated to completed in Step 3. This is correct -- the task is done, even though the branch persists.

#### Option 4: Discard

**Confirm first:**
```
This will permanently delete:
- Branch <name>
- All commits: <commit-list>
- Worktree at <path>

Type 'discard' or '确认丢弃' to confirm.
```

Wait for exact confirmation.

If confirmed:
```bash
git checkout <base-branch>
git branch -D <feature-branch>
```

Then: Cleanup worktree (Step 8)

### Step 8: Cleanup Worktree

**For Merge, Create PR, and Discard:**

Check if in worktree:
```bash
git worktree list | grep $(git branch --show-current)
```

If yes:
```bash
git worktree remove <worktree-path>
```

**For Keep as-is and QA verification:** Keep worktree.

## Quick Reference

| Option | Merge | Push | Keep Worktree | Cleanup Branch | Task State |
|--------|-------|------|---------------|----------------|------------|
| QA verification* | - | - | Y | - | completed |
| Merge locally | Y | - | - | Y | completed |
| Create PR | - | Y | Y | - | completed |
| Keep as-is | - | - | Y | - | completed |
| Discard | - | - | - | Y (force) | completed |

\* QA option only appears when e2e-cases.yaml exists and QA has not passed yet. After QA completes, the option list refreshes without it.

Note: Task state is always set to "completed" in Step 3, before presenting options. The options control git/worktree state, not task state.

## Common Mistakes

**Skipping test verification**
- **Problem:** Merge broken code, create failing PR
- **Fix:** Always verify tests before offering options

**Reporting completion without reading trace.jsonl**
- **Problem:** Lose observability into the development process
- **Fix:** Always read `.superharness/tasks/{task}/trace.jsonl` before presenting options

**Forgetting to update task state**
- **Problem:** task.json never marked completed, task keeps matching as active
- **Fix:** Update task.json in Step 3, before presenting options

**Open-ended questions**
- **Problem:** "What should I do next?" -- ambiguous
- **Fix:** Present the structured option menu (4 options, or 5 when QA is pending)

**Automatic worktree cleanup**
- **Problem:** Remove worktree when might need it (Option 3)
- **Fix:** Only cleanup for Options 1, 2, and 4

**No confirmation for discard**
- **Problem:** Accidentally delete work
- **Fix:** Require typed "discard" confirmation

## Red Flags

**Never:**
- Proceed with failing tests
- Skip E2E status check (Step 5) when e2e-cases.yaml exists — always check and include QA option when pending
- Merge without verifying tests on result
- Delete work without confirmation
- Force-push without explicit request
- Report completion without reading trace.jsonl
- Present options before updating task state

**Always:**
- Verify tests before offering options
- Read trace.jsonl before presenting options
- Update task.json status to "completed" and set completed_at
- Present the structured option menu (4 or 5 options depending on QA status)
- Get typed confirmation for Discard option
- Clean up worktree for Merge, PR, and Discard options

## Integration

**Called by:**
- **superharness-subagent-driven-development** (final step) - After all tasks complete
- **superharness-executing-plans** (final step) - After all batches complete

**Pairs with:**
- **superharness-using-git-worktrees** - Cleans up worktree created by that skill
