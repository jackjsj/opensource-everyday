// src/hooks/pre-tool-use.ts
import { existsSync, readFileSync as readFileSync2, writeFileSync } from "fs";
import { join as join2 } from "path";

// src/hooks/shared.ts
import {
  appendFileSync,
  readFileSync,
  readdirSync,
  realpathSync
} from "fs";
import { join } from "path";

// src/utils/skill-refs.ts
function rewriteSkillRefs(content) {
  return content.replace(
    /\/?superharness:([a-z][a-z0-9-]*)/g,
    "superharness-$1"
  );
}

// src/hooks/shared.ts
var NON_CLAUDE_PLATFORM_DIRS = [
  ".codex/",
  ".cursor/",
  ".qoder/",
  ".aone_copilot/"
];
function adaptForPlatform(content) {
  const scriptPath = process.argv[1] || "";
  const isNonClaudePlatform = NON_CLAUDE_PLATFORM_DIRS.some(
    (dir) => scriptPath.includes(dir)
  );
  return isNonClaudePlatform ? rewriteSkillRefs(content) : content;
}
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

// src/hooks/pre-tool-use.ts
var AGENTS_ALL = [
  "implement",
  "check",
  "task-reviewer",
  "debug",
  "research"
];
var AGENTS_REQUIRE_TASK = [
  "implement",
  "check",
  "task-reviewer",
  "debug"
];
var SUPERHARNESS_DIR = ".superharness";
var PHASE_OVERRIDE = {
  "task-reviewer": "check"
};
function resolvePhase(agentType) {
  return PHASE_OVERRIDE[agentType] ?? agentType;
}
function readFileOrNull(path) {
  try {
    return readFileSync2(path, "utf-8");
  } catch {
    return null;
  }
}
function checkPhaseGate(projectDir, taskDir, subagentType) {
  if (subagentType !== "implement") return null;
  const prdPath = join2(projectDir, taskDir, "prd.md");
  const planPath = join2(projectDir, taskDir, "plan.md");
  const taskJsonPath = join2(projectDir, taskDir, "task.json");
  let profile;
  const raw = readFileOrNull(taskJsonPath);
  if (raw) {
    try {
      const task = JSON.parse(raw);
      profile = typeof task.profile === "string" && task.profile !== "full" ? task.profile : void 0;
    } catch {
    }
  }
  if (!existsSync(prdPath)) {
    return [
      "[PHASE GATE FAILED] \u26D4 ABORT THIS TASK IMMEDIATELY.",
      "",
      "You are attempting to dispatch an implement subagent, but prd.md does not exist.",
      "This means the brainstorm phase has NOT been completed.",
      "",
      "Required action: DO NOT implement anything. Return to the controller and:",
      "1. Complete brainstorm (invoke superharness:brainstorm)",
      "2. Then complete plan (invoke superharness:writing-plans)",
      "3. Only then dispatch implement subagents",
      "",
      "Output exactly: ABORTED \u2014 brainstorm phase incomplete, prd.md missing."
    ].join("\n");
  }
  if (!profile && !existsSync(planPath)) {
    return [
      "[PHASE GATE FAILED] \u26D4 ABORT THIS TASK IMMEDIATELY.",
      "",
      "You are attempting to dispatch an implement subagent, but plan.md does not exist.",
      "This means the plan phase has NOT been completed.",
      "",
      "Required action: DO NOT implement anything. Return to the controller and:",
      "1. Invoke superharness:writing-plans to create plan.md",
      "2. Get user approval on the plan",
      "3. Only then dispatch implement subagents",
      "",
      "Output exactly: ABORTED \u2014 plan phase incomplete, plan.md missing."
    ].join("\n");
  }
  return null;
}
function updatePhase(projectDir, taskDir, agentType) {
  const taskJsonPath = join2(projectDir, taskDir, "task.json");
  const raw = readFileOrNull(taskJsonPath);
  if (!raw) return;
  try {
    const task = JSON.parse(raw);
    const phase = resolvePhase(agentType);
    if (task.phase !== phase) {
      task.phase = phase;
      task.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      writeFileSync(taskJsonPath, `${JSON.stringify(task, null, 2)}
`);
    }
  } catch {
  }
}
function readTaskProfile(projectDir, taskDir) {
  const raw = readFileOrNull(join2(projectDir, taskDir, "task.json"));
  if (!raw) return void 0;
  try {
    const profile = JSON.parse(raw).profile;
    return typeof profile === "string" && profile !== "full" ? profile : void 0;
  } catch {
    return void 0;
  }
}
function writeDispatchTrace(opts) {
  const event = `${opts.subagentType}:start`;
  const taskRef = extractTaskRef(opts.prompt);
  writeTrace({
    projectDir: opts.projectDir,
    taskDir: opts.taskDir,
    phase: resolvePhase(opts.subagentType),
    event,
    detail: `Dispatching ${opts.subagentType} subagent`,
    task: taskRef?.task,
    round: taskRef ? countTraceEvents({
      projectDir: opts.projectDir,
      taskDir: opts.taskDir,
      task: taskRef.task,
      event
    }) + 1 : void 0,
    ref: taskRef?.ref,
    profile: readTaskProfile(opts.projectDir, opts.taskDir)
  });
}
var MANIFEST_FILE = {
  implement: "implement.jsonl",
  check: "check.jsonl",
  "task-reviewer": "check.jsonl",
  debug: "debug.jsonl"
};
function buildPointerContext(baseDir, taskDir, agentType) {
  const manifestFile = MANIFEST_FILE[agentType];
  const normalizedTaskDir = taskDir.replace(/\/+$/, "");
  if (!manifestFile || !normalizedTaskDir) return "";
  const taskDirAbs = join2(baseDir, normalizedTaskDir);
  const lines = [
    "## Task Context (pull-based)",
    "",
    "Before starting, use the Read tool in this order (skip entries that do not exist):",
    `1. ${join2(taskDirAbs, manifestFile)} \u2014 context manifest (JSONL, one {file, reason} per line); read each referenced file`,
    `2. ${join2(taskDirAbs, "prd.md")} \u2014 requirements document`
  ];
  if (agentType === "check" || agentType === "task-reviewer") {
    lines.push(`3. ${join2(taskDirAbs, "contract.md")} \u2014 Done Definition`);
  }
  lines.push("", "Finish reading before you begin the task.");
  return lines.join("\n");
}
function buildResearchContext(projectDir) {
  const specDir = join2(projectDir, SUPERHARNESS_DIR, "spec");
  if (!existsSync(specDir)) return "";
  return `Project spec directory: ${specDir}
Read relevant spec files as needed.`;
}
function buildPrompt(originalPrompt, context) {
  if (!context) return originalPrompt;
  const header = context.startsWith("## ") ? "" : "## Task Context\n\n";
  return `${header}${context}

---

## Original Task

${originalPrompt}`;
}
function buildOutput(hookEvent, toolInput, newPrompt) {
  return {
    hookSpecificOutput: {
      hookEventName: hookEvent,
      permissionDecision: "allow",
      updatedInput: { ...toolInput, prompt: newPrompt }
    }
  };
}
function main() {
  if (hooksDisabled()) process.exit(0);
  const input = readStdinJson();
  if (!input) process.exit(0);
  const toolName = input.tool_name || "";
  if (toolName === "apply_patch") {
    const projectDir2 = getProjectDir(input);
    const taskDir2 = resolveActiveTask(projectDir2);
    if (taskDir2) {
      const taskJsonPath = join2(projectDir2, taskDir2, "task.json");
      const raw = readFileOrNull(taskJsonPath);
      if (raw) {
        try {
          const task = JSON.parse(raw);
          const phase = task.phase || "";
          const profile = typeof task.profile === "string" && task.profile !== "full" ? task.profile : void 0;
          if ((phase === "brainstorm" || phase === "plan") && !profile) {
            const patchInput = input.tool_input?.input ?? input.input ?? "";
            const patchStr = String(patchInput);
            const filePaths = [
              ...patchStr.matchAll(
                /\*\*\*\s+(?:Add|Update|Delete)\s+File:\s*(.+)/g
              )
            ].map((m) => m[1].trim());
            const srcFiles = filePaths.filter(
              (f) => !f.startsWith(".superharness/")
            );
            if (srcFiles.length > 0) {
              const hookEvent2 = input.hook_event_name || "PreToolUse";
              const warning = [
                `[PHASE GATE] \u26A0\uFE0F You are modifying source files (${srcFiles.join(", ")}) while still in "${phase}" phase.`,
                'Writing implementation code is NOT allowed until phase reaches "implement".',
                "Complete the current phase first: brainstorm (design approval) \u2192 plan (implementation plan) \u2192 implement (code).",
                "",
                "If you believe this is an error, check task.json phase field."
              ].join("\n");
              process.stdout.write(
                JSON.stringify({
                  hookSpecificOutput: {
                    hookEventName: hookEvent2,
                    additionalContext: warning
                  }
                })
              );
              process.exit(0);
            }
          }
        } catch {
        }
      }
    }
    process.exit(0);
  }
  if (toolName !== "Task" && toolName !== "Agent") {
    process.exit(0);
  }
  const toolInput = input.tool_input || {};
  const subagentType = toolInput.subagent_type || "";
  const originalPrompt = toolInput.prompt || "";
  const projectDir = getProjectDir(input);
  if (!AGENTS_ALL.includes(subagentType)) {
    process.exit(0);
  }
  const taskDir = resolveActiveTask(projectDir);
  if (AGENTS_REQUIRE_TASK.includes(
    subagentType
  )) {
    if (!taskDir || !existsSync(join2(projectDir, taskDir))) {
      process.exit(0);
    }
    updatePhase(projectDir, taskDir, subagentType);
    writeDispatchTrace({
      projectDir,
      taskDir,
      subagentType,
      prompt: originalPrompt
    });
    const gateMessage = checkPhaseGate(projectDir, taskDir, subagentType);
    if (gateMessage) {
      const hookEvent2 = input.hook_event_name || "PreToolUse";
      const output2 = buildOutput(hookEvent2, toolInput, gateMessage);
      process.stdout.write(JSON.stringify(output2));
      process.exit(0);
    }
  }
  let context = "";
  switch (subagentType) {
    case "implement":
    case "check":
    case "task-reviewer":
    case "debug":
      if (taskDir)
        context = buildPointerContext(projectDir, taskDir, subagentType);
      break;
    case "research":
      context = buildResearchContext(projectDir);
      break;
  }
  if (!context) {
    process.exit(0);
  }
  const newPrompt = buildPrompt(originalPrompt, adaptForPlatform(context));
  const hookEvent = input.hook_event_name || "PreToolUse";
  const output = buildOutput(hookEvent, toolInput, newPrompt);
  process.stdout.write(JSON.stringify(output));
  process.exit(0);
}
if (process.env.VITEST !== "true") {
  main();
}
export {
  buildOutput,
  buildPointerContext,
  checkPhaseGate,
  writeDispatchTrace
};
//# sourceMappingURL=pre-tool-use.js.map