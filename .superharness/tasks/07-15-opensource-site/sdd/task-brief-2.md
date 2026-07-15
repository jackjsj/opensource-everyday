# Task 2: Content Collection + Sample Report

## Context

This is Task 2 of the "每天一个开源项目" Astro static site. Task 1 is complete — the project is scaffolded with Astro 5, global CSS, BaseLayout, Header, and a minimal index page. The project builds and tests pass.

This task adds the content collection schema (so Astro can validate report frontmatter) and a sample report about Redis. These will be used by Task 3 (homepage) and Task 4 (detail page).

## Global Constraints (from plan.md)

- All reports are Markdown files in `src/content/reports/`, frontmatter must match schema in `src/content.config.ts`
- Report content sections 1-7 are Markdown; section 8 (评分) is auto-rendered from frontmatter `ratings` via RatingBar component
- No external runtime dependencies beyond Astro and Pagefind

## Files to Create

- `src/content.config.ts`
- `src/content/reports/redis.md`

## Implementation Details

### src/content.config.ts

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const reports = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/reports' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    tags: z.array(z.string()),
    githubUrl: z.string().url(),
    language: z.string(),
    license: z.string(),
    stars: z.number(),
    ratings: z.object({
      activity: z.number(),
      documentation: z.number(),
      easeOfUse: z.number(),
      community: z.number(),
      overall: z.number(),
    }),
  }),
});

export const collections = { reports };
```

### src/content/reports/redis.md

The complete Redis report Markdown file. See plan.md Task 2 Step 4 for the complete content. It contains:
- Frontmatter: title, description, date "2026-07-15", tags ["database", "caching", "in-memory"], githubUrl, language "C", license "BSD-3-Clause", stars 67000, ratings (activity 10, documentation 9, easeOfUse 8, community 10, overall 9)
- 7 content sections (## headings): 项目概览, 核心功能, 技术架构, 快速上手, 生态与社区, 适用场景, 优缺点总结
- The 8th section (评分) is NOT in the Markdown — it will be auto-rendered by the detail page in Task 4

Read plan.md Task 2 Step 4 and copy the complete redis.md content verbatim.

## Test Steps

Add these checks to `scripts/check.mjs` before the final `console.log` line:

```js
// Task 2 checks
test('content collection builds without error', () => {
  const html = readPage('index.html');
  assertIncludes(html, '<html', 'build should succeed with content config');
});
```

Then:
1. Run `npm run build` — should succeed (content collection schema is valid)
2. Run `npm test` — all checks should PASS (Task 1 + Task 2)

## Commit

```bash
git add -A
git commit -m "feat: content collection schema and sample Redis report"
```
