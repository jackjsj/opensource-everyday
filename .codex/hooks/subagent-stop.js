// src/hooks/subagent-stop.ts
import { execSync } from "child_process";
import { existsSync, readFileSync as readFileSync2, rmSync, writeFileSync } from "fs";
import { join as join2 } from "path";

// src/hooks/shared.ts
import {
  appendFileSync,
  readFileSync,
  readdirSync,
  realpathSync
} from "fs";
import { join } from "path";
function hooksDisabled() {
  return process.env.SUPERHARNESS_HOOKS === "0";
}
function parseStdinPayload(raw) {
  if (!raw.trim()) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
function readStdinJson() {
  try {
    const raw = readFileSync(0, "utf-8");
    return parseStdinPayload(raw);
  } catch {
    return null;
  }
}
function getProjectDir(input) {
  return input.cwd || process.env.CLAUDE_PROJECT_DIR || process.env.CURSOR_PROJECT_DIR || process.cwd();
}
function toRealpath(p) {
  try {
    return realpathSync(p);
  } catch {
    return null;
  }
}
function resolveActiveTask(projectDir) {
  const tasksRoot = join(projectDir, ".superharness", "tasks");
  let entries;
  try {
    entries = readdirSync(tasksRoot).sort();
  } catch {
    return null;
  }
  const projectReal = toRealpath(projectDir) ?? projectDir;
  const windowCandidates = [];
  for (const entry of entries) {
    let task;
    try {
      task = JSON.parse(
        readFileSync(join(tasksRoot, entry, "task.json"), "utf-8")
      );
    } catch {
      continue;
    }
    if (task.status === "completed") continue;
    const rel = join(".superharness", "tasks", entry);
    if (task.worktree_path) {
      const worktreeReal = toRealpath(task.worktree_path);
      if (worktreeReal === null) continue;
      if (worktreeReal === projectReal) return rel;
      continue;
    }
    windowCandidates.push(rel);
  }
  return windowCandidates.length === 1 ? windowCandidates[0] : null;
}
function writeTrace(opts) {
  const entry = JSON.stringify({
    ts: (/* @__PURE__ */ new Date()).toISOString(),
    phase: opts.phase,
    event: opts.event,
    detail: opts.detail,
    // JSON.stringify 会丢弃 undefined 值的键，天然满足「不落键」
    task: opts.task,
    round: opts.round,
    ref: opts.ref,
    profile: opts.profile
  });
  try {
    appendFileSync(
      join(opts.projectDir, opts.taskDir, "trace.jsonl"),
      `${entry}
`
    );
  } catch {
  }
}
function extractTaskRef(prompt) {
  const m = prompt.match(/(task-brief|review-package)-(\d+)\.md/);
  if (!m) return null;
  return { task: Number(m[2]), ref: `sdd/${m[1]}-${m[2]}.md` };
}
function countTraceEvents(opts) {
  try {
    const raw = readFileSync(
      join(opts.projectDir, opts.taskDir, "trace.jsonl"),
      "utf-8"
    );
    let count = 0;
    for (const line of raw.split("\n")) {
      if (!line.trim()) continue;
      try {
        const e = JSON.parse(line);
        if (e.task === opts.task && e.event === opts.event) count++;
      } catch {
      }
    }
    return count;
  } catch {
    return 0;
  }
}

// src/hooks/subagent-stop.ts
var SUPERHARNESS_DIR = ".superharness";
var TARGET_AGENTS = ["check", "task-reviewer"];
function shouldCheckMarkers(agentType) {
  return agentType === "check";
}
function readFileOrNull(path) {
  try {
    return readFileSync2(path, "utf-8");
  } catch {
    return null;
  }
}
function recordVerification(projectDir, taskDir, result) {
  const statePath = join2(projectDir, taskDir, "pending-verification.json");
  if (result.passed) {
    rmSync(statePath, { force: true });
    return;
  }
  writeFileSync(
    statePath,
    `${JSON.stringify({ ts: (/* @__PURE__ */ new Date()).toISOString(), passed: false, failures: result.failures }, null, 2)}
`
  );
}
function getVerifyCommands(projectDir) {
  const worktreeYaml = readFileOrNull(
    join2(projectDir, SUPERHARNESS_DIR, "worktree.yaml")
  );
  if (!worktreeYaml) return [];
  const lines = worktreeYaml.split("\n");
  const commands = [];
  let inVerify = false;
  for (const line of lines) {
    if (line.match(/^verify\s*:/)) {
      inVerify = true;
      continue;
    }
    if (inVerify) {
      if (line.match(/^\s+-\s+/)) {
        commands.push(line.replace(/^\s+-\s+/, "").trim());
      } else if (!line.match(/^\s*$/)) {
        break;
      }
    }
  }
  return commands;
}
function runVerifyCommands(projectDir, commands) {
  const failures = [];
  for (const cmd of commands) {
    try {
      execSync(cmd, {
        cwd: projectDir,
        timeout: 12e4,
        stdio: ["pipe", "pipe", "pipe"]
      });
    } catch (err) {
      const error = err;
      const output = (error.stderr?.toString() || error.stdout?.toString() || "").trim().slice(-500);
      failures.push(`${cmd} failed${output ? `: ${output}` : ""}`);
    }
  }
  return { passed: failures.length === 0, failures };
}
function getCompletionMarkers(projectDir, taskDir) {
  const checkJsonlPath = join2(projectDir, taskDir, "check.jsonl");
  const raw = readFileOrNull(checkJsonlPath);
  if (!raw) return [];
  return raw.split("\n").filter((line) => line.trim()).map((line) => {
    try {
      const entry = JSON.parse(line);
      if (entry.reason) {
        return `${entry.reason.toUpperCase().replace(/[\s-]+/g, "_")}_FINISH`;
      }
      return null;
    } catch {
      return null;
    }
  }).filter((m) => m !== null);
}
function checkMarkers(agentOutput, markers) {
  const missing = markers.filter((marker) => !agentOutput.includes(marker));
  return { allPresent: missing.length === 0, missing };
}
var OUTPUT_TAIL_LENGTH = 200;
function parseVerdict(output) {
  const spec = output.match(/SPEC_VERDICT:\s*(PASS|FAIL)/);
  const quality = output.match(/QUALITY_VERDICT:\s*(PASS|FAIL)/);
  if (!spec || !quality) return null;
  let findings = null;
  const section = output.match(
    /FINDINGS:?([\s\S]*?)(?:\n[A-Z_]+:|\n#{1,6}\s|$)/
  );
  if (section) {
    findings = (section[1].match(/^\s*[-*]\s+/gm) || []).length;
  }
  return {
    spec: spec[1],
    quality: quality[1],
    findings
  };
}
var IMPLEMENT_STATUSES = [
  "DONE_WITH_CONCERNS",
  "NEEDS_CONTEXT",
  "BLOCKED",
  "DONE"
];
function parseStatus(output) {
  for (const status of IMPLEMENT_STATUSES) {
    if (output.includes(status)) return status;
  }
  return null;
}
function outcomeRound(opts, task, startEvent) {
  const started = countTraceEvents({
    projectDir: opts.projectDir,
    taskDir: opts.taskDir,
    task,
    event: startEvent
  });
  return started > 0 ? started : 1;
}
function writeOutcomeTrace(opts) {
  if (opts.subagentType !== "task-reviewer" && opts.subagentType !== "implement")
    return;
  const taskRef = extractTaskRef(opts.prompt);
  const tail = opts.agentOutput.trim().slice(-OUTPUT_TAIL_LENGTH);
  if (opts.subagentType === "task-reviewer") {
    const verdict = parseVerdict(opts.agentOutput);
    writeTrace({
      projectDir: opts.projectDir,
      taskDir: opts.taskDir,
      phase: "check",
      event: verdict ? "task-reviewer:verdict" : "task-reviewer:verdict_unparsed",
      detail: verdict ? `SPEC=${verdict.spec} QUALITY=${verdict.quality}${verdict.findings === null ? "" : ` findings=${verdict.findings}`}` : tail,
      task: taskRef?.task,
      round: taskRef ? outcomeRound(opts, taskRef.task, "task-reviewer:start") : void 0,
      ref: taskRef?.ref
    });
    return;
  }
  const status = parseStatus(opts.agentOutput);
  writeTrace({
    projectDir: opts.projectDir,
    taskDir: opts.taskDir,
    phase: "implement",
    event: status ? "implement:status" : "implement:status_unparsed",
    detail: status ?? tail,
    task: taskRef?.task,
    round: taskRef ? outcomeRound(opts, taskRef.task, "implement:start") : void 0,
    // implementer 的详情文件是 report-N.md（brief 只是输入）
    ref: taskRef ? `sdd/report-${taskRef.task}.md` : void 0
  });
}
function buildClaudeCodeOutput(reason) {
  return { decision: "allow", reason };
}
function buildFollowupOutput(message) {
  return message ? { followup_message: message } : {};
}
function outputClaudeCode(reason) {
  process.stdout.write(JSON.stringify(buildClaudeCodeOutput(reason)));
}
function outputFollowupMessage(message) {
  process.stdout.write(JSON.stringify(buildFollowupOutput(message)));
}
function emit(isClaudeCode, reason, followup) {
  if (isClaudeCode) {
    outputClaudeCode(reason);
  } else {
    outputFollowupMessage(followup);
  }
}
function main() {
  if (hooksDisabled()) process.exit(0);
  const input = readStdinJson();
  if (!input) process.exit(0);
  const hookEvent = input.hook_event_name || "";
  const subagentType = input.subagent_type || "";
  const agentOutput = input.agent_output || input.summary || "";
  const originalPrompt = input.prompt || "";
  const projectDir = getProjectDir(input);
  const isClaudeCode = hookEvent === "SubagentStop";
  if (originalPrompt.toLowerCase().includes("[finish]")) {
    emit(isClaudeCode, "Finish phase - skip verification", null);
    process.exit(0);
  }
  const taskDir = resolveActiveTask(projectDir);
  if (!taskDir || !existsSync(join2(projectDir, taskDir))) {
    emit(isClaudeCode, "No active task", null);
    process.exit(0);
  }
  writeOutcomeTrace({
    projectDir,
    taskDir,
    subagentType,
    agentOutput,
    prompt: originalPrompt
  });
  if (subagentType && !TARGET_AGENTS.includes(subagentType)) {
    emit(isClaudeCode, "Not a verification-target agent", null);
    process.exit(0);
  }
  const verifyCommands = getVerifyCommands(projectDir);
  if (verifyCommands.length > 0) {
    const result = runVerifyCommands(projectDir, verifyCommands);
    recordVerification(projectDir, taskDir, result);
    if (result.passed) {
      writeTrace({
        projectDir,
        taskDir,
        phase: "check",
        event: "check:verify",
        detail: "all verify commands passed"
      });
      emit(isClaudeCode, "All verify commands passed", null);
    } else {
      const reason = `verify command(s) failed: ${result.failures.join("; ")}`;
      writeTrace({
        projectDir,
        taskDir,
        phase: "check",
        event: "check:verify",
        detail: reason
      });
      emit(
        isClaudeCode,
        `Verification failed, recorded to pending-verification.json; breadcrumb will surface it. ${reason}`,
        `\u9A8C\u8BC1\u672A\u901A\u8FC7: ${reason}`
      );
    }
    process.exit(0);
  }
  const markers = shouldCheckMarkers(subagentType) ? getCompletionMarkers(projectDir, taskDir) : [];
  if (markers.length > 0) {
    const { allPresent, missing } = checkMarkers(agentOutput, markers);
    const result = allPresent ? { passed: true, failures: [] } : { passed: false, failures: missing.map((m) => `missing marker: ${m}`) };
    recordVerification(projectDir, taskDir, result);
    if (allPresent) {
      writeTrace({
        projectDir,
        taskDir,
        phase: "check",
        event: "check:markers",
        detail: "all markers present"
      });
      emit(isClaudeCode, "All completion markers found", null);
    } else {
      const reason = `missing markers: ${missing.join(", ")}`;
      writeTrace({
        projectDir,
        taskDir,
        phase: "check",
        event: "check:markers",
        detail: reason
      });
      emit(
        isClaudeCode,
        `Verification failed, recorded to pending-verification.json; breadcrumb will surface it. ${reason}`,
        `\u9A8C\u8BC1\u672A\u901A\u8FC7: ${reason}`
      );
    }
    process.exit(0);
  }
  emit(isClaudeCode, "No verification configured", null);
  process.exit(0);
}
if (process.env.VITEST !== "true") {
  main();
}
export {
  TARGET_AGENTS,
  buildClaudeCodeOutput,
  buildFollowupOutput,
  checkMarkers,
  getCompletionMarkers,
  getVerifyCommands,
  parseStatus,
  parseVerdict,
  recordVerification,
  shouldCheckMarkers,
  writeOutcomeTrace
};
//# sourceMappingURL=subagent-stop.js.map