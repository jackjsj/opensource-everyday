// src/hooks/session-start.ts
import { existsSync, readFileSync as readFileSync2, readdirSync as readdirSync2, statSync } from "fs";
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

// src/hooks/session-start.ts
function getProjectDir() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}
function readFileOrNull(path) {
  try {
    return readFileSync2(path, "utf-8");
  } catch {
    return null;
  }
}
function collectIndexFiles(specDir) {
  const results = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync2(dir)) {
      const fullPath = join2(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (entry === "index.md") {
        results.push(fullPath);
      }
    }
  }
  walk(specDir);
  return results;
}
var GUIDE_MAX_LINES = 40;
function stripFrontmatter(content) {
  const lines = content.split("\n");
  if (lines[0] !== "---") return content;
  const end = lines.indexOf("---", 1);
  if (end === -1) return content;
  return lines.slice(end + 1).join("\n");
}
function findGuideCutLine(lines) {
  const initialCut = Math.min(GUIDE_MAX_LINES, lines.length);
  for (let i = initialCut - 1; i > 0; i--) {
    if (lines[i]?.trim() === "") return i;
  }
  return initialCut;
}
function slimGuide(content) {
  const body = stripFrontmatter(content);
  const lines = body.split("\n");
  if (lines.length <= GUIDE_MAX_LINES) return body;
  const cutLine = findGuideCutLine(lines);
  return `${lines.slice(0, cutLine).join("\n")}
[Full guide truncated \u2014 read the superharness:using-superharness skill via the Skill tool for the complete guide.]`;
}
function buildContext(projectDir) {
  const shDir = join2(projectDir, ".superharness");
  if (!existsSync(shDir)) return "";
  const sections = [];
  const usingSuperharness = readFileOrNull(
    join2(shDir, "using-superharness.md")
  );
  if (usingSuperharness) {
    sections.push(
      `<EXTREMELY_IMPORTANT>
You have superharness.

Below is the content of your 'using-superharness' skill \u2014 your guide to using skills. For all other skills, use the Skill tool:

${slimGuide(usingSuperharness)}
</EXTREMELY_IMPORTANT>`
    );
  }
  const specDir = join2(shDir, "spec");
  if (existsSync(specDir)) {
    const indexFiles = collectIndexFiles(specDir);
    if (indexFiles.length > 0) {
      const guidelines = indexFiles.map((f) => {
        const relativePath = f.replace(`${shDir}/`, "");
        const content = readFileOrNull(f);
        return content ? `### ${relativePath}
${content}` : null;
      }).filter(Boolean).join("\n\n");
      if (guidelines) {
        sections.push(`<guidelines>
${guidelines}
</guidelines>`);
      }
    }
  }
  if (!process.env.CLAUDE_PROJECT_DIR) {
    sections.push(
      "<workflow-note>\n\u672C\u5E73\u53F0\u65E0\u6BCF\u56DE\u5408\u9762\u5305\u5C51\u6CE8\u5165\u3002\u63A8\u8FDB\u4EFB\u52A1\u9636\u6BB5\u524D\uFF0C\u81EA\u884C\u8BFB\u53D6 .superharness/workflow.md \u4E2D\u4E0E task.json phase \u5BF9\u5E94\u7684 [workflow-state:{phase}] \u5757\u5E76\u9075\u5FAA\u5176 [required] \u9879\u3002\n</workflow-note>"
    );
  }
  return sections.join("\n\n");
}
function buildOutput(context) {
  return {
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: context
    }
  };
}
function main() {
  if (hooksDisabled()) process.exit(0);
  if (process.env.CLAUDE_NON_INTERACTIVE === "1") {
    process.exit(0);
  }
  const projectDir = getProjectDir();
  const context = buildContext(projectDir);
  if (!context) {
    process.exit(0);
  }
  process.stdout.write(JSON.stringify(buildOutput(adaptForPlatform(context))));
}
if (process.env.VITEST !== "true") {
  main();
}
export {
  buildContext,
  buildOutput,
  slimGuide
};
//# sourceMappingURL=session-start.js.map