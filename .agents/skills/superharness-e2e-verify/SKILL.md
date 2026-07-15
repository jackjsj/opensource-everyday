---
name: superharness-e2e-verify
description: "Run E2E case verification via CLI. Parses cases, starts app, drives agent-browser, produces qa-issues.json + issues/ + process/. Called by QA after tasks pass review."
allowed-tools: Bash(superharness:*), Bash(agent-browser:*), Read
---

# E2E Verification

The `superharness e2e verify` command executes the full E2E verification flow in a single CLI call. Step ordering is enforced by code — no need for AI agent to manually drive browser commands.

## Usage

```bash
superharness e2e verify --task .superharness/tasks/{task-dir} [--config .superharness/e2e-config.yaml] [--timeout 30]
```

The command handles:
1. Parse e2e-cases.yaml + e2e-config.yaml
2. Create output directory `evals/{run_id}/`
3. Start app (from config, with port conflict handling)
4. Initialize browser (headless/viewport/device from config)
5. Load auth state if needed
6. Execute each case: mock injection -> steps -> screenshots -> assertions -> evidence
7. Write 3-layer results: qa-issues.json + issues/ + process/
8. Cleanup: stop app + close browser
9. Print report (pass/fail/error)

## Pre-requisites

- `e2e-cases.yaml` in the task directory
- `.superharness/e2e-config.yaml` at project root (no TODO placeholders)
- `agent-browser` installed (`npm i -g agent-browser`)
- Auth state file exists if `auth.needs_auth: true`

If auth state is missing, run first:
```bash
superharness e2e auth {login_url} --state-file {state_file}
```

## Output

```
evals/{run_id}/
  qa-issues.json          # Index layer (verdict + issues list)
  issues/{id}.json        # Detail layer (per-failure diagnosis)
  process/
    index.json             # Case summary + artifact manifest
    {case_id}/
      summary.md
      console-errors.json
      dom-snapshot.txt
      network-failed.json
      steps.jsonl
      screenshots/
        step-{seq}.png
        before-assert.png
```

## After Verification

Read `{task-dir}/evals/{run_id}/qa-issues.json`:
- `verdict: "pass"` -> Ready to finalize with `superharness-finishing-a-development-branch`
- `verdict: "fail"` -> Run `superharness-fix` to address issues, then re-run verify
- `verdict: "error"` -> Infra/auth issue, check error message

## Calibration

If `calibrated: false` in e2e-cases.yaml, run `superharness e2e calibrate` first to resolve config placeholders and check prerequisites. The verify command will proceed regardless but may fail on uncalibrated locators.

## Port Conflict Handling

The command automatically handles port conflicts:
- Localhost URLs: kills occupant or switches to free port
- Remote proxy URLs (clam/edith): skips port check (local dev server uses a different port)

## Internal Flow

For implementation details, see [references/](references/) — these are now reference documentation only; the actual execution logic lives in `src/commands/e2e-verify-runner.ts`.
