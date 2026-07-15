# Task 7: Leaderboard Page

## Context

Tasks 1-6 are complete. The project has Astro 5 with homepage, report detail page, search, categories, content collection, and all components. This task adds a rating leaderboard page with dimension switching.

## Global Constraints (from plan.md)

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`
- Site base path is `/opensource-everyday`

## Files to Create

- `src/pages/leaderboard.astro`
- Modify: `scripts/check.mjs` (add Task 7 checks)

## Implementation Details

### src/pages/leaderboard.astro

IMPORTANT CORRECTIONS from plan.md:
1. Data attributes must be all lowercase — use `data-easeofuse` (not `data-easeOfUse`) consistently in both the template and the script
2. Report links in the table must use `import.meta.env.BASE_URL` prefix (same pattern as ReportCard in Task 3)
3. The script must use `data-easeofuse` (lowercase) when reading the attribute for the easeOfUse dimension

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const reports = await getCollection('reports');

const dimensions = [
  { key: 'overall', label: '综合' },
  { key: 'activity', label: '活跃度' },
  { key: 'documentation', label: '文档质量' },
  { key: 'easeofuse', label: '上手难度' },
  { key: 'community', label: '社区活跃度' },
];

// Default sort by overall
const sorted = [...reports].sort(
  (a, b) => b.data.ratings.overall - a.data.ratings.overall
);
---

<BaseLayout title="排行榜 — 每天一个开源项目">
  <div class="leaderboard-page">
    <h1>评分排行榜</h1>

    <div class="dimension-tabs" id="dim-tabs">
      {dimensions.map((dim, i) => (
        <button class={`dim-tab ${i === 0 ? 'active' : ''}`} data-key={dim.key}>{dim.label}</button>
      ))}
    </div>

    <table class="leaderboard-table" id="leaderboard-table">
      <thead>
        <tr>
          <th>排名</th>
          <th>项目</th>
          <th>评分</th>
          <th>日期</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((report, i) => (
          <tr
            data-overall={report.data.ratings.overall}
            data-activity={report.data.ratings.activity}
            data-documentation={report.data.ratings.documentation}
            data-easeofuse={report.data.ratings.easeOfUse}
            data-community={report.data.ratings.community}
          >
            <td class={`rank ${i === 0 ? 'rank-1' : ''}`}>{i + 1}</td>
            <td><a href={`${import.meta.env.BASE_URL}/reports/${report.id}/`}>{report.data.title}</a></td>
            <td>{report.data.ratings.overall}</td>
            <td>{report.data.date}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>

  <script>
    const tabs = document.querySelectorAll('.dim-tab');
    const tbody = document.querySelector('#leaderboard-table tbody');
    const rows = tbody ? Array.from(tbody.querySelectorAll('tr')) : [];

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const key = tab.getAttribute('data-key');

        rows.sort((a, b) => {
          const aVal = Number(a.getAttribute('data-' + key));
          const bVal = Number(b.getAttribute('data-' + key));
          return bVal - aVal;
        });

        rows.forEach((row, i) => {
          const rankCell = row.querySelector('.rank');
          rankCell.textContent = String(i + 1);
          rankCell.classList.toggle('rank-1', i === 0);
          const scoreCell = row.querySelectorAll('td')[2];
          scoreCell.textContent = row.getAttribute('data-' + key);
          tbody.appendChild(row);
        });
      });
    });
  </script>
</BaseLayout>
```

### scripts/check.mjs additions

Add these checks before the final `console.log` line:

```js
// Task 7 checks
test('leaderboard page exists', () => {
  const html = readPage('leaderboard/index.html');
  assertIncludes(html, 'leaderboard-table', 'missing leaderboard table');
  assertIncludes(html, 'dim-tab', 'missing dimension tabs');
  assertIncludes(html, 'Redis', 'missing Redis entry');
  assertIncludes(html, '综合', 'missing overall dimension tab');
});
```

## Test Steps

1. Run `npm run build`
2. Run `npm test` — all checks should PASS

## Commit

```bash
git add -A
git commit -m "feat: leaderboard page with dimension switching"
```
