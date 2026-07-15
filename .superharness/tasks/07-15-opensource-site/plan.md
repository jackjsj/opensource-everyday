# 每天一个开源项目 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superharness-subagent-driven-development (recommended) or superharness-executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static site that collects and displays open-source project research reports, with browsing, search, category archive, and rating leaderboard.

**Architecture:** Astro static site generator with Content Collections for Markdown reports. Supabase DESIGN.md design system mapped to CSS variables. Pagefind for client-side full-text search. GitHub Pages deployment via GitHub Actions.

**Tech Stack:** Astro 5, Pagefind, GitHub Pages, GitHub Actions

## Global Constraints

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`, sourced from Supabase DESIGN.md tokens
- All reports are Markdown files in `src/content/reports/`, frontmatter must match schema in `src/content.config.ts`
- Site base path is `/opensource-everyday` for GitHub Pages project deployment
- Report content sections 1-7 are Markdown; section 8 (评分) is auto-rendered from frontmatter `ratings` via RatingBar component
- No external runtime dependencies beyond Astro and Pagefind

## File Structure

| File | Responsibility |
|------|----------------|
| `package.json` | Dependencies, scripts (build/test/dev) |
| `astro.config.mjs` | Astro config with base path |
| `tsconfig.json` | TypeScript config |
| `DESIGN.md` | Supabase design spec (copied from awesome-design-md) |
| `scripts/check.mjs` | Build output verification script |
| `src/styles/global.css` | All CSS variables + site-wide styles |
| `src/content.config.ts` | Content collection schema (frontmatter validation) |
| `src/content/reports/redis.md` | Sample report (Redis) |
| `src/layouts/BaseLayout.astro` | Global layout (head, header, container) |
| `src/layouts/ReportLayout.astro` | Report detail layout (wider container) |
| `src/components/Header.astro` | Site navigation header |
| `src/components/ReportCard.astro` | Report list card |
| `src/components/TagFilter.astro` | Tag filter bar with client-side JS |
| `src/components/RatingBar.astro` | Rating visualization bar |
| `src/components/TableOfContents.astro` | TOC sidebar with scroll-spy |
| `src/pages/index.astro` | Homepage: report list + tag filter |
| `src/pages/reports/[slug].astro` | Report detail page |
| `src/pages/search.astro` | Pagefind search page |
| `src/pages/categories.astro` | Category archive page |
| `src/pages/leaderboard.astro` | Rating leaderboard page |
| `src/pages/about.astro` | About page |
| `.github/workflows/deploy.yml` | GitHub Pages deploy workflow |

---

### Task 1: Project Scaffolding + Design System + Base Layout + Header

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `DESIGN.md`
- Create: `scripts/check.mjs`
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/Header.astro`
- Create: `src/pages/index.astro` (minimal placeholder)

**Interfaces:**
- Produces: `BaseLayout` component (props: `title`, `description?`), `Header` component (no props), CSS variables in `global.css`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "opensource-everyday",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "node scripts/check.mjs"
  },
  "dependencies": {
    "astro": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create astro.config.mjs**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  base: '/opensource-everyday',
});
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

- [ ] **Step 4: Copy Supabase DESIGN.md**

```bash
cp /tmp/awesome-design-md/design-md/supabase/DESIGN.md DESIGN.md
```

- [ ] **Step 5: Create src/styles/global.css**

```css
:root {
  --color-primary: #3ecf8e;
  --color-primary-deep: #24b47e;
  --color-ink: #171717;
  --color-ink-secondary: #212121;
  --color-ink-mute: #707070;
  --color-ink-faint: #b2b2b2;
  --color-canvas: #ffffff;
  --color-canvas-soft: #fafafa;
  --color-canvas-night: #1c1c1c;
  --color-hairline: #dfdfdf;
  --color-hairline-strong: #c7c7c7;
  --font-sans: 'Circular', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-pill: 9999px;
  --max-width: 1200px;
  --content-width: 768px;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.55;
  color: var(--color-ink);
  background: var(--color-canvas);
  -webkit-font-smoothing: antialiased;
}

a { color: var(--color-ink); text-decoration: none; }
a:hover { color: var(--color-primary-deep); }
h1, h2, h3, h4, h5, h6 { font-weight: 500; letter-spacing: -0.02em; }

.container { max-width: var(--max-width); margin: 0 auto; padding: 0 24px; }

.site-header {
  border-bottom: 1px solid var(--color-hairline);
  position: sticky; top: 0;
  background: var(--color-canvas); z-index: 100;
}
.header-inner {
  max-width: var(--max-width); margin: 0 auto; padding: 0 24px;
  height: 64px; display: flex; align-items: center; justify-content: space-between;
}
.logo { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
.nav { display: flex; gap: 24px; }
.nav a { font-size: 14px; color: var(--color-ink-mute); }
.nav a:hover { color: var(--color-ink); }

.hero { padding: 48px 0 32px; }
.hero h1 { font-size: 48px; line-height: 1.1; letter-spacing: -0.04em; margin-bottom: 8px; }
.hero p { font-size: 18px; color: var(--color-ink-mute); }

.tag-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; }
.tag-btn {
  padding: 6px 14px; border: 1px solid var(--color-hairline);
  border-radius: var(--radius-pill); background: var(--color-canvas);
  font-size: 13px; color: var(--color-ink-mute); cursor: pointer; transition: all 0.15s;
}
.tag-btn:hover { border-color: var(--color-primary); color: var(--color-primary-deep); }
.tag-btn.active { background: var(--color-ink); color: var(--color-canvas); border-color: var(--color-ink); }

.report-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px; padding-bottom: 64px;
}
.report-card {
  display: block; padding: 24px; background: var(--color-canvas-soft);
  border: 1px solid var(--color-hairline); border-radius: var(--radius-lg);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.report-card:hover { border-color: var(--color-hairline-strong); box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
.card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px; }
.card-header h3 { font-size: 20px; font-weight: 500; }
.rating-badge {
  background: var(--color-primary); color: var(--color-ink);
  font-size: 13px; font-weight: 600; padding: 2px 8px; border-radius: var(--radius-sm);
}
.card-desc { font-size: 14px; color: var(--color-ink-mute); margin-bottom: 16px; line-height: 1.5; }
.card-footer { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--color-ink-faint); }
.tags { display: flex; gap: 6px; }
.tag { padding: 2px 8px; background: var(--color-canvas); border: 1px solid var(--color-hairline); border-radius: var(--radius-sm); font-size: 12px; }

.report-container { max-width: var(--max-width); margin: 0 auto; padding: 32px 24px 64px; }
.report-detail { display: grid; grid-template-columns: 220px 1fr; gap: 48px; }
.report-sidebar { position: sticky; top: 88px; align-self: start; max-height: calc(100vh - 120px); overflow-y: auto; }
.toc ul { list-style: none; }
.toc-level-2 { margin-bottom: 4px; }
.toc-level-3 { margin-left: 16px; margin-bottom: 4px; }
.toc-link { font-size: 13px; color: var(--color-ink-mute); display: block; padding: 2px 0; }
.toc-link.active { color: var(--color-primary-deep); font-weight: 500; }
.report-content { max-width: var(--content-width); }
.project-info {
  display: flex; gap: 16px; flex-wrap: wrap; padding: 12px 16px;
  background: var(--color-canvas-soft); border: 1px solid var(--color-hairline);
  border-radius: var(--radius-md); margin-bottom: 32px; font-size: 14px;
}
.project-info a { color: var(--color-primary-deep); font-weight: 500; }

.ratings-section { margin-top: 48px; padding-top: 32px; border-top: 1px solid var(--color-hairline); }
.rating-bar { display: grid; grid-template-columns: 100px 1fr 50px; align-items: center; gap: 16px; margin-bottom: 12px; }
.rating-label { font-size: 14px; color: var(--color-ink-mute); }
.bar-track { height: 8px; background: var(--color-canvas-soft); border-radius: var(--radius-pill); overflow: hidden; }
.bar-fill { height: 100%; background: var(--color-primary); border-radius: var(--radius-pill); transition: width 0.3s ease; }
.rating-value { font-size: 14px; font-weight: 500; text-align: right; }

.search-page { max-width: var(--content-width); margin: 0 auto; padding: 32px 24px 64px; }
#search { margin-top: 24px; }

.categories-page { max-width: var(--max-width); margin: 0 auto; padding: 32px 24px 64px; }
.category-group { margin-bottom: 40px; }
.category-group h2 { font-size: 24px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid var(--color-hairline); }
.category-group .report-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }

.leaderboard-page { max-width: var(--content-width); margin: 0 auto; padding: 32px 24px 64px; }
.dimension-tabs { display: flex; gap: 8px; margin-bottom: 24px; }
.dim-tab { padding: 8px 16px; border: 1px solid var(--color-hairline); border-radius: var(--radius-md); background: var(--color-canvas); font-size: 14px; cursor: pointer; }
.dim-tab.active { background: var(--color-ink); color: var(--color-canvas); border-color: var(--color-ink); }
.leaderboard-table { width: 100%; border-collapse: collapse; }
.leaderboard-table th { text-align: left; font-size: 13px; color: var(--color-ink-mute); padding: 8px 12px; border-bottom: 1px solid var(--color-hairline); }
.leaderboard-table td { padding: 12px; border-bottom: 1px solid var(--color-hairline); }
.rank { font-weight: 600; color: var(--color-ink-mute); }
.rank-1 { color: var(--color-primary-deep); }

.about-page { max-width: var(--content-width); margin: 0 auto; padding: 32px 24px 64px; }
.about-page h2 { font-size: 24px; margin: 32px 0 16px; }
.about-page p { margin-bottom: 12px; color: var(--color-ink-mute); }

.report-content h2 { font-size: 28px; margin: 40px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--color-hairline); }
.report-content h3 { font-size: 20px; margin: 24px 0 12px; }
.report-content p { margin-bottom: 16px; }
.report-content ul, .report-content ol { margin: 0 0 16px 20px; }
.report-content li { margin-bottom: 4px; }
.report-content code { font-family: var(--font-mono); font-size: 13px; background: var(--color-canvas-soft); padding: 2px 6px; border-radius: var(--radius-sm); }
.report-content pre { font-family: var(--font-mono); font-size: 13px; background: var(--color-canvas-night); color: #e6e6e6; padding: 16px; border-radius: var(--radius-md); overflow-x: auto; margin-bottom: 16px; }
.report-content pre code { background: none; padding: 0; }

@media (max-width: 768px) {
  .report-detail { grid-template-columns: 1fr; }
  .report-sidebar { position: static; max-height: none; }
  .hero h1 { font-size: 32px; }
}
```

- [ ] **Step 6: Create src/layouts/BaseLayout.astro**

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
  <title>{title}</title>
</head>
<body>
  <Header />
  <main class="container">
    <slot />
  </main>
</body>
</html>
```

- [ ] **Step 7: Create src/components/Header.astro**

```astro
---
const navItems = [
  { label: '首页', href: '/' },
  { label: '搜索', href: '/search' },
  { label: '分类', href: '/categories' },
  { label: '排行', href: '/leaderboard' },
  { label: '关于', href: '/about' },
];
---

<header class="site-header">
  <div class="header-inner">
    <a href="/" class="logo">每天一个开源项目</a>
    <nav class="nav">
      {navItems.map(item => (
        <a href={item.href}>{item.label}</a>
      ))}
    </nav>
  </div>
</header>
```

- [ ] **Step 8: Create minimal src/pages/index.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="每天一个开源项目">
  <section class="hero">
    <h1>每天一个开源项目</h1>
    <p>开源项目调研报告集合站</p>
  </section>
</BaseLayout>
```

- [ ] **Step 9: Create scripts/check.mjs**

```js
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
let failures = 0;

function readPage(path) {
  const filePath = join(dist, path);
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return readFileSync(filePath, 'utf-8');
}

function assertIncludes(html, sub, msg) {
  if (!html.includes(sub)) throw new Error(`${msg}: expected "${sub}"`);
}

function test(name, fn) {
  try { fn(); console.log(`  PASS: ${name}`); }
  catch (e) { failures++; console.error(`  FAIL: ${name} - ${e.message}`); }
}

// Task 1 checks
test('homepage exists', () => {
  const html = readPage('index.html');
  assertIncludes(html, '<html', 'missing html tag');
  assertIncludes(html, '--color-primary', 'missing CSS variable');
  assertIncludes(html, '每天一个开源项目', 'missing site title');
  assertIncludes(html, '首页', 'missing nav link');
});

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
```

- [ ] **Step 10: Install dependencies and run test (should fail — build not configured yet)**

Run: `npm install && npm run build && npm test`
Expected: FAIL — `dist/index.html` not found (project not built yet, or build errors)

- [ ] **Step 11: Fix any build issues, rebuild and verify test passes**

Run: `npm run build && npm test`
Expected: PASS — all Task 1 checks pass

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: project scaffolding, design system, base layout, header"
```

---

### Task 2: Content Collection + Sample Report

**Files:**
- Create: `src/content.config.ts`
- Create: `src/content/reports/redis.md`

**Interfaces:**
- Produces: `reports` content collection with schema: `{ title, description, date, tags, githubUrl, language, license, stars, ratings: { activity, documentation, easeOfUse, community, overall } }`
- Produces: sample report entry with id `redis`

- [ ] **Step 1: Write the failing test**

Add these checks to `scripts/check.mjs` before the final `console.log` line:

```js
// Task 2 checks
test('content collection builds without error', () => {
  // If the build succeeded enough to produce index.html, content config is valid
  const html = readPage('index.html');
  assertIncludes(html, '<html', 'build should succeed with content config');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test`
Expected: PASS (Task 2 checks are basic — this is a placeholder confirming no schema errors)

- [ ] **Step 3: Create src/content.config.ts**

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

- [ ] **Step 4: Create src/content/reports/redis.md**

```markdown
---
title: "Redis"
description: "高性能内存键值数据库，支持多种数据结构"
date: "2026-07-15"
tags: ["database", "caching", "in-memory"]
githubUrl: "https://github.com/redis/redis"
language: "C"
license: "BSD-3-Clause"
stars: 67000
ratings:
  activity: 10
  documentation: 9
  easeOfUse: 8
  community: 10
  overall: 9
---

## 项目概览

Redis（Remote Dictionary Server）是一个开源的、基于内存的键值数据存储，由 Salvatore Sanfilippo 于 2009 年创建。它常被用作数据库、缓存、消息队列和流处理引擎。项目使用 C 语言编写，以极高的性能著称，单实例每秒可处理十万级读写操作。

- GitHub: https://github.com/redis/redis
- 语言: C
- License: BSD-3-Clause
- Stars: 67k+

## 核心功能

Redis 不仅仅是简单的键值存储，它支持多种数据结构：

- **Strings**：二进制安全的字符串，最大 512MB
- **Hashes**：字段-值映射，适合存储对象
- **Lists**：有序字符串列表，支持从两端 push/pop
- **Sets**：无序唯一元素集合，支持交并差运算
- **Sorted Sets**：带分数的有序集合，适合排行榜场景
- **Streams**：日志型数据结构，支持消费组
- **Pub/Sub**：发布订阅消息模式
- **过期与淘汰**：可对 key 设置 TTL，支持多种淘汰策略

## 技术架构

Redis 采用单线程事件循环架构（Redis 6.0 后网络 IO 支持多线程，但命令执行仍为单线程）：

- **单线程模型**：避免锁竞争和上下文切换，简化并发处理
- **IO 多路复用**：使用 epoll/kselect 实现高并发网络连接
- **内存存储**：所有数据常驻内存，磁盘持久化为 RDB 快照和 AOF 日志
- **RESP 协议**：自定义的二进制安全文本协议，简单高效

## 快速上手

使用 Docker 启动 Redis：

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

连接并测试：

```bash
docker exec -it redis redis-cli
> SET hello world
> GET hello
"world"
> ZADD leaderboard 100 alice 200 bob
> ZREVRANGE leaderboard 0 -1 WITHSCORES
1) "bob"
2) "200"
3) "alice"
4) "100"
```

上手难度：低。基本操作直观，官方文档和交互式教程完善。

## 生态与社区

- **贡献者**：600+ 贡献者，核心维护由 Redis Ltd 团队主导
- **活跃度**：GitHub 上持续高频提交，定期发布新版本
- **主要使用者**：Twitter、GitHub、Stack Overflow、Instagram 等大型互联网公司
- **相关项目**：Redis Sentinel（哨兵高可用）、Redis Cluster（集群分片）、RedisStack（搜索/JSON/时间序列模块）

## 适用场景

**适合：**

- 缓存层（热数据加速、Session 存储）
- 排行榜/计数器（利用 Sorted Set 原子操作）
- 消息队列（List/Stream 轻量级队列）
- 实时分析（位图、HyperLogLog）

**不适合：**

- 需要复杂查询和关系运算的场景（用 SQL 数据库）
- 数据量远超内存容量的场景（内存成本高）
- 对数据持久性要求极高且不能接受秒级丢失的场景

## 优缺点总结

**优势：**

- 极致性能，单线程单实例 10 万+ QPS
- 数据结构丰富，覆盖常见业务场景
- 社区生态成熟，文档完善
- 部署简单，开箱即用

**局限：**

- 内存容量限制数据规模，成本较高
- 单线程模型不适合 CPU 密集型计算
- 事务支持有限（无回滚）
- 集群方案配置复杂度高
```

- [ ] **Step 5: Run build and verify test passes**

Run: `npm run build && npm test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: content collection schema and sample Redis report"
```

---

### Task 3: Homepage — Report List + Tag Filter

**Files:**
- Modify: `src/pages/index.astro` (replace placeholder with full homepage)
- Create: `src/components/ReportCard.astro`
- Create: `src/components/TagFilter.astro`

**Interfaces:**
- Consumes: `reports` collection from Task 2, `BaseLayout` from Task 1
- Produces: homepage at `/` with report list and tag filter

- [ ] **Step 1: Write the failing test**

Add these checks to `scripts/check.mjs` before the final `console.log` line:

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL — `Redis` not found in homepage HTML (placeholder index.astro doesn't list reports)

- [ ] **Step 3: Create src/components/ReportCard.astro**

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

- [ ] **Step 4: Create src/components/TagFilter.astro**

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

- [ ] **Step 5: Replace src/pages/index.astro with full homepage**

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

- [ ] **Step 6: Run build and verify test passes**

Run: `npm run build && npm test`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: homepage with report list and tag filter"
```

---

### Task 4: Report Detail Page — TOC + RatingBar

**Files:**
- Create: `src/layouts/ReportLayout.astro`
- Create: `src/components/TableOfContents.astro`
- Create: `src/components/RatingBar.astro`
- Create: `src/pages/reports/[slug].astro`

**Interfaces:**
- Consumes: `reports` collection from Task 2, CSS from Task 1
- Produces: report detail page at `/reports/[slug]/` with TOC and rating bars

- [ ] **Step 1: Write the failing test**

Add these checks to `scripts/check.mjs` before the final `console.log` line:

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL — `reports/redis/index.html` not found (detail page not implemented)

- [ ] **Step 3: Create src/layouts/ReportLayout.astro**

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

- [ ] **Step 4: Create src/components/RatingBar.astro**

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

- [ ] **Step 5: Create src/components/TableOfContents.astro**

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

- [ ] **Step 6: Create src/pages/reports/[slug].astro**

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
---

<ReportLayout title={title} description={description}>
  <div class="report-detail">
    <aside class="report-sidebar">
      <TableOfContents headings={headings} />
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
        <h2 id="评分">评分</h2>
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

- [ ] **Step 7: Run build and verify test passes**

Run: `npm run build && npm test`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: report detail page with TOC and rating bars"
```

---

### Task 5: Search Page — Pagefind

**Files:**
- Modify: `package.json` (add pagefind dependency + postbuild script)
- Create: `src/pages/search.astro`

**Interfaces:**
- Consumes: built site in `dist/` (Pagefind indexes after build)
- Produces: search page at `/search` with full-text search

- [ ] **Step 1: Write the failing test**

Add these checks to `scripts/check.mjs` before the final `console.log` line:

```js
// Task 5 checks
test('search page exists', () => {
  const html = readPage('search/index.html');
  assertIncludes(html, 'pagefind', 'missing pagefind script');
  assertIncludes(html, 'id="search"', 'missing search container');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL — `search/index.html` not found

- [ ] **Step 3: Install pagefind and update build script**

```bash
npm install pagefind --save-dev
```

Modify `package.json` scripts section — change the `build` script and add `postbuild`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "postbuild": "pagefind --site dist",
    "preview": "astro preview",
    "test": "node scripts/check.mjs"
  }
}
```

- [ ] **Step 4: Create src/pages/search.astro**

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="搜索 — 每天一个开源项目">
  <div class="search-page">
    <h1>搜索报告</h1>
    <div id="search"></div>
    <link href="/opensource-everyday/pagefind/pagefind-ui.css" rel="stylesheet">
    <script src="/opensource-everyday/pagefind/pagefind-ui.js"></script>
    <script>
      new PagefindUI({ element: "#search" });
    </script>
  </div>
</BaseLayout>
```

- [ ] **Step 5: Run build and verify test passes**

Run: `npm run build && npm test`
Expected: PASS (postbuild runs pagefind, search page exists)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: search page with Pagefind full-text search"
```

---

### Task 6: Categories Archive Page

**Files:**
- Create: `src/pages/categories.astro`

**Interfaces:**
- Consumes: `reports` collection from Task 2, `ReportCard` from Task 3
- Produces: categories page at `/categories` grouping reports by tags

- [ ] **Step 1: Write the failing test**

Add these checks to `scripts/check.mjs` before the final `console.log` line:

```js
// Task 6 checks
test('categories page exists', () => {
  const html = readPage('categories/index.html');
  assertIncludes(html, 'database', 'missing database category');
  assertIncludes(html, 'Redis', 'missing Redis under a category');
  assertIncludes(html, 'category-group', 'missing category group');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL — `categories/index.html` not found

- [ ] **Step 3: Create src/pages/categories.astro**

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

- [ ] **Step 4: Run build and verify test passes**

Run: `npm run build && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: categories archive page grouped by tags"
```

---

### Task 7: Leaderboard Page

**Files:**
- Create: `src/pages/leaderboard.astro`

**Interfaces:**
- Consumes: `reports` collection from Task 2
- Produces: leaderboard page at `/leaderboard` with sortable ratings

- [ ] **Step 1: Write the failing test**

Add these checks to `scripts/check.mjs` before the final `console.log` line:

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

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL — `leaderboard/index.html` not found

- [ ] **Step 3: Create src/pages/leaderboard.astro**

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';

const reports = await getCollection('reports');

const dimensions = [
  { key: 'overall', label: '综合' },
  { key: 'activity', label: '活跃度' },
  { key: 'documentation', label: '文档质量' },
  { key: 'easeOfUse', label: '上手难度' },
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
            <td><a href={`/reports/${report.id}/`}>{report.data.title}</a></td>
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
          const valKey = key === 'easeOfUse' ? 'data-easeofuse' : `data-${key}`;
          const aVal = Number(a.getAttribute(valKey));
          const bVal = Number(b.getAttribute(valKey));
          return bVal - aVal;
        });

        rows.forEach((row, i) => {
          const rankCell = row.querySelector('.rank');
          rankCell.textContent = String(i + 1);
          rankCell.classList.toggle('rank-1', i === 0);
          const scoreCell = row.querySelectorAll('td')[2];
          const valKey = key === 'easeOfUse' ? 'data-easeofuse' : `data-${key}`;
          scoreCell.textContent = row.getAttribute(valKey);
          tbody.appendChild(row);
        });
      });
    });
  </script>
</BaseLayout>
```

- [ ] **Step 4: Run build and verify test passes**

Run: `npm run build && npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: leaderboard page with dimension switching"
```

---

### Task 8: About Page + GitHub Actions Deploy

**Files:**
- Create: `src/pages/about.astro`
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: about page at `/about`, GitHub Actions workflow for auto-deployment

- [ ] **Step 1: Write the failing test**

Add these checks to `scripts/check.mjs` before the final `console.log` line:

```js
// Task 8 checks
import { readFileSync as readFileSyncSync } from 'node:fs';

test('about page exists', () => {
  const html = readPage('about/index.html');
  assertIncludes(html, '每天一个开源项目', 'about page should mention site name');
  assertIncludes(html, '调研', 'about page should mention research');
});

test('deploy workflow exists', () => {
  const content = readFileSyncSync('.github/workflows/deploy.yml', 'utf-8');
  assertIncludes(content, 'github-pages', 'missing pages deployment');
  assertIncludes(content, 'npm run build', 'missing build step');
  assertIncludes(content, 'actions/upload-pages-artifact', 'missing artifact upload');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run build && npm test`
Expected: FAIL — `about/index.html` not found, `deploy.yml` not found

- [ ] **Step 3: Create src/pages/about.astro**

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

- [ ] **Step 4: Create .github/workflows/deploy.yml**

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

- [ ] **Step 5: Run build and verify all tests pass**

Run: `npm run build && npm test`
Expected: PASS — all checks pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: about page and GitHub Pages deploy workflow"
```
