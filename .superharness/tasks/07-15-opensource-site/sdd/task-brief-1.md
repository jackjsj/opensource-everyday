# Task 1: Project Scaffolding + Design System + Base Layout + Header

## Context

This is the first task for a brand-new Astro static site project called "每天一个开源项目" (One Open Source Project Per Day). The project directory is at `/Users/jesse/Desktop/btrip/opensource-everyday` on branch `superharness/opensource-site`. There is no existing source code — only `.superharness/` task artifacts and `.agents/` skill files.

This task sets up the project foundation: package.json, Astro config, TypeScript config, global CSS (from Supabase DESIGN.md tokens), base layout, header component, a minimal index page, and a test check script.

## Global Constraints (from plan.md)

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`, sourced from Supabase DESIGN.md tokens
- All reports are Markdown files in `src/content/reports/`, frontmatter must match schema in `src/content.config.ts`
- Site base path is `/opensource-everyday` for GitHub Pages project deployment
- Report content sections 1-7 are Markdown; section 8 (评分) is auto-rendered from frontmatter `ratings` via RatingBar component
- No external runtime dependencies beyond Astro and Pagefind

## Files to Create

- `package.json`
- `astro.config.mjs`
- `tsconfig.json`
- `DESIGN.md` (copy from Supabase design-md)
- `scripts/check.mjs`
- `src/styles/global.css`
- `src/layouts/BaseLayout.astro`
- `src/components/Header.astro`
- `src/pages/index.astro` (minimal placeholder)

Also create a `.gitignore` file at the project root with:
```
node_modules/
dist/
.superharness/visualize/
```

## Implementation Details

### package.json

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

### astro.config.mjs

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  base: '/opensource-everyday',
});
```

### tsconfig.json

```json
{
  "extends": "astro/tsconfigs/strict"
}
```

### DESIGN.md

Copy the Supabase DESIGN.md from the awesome-design-md repo. If the file `/tmp/awesome-design-md/design-md/supabase/DESIGN.md` exists, copy it. Otherwise, create a DESIGN.md with the Supabase design tokens (see prd.md for the color/font values).

### src/styles/global.css

The complete CSS file with all design tokens as CSS variables and styles for all pages. See the plan.md Task 1 Step 5 for the complete CSS content. Copy it verbatim — it contains styles for the header, hero, tag filter, report grid, report cards, report detail, TOC, rating bars, search page, categories page, leaderboard, about page, and responsive breakpoints.

### src/layouts/BaseLayout.astro

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

### src/components/Header.astro

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

### src/pages/index.astro (minimal placeholder — will be replaced in Task 3)

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

### scripts/check.mjs

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

## Test Steps

1. Run `npm install` to install Astro
2. Run `npm run build` to build the site
3. Run `npm test` to verify the check script passes
4. All three Task 1 checks should PASS

## Commit

```bash
git add -A
git commit -m "feat: project scaffolding, design system, base layout, header"
```
