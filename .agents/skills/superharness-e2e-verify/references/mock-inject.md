## Eval-Based Mock Injection & Fallback Templates

Read this when §6.2 Step 2b applies (cross-domain mocks, e.g. mtop APIs) or when a `fill` command fails to trigger React onChange.

> **⚠️ CRITICAL:** Before using any mock strategy, read [mock-pitfalls.md](mock-pitfalls.md) — it documents 6 real-world pitfalls that cause silent mock failures. The most common issue is **wrong mock body format for mtop APIs** (`{isSuccess, data}` instead of `{ret: [...], data}`). The e2e-verify runner auto-wraps mtop bodies missing `ret`, but understanding the format avoids confusion.

## Mock Strategy Selection Guide

**The e2e-verify runner only uses fetch/XHR override (Strategy 1).** This is sufficient for all API types including mtop. The lib.mtop SDK and script tag strategies (below) are kept as reference documentation for edge cases but are NOT used by the runner.

| API Pattern | Strategy | Why |
|---|---|---|
| Same-origin REST API (`/api/...`) | `agent-browser network route` | Same domain — route interception works |
| Cross-domain REST API | Eval: fetch/XHR override (Strategy 1) | `network route` silently fails for cross-domain |
| mtop API (`mtop.btrip.*`) | Eval: fetch/XHR override (Strategy 1) | mtop is HTTP POST, fetch/XHR intercepts it. **This works** — previous fallback strategies were unnecessary. |

**Key insight:** fetch/XHR override handles all API types. The runner includes an interception counter (`window.__sh_mock_intercepted`) that automatically detects if the mock was consumed. If interception count is 0, the problem is the URL pattern, not the strategy — do NOT switch strategies.

### Mock Effectiveness Probe

The runner automatically verifies interception after each case:
1. The mock JS sets `window.__sh_mock_intercepted = 0` on install
2. Each fetch/XHR interception increments the counter
3. After case steps, the runner checks the counter. If 0 and the case had mocks, it reports `error.kind: "mock-not-intercepted"`.

Do NOT use `agent-browser network requests` to check interception — it returns ALL requests in the browser session, not just the current page. See [mock-pitfalls.md](mock-pitfalls.md) Pitfall 2.

---

## Injection Templates

### 1. Cross-Domain fetch/XHR Override (used by runner)

**Template:** [templates/fetch-xhr-mock.js](templates/fetch-xhr-mock.js)

For cross-domain APIs using standard fetch/XHR, including mtop APIs (HTTP POST to `h5api.m.alibtrip.com/mtop.xxx/`). Pattern key uses `url.includes(pattern)` — use API name only (e.g. `mtop.btrip.common.greycheck`), no version/domain/slash. When mocking mtop via fetch/XHR, `mock.body` should be the full mtop response object (`{ ret: [...], data: {...} }`) since the HTTP response body is already in mtop format. The runner auto-wraps bodies missing `ret` for mtop URLs.

Verify: `agent-browser eval "window.__sh_mock_active"` -> `true`

### 2. lib.mtop SDK Override (reference only — NOT used by runner)

**Template:** [templates/mtop-mock.js](templates/mtop-mock.js)

Kept for reference. In practice, fetch/XHR override (Strategy 1) handles all mtop cases. This strategy is only needed if the mtop SDK uses JSONP `<script>` transport instead of XHR, which is extremely rare.

### 3. `<script>` Tag Interception (reference only — NOT used by runner)

**Template:** [templates/script-tag-mock.js](templates/script-tag-mock.js)

Kept for reference. Last-resort strategy for SDKs bundled in webpack closure. Not needed in practice.

---

## Fill Empty String — React onChange Fallback

**Template:** [templates/react-fill-empty.js](templates/react-fill-empty.js)

When `fill @eN ""` doesn't trigger React's synthetic onChange (submit button stays enabled). The runner automatically falls back to native value setter + dispatchEvent when `agent-browser fill` fails.

---

## Cleanup

The next case's `open` step loads a fresh page and clears eval overrides automatically. If the next case has no `open` step, explicitly reload: `agent-browser eval "location.reload()"` then `wait --load networkidle`.
