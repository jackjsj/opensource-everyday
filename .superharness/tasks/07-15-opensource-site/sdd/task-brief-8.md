# Task 8: About Page + GitHub Actions Deploy

## Context

Tasks 1-7 are complete. The project has all 5 pages (homepage, detail, search, categories, leaderboard), content collection, and components. This is the final task — adding the about page and GitHub Actions deployment workflow.

## Global Constraints (from plan.md)

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`
- Site base path is `/opensource-everyday`

## Files to Create

- `src/pages/about.astro`
- `.github/workflows/deploy.yml`
- Modify: `scripts/check.mjs` (add Task 8 checks)

## Implementation Details

### src/pages/about.astro

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="关于 — 每天一个开源项目">
  <div class="about-page">
    <h1>关于</h1>

    <h2>站点目的</h2>
    <p>每天一个开源项目是一个开源项目调研报告集合站。每份报告系统化地分析一个开源项目的功能、架构、生态和适用场景，帮助开发者快速了解和评估开源项目。</p>

    <h2>如何使用</h2>
    <p>在首页浏览所有报告，按标签筛选感兴趣的项目。使用搜索功能通过关键词查找报告。分类页按技术领域归档，排行榜页按评分维度排序。</p>
    <p>每份报告页面可直接分享链接给同事或朋友。</p>

    <h2>报告生成流程</h2>
    <p>1. 提出一个开源项目名称</p>
    <p>2. AI 完成调研，生成结构化报告</p>
    <p>3. 报告添加到站点并自动部署上线</p>
    <p>4. 可在站点查阅和分享</p>
  </div>
</BaseLayout>
```

### .github/workflows/deploy.yml

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v5
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

### scripts/check.mjs additions

Add these checks before the final `console.log` line. Note: the existing `readFileSync` import at the top of check.mjs is sufficient — do NOT add another import.

```js
// Task 8 checks
test('about page exists', () => {
  const html = readPage('about/index.html');
  assertIncludes(html, '每天一个开源项目', 'about page should mention site name');
  assertIncludes(html, '调研', 'about page should mention research');
});

test('deploy workflow exists', () => {
  const content = readFileSync('.github/workflows/deploy.yml', 'utf-8');
  assertIncludes(content, 'github-pages', 'missing pages deployment');
  assertIncludes(content, 'npm run build', 'missing build step');
  assertIncludes(content, 'actions/upload-pages-artifact', 'missing artifact upload');
});
```

## Test Steps

1. Run `npm run build`
2. Run `npm test` — all checks should PASS (8 tasks worth of checks)

## Commit

```bash
git add -A
git commit -m "feat: about page and GitHub Pages deploy workflow"
```
