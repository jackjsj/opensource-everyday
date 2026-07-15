## Output Schemas

Detailed JSON formats for all output files. Read this when writing results in §9.

### Table of Contents

1. process/index.json — Case summary + artifact manifest
2. issues/{id}.json — Per-issue diagnosis
3. qa-issues.json — Index layer for triage

---

### 1. process/index.json

```json
{
  "schema_version": "eval-process/v1",
  "config": {
    "profile": "pc",
    "base_url": "http://localhost:3000",
    "headless": false
  },
  "cases": [
    {
      "case_id": "rfp-submit-success",
      "result": "pass | fail | not-run",
      "duration_ms": 4200,
      "dir": "rfp-submit-success",
      "artifacts": [
        { "file": "steps.jsonl", "kind": "steps", "bytes": 1024 },
        { "file": "console-errors.json", "kind": "console", "bytes": 89 },
        { "file": "dom-snapshot.txt", "kind": "dom", "bytes": 5120 },
        { "file": "network-failed.json", "kind": "network", "bytes": 0 },
        { "file": "screenshots/step-1.png", "kind": "screenshot", "bytes": 52000 },
        { "file": "screenshots/before-assert.png", "kind": "screenshot", "bytes": 54000 },
        { "file": "summary.md", "kind": "summary", "bytes": 120 }
      ]
    }
  ]
}
```

### 2. issues/{id}.json

One file per failure. ID format: `{case_id}--{assertion_key}` or `{case_id}--step-{n}`.

```json
{
  "id": "rfp-submit-success--url_matches",
  "file": null,
  "line": null,
  "behavior": {
    "requirement": "{goal from e2e-cases.yaml}",
    "expected": "URL matches **/rfp/success",
    "actual": "URL is http://localhost:3000/rfp/create (unchanged)"
  },
  "repro": [
    "open /rfp/create",
    "fill role:textbox name:标题 value:测试RFP",
    "click role:button name:提交"
  ],
  "signals": [
    {
      "type": "page-error",
      "file": "src/rfp/SubmitButton.tsx",
      "line": 42,
      "confidence": 0.8,
      "source": "agent-browser errors + sourcemap parsing"
    }
  ]
}
```

- **signals extraction:** Parse `console-errors.json` — if errors contain stack frames with file paths and line numbers, extract them as signals with `type: "page-error"`. If no useful stack frames, `signals` is an empty array.
- **repro:** Reconstruct from steps.jsonl — translate each executed step back into the intent vocabulary.

### 3. qa-issues.json

Index layer for fix triage.

```json
{
  "schema_version": "eval-result/v1",
  "run": {
    "run_id": "{run_id}",
    "task_id": "{task name from task.json}",
    "attempt_id": "attempt_1",
    "verdict": "pass | fail | error",
    "error": null,
    "meta": {
      "started_at": "{ISO timestamp}",
      "duration_ms": 0,
      "runner": "agent-browser",
      "runner_version": "{from agent-browser --version}",
      "profile": "pc",
      "headless": false
    },
    "projects": [
      {
        "project": ".",
        "provider": "frontend-e2e",
        "verdict": "pass | fail",
        "gate": { "type": "all-hard-gates" },
        "summary": { "total": 0, "passed": 0, "failed": 0 }
      }
    ]
  },
  "issues": [
    {
      "id": "rfp-submit-success--url_matches",
      "project": ".",
      "category": "e2e-behavior",
      "severity": "major",
      "status": "pending",
      "fix_round": 0,
      "result": "fail",
      "error": { "kind": "assertion", "message": "URL 未匹配 **/rfp/success" },
      "detail": "issues/rfp-submit-success--url_matches.json",
      "evidence": "process/rfp-submit-success/"
    }
  ]
}
```

- **severity rules:** Core user flow blockers (navigation, form submission, login) → `"critical"`. Other functional failures → `"major"`. Console errors without visible behavioral impact → `"minor"`.
- **attempt_id:** Read from existing qa-issues.json if re-running (increment N). First run = `"attempt_1"`.
