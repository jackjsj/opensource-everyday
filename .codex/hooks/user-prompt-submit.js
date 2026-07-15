// src/hooks/user-prompt-submit.ts
import { execSync } from "child_process";
import { existsSync, readFileSync as readFileSync2, readdirSync as readdirSync2 } from "fs";
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

// src/hooks/user-prompt-submit.ts
function readJson(path) {
  try {
    return JSON.parse(readFileSync2(path, "utf-8"));
  } catch {
    return null;
  }
}
var MAX_BLOCK_LENGTH = 2e3;
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function matchStateBlock(workflowMd, key) {
  const m = workflowMd.match(
    new RegExp(
      String.raw`<!--\s*\[workflow-state:${escapeRegex(key)}\]([\s\S]*?)-->`
    )
  );
  if (!m) return "";
  const block = m[1].trim();
  if (block.length > MAX_BLOCK_LENGTH) {
    return `${block.slice(0, MAX_BLOCK_LENGTH)}
[...truncated]`;
  }
  return block;
}
function extractStateBlock(workflowMd, phase, profile) {
  if (profile && profile !== "full") {
    const block = matchStateBlock(workflowMd, `${phase}@${profile}`);
    if (block) return block;
  }
  return matchStateBlock(workflowMd, phase);
}
function buildBreadcrumb(projectDir) {
  const taskDir = resolveActiveTask(projectDir);
  if (!taskDir) return "";
  const task = readJson(join2(projectDir, taskDir, "task.json"));
  if (!task || task.status === "completed" || !task.phase) return "";
  const profile = typeof task.profile === "string" ? task.profile : void 0;
  const lines = [];
  const workflowPath = join2(projectDir, ".superharness", "workflow.md");
  if (existsSync(workflowPath)) {
    const block = extractStateBlock(
      readFileSync2(workflowPath, "utf-8"),
      task.phase,
      profile
    );
    if (block) {
      const profileTag = profile && profile !== "full" ? ` [${profile}]` : "";
      lines.push(
        `[superharness workflow-state] Phase: ${task.phase}${profileTag}`
      );
      if (task.sprint) {
        lines.push(
          `Sprint: ${task.sprint.current ?? "?"}/${task.sprint.total ?? "?"}`
        );
      }
      lines.push(block);
    }
  }
  if (task.phase === "plan" && (!profile || profile === "full")) {
    const planExists = existsSync(join2(projectDir, taskDir, "plan.md"));
    const e2eCasesExists = existsSync(
      join2(projectDir, taskDir, "e2e-cases.yaml")
    );
    if (planExists && !e2eCasesExists) {
      lines.push(
        "[GATE CHECK] \u26A0\uFE0F plan.md \u5DF2\u5B58\u5728\u4F46 e2e-cases.yaml \u4E0D\u5B58\u5728\u3002\u4F60\u662F\u5426\u5DF2\u8C03\u7528 superharness:e2e-gen\uFF1F\u5982\u679C\u6CA1\u6709\uFF0C\u4F60\u5FC5\u987B\u73B0\u5728\u8C03\u7528\u3002e2e-gen \u7684\u8C03\u7528\u662F\u65E0\u6761\u4EF6\u7684\u2014\u2014\u5373\u4F7F\u4F60\u8BA4\u4E3A\u9879\u76EE\u4E0D\u9700\u8981 E2E\uFF0C\u5224\u65AD\u6743\u4E5F\u5728 skill \u5185\u90E8\u800C\u975E\u4F60\u3002\u8DF3\u8FC7\u6B64\u6B65\u9AA4\u5C06\u5BFC\u81F4\u4EFB\u52A1\u5931\u8D25\u3002"
      );
    }
  }
  if (task.phase === "complete" && (!profile || profile === "full")) {
    const e2eCasesPath = join2(projectDir, taskDir, "e2e-cases.yaml");
    if (existsSync(e2eCasesPath)) {
      const evalsDir = join2(projectDir, taskDir, "evals");
      let qaCompleted = false;
      if (existsSync(evalsDir)) {
        try {
          for (const entry of readdirSync2(evalsDir)) {
            if (existsSync(join2(evalsDir, entry, "qa-issues.json"))) {
              qaCompleted = true;
              break;
            }
          }
        } catch {
        }
      }
      if (!qaCompleted) {
        lines.push(
          '[GATE CHECK] \u26A0\uFE0F e2e-cases.yaml \u5B58\u5728\u4F46 QA \u5C1A\u672A\u5B8C\u6210\uFF08\u672A\u627E\u5230 qa-issues.json\uFF09\u3002\u6267\u884C finishing-a-development-branch \u65F6\uFF0C\u4F60\u5FC5\u987B\u6267\u884C Step 5\uFF08E2E Status Check\uFF09\u5E76\u5728\u9009\u9879\u83DC\u5355\u4E2D\u5305\u542B "Run QA verification" \u4F5C\u4E3A\u7B2C\u4E00\u9009\u9879\u3002\u4E0D\u5F97\u8DF3\u8FC7\u6B64\u6B65\u9AA4\u3002'
        );
      }
    }
  }
  if ((task.phase === "brainstorm" || task.phase === "plan") && (!profile || profile === "full")) {
    try {
      const dirty = execSync("git diff --name-only", {
        cwd: projectDir,
        encoding: "utf-8",
        timeout: 3e3
      }).trim();
      if (dirty) {
        const srcDirty = dirty.split("\n").filter((f) => !f.startsWith(".superharness/"));
        if (srcDirty.length > 0) {
          lines.push(
            `[PHASE VIOLATION] \u26A0\uFE0F Source files modified while still in "${task.phase}" phase: ${srcDirty.slice(0, 3).join(", ")}${srcDirty.length > 3 ? ` (+${srcDirty.length - 3} more)` : ""}. You MUST NOT write implementation code until phase reaches "implement". Revert these changes and complete the current phase first (brainstorm \u2192 plan \u2192 implement).`
          );
        }
      }
    } catch {
    }
  }
  const pending = readJson(
    join2(projectDir, taskDir, "pending-verification.json")
  );
  if (pending?.failures?.length) {
    lines.push(
      `\u6CE8\u610F: \u4E0A\u8F6E\u9A8C\u8BC1\u672A\u901A\u8FC7 \u2014 ${pending.failures.join("; ")}\u3002\u4FEE\u590D\u5E76\u91CD\u8DD1\u9A8C\u8BC1\u540E\u624D\u80FD\u63A8\u8FDB\u3002`
    );
  }
  return lines.join("\n");
}
var USER_PROMPT_DETAIL_LENGTH = 200;
function writeUserPromptTrace(projectDir, userPrompt) {
  if (!userPrompt.trim()) return;
  const taskDir = resolveActiveTask(projectDir);
  if (!taskDir) return;
  const task = readJson(join2(projectDir, taskDir, "task.json"));
  if (!task || task.status === "completed") return;
  writeTrace({
    projectDir,
    taskDir,
    phase: task.phase || "unknown",
    event: "user:prompt",
    detail: userPrompt.trim().slice(0, USER_PROMPT_DETAIL_LENGTH),
    // full 与缺失（含非 string 的脏值）一律不落键，与 pre-tool-use 的 readTaskProfile 对齐
    profile: typeof task.profile === "string" && task.profile !== "full" ? task.profile : void 0
  });
}
function buildOutput(breadcrumb) {
  return {
    hookSpecificOutput: {
      hookEventName: "UserPromptSubmit",
      additionalContext: breadcrumb
    }
  };
}
function main() {
  try {
    if (hooksDisabled()) process.exit(0);
    const input = readStdinJson();
    if (!input) process.exit(0);
    writeUserPromptTrace(getProjectDir(input), input.prompt || "");
    const breadcrumb = buildBreadcrumb(getProjectDir(input));
    if (!breadcrumb) process.exit(0);
    process.stdout.write(
      JSON.stringify(buildOutput(adaptForPlatform(breadcrumb)))
    );
  } catch {
    process.exit(0);
  }
}
if (process.env.VITEST !== "true") {
  main();
}
export {
  buildBreadcrumb,
  buildOutput,
  writeUserPromptTrace
};
//# sourceMappingURL=user-prompt-submit.js.map