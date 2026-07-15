# Task 6: Categories Archive Page

## Context

Tasks 1-5 are complete. The project has Astro 5 with homepage, report detail page, search, content collection, and all components. This task adds a categories page that groups reports by tags.

## Global Constraints (from plan.md)

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`
- All reports are Markdown files in `src/content/reports/`

## Files to Create

- `src/pages/categories.astro`
- Modify: `scripts/check.mjs` (add Task 6 checks)

## Implementation Details

### src/pages/categories.astro

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import ReportCard from '../components/ReportCard.astro';

const reports = await getCollection('reports');

// Group reports by tag
const tagMap = new Map<string, typeof reports>();
for (const report of reports) {
  for (const tag of report.data.tags) {
    if (!tagMap.has(tag)) tagMap.set(tag, []);
    tagMap.get(tag)!.push(report);
  }
}

// Sort tags alphabetically
const sortedTags = [...tagMap.keys()].sort();
---

<BaseLayout title="分类 — 每天一个开源项目">
  <div class="categories-page">
    <h1>分类归档</h1>
    {sortedTags.map(tag => (
      <section class="category-group">
        <h2>{tag}</h2>
        <div class="report-grid">
          {tagMap.get(tag)!.map(report => (
            <ReportCard report={report} />
          ))}
        </div>
      </section>
    ))}
  </div>
</BaseLayout>
```

### scripts/check.mjs additions

Add these checks before the final `console.log` line:

```js
// Task 6 checks
test('categories page exists', () => {
  const html = readPage('categories/index.html');
  assertIncludes(html, 'database', 'missing database category');
  assertIncludes(html, 'Redis', 'missing Redis under a category');
  assertIncludes(html, 'category-group', 'missing category group');
});
```

## Test Steps

1. Run `npm run build`
2. Run `npm test` — all checks should PASS

## Commit

```bash
git add -A
git commit -m "feat: categories archive page grouped by tags"
```
