## Example Workflow

```
You: I'm using the subagent-driven-development skill to execute tasks from the plan.

[Read task.json.worktree_path — empty, invoke superharness-using-git-worktrees, write back path]
[Read plan file once: .superharness/tasks/04-03-auth-feature/plan.md]
[Pre-flight scan: clean, no conflicts]
[Create TodoWrite with all tasks]

Task 1: Hook installation script

[Write task-brief-1.md; dispatch implement with brief path + scene-setting]

Implementer: "Before I begin - should the hook be installed at user or system level?"
You: "User level (~/.config/superharness/hooks/)"

Implementer:
  - Implemented install-hook command
  - Added tests, 5/5 passing
  - Committed, wrote report-1.md

[Write review-package-1.md (brief-1/report-1 paths + base..head SHA)]
[Dispatch: Task(subagent_type: "task-reviewer", prompt: "Review review-package-1.md")]
Task-reviewer: SPEC_VERDICT: PASS, QUALITY_VERDICT: PASS, no findings

[Append progress.md: "- [x] Task 1: Hook installation script — commit abc1234"]
[Mark Task 1 complete]

Task 2: Recovery modes

[Write task-brief-2.md; dispatch implement]
Implementer:
  - Added verify/repair modes
  - 8/8 tests passing
  - Committed, wrote report-2.md

[Write review-package-2.md; dispatch task-reviewer]
Task-reviewer: SPEC_VERDICT: FAIL (missing progress reporting), QUALITY_VERDICT: PASS
FINDINGS:
  - Major report.ts:42 — progress reporting not implemented — add per-100-item callback

[Dispatch implementer to fix; re-write review-package-2.md; re-dispatch task-reviewer]
Task-reviewer: SPEC_VERDICT: PASS, QUALITY_VERDICT: PASS

[Append progress.md ledger line; mark Task 2 complete]

[Per-task E2E checkpoint]
Task 2 modified: src/pages/Recovery.tsx, src/components/ProgressBar.tsx
e2e-cases.yaml exists (3 cases)

You: "Task 2 complete: Recovery modes
  Modified frontend files: Recovery.tsx, ProgressBar.tsx
  This project has E2E cases (3 cases).
  Run E2E verification now?"

User: "yes"

[Run superharness qa --task ...]
Result: 2/3 passed, 1 failed (recovery-progress--visible)

[Dispatch implementer to fix]
[Re-run superharness qa]
Result: 3/3 passed

[Continue to next task...]

...

[After all tasks]
[Dispatch: Task(subagent_type: "task-reviewer", prompt: "Broad review of merge-base..HEAD", model: most capable)]
Task-reviewer: All requirements met, ready to merge

Report to user:
  "All tasks implemented and reviewed. Proceeding to finishing."

Then invoke superharness-finishing-a-development-branch
  [finishing skill detects e2e-cases.yaml, adds QA option to menu]
  User chooses: Run QA verification
  [superharness qa --task ... runs e2e-verify internally]
  All passed → menu refreshes without QA option
  User chooses: Push and create a Pull Request
```

