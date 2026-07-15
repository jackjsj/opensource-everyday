# Phase 0: Calibration

Before running verification, ensure cases and config are calibrated against the actual implementation. Cases generated at plan stage are based on theoretical paths and locators - they need to be aligned with what the implementation actually produced.

## 0a. Resolve config placeholders

If `app.base_url` is a placeholder (`TODO`, `http://localhost:3000` without verification, or similar):

1. Start the app using `app.startup_cmd`
2. Detect the real URL from startup logs (see e2e-gen's clam remote proxy detection for clam projects)
3. Update `app.base_url` in `.superharness/e2e-config.yaml` with the resolved URL
4. Stop the app (it will be re-started in the execution flow)

If `app.base_url` is already concrete, skip this step.

## 0b. Auth state check

If `config.auth.needs_auth` is true, run the **auth resolution flow** (see [Auth Resolution Flow](#auth-resolution-flow) below):

1. Check whether `config.auth.state_file` exists
2. If missing — execute the login flow automatically
3. If exists — check for expiration signals; if expired, re-run login

**Worktree awareness:** `config.auth.state_file` is a relative path (e.g. `.superharness/e2e-auth.json`). When running inside a git worktree, this path resolves relative to the **worktree root** (the current cwd), NOT the main repository root. This is correct — the auth state file will be created in the worktree's `.superharness/` directory. Since auth state is a runtime artifact (not tracked by git), it does not automatically exist in a new worktree. Always check for the file relative to cwd and run the auth flow if it is missing.

## 0c. Profile existence check

For each case in e2e-cases.yaml, check whether its `profile` value exists in `config.profiles`:

- If a case references a profile not in config (e.g. case says `profile: h5` but config has no `h5` profile) - prompt the user to add the missing profile to e2e-config.yaml, then re-read config.

## 0d. Pending mock scan

Scan all cases for `response: pending` mock entries:

- If any pending mocks exist, list them and ask the user to fill before proceeding:
  > "Pending mocks found - these must be filled before verification:
  > - Case `{case_id}`: `{url}` ({method})
  > Fill them in e2e-cases.yaml, then re-run."
- If user fills them, re-read e2e-cases.yaml and continue.
- If user chooses to skip a case with pending mocks, that case will be marked `not-run` during verification.

## 0e. Case locator calibration

For each case, navigate to the target page and compare actual DOM with the case's locators:

1. Start the app (if not already running from 0a)
2. For each case's first `open` step, navigate to the page
3. Run `agent-browser snapshot -i` to get the actual accessibility tree
4. Compare each `{ role, name }` locator in the case's steps with the actual DOM:
   - If the element exists with matching role but different name (e.g. button text changed from "Submit" to "Confirm") - update the case's locator
   - If the element doesn't exist at all - leave the case as-is; it may be a real bug or the page hasn't been fully implemented yet
5. Write updated cases back to e2e-cases.yaml

## 0f. Mock URL calibration

Capture actual network requests during page navigation and compare with mock URLs:

1. For each case's `open` step, navigate with network interception enabled
2. Capture all API requests triggered by the page (`agent-browser network requests --json`)
3. For each mock entry in the case, check if the mock URL pattern matches any actual request URL
4. If the actual API path differs from the mock URL (e.g. plan said `/api/create` but actual is `/h5/mtop.btrip.create/1.0`) - update the mock URL to match the actual path
5. For `response: pending` mocks that now have actual API responses captured - use the captured response as mock data (mark as calibrated)
6. Write updated cases back to e2e-cases.yaml

## 0g. Mark as calibrated

After completing 0a-0f (or skipping steps that don't apply), set `calibrated: true` in e2e-cases.yaml. Subsequent e2e-verify runs will skip Phase 0.

**Skip conditions:** If `calibrated: true` already exists in e2e-cases.yaml, skip the entire Phase 0. If only specific steps don't apply (e.g. no pending mocks), skip those steps but still run the rest.

## Auth Resolution Flow

This is the single authoritative procedure for obtaining or refreshing auth state. Referenced by Phase 0b and Execution §5.

When `config.auth.needs_auth` is `true` and auth state is missing or expired:

1. Resolve the state file path relative to cwd: if `config.auth.state_file` is relative, prepend the current working directory. Run `superharness e2e auth {config.auth.login_url || config.app.base_url} --state-file {resolved_state_file_path}` with `tty: true`
2. This opens a **headed** browser for the user to log in manually
3. The command prints "登录完成后按回车继续" — the user presses Enter after logging in
4. Auth state is saved automatically, then continue

If `superharness e2e auth` fails (e.g. browser cannot open), THEN escalate to the user:
> "Auth state required but auto-login failed. Please manually run: `superharness e2e auth {config.auth.login_url}`
> {config.auth.login_hint}"

**Key rule:** Do NOT skip E2E or just print a hint when auth is missing. The default behavior is to **execute the auth flow**, not merely suggest it.
**Path resolution rule:** `state_file` always resolves relative to **cwd**. Before running the auth flow, determine whether cwd is a worktree or the main checkout:

```bash
# Check if currently in a worktree
git rev-parse --git-common-dir 2>/dev/null  # differs from .git if in worktree
```

This matters because:
- **In worktree:** auth state is created under the worktree's `.superharness/` — it won't exist in the main repo, and that's fine. The worktree is the working context.
- **In main checkout:** auth state is created under the main repo's `.superharness/` — standard behavior.
- **Wrong:** running from the main checkout but expecting the file in a worktree, or vice versa. Always check the file relative to cwd, and generate it in the same cwd where verification will run.
