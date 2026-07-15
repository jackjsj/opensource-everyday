---
name: superharness-executing-plans
description: Use when you have a written implementation plan to execute in a separate session with review checkpoints
---

# Executing Plans

## Overview

Load plan, review critically, execute all tasks, report when complete.

**Announce at start:** "I'm using the executing-plans skill to implement this plan."

**Note:** Tell the user that superharness works much better with access to subagents. The quality of its work will be significantly higher if run on a platform with subagent support (claude-code, aone-copilot, codex, cursor, and qoder all qualify). If subagents are available, use superharness-subagent-driven-development instead of this skill.

## The Process

### Step 1: Load and Review Plan
1. Read plan file
2. Review critically - identify any questions or concerns about the plan
3. If concerns: Raise them with the user before starting
4. If no concerns: Create todos for the plan items and proceed

### Step 2: Execute Tasks

For each task:
1. Mark as in_progress
2. Follow each step exactly (plan has bite-sized steps)
3. Run verifications as specified
4. Mark as completed

### Superharness Convention: Task Artifact Updates

After each sprint completes — or every 3-5 finished tasks, whichever comes first — update `.superharness/tasks/{task}/task.json`:
- `tasks[].status` — set finished tasks' `status` to `"completed"`
- `sprint.current` — holds the number of the sprint currently in progress (0 = not started); set it when you begin a sprint, not when you finish one

This keeps the task directory as the durable source of truth if the session is interrupted — task.json carries the recovery state instead of relying on conversation memory.

### Step 3: Complete Development

After all tasks complete and verified:
- Announce: "I'm using the finishing-a-development-branch skill to complete this work."
- **REQUIRED SUB-SKILL:** Use superharness-finishing-a-development-branch
- Follow that skill to verify tests, present options, execute choice

## When to Stop and Ask for Help

**STOP executing immediately when:**
- Hit a blocker (missing dependency, test fails, instruction unclear)
- Plan has critical gaps preventing starting
- You don't understand an instruction
- Verification fails repeatedly

**Ask for clarification rather than guessing.**

## When to Revisit Earlier Steps

**Return to Review (Step 1) when:**
- The user updates the plan based on your feedback
- Fundamental approach needs rethinking

**Don't force through blockers** - stop and ask.

## Remember
- Review plan critically first
- Follow plan steps exactly
- Don't skip verifications
- Reference skills when plan says to
- Update task.json at sprint boundaries
- Stop when blocked, don't guess
- Never start implementation on main/master branch without explicit user consent

## Integration

**Required workflow skills:**
- **superharness-using-git-worktrees** - Ensures isolated workspace (creates one or verifies existing)
- **superharness-writing-plans** - Creates the plan this skill executes
- **superharness-finishing-a-development-branch** - Complete development after all tasks

**Alternative workflow:**
- **superharness-subagent-driven-development** - Use when subagents are available and tasks are mostly independent, staying in the same session (no context switch, no handoff)
