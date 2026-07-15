# Task 3: Homepage — Report List + Tag Filter

## Context

Task 1 and Task 2 are complete. The project has Astro 5 scaffolded, global CSS with Supabase design tokens, BaseLayout, Header, content collection schema, and a sample Redis report. The current `src/pages/index.astro` is a minimal placeholder — this task replaces it with the full homepage.

## Global Constraints (from plan.md)

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`
- All reports are Markdown files in `src/content/reports/`
- Site base path is `/opensource-everyday`

## Files to Create/Modify

- Modify: `src/pages/index.astro` (replace placeholder with full homepage)
- Create: `src/components/ReportCard.astro`
- Create: `src/components/TagFilter.astro`
- Modify: `scripts/check.mjs` (add Task 3 checks)

## Implementation Details

### src/components/ReportCard.astro

```astro
---
import type { CollectionEntry } from 'astro:content';

interface Props {
  report: CollectionEntry<'reports'>;
}

const { report } = Astro.props;
const { title, description, date, tags, ratings } = report.data;
---

<a href={`/reports/${report.id}/`} class="report-card">
  <div class="card-header">
    <h3>{title}</h3>
    <span class="rating-badge">{ratings.overall}</span>
  </div>
  <p class="card-desc">{description}</p>
  <div class="card-footer">
    <span class="date">{date}</span>
    <div class="tags">
      {tags.map(tag => <span class="tag">{tag}</span>)}
    </div>
  </div>
</a>
```

### src/components/TagFilter.astro

```astro
---
interface Props {
  tags: string[];
}

const { tags } = Astro.props;
---

<div class="tag-filter" id="tag-filter">
  <button class="tag-btn active" data-tag="all">全部</button>
  {tags.map(tag => (
    <button class="tag-btn" data-tag={tag}>{tag}</button>
  ))}
</div>

<script>
  const buttons = document.querySelectorAll('.tag-btn');
  const cards = document.querySelectorAll('.report-card-wrapper');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tag = btn.getAttribute('data-tag');
      cards.forEach(card => {
        const cardTags = card.getAttribute('data-tags') || '';
        if (tag === 'all' || cardTags.includes(tag)) {
          (card as HTMLElement).style.display = '';
        } else {
          (card as HTMLElement).style.display = 'none';
        }
      });
    });
  });
</script>
```

### src/pages/index.astro (replace existing content)

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import ReportCard from '../components/ReportCard.astro';
import TagFilter from '../components/TagFilter.astro';

const reports = (await getCollection('reports')).sort(
  (a, b) => b.data.date.localeCompare(a.data.date)
);

const allTags = [...new Set(reports.flatMap(r => r.data.tags))].sort();
---

<BaseLayout title="每天一个开源项目">
  <section class="hero">
    <h1>每天一个开源项目</h1>
    <p>开源项目调研报告集合站</p>
  </section>

  <TagFilter tags={allTags} />

  <div class="report-grid">
    {reports.map(report => (
      <div class="report-card-wrapper" data-tags={report.data.tags.join(',')}>
        <ReportCard report={report} />
      </div>
    ))}
  </div>
</BaseLayout>
```

### scripts/check.mjs additions

Add these checks before the final `console.log` line:

```js
// Task 3 checks
test('homepage lists reports', () => {
  const html = readPage('index.html');
  assertIncludes(html, 'Redis', 'homepage should list Redis report');
  assertIncludes(html, 'report-card', 'missing report card class');
  assertIncludes(html, 'tag-btn', 'missing tag filter buttons');
  assertIncludes(html, 'database', 'missing database tag');
});
```

## Test Steps

1. Run `npm run build`
2. Run `npm test` — all checks should PASS (Task 1 + Task 2 + Task 3)

## Commit

```bash
git add -A
git commit -m "feat: homepage with report list and tag filter"
```
