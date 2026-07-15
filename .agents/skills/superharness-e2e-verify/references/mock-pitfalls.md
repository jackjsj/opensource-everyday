# Mock Pitfalls & Lessons Learned

This document records real-world pitfalls encountered during E2E verification of mtop-based applications (specifically `@ali/btrip-base` mtop SDK). Use it to avoid repeating the same mistakes.

## Pitfall 1: Mock Body Format - `ret` vs `isSuccess`

### Problem

e2e-gen generates mock bodies in this format:
```yaml
body:
  data:
    result: [...]
  isSuccess: true
```

This format **does not work** for mtop APIs when using fetch/XHR override (Strategy 1). The mtop SDK's `handleRequestSuccess` function calls `parseError(response.ret)` to determine success/failure. If `ret` is missing, `parseError(undefined)` returns `{code: "ERROR"}`, causing `isSuccess = false`, and the request is routed to `handleRequestFail` instead of `resolve`.

**Symptom:** XHR `send` IS intercepted, `Object.defineProperty` works, `onreadystatechange` fires, but the button stays in "loading" state forever - no Tag, no Alert.

### Root Cause

The mtop SDK (`@ali/btrip-base/es/packages/mtop/src/web`) has two layers:

1. **XHR layer** (`lib-mtop.js` -> `__requestJSON`): Creates `XMLHttpRequest`, calls `open`/`send`, reads `xhr.responseText`, parses JSON, resolves with the raw mtop response object.
2. **Handler layer** (`handleRequestSuccess`): Takes the raw mtop response, calls `parseError(response.ret)` to extract `code` and `msg`, sets `isSuccess = (code === "SUCCESS")`, then resolves with `Object.assign(response, {isSuccess, code, message})`.

The `isSuccess` field is **set by the handler**, not by the response body. The response body must contain `ret` (an array of strings like `["SUCCESS::调用成功"]`) so that `parseError` can extract the code.

### Correct Format

```yaml
# Success
body:
  ret:
    - "SUCCESS::调用成功"
  data:
    result: [...]

# Error
body:
  ret:
    - "FAIL::系统异常"
  data: {}
```

### Fix Needed

- **e2e-gen**: When generating mock bodies for mtop APIs (detected by `mtop.` prefix in API name), wrap the body in `{ret: ["SUCCESS::..."], data: {...}}` format instead of `{isSuccess: true, data: {...}}`.
- **mock-inject.md**: Already says "mock.body should be the full mtop response object" - but this guidance is buried in a single line. Make it a prominent warning.
- **fetch-xhr-mock.js template**: Add inline comment about mtop body format.

### Verification Method

After installing fetch/XHR mock, verify interception AND response correctness:
```javascript
// Check 1: Was send intercepted?
agent-browser eval "window.__sh_mock_active"  // -> true

// Check 2: Did the React component render the expected result?
agent-browser eval "document.querySelectorAll('.ant-tag').length > 0"

// Check 3: Is the button stuck in loading?
agent-browser eval "!!document.querySelector('button.ant-btn-loading')"  // -> false
```

If `intercepted=true` but `buttonLoading=true`, the mock body format is likely wrong.

---

## Pitfall 2: `agent-browser network requests` Shows Historical Requests

### Problem

After installing a mock and clicking a button, I checked `agent-browser network requests --json` to verify the mock intercepted the request. The network log showed a greycheck POST with status 200. I concluded the mock failed and the real request went through.

**This was wrong.** The POST in the network log was from a **previous test run** (4 minutes earlier). `agent-browser network requests` returns ALL requests in the browser session, not just from the current page.

### Fix

Never use `agent-browser network requests` to determine if a mock intercepted a request. Instead:
1. Set a flag in the mock's `send` override: `window.__sh_intercepted = true`
2. Check the flag after the action: `agent-browser eval "window.__sh_intercepted"`
3. If you must check network, compare timestamps: `r.timestamp` vs `Date.now()`

---

## Pitfall 3: `agent-browser fill` Does Not Trigger React onChange

### Problem

`agent-browser fill @eN "value"` sets the DOM `input.value` but does NOT trigger React's synthetic `onChange` event. Antd `Form` components rely on `onChange` to update internal form state. Without it:
- Form validation fails (required fields appear empty to React)
- `onFinish` callback is never called
- The submit button click does nothing

**Symptom:** Button stays normal (not "loading"), no API call made, no result displayed.

### Fix

Use the React onChange fallback for ALL `fill` actions on form inputs:
```javascript
var formItems = document.querySelectorAll('.ant-form-item');
for (var i = 0; i < formItems.length; i++) {
  var label = formItems[i].querySelector('.ant-form-item-label label');
  if (label && label.textContent.indexOf('greyKey') > -1) {
    var input = formItems[i].querySelector('input');
    if (input) {
      var nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      nativeSetter.call(input, 'test_key');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    break;
  }
}
```

### Fix Needed

- **execution-steps.md section 6.3**: Add a note that `fill` may not trigger React onChange for antd Form items. Recommend the native value setter fallback for ALL form fills, not just empty string fills.
- **mock-inject.md**: The "Fill Empty String" section is too narrow. Rename to "React Input Fill Fallback" and recommend it for all antd form inputs.

---

## Pitfall 4: `agent-browser snapshot -i` Does Not Show antd Tag/Alert

### Problem

`agent-browser snapshot -i` (accessibility tree) does not render antd `<Tag>` or `<Alert>` components. These elements exist in the DOM and are visually visible in screenshots, but they do not appear in the accessibility tree.

**Symptom:** `agent-browser snapshot -i | grep "命中"` returns empty, even though the Tag is rendered and visible.

### Fix

For assertion checks involving antd Tag/Alert, use DOM queries instead of accessibility tree:
```bash
# Wrong (accessibility tree may not show Tag):
agent-browser snapshot -i | grep "命中"

# Correct (DOM query):
agent-browser eval "document.body.innerText.indexOf('命中') > -1"
```

### Fix Needed

- **execution-steps.md section 6.5**: Add guidance to prefer DOM text queries over accessibility tree for `visible: {text: "..."}` assertions.
- Consider adding a `agent-browser has-text "..."` command.

---

## Pitfall 5: `agent-browser errors --json` Does Not Capture `console.log`

### Problem

I added `console.log("[sh-mock] ...")` in the mock's `send` override for debugging. Then I checked `agent-browser errors --json` for the log output. It was not there -- `errors --json` only captures `console.error`, not `console.log`.

**Symptom:** Mock debug logs appear missing, leading to incorrect diagnosis that the mock's `send` override was never called.

### Fix

Use `window.__sh_debug = []` array and push debug info to it, then check with `agent-browser eval "JSON.stringify(window.__sh_debug)"`. Never rely on `console.log` for debugging in agent-browser.

---

## Pitfall 6: Misdiagnosis - Wasted Time on Wrong Root Cause

### Problem

When the mock appeared to not work (button stuck in loading), I went through a sequence of incorrect hypotheses:

1. **"XHR prototype override does not work"** -> Spent time reading `lib-mtop.js` source code, checking if mtop SDK caches `open`/`send` references. It does not -- it calls `xhr.open()` and `xhr.send()` through normal prototype lookup.
2. **"lib.mtop.request override needs callbacks not Promises"** -> Switched to callback-based override. This "worked" but for the wrong reason -- the callback mock used the correct body format (`{ret, data}`) while the XHR mock used the wrong format (`{isSuccess, data}`).
3. **"Mtop.prototype.__processRequest middleware chain is too complex"** -> Tried overriding SDK internals. Unnecessary complexity.

The **actual root cause** was simply the mock body format (missing `ret` field). The XHR prototype override worked perfectly all along.

### Lesson

When a mock appears to not work, verify in this order:
1. **Was `send` intercepted?** -> Check `window.__sh_intercepted` flag
2. **Was the response body format correct?** -> Check if the mock body matches what the SDK expects (mtop: `{ret, data}`, REST: varies)
3. **Did the React component re-render?** -> Check DOM for expected elements
4. **Is the button stuck in loading?** -> Check `document.querySelector('button.ant-btn-loading')`

If `intercepted=true` and `buttonLoading=true`, the problem is the response body format, not the interception mechanism. Do not switch to a different mock strategy -- fix the body format.

---

## Summary: Recommended Mock Debugging Checklist

When E2E mock appears to fail, run this diagnostic sequence:

```bash
# 1. Was send intercepted?
agent-browser eval "window.__sh_mock_active"

# 2. Did the React component render results?
agent-browser eval "JSON.stringify({
  tags: Array.from(document.querySelectorAll('.ant-tag')).map(t => t.textContent),
  alerts: Array.from(document.querySelectorAll('.ant-alert')).map(a => a.textContent),
  buttonLoading: !!document.querySelector('button.ant-btn-loading')
})"

# 3. If intercepted=true but buttonLoading=true:
#    -> Mock body format is wrong. Check if API is mtop (needs `ret` field).
#    -> Do not switch mock strategy. Fix the body format.

# 4. If intercepted=false:
#    -> Mock strategy issue. Check fetch vs XHR, method (GET vs POST), URL pattern.
#    -> Try callback-based override if fetch/XHR override does not intercept.
```
