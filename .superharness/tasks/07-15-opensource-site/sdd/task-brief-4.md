# Task 4: Report Detail Page — TOC + RatingBar

## Context

Tasks 1-3 are complete. The project has Astro 5, global CSS, BaseLayout, Header, content collection schema, a sample Redis report, and a homepage that lists reports with tag filter. ReportCard links to `/opensource-everyday/reports/{id}/` using `import.meta.env.BASE_URL`.

This task creates the report detail page that renders the full report content with a table of contents sidebar and rating bar visualizations.

## Global Constraints (from plan.md)

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`
- All reports are Markdown files in `src/content/reports/`
- Site base path is `/opensource-everyday`
- Report content sections 1-7 are Markdown; section 8 (评分) is auto-rendered from frontmatter `ratings` via RatingBar component

## Files to Create

- `src/layouts/ReportLayout.astro`
- `src/components/RatingBar.astro`
- `src/components/TableOfContents.astro`
- `src/pages/reports/[slug].astro`
- Modify: `scripts/check.mjs` (add Task 4 checks)

## Implementation Details

### src/layouts/ReportLayout.astro

```astro
---
import '../styles/global.css';
import Header from '../components/Header.astro';

interface Props {
  title: string;
  description?: string;
}

const { title, description } = Astro.props;
---

<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="description" content={description || '每天一个开源项目调研报告'} />
  <title>{title} — 每天一个开源项目</title>
</head>
<body>
  <Header />
  <main class="report-container">
    <slot />
  </main>
</body>
</html>
```

### src/components/RatingBar.astro

```astro
---
interface Props {
  label: string;
  value: number;
}

const { label, value } = Astro.props;
const percentage = value * 10;
---

<div class="rating-bar">
  <span class="rating-label">{label}</span>
  <div class="bar-track">
    <div class="bar-fill" style={`width: ${percentage}%`}></div>
  </div>
  <span class="rating-value">{value}/10</span>
</div>
```

### src/components/TableOfContents.astro

```astro
---
interface Props {
  headings: { depth: number; slug: string; text: string }[];
}

const { headings } = Astro.props;
const tocItems = headings.filter(h => h.depth >= 2 && h.depth <= 3);
---

<nav class="toc" id="toc">
  <ul>
    {tocItems.map(item => (
      <li class={`toc-level-${item.depth}`}>
        <a href={`#${item.slug}`} class="toc-link" data-slug={item.slug}>{item.text}</a>
      </li>
    ))}
  </ul>
</nav>

<script>
  const links = document.querySelectorAll('.toc-link');
  const headings = document.querySelectorAll('h2, h3');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const id = entry.target.id;
        const link = document.querySelector(`.toc-link[data-slug="${id}"]`);
        if (entry.isIntersecting && link) {
          links.forEach(l => l.classList.remove('active'));
          link.classList.add('active');
        }
      });
    },
    { rootMargin: '0% 0% -80% 0%' }
  );

  headings.forEach(h => observer.observe(h));
</script>
```

### src/pages/reports/[slug].astro

IMPORTANT CORRECTION from plan.md: The `render()` function only returns headings from Markdown content. The "评分" section (section 8) is rendered by the Astro template, not the Markdown. So the "评分" heading will NOT be in the `headings` array. You must manually add it to the headings array passed to TableOfContents.

Also: all internal links in the detail page must use `import.meta.env.BASE_URL` as prefix (same pattern as ReportCard in Task 3). The TableOfContents `href` attributes for `#slug` anchors do NOT need the base prefix (they're same-page anchors).

```astro
---
import { getCollection, render } from 'astro:content';
import ReportLayout from '../../layouts/ReportLayout.astro';
import TableOfContents from '../../components/TableOfContents.astro';
import RatingBar from '../../components/RatingBar.astro';

export async function getStaticPaths() {
  const reports = await getCollection('reports');
  return reports.map(report => ({
    params: { slug: report.id },
    props: { report },
  }));
}

const { report } = Astro.props;
const { Content, headings } = await render(report);
const { title, description, date, tags, githubUrl, language, license, stars, ratings } = report.data;

// Add the "评分" heading manually — it's rendered by the template, not the Markdown
const allHeadings = [...headings, { depth: 2, slug: 'ping-fen', text: '评分' }];
---

<ReportLayout title={title} description={description}>
  <div class="report-detail">
    <aside class="report-sidebar">
      <TableOfContents headings={allHeadings} />
    </aside>

    <article class="report-content">
      <h1>{title}</h1>

      <div class="project-info">
        <span>语言: {language}</span>
        <span>License: {license}</span>
        <span>Stars: {stars.toLocaleString()}</span>
        <a href={githubUrl}>GitHub</a>
      </div>

      <Content />

      <div class="ratings-section">
        <h2 id="ping-fen">评分</h2>
        <RatingBar label="活跃度" value={ratings.activity} />
        <RatingBar label="文档质量" value={ratings.documentation} />
        <RatingBar label="上手难度" value={ratings.easeOfUse} />
        <RatingBar label="社区活跃度" value={ratings.community} />
        <RatingBar label="综合评分" value={ratings.overall} />
      </div>
    </article>
  </div>
</ReportLayout>
```

### scripts/check.mjs additions

Add these checks before the final `console.log` line:

```js
// Task 4 checks
test('report detail page exists', () => {
  const html = readPage('reports/redis/index.html');
  assertIncludes(html, 'Redis', 'detail page should have project title');
  assertIncludes(html, '项目概览', 'missing overview section');
  assertIncludes(html, '核心功能', 'missing core features section');
  assertIncludes(html, '技术架构', 'missing tech architecture section');
  assertIncludes(html, '快速上手', 'missing quick start section');
  assertIncludes(html, '生态与社区', 'missing ecosystem section');
  assertIncludes(html, '适用场景', 'missing use cases section');
  assertIncludes(html, '优缺点总结', 'missing pros/cons section');
  assertIncludes(html, '评分', 'missing ratings section');
  assertIncludes(html, 'toc-link', 'missing TOC links');
  assertIncludes(html, 'bar-fill', 'missing rating bars');
  assertIncludes(html, 'BSD-3-Clause', 'missing license info');
});
```

## Test Steps

1. Run `npm run build`
2. Run `npm test` — all checks should PASS

## Commit

```bash
git add -A
git commit -m "feat: report detail page with TOC and rating bars"
```
