# Execution Flow (§1-§11)

This file contains the detailed step-by-step execution procedure for E2E verification. Read this when you are ready to execute cases.

## 1. Parse Cases

```bash
superharness e2e parse {task-dir}/e2e-cases.yaml
```

Read the JSON output to get `profile` and `cases`. Each case has `case_id`, `goal`, `steps` (action array), and `expect` (assertion array).

## 2. Create Output Directories

```bash
mkdir -p {task-dir}/evals/{run_id}/issues
mkdir -p {task-dir}/evals/{run_id}/process
```

For each case, also create:
```bash
mkdir -p {task-dir}/evals/{run_id}/process/{case_id}/screenshots
```

## 3. Install Dependencies & Start the App

**3.1 Run pre_start commands:**

If `config.app.pre_start` is non-empty, execute each command sequentially:

```bash
# For each command in config.app.pre_start
{pre_start_command}
```

If any pre_start command fails → write qa-issues.json with `verdict: "error"`, `run.error: { kind: "infra", message: "pre_start failed: {command}" }`, cleanup, and stop.

**3.2 Start the app:**

```bash
superharness e2e start-app --cmd "{config.app.startup_cmd}" --url "{config.app.base_url}" --timeout {config.app.startup_timeout_s} --pid-file {task-dir}/.e2e-app.pid --log-file {task-dir}/.e2e-app.log
```

The `--log-file` flag captures all dev server stdout/stderr to a file. Use `tty: true` when running this command so the dev server can output colored/interactive logs (many dev servers suppress output or fail without a TTY). If startup fails or times out, read the log file for diagnostics:

```bash
tail -30 {task-dir}/.e2e-app.log
```

**Port conflict handling (exit code 2):** `start-app` pre-checks the port. If occupied (non-interactive mode), it prints the occupant and exits code **2**. This is a user-decision point, not infra failure. Present two choices:

1. **(1) Kill and restart** — re-run with `--kill-occupant`
2. **(2) New port** — re-run with `--port auto`. Capture `E2E_EFFECTIVE_PORT={port}` from output and use everywhere downstream.

If the user is at a TTY, `start-app` resolves interactively.

**Startup failure recovery:** If `startup_cmd` fails, do NOT immediately abort:

1. Diagnose: wrong command, missing dependency, or port issue?
2. Check `package.json` scripts for alternatives
3. Ask user or suggest the most likely alternative
4. Once working, **update `app.startup_cmd`** and `app.base_url` in e2e-config.yaml
5. Only write `verdict: "error"` if no command works or the user can't provide one

## 4. Initialize Browser

The browser starts on the first `open`. Use `open` without a URL to launch to `about:blank`, then apply settings.

**Pre-flight checklist:**

| Config field | agent-browser command | Notes |
|---|---|---|
| `browser.headless` | `agent-browser [--headed] open` | Add `--headed` when `false`. Close existing daemon first (`agent-browser close`). |
| `browser.ignore_https_errors` | `--ignore-https-errors` on `open` | For clam/self-signed certs. Same daemon caveat. |
| `browser.viewport` | `set viewport {w} {h}` | Skip if `browser.device` is set. |
| `browser.device` | `set device "{name}"` | Overrides viewport + user-agent. |
| `browser.color_scheme` | `set media {value}` | Only if configured. |

Verify each item after applying. If launch fails → `verdict: "error"`, cleanup, stop.

## 5. Load Auth State (if needed)

If `config.auth.needs_auth` is true: follow the **Auth Resolution Flow** in [calibration.md](calibration.md#auth-resolution-flow). Then load:

```bash
agent-browser state load {config.auth.state_file}
```

If load fails, re-run auth flow.

## 6. Execute Cases One by One

For each case (by `case_id`):

### 6.1 Initialize recording

Start `steps.jsonl` (seq from 1). Write each entry immediately after the action — do not batch.

**Page liveness check:** Before each case, verify the browser isn't on `about:blank`:

```bash
agent-browser get url
# If about:blank or wrong domain → re-navigate
agent-browser open {base_url}
agent-browser wait --load networkidle
```

### 6.2 Set up mock routes

Merge: `config.mock.static_routes` (global) + case `mock` array (case overrides global for same url+method).

**Strategy selection:** Check mock URLs against `base_url`:
- **Same-origin** → `agent-browser network route` (Step 2a)
- **Cross-domain / mtop** → eval injection directly (Step 2b). Do NOT try `network route` for cross-domain — it silently fails.

See [mock-inject.md](mock-inject.md) for the **Mock Strategy Selection Guide**, injection templates, and fallback order.

**Step 2a — Same-origin:**
```bash
agent-browser network route "{base_url}{mock.url}" --method {mock.method} --body '{body}'
```
Note: no `--status` flag. For non-200, use eval injection.

If `response: pending` → skip case, mark `not-run`.

**Step 2b — Cross-domain:** See [mock-inject.md](mock-inject.md) templates.

**Step 3 — Verify mock (MANDATORY):**
```bash
agent-browser eval "window.__sh_mock_active"  # should return true
```
If probe fails → switch strategy per [mock-inject.md](mock-inject.md#mock-strategy-selection-guide).

**Ordering for eval mocks:** Install AFTER `open` + `wait --load networkidle`, BEFORE the triggering action. Re-install after any page reload.

### 6.3 Execute steps

| Action | Translation |
|--------|-------------|
| `open: /path` | Build full URL per routing mode (see below), then `agent-browser open {full_url}` then `wait --load networkidle` |
| `click: { role, name }` | `snapshot -i` → find by ARIA → `click @eN` |
| `click: { text }` | `snapshot -i` → find by text → `click @eN` |
| `fill: { role, name, value }` | `snapshot -i` → `fill @eN "{value}"` |
| `select: { role, name, value }` | `snapshot -i` → `select @eN "{value}"` |
| `press: Key` | `agent-browser press {Key}` |
| `hover: { role, name }` | `snapshot -i` → `hover @eN` |
| `wait` | `wait --text "..."` or `wait --url "..."` |

**URL construction per `app.routing_mode`:**
- `history` (default): `{base_url}{path}` — e.g. `https://localhost:8092/tools`
- `hash`: `{base_url}/#{path}` — e.g. `https://localhost:8092/#/tools`

If `routing_mode` is not set or is `TODO`, ask the user before the first `open` step. Never guess — an incorrect URL causes silent redirects that waste the entire case execution.

**`fill` with empty string:** Use eval fallback in [mock-inject.md](mock-inject.md#fill-empty-string---react-onchange-fallback).

**Per-step screenshot (MANDATORY after every DOM-changing step):** `open`, `click`, `fill`, `select`, `press`, `hover` — NOT `wait`. Use absolute paths:

```bash
TARGET="$(pwd)/{process}/{case_id}/screenshots/step-{seq}.png"
agent-browser screenshot "$TARGET"
if [ ! -f "$TARGET" ]; then
  LATEST=$(ls -t ~/.agent-browser/tmp/screenshots/*.png 2>/dev/null | head -1)
  [ -n "$LATEST" ] && cp "$LATEST" "$TARGET"
fi
```

Record in steps.jsonl with `screenshot` field:
```json
{"seq": 1, "action": "open", "target": "/rfp/create", "ok": true, "duration_ms": 320, "screenshot": "screenshots/step-1.png"}
```

If step fails: record `"ok": false, "error": "..."`, classify `error.kind` (`element-not-found` / `timeout` / `runtime-load`), stop remaining steps for this case → proceed to evidence collection.

### 6.4 Auth Expiration Detection

After network-active steps, check:

| Signal | Detection |
|--------|-----------|
| HTTP 401/403 | `network requests --status 401-403 --json` ≥1 result |
| Redirect to login | `get url` contains login domain/path |
| Login form | `snapshot -i` shows password textbox |

If ANY fires → `error.kind: "auth-expired"`, abort entire run, `verdict: "error"`, prompt re-auth. Does NOT consume a fix round.

### 6.5 Evaluate assertions (only if all steps passed)

Capture `before-assert.png` first (absolute path). Then check:

| Assertion | How |
|-----------|-----|
| `url_matches: pattern` | `get url` → glob match |
| `visible: { role, name }` | `snapshot -i` → exists & visible |
| `not_visible: { role, name }` | `snapshot -i` → not found/hidden |
| `text_present: "text"` | `get text` or snapshot |
| `no_fatal_console_error: true` | `errors --json` → no errors |

### 6.6 Collect evidence (MANDATORY — pass or fail)

```bash
agent-browser errors --json > {process}/{case_id}/console-errors.json
agent-browser snapshot > {process}/{case_id}/dom-snapshot.txt
agent-browser network requests --status 400-599 --json > {process}/{case_id}/network-failed.json
```

Screenshot completeness check: verify every DOM-changing step has `step-{seq}.png`. Fallback-capture missing ones.

Write summary.md: `PASS — {goal}` or `FAIL — {goal}\n\nFailed at: ...\nError: ...`

### 6.7 Teardown mock routes

```bash
agent-browser network unroute
```

Eval mocks clear on next `open`. If no `open` next, reload explicitly.

### 6.8 No retry

Frontend is deterministic. Do NOT retry failed cases.

## 7. Classify and Route Failures

| error.kind | Routing |
|------------|---------|
| `assertion` | Issue record → `status: "pending"` → fix cycle |
| `element-not-found` | Issue record → `status: "pending"` → fix cycle |
| `auth-expired` | `verdict: "error"` → abort, prompt re-auth |
| `infra` / `timeout` / `runtime-load` | `verdict: "error"` → alert human |

Infra-class failure aborts run. Remaining cases → `not-run`.

## 8. Generate Issue ID

- Assertion failure: `{case_id}--{assertion_key}` (append `-N` for duplicates)
- Step failure: `{case_id}--step-{n}`

## 9. Write Results

Three layers. **See [output-schemas.md](output-schemas.md) for full JSON schemas.**

- `process/index.json` — case results + artifact manifest
- `issues/{id}.json` — per-failure detail
- `qa-issues.json` — index layer with verdict, issues array

**Severity:** Core flow blockers: `critical`. Other: `major`. Console-only: `minor`.
**attempt_id:** Increment from existing qa-issues.json. First run = `attempt_1`.

## 10. Cleanup

```bash
superharness e2e stop-app --pid-file {task-dir}/.e2e-app.pid --port {port}
agent-browser close
```

`{port}` parsed from `config.app.base_url`. **Mandatory on EVERY exit path** (pass, fail, all aborts). A run that aborts without releasing the port blocks the next run.

## 11. Report Outcome

**pass:** "E2E verification passed: N/N cases passed. Results: {path}"

**fail:** List each issue with severity. "Code must be fixed and E2E verification re-run." Block workflow.

**error (auth-expired):** Prompt re-auth. Does not consume fix round.

**error (infra):** "Environment/infra failure: {message}". Block and escalate.
