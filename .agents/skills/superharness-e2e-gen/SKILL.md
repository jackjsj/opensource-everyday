---
name: superharness-e2e-gen
description: "Generate E2E test cases (e2e-cases.yaml) from prd.md, plan.md, and contract.md. Called by writing-plans skill after plan completion. Only generates for projects with a UI. Also generates e2e-config.yaml on first run."
allowed-tools: Bash(superharness:*), Bash(npm:*), Bash(pnpm:*), Bash(yarn:*), Read, Write
---

# E2E Case Generation

Generate comprehensive E2E test cases by analyzing the product spec (prd.md), the implementation plan (plan.md), and the Done Definition (contract.md). The goal is to produce cases that cover every user-visible behavior described in the requirements and every acceptance criterion in the contract's Done Definition — if a feature is in the prd or a criterion is in the contract, there should be a case that verifies it.

**⚠️ READ THE FULL SKILL FILE.** This file is 400+ lines. If you only read the top portion, you will miss the mandatory output format (Section 4: closed vocabulary, field names, YAML schema) and the validation gate (Section 6). Reading only the config generation section and skipping the case format section guarantees invalid output. You MUST read at minimum: Section 4 (format spec + closed vocabulary table) and Section 6 (validate command).

**Announce at start:** "I'm using the e2e-gen skill to generate E2E test cases."

## Pre-check: Does the Project Have a UI?

Determine whether the project has a UI:

1. Check project structure: frontend framework configs (next.config, vite.config, angular.json, .vue files, etc.)
2. Check prd.md content: does it mention pages, interfaces, interactions, or user-visible behavior?
3. Check package.json scripts: `dev`, `start`, `serve`, or similar scripts that launch a UI?

**If no UI:** Tell the user: "This project has no UI — skipping E2E case generation." Return.

**If UI exists:** Proceed.

## Config Generation (First-Run Only)

Before generating cases, check whether `.superharness/e2e-config.yaml` exists at the project root.

**If config exists:** Skip to [Case Generation](#case-generation). Read the config to understand available profiles.

**If config does NOT exist:** Generate a skeleton config now. This is a one-time setup; placeholder values (startup_cmd, base_url) will be resolved during E2E verification when the app is actually running.

### Config Generation Flow

#### Step 1 - Lightweight detection (no app execution)

Detect the startup command and set a placeholder base_url. Do NOT run the app at this stage - the implementation hasn't happened yet, so the app may not start or may serve stale code.

**Clam project detection:** Check for clam build tool usage:
- Look for `clam.config.js`, `clam.config.ts`, `.clamrc`, or `edithDevHost` in any config file
- Look for `dev-remote:*` or `start-remote*` scripts in package.json (these are clam-specific patterns)
- If clam is detected: set `base_url: "TODO"` (edith proxy URL is dynamic), and note `proxy_mode: clam` for e2e-verify calibration
- If clam is NOT detected: set `base_url: "http://localhost:3000"` (conventional default)

**Startup command detection:**
1. Read `package.json` scripts - collect ALL scripts matching `dev*`, `start*`, `serve*` patterns
2. If clam is detected, prioritize `dev-remote:*` scripts over `start`/`dev`
3. Read `README.md` for documented startup instructions
4. Set `startup_cmd` to `TODO` — auto-detected candidates go into the YAML comment as recommendations. Do NOT write a concrete value here. The user will confirm the correct command when QA runs pre-check.

#### Step 2 - Write skeleton config with TODO placeholders (NO user questions)

Do NOT ask the user any questions at this stage. **ALL launch-critical fields are written as `TODO` placeholders** with auto-detected recommendations in YAML comments — they will be resolved when QA runs pre-check (Phase 0) where the user confirms each value interactively.

**Field rules (all launch-critical fields are `TODO` with recommendations in comments):**
- `startup_cmd`: Write `TODO`. Put auto-detected candidates (from package.json scripts) in a YAML comment above the field, e.g. `# Detected: "npm run dev", "npm run start-remote:daily"`. User confirms when QA runs.
- `base_url`: Write `TODO`. Put detected default in comment, e.g. `# Default: http://localhost:3000 (or clam proxy URL)`. User confirms when QA runs.
- `auth.needs_auth`: Default `true` for web projects. User confirms when QA runs.
- `auth.login_url`: Write `TODO`. User provides when QA runs.
- `profiles`: Default to `pc` only. User can add `h5` when QA runs.

**Why all TODO:** Auto-detection is unreliable — package.json may list multiple scripts, the actual startup command may require env vars or flags, base_url depends on the dev server's port and protocol, and login URLs vary by environment. Writing a concrete auto-detected value causes the Pre-check to skip confirmation, and wrong values waste user time debugging failed E2E runs. The YAML comment preserves the detection result for user reference.

#### Step 3 — Write e2e-config.yaml

Write to: `.superharness/e2e-config.yaml`

```yaml
schema_version: "e2e-config/v1"

app:
  # Detected candidates: "npm run dev", "npm run start" (from package.json)
  startup_cmd: "TODO"  # user confirms when QA runs pre-check
  # Default: http://localhost:3000
  base_url: "TODO"  # user confirms when QA runs pre-check
  # Routing mode: "hash" (URLs like /#/path) or "history" (URLs like /path)
  # Detection hint: check config for history: { type: 'hash' } or similar
  routing_mode: "TODO"  # "hash" or "history" — user confirms when QA runs pre-check
  startup_timeout_s: 30
  env: {}
  pre_start: []

auth:
  needs_auth: true
  state_file: ".superharness/e2e-auth.json"
  login_url: "TODO"  # resolved when QA runs calibration (Phase 0)
  login_hint: "TODO"  # auto-generated from login_url when resolved
  expire_signals:
    - status_codes: [401, 403]
    - redirect_to_login: true

browser:
  headless: false
  viewport: { width: 1920, height: 1080 }
  device: null
  color_scheme: null
  ignore_https_errors: false  # set to true for clam/local HTTPS dev servers with self-signed certs

mock:
  service: null
  static_routes: []

profiles:
  pc:
    browser: { viewport: { width: 1920, height: 1080 } }
  h5:
    app: { base_url: "http://localhost:3000/m" }
    browser: { device: "iPhone 14", viewport: { width: 390, height: 844 } }
```

**Field population rules:**

| Field | Source |
|-------|--------|
| `app.pre_start` | Auto-detected install command (see below) |
| `app.startup_cmd` | `TODO` — detected candidates in YAML comment (user confirms when QA runs) |
| `app.base_url` | `TODO` — detected default in YAML comment (user confirms when QA runs) |
| `auth.needs_auth` | Default `true` (user confirms when QA runs) |
| `auth.login_url` | `TODO` (resolved when QA runs pre-check) |
| `auth.login_hint` | Auto-generated from login_url, or user-provided |
| `auth.state_file` | Always `.superharness/e2e-auth.json` |
| `browser.headless` | Default `false` for local dev |
| `profiles` | Default `pc` only (user can add `h5` when QA runs (e2e-verify Phase 0)) |

**`app.pre_start` detection:** Check which package manager the project uses (look for lock files) and set the install command:
- `package-lock.json` exists → `["npm install"]`
- `pnpm-lock.yaml` exists → `["pnpm install"]`
- `yarn.lock` exists → `["yarn install"]`
- None found → `[]` (empty, ask user if unsure)

If `needs_auth` is false, omit the `auth.login_url`, `auth.login_hint`, and `auth.expire_signals` fields (keep `needs_auth: false` and `state_file`).

Note: Auth state acquisition is deferred to QA. Do not prompt the user to run `superharness e2e auth` at this stage — the auth state may expire before verification actually runs.

## Case Generation

### 1. Read Spec Files

Read both files from the task directory:

- `.superharness/tasks/{task}/prd.md` — what the product should do
- `.superharness/tasks/{task}/plan.md` — how it will be built
- `.superharness/tasks/{task}/contract.md` — Done Definition (acceptance criteria)

Also read `.superharness/e2e-config.yaml` to understand available profiles.

### 2. Extract Cases

Systematically walk through prd.md and contract.md to extract every testable user-facing behavior and acceptance criterion. Cross-reference with plan.md to understand implementation details.

**Extraction strategy:**

1. **List all features from prd.md** — enumerate every distinct user-facing capability. Each feature becomes at least one Case.

2. **Map features to implementation** — for each feature, check plan.md for:
   - Which component/page implements it
   - What route or URL is involved
   - What user interactions are needed
   - What the visible outcome should be

3. **Generate Cases from two perspectives:**

   **User perspective (primary):**
   - Each user-visible feature → one Case
   - Each interaction step → one Step
   - Each expected result → assertion in `expect`
   - Cover happy path AND meaningful edge cases

   **Technical perspective (secondary):**
   - Check browser console for errors after key interactions
   - Verify navigation/URL changes match expected routes

4. **Coverage check** — re-read prd.md and verify every feature/acceptance criterion has a corresponding Case.
5. **Contract cross-check** — read contract.md's Done Definition and verify each acceptance criterion maps to at least one Case. If a criterion has no Case, either add one or explain why it's not E2E-testable (e.g., performance threshold, non-UI behavior).

### 3. Determine Mock Requirements

For each case, decide whether mock data is needed and generate it.

**⚠️ Hard Gate: Every case that triggers an external API call MUST have a `mock` entry.** A case without mock that depends on an external API is unverifiable in local dev — it will be skipped or fail during E2E verification, wasting the entire QA cycle. If you cannot determine the mock response, use `response: pending` — but the mock entry itself must exist. Cases that only interact with the DOM (e.g. form validation, navigation, UI state) and trigger no API calls are exempt.

**Step 1 — Identify API dependencies per case:**

From plan.md and source code (if available), extract which API endpoints each case's steps will trigger. Look for:
- Fetch/axios/request calls in the components involved
- API route definitions (if full-stack project)
- TypeScript interfaces for request/response types

**Step 2 — Apply the mock decision rules:**

| Condition | Decision |
|-----------|----------|
| API is served by the same dev server (same base_url) | No mock needed — real backend handles it |
| API is an external service (different domain/port) | Mock needed |
| Case tests a specific state (empty list, error, edge case) | Mock needed to force that state |
| API requires third-party auth tokens (not user login) | Mock needed |
| API is unreliable/slow in dev environment | Mock needed |
| `config.mock.static_routes` already covers this endpoint | No additional case mock needed |
| Case goal describes a specific API outcome (hit/miss/success/error) | Mock needed to guarantee that outcome |
| API is a gateway/proxy (e.g. mtop, BFF) not running locally | Mock needed |

**Step 3 — Generate mock data:**

For endpoints that need mocking:

1. **Find the response type** — look for TypeScript interfaces, API docs in code, or example responses in tests
2. **Match to case goal** — the mock should produce the exact state the case is testing:
   - Goal says "empty list" → `body: { data: [], total: 0 }`
   - Goal says "create success" → `body: { id: "mock-id", success: true }`
   - Goal says "server error" → `status: 500, body: { error: "Internal error" }`
   - **mtop API** (URL contains `mtop.`) → `body` must use mtop response format:
     - Success: `body: { ret: ["SUCCESS::调用成功"], data: { ...actual_data... } }`
     - Error: `body: { ret: ["FAIL_BIZ_XXX::error message"], data: {} }`
     - Do NOT use `{isSuccess: true, data: ...}` — mtop SDK checks `response.ret`, not `isSuccess`. Missing `ret` causes silent failure (button stuck loading, no error). The e2e-verify runner auto-wraps bodies missing `ret`, but generating the correct format avoids ambiguity.
3. **Keep it minimal** — only include fields the frontend actually reads. Don't generate 50-field objects when the UI only displays 3 fields.
4. **Mark as `pending` when uncertain** — if you cannot determine the correct response structure (complex business data, no type definitions found, relational dependencies), write `response: pending` and move on.

**Rules:**
- Always specify `method` — don't rely on defaults
- `body` must be valid JSON
- For paginated lists, include the pagination fields the frontend expects
- Never mock browser-side resources (CSS, JS, images) — only API endpoints
- **Mock URL format:** Use the API path only, without a hardcoded domain. This ensures the mock works across environments (local/dev/staging/prod). There are two supported formats:
  - **Relative path** (preferred for same-origin APIs): `/h5/mtop.btrip.common.greycheck/1.0` — matched against requests to `base_url`
  - **Path-fragment pattern** (required for cross-domain APIs): `**/mtop.btrip.common.greycheck/**` — uses `**` wildcards to match any domain, so the mock works regardless of which environment the API points to
- **NEVER** hardcode a specific domain (e.g. `h5api.m.taobao.com`) in mock URLs — the actual API domain varies by environment and will cause mocks to silently fail. Read `e2e-config.yaml`'s `app.base_url` to understand the environment, but always use domain-agnostic URL patterns in mock entries
- When the page and API are on different domains (e.g. clam remote proxy: page on `edith.wapa.alibtrip.com`, API on `h5api.wapa.alibtrip.com`), you MUST use the `**` path-fragment pattern format — relative paths won't match cross-domain requests
- **mtop API URL structure:** mtop requests follow the format `{domain}/h5/{apiName}/{version}?{queryParams}` (e.g. `https://h5api.wapa.alibtrip.com/h5/mtop.btrip.common.greycheck/1.0?jsv=2.7.1&...`). Query parameters are appended directly after the version with `?`, NOT after a trailing slash. When generating mock URL patterns for mtop APIs:
  - **Use the API name only** as the pattern: `**/{apiName}/**` (e.g. `**/mtop.btrip.common.greycheck/**`)
  - **NEVER include the version number** in the pattern — `**/mtop.btrip.common.greycheck/1.0/**` will FAIL because `1.0/` expects a path segment after the slash, but the actual URL has `1.0?jsv=...` (query string, no trailing slash)
  - **NEVER add a trailing `/**` after the version** — the `?` in the actual URL breaks the glob match at the `/` boundary
  - The pattern `**/{apiName}/**` works because `/**` after the API name matches everything that follows, including `/{version}?{queryParams}`

### 4. Generate e2e-cases.yaml

Write to the task directory: `.superharness/tasks/{task}/e2e-cases.yaml`

Include `mock` field for each case that needs it (from step 3). Omit `mock` entirely for cases that don't need mocking.

**Format specification (YAML):**

```yaml
calibrated: false
profile: pc

cases:
  - case_id: feature-name-scenario
    goal: 用户可以完成某操作并看到预期结果
    mock:
      - url: "/api/rfp/create"
        method: POST
        response:
          status: 200
          body: { id: "mock-123", success: true }
    steps:
      - open: /path
      - fill: { role: textbox, name: 标题, value: 测试内容 }
      - click: { role: button, name: 提交 }
    expect:
      - url_matches: "**/success"
      - visible: { role: dialog, name: 提交成功 }
      - no_fatal_console_error: true

  - case_id: empty-list-state
    goal: 验证空列表显示空状态提示
    mock:
      - url: "/api/items"
        method: GET
        response:
          status: 200
          body: { data: [], total: 0 }
    steps:
      - open: /items
    expect:
      - visible: { role: img, name: 空状态 }
      - text_present: 暂无数据
```

**Top-level fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `profile` | Yes | Which profile from e2e-config.yaml to use for this case set |
| `cases` | Yes | Array of test cases |
| `calibrated` | Yes | `false` when generated; set to `true` by e2e-verify after calibration |

**Per-case fields:**

| Field | Required | Description |
|-------|----------|-------------|
| `case_id` | Yes | Unique kebab-case identifier |
| `goal` | Yes | One-sentence business outcome |
| `mock` | No | Array of HTTP mock routes for this case |
| `steps` | Yes | Array of actions |
| `expect` | Yes | Array of assertions |

**No `meta` section.** All runtime config (startup_cmd, base_url, auth) lives in `e2e-config.yaml`.

**Mock field specification:**

```yaml
mock:
  - url: "/api/endpoint"       # Same-origin: relative path (matched against base_url)
    method: GET                 # HTTP method (GET/POST/PUT/DELETE)
    response:
      status: 200              # HTTP status code
      body: { ... }            # Response body (JSON)
  - url: "**/mtop.btrip.common.greycheck/**"  # Cross-domain: ** wildcards match any domain
    method: POST
    response: pending          # AI cannot determine — user must fill
```

**URL pattern formats:**
- Same-origin APIs: use relative paths starting with `/` (e.g. `/api/users`)
- Cross-domain APIs: use `**` wildcard patterns wrapping the path fragment (e.g. `**/mtop.btrip.common.greycheck/**`), never hardcode the domain
  - For mtop APIs specifically: use `**/{apiName}/**` WITHOUT the version number — see mtop URL structure rules above. The actual request URL has `{version}?{queryParams}` directly after the API name (no trailing slash before query params), so patterns like `**/{apiName}/{version}/**` will NOT match

**Mock merge rules:** When verify runs, `config.mock.static_routes` provides global mocks (shared across all cases). Per-case `mock` entries override global routes matching the same `url` + `method`. This allows config to define common mocks (e.g., user info endpoint) while cases define scenario-specific ones.

**`response: pending`** — When AI cannot confidently produce mock data (complex business logic, relational data), mark as `pending`. The validate command will report these as warnings (not errors). User or future mock service fills them in before verification.

**Closed vocabulary — only use these, nothing else:**

| Category | Word | Usage |
|----------|------|-------|
| Action | `open` | Relative path (appended to base_url) |
| Action | `click` | `click: { role, name }` or `click: { text }` |
| Action | `fill` | `fill: { role, name, value }` |
| Action | `select` | `select: { role, name, value }` |
| Action | `press` | `press: Enter` / `press: Escape` etc. |
| Action | `hover` | `hover: { role, name }` or `hover: { text }` |
| Action | `wait` | Explicit async sync point only; auto-wait is built-in per step |
| Locator | `{ role, name }` | **Preferred**: ARIA role + accessible name |
| Locator | `{ text }` | Fallback: visible text content |
| Locator | `{ css }` | Escape hatch: **never generate this** — reserved for manual overrides |
| Assertion | `url_matches` | Glob pattern against current URL |
| Assertion | `visible` | Element (by locator) is visible |
| Assertion | `not_visible` | Element (by locator) is not visible |
| Assertion | `text_present` | Specified text exists on page |
| Assertion | `no_fatal_console_error` | No error-level console messages |

**Rules:**
- `case_id` must be kebab-case and unique within the file
- `goal` is natural language, one sentence describing the business outcome
- `steps` must have at least 1 action
- `expect` must have at least 1 assertion
- Prefer `{ role, name }` locators
- Do NOT write explicit `wait` steps unless the operation involves a known async delay
- Do NOT use `{ css }` locators
- Use implementation details from plan.md for correct route paths, button labels, input names

### 5. Mock Coverage Gate (MANDATORY)

Before writing the final file, run this self-check for every case:

1. List the API endpoints that each case's steps will trigger (from Section 3 Step 1)
2. For each endpoint, check: is it served by the local dev server, or is it external?
3. If external → does this case have a `mock` entry covering that endpoint?

**If a case triggers an external API and has no `mock` entry:** You MUST add one. Use `response: pending` if you cannot determine the response structure — but the mock entry must exist so that e2e-verify knows to intercept it.

**Self-check table (write this mentally for each case before finalizing):**

| case_id | API endpoint(s) | External? | Mock provided? | Action |
|---------|----------------|-----------|----------------|--------|
| ... | ... | ... | ... | OK / Add mock / Add pending mock |

A case with "External? = yes" and "Mock provided? = no" is a **generation failure** — fix it before proceeding.

### 6. Validate Format

**HARD GATE — do NOT skip.** You MUST run this command after writing e2e-cases.yaml. If you skip it, invalid files (wrong field names, invented actions, CSS selectors) will silently pass through and cause every E2E case to fail at verification time.

```bash
superharness e2e gen {task-dir}/e2e-cases.yaml
```

If validation fails, fix the issues and re-validate until exit code 0. Pending mocks generate warnings, not errors.

**Common violations this catches:**
- Using `id` instead of `case_id`
- Using `action: navigate` instead of `open: /path`
- Using `selector: ".class"` instead of `{ role, name }` locators
- Using `assert_visible` (not a valid action) instead of `expect: [visible: ...]`
- Missing `expect` block entirely
- Using `verification` instead of `expect`

### 7. User Review

Tell the user: "E2E test cases generated at `{task-dir}/e2e-cases.yaml` — please review and confirm."

**Pending mock summary:** If any mock entries have `response: pending`, list them before user review:
> Pending mocks (must be filled before verification):
> - Case `{case_id}`: `{url}` ({method}) — cannot determine response structure
> 
> These will also be flagged by e2e-verify before running. Fill them in `e2e-cases.yaml` or provide the data when prompted.

Wait for user confirmation before continuing.

## Post-Generation: Register in config.yaml

After writing `e2e-cases.yaml` and `e2e-config.yaml`, check whether `.superharness/config.yaml` has an `e2e-verify` entry under `qa.services`. If not, add one to make E2E verification explicitly visible in the project config:

```yaml
qa:
  services:
    - name: e2e-verify
      type: builtin
```

**Rules:**
- Only add the entry if it does not already exist (check by `name: e2e-verify`)
- Preserve all existing `qa.services` entries — append, do not replace
- If `qa.services` is `[]` (empty array), replace it with the single-entry list
- The `type: builtin` signals that this is handled internally by the qa command (auto-detects e2e-cases.yaml), not an external service
- This step is idempotent — running e2e-gen again on a project that already has the entry is a no-op
No config registration needed. The `superharness qa` command auto-detects `e2e-cases.yaml` in the task directory and runs E2E verification automatically. There is no `builtin` service type — E2E is a built-in behavior of the QA command, not a configured service.

## Red Flags

- **Don't** generate cases for projects without a UI
- **Don't** regenerate e2e-config.yaml if it already exists
- **Don't** write vague assertions ("page loads normally" is not specific enough)
- **Don't** use `{ css }` locators — always use `{ role, name }` or `{ text }`
- **Don't** use words outside the closed vocabulary
- **Don't** add explicit `wait` steps unless there's a known async operation
- **Don't** skip user review
- **Don't** hardcode element refs (@e1, etc.) — refs are runtime-assigned
- **Don't** leave prd.md features uncovered — every feature should map to at least one Case
- **Don't** leave contract.md Done Definition criteria uncovered — every E2E-testable criterion should map to at least one Case
- **Don't** guess startup config without attempting to verify it
- **Don't** run the app during config generation — startup_cmd and base_url are placeholders, resolved when QA runs calibration
- **Don't** prompt for auth state at config generation time — auth is deferred to QA
- **Don't** omit the `calibrated: false` field in e2e-cases.yaml — e2e-verify uses it to determine whether calibration is needed
- **Don't** skip the pending mock summary in user review — users need to know what requires manual input before verification
- **Don't** include `meta` section in e2e-cases.yaml — runtime config belongs in e2e-config.yaml
- **Don't** mock endpoints that the local dev server handles — only mock external/unavailable APIs
- **Don't** generate mock data when you can't find the response type — use `response: pending` instead
- **Don't** over-engineer mock data — minimal fields the UI actually reads is enough
- **Don't** mock browser resources (CSS, JS, images) — only API endpoints
- **Don't** hardcode domains in mock URLs — use relative paths or `**` wildcard patterns so mocks work across all environments
- **Don't** ask the user ANY config questions during e2e-gen (startup command, auth, login URL, platform profiles) — all undeterminable fields are `TODO` placeholders, resolved when QA runs pre-check. Zero questions at plan stage.
- **Don't** skip the `superharness e2e gen` validation step — this is the only mechanical check that catches schema violations (wrong field names, invented actions, CSS selectors). Without it, invalid files pass silently and every case fails at runtime.
- **Don't** invent your own YAML schema — use ONLY the field names defined in the closed vocabulary (case_id, goal, mock, steps, expect) and the action/assertion keywords listed in Section 4. Any deviation (e.g. `id` instead of `case_id`, `action:` instead of the action keyword as the YAML key, `selector:` instead of `{ role, name }`) will fail validation.
- If clam is detected: also set `browser.ignore_https_errors: true` — clam dev servers use self-signed HTTPS certificates on localhost
