---
name: superharness-qa
description: "Single entry point for all verification. Auto-detects E2E cases and runs e2e-verify internally via CLI."
---

# QA Evaluation

`superharness qa` is the **single entry point** for all quality verification. It calls configured QA services and automatically runs E2E verification when `e2e-cases.yaml` exists in the task directory.

## Usage

```bash
superharness qa --task .superharness/tasks/{task} [--json] [--services name1,name2]
```

## Execution Mode — CRITICAL

### Must use `tty: true`

Without `tty: true`, output is buffered in pipes and the user sees nothing for 30-60 seconds. **The user will feel blind and anxious.**

Correct exec_command call:

```json
{"cmd": "superharness qa --task .superharness/tasks/{task} --json 2>&1", "tty": true, "yield_time_ms": 15000}
```

Key parameters:
- `tty: true` — **MANDATORY**. Streams output to user terminal in real-time.
- `yield_time_ms: 15000` — Poll every 15s. Do not exceed 30000.

### Must share progress with user

Each time you poll the running process and get new output, **share the key progress with the user**. Do not just say "QA is running, waiting". Instead, relay what you see:

- "应用已就绪，浏览器启动中，正在加载登录态"
- "Case 1/6 tools-page-loads 执行中：open /#/tools"
- "Case 2/6 grey-check-hit 通过：mock 拦截成功"
- "Case 3/6 grey-check-miss 失败：open 超时"

The user needs to know what step the QA is on, not just that it's "running".

## What QA Does

1. **Configured services** — Executes services from `config.yaml -> qa.services`:
   - `managed`: HTTP POST to endpoint (not yet implemented)
   - `autonomous`: Run command, read output file for pass/fail counts
   - `agent`: Produce signal for AI agent to invoke a skill
2. **Built-in E2E** — Auto-detects `e2e-cases.yaml` in the task directory. When found, calls `superharness e2e verify` directly and reads `qa-issues.json` for results. No config entry needed.

## Terminal Output

**The `superharness qa` command outputs detailed execution logs to the terminal in real-time.** When E2E verification runs, you will see:

- Each case being executed (case ID + goal)
- Every agent-browser command (open URL, snapshot, click, fill, screenshot path)
- Element refs found in snapshots (`@eN`)
- Mock injection status (which mocks, success/fail, interception count)
- Screenshot file paths
- Assertion results (visible/text_present/no_fatal_console_error)
- Per-case PASS/FAIL verdict
- Final summary (pass/fail/skip counts + report path)

**These logs are visible to the user in the terminal during execution.** Do not discard them — they are valuable for diagnosing failures.

When running with `--json`, the structured JSON result appears at the END of the output (after all execution logs). Parse the JSON from the end of the command output.

## Sharing Results with User

After QA completes, **do not just report pass/fail counts**. Share with the user:

1. **Overall verdict**: pass / fail / error
2. **Per-case results**: which cases passed, which failed, and why
3. **Key execution details**: if a case failed, quote the specific error from the terminal output (e.g., "element not found: button '查询'", "mock not intercepted", "assertion failed: text '命中' not found")
4. **Evidence paths**: point the user to screenshots and evidence files for failed cases

Example response to user:

> E2E 验证完成：4/6 通过，2/6 失败。
>
> 失败的 case：
> - `grey-check-hit`：断言失败，文本"命中"未找到。mock 拦截计数为 1（拦截成功），可能是 mock body 格式问题。截图：`evals/run_xxx/process/grey-check-hit/screenshots/step-3.png`
> - `grey-check-error`：元素未找到，未找到 alert 组件。截图：`evals/run_xxx/process/grey-check-error/screenshots/step-3.png`
>
> 完整报告：`.superharness/tasks/xxx/evals/run_xxx/qa-issues.json`

Do NOT give a bare "QA passed" or "QA failed" without context. The user needs to see what happened.

## JSON Output

In `--json` mode, structured JSON appears at the end of terminal output:
```json
{
  "schema_version": "qa-result/v1",
  "task_id": "...",
  "services": [
    { "name": "e2e-verify", "type": "builtin", "status": "done", "result": { "total": 6, "passed": 5, "failed": 1, "issues": [...] } }
  ],
  "summary": { "total_services": 1, "completed": 1, "signaled": 0, "failed": 0 }
}
```

## After QA

Read the `status` field for each service:
- `done` + `failed: 0` — Passed, ready to finalize
- `done` + `failed: >0` — Run `superharness-fix` to address issues, then re-run QA
- `error` — Infra/auth failure, check error message (also visible in terminal output above the JSON)
- `signal` — Custom agent service, invoke the indicated skill

## Skipping E2E

Use `--services` to run only specific services. E2E is skipped unless `e2e-verify` is explicitly included:

```bash
superharness qa --task <dir> --services my-custom-svc
```

## Red Flags

- **Never** tell the user to invoke `superharness-e2e-verify` directly — always route through `superharness qa`
- **Never** add `type: builtin` to config.yaml — E2E is auto-detected, not a configured service
- **Never** skip QA when e2e-cases.yaml exists — the qa command handles detection automatically
- **Never** report only pass/fail counts without context — share per-case results and failure reasons from the terminal output
- **Never** discard the terminal execution logs — they contain the detailed browser interaction process that the user needs for diagnosis
- **Never** run `superharness qa` without `tty: true` — the user will see nothing for 30-60 seconds and feel blind
- **Never** just say "QA is running" without sharing what you see in the output — relay the actual progress (which case, which step, pass/fail)
