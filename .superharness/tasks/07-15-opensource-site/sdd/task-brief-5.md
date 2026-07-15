# Task 5: Search Page — Pagefind

## Context

Tasks 1-4 are complete. The project has Astro 5 with homepage, report detail page, content collection, and all components. This task adds full-text search using Pagefind.

## Global Constraints (from plan.md)

- Site base path is `/opensource-everyday`
- No external runtime dependencies beyond Astro and Pagefind

## Files to Create/Modify

- Modify: `package.json` (add pagefind devDependency + postbuild script)
- Create: `src/pages/search.astro`
- Modify: `scripts/check.mjs` (add Task 5 checks)

## Implementation Details

### package.json changes

1. Run `npm install pagefind --save-dev`
2. Update the `scripts` section — add a `postbuild` script that runs pagefind on the dist directory:

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

### src/pages/search.astro

IMPORTANT: The site uses base path `/opensource-everyday`. Pagefind generates its index in `dist/pagefind/`. The CSS and JS references must include the base path prefix.

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
---

<BaseLayout title="搜索 — 每天一个开源项目">
  <div class="search-page">
    <h1>搜索报告</h1>
    <div id="search"></div>
    <link href={`${import.meta.env.BASE_URL}pagefind/pagefind-ui.css`} rel="stylesheet">
    <script src={`${import.meta.env.BASE_URL}pagefind/pagefind-ui.js`}></script>
    <script>
      new PagefindUI({ element: "#search" });
    </script>
  </div>
</BaseLayout>
```

Note: Use `import.meta.env.BASE_URL` for the pagefind asset paths. BASE_URL resolves to `/opensource-everyday` (no trailing slash), so the paths will be `/opensource-everyday/pagefind/pagefind-ui.css` and `/opensource-everyday/pagefind/pagefind-ui.js`.

### scripts/check.mjs additions

Add these checks before the final `console.log` line:

```js
// Task 5 checks
test('search page exists', () => {
  const html = readPage('search/index.html');
  assertIncludes(html, 'pagefind', 'missing pagefind script');
  assertIncludes(html, 'id="search"', 'missing search container');
});
```

## Test Steps

1. Run `npm run build` — this runs `astro build` then `pagefind --site dist` (postbuild)
2. Run `npm test` — all checks should PASS
3. Verify `dist/pagefind/` directory exists (Pagefind index)

## Commit

```bash
git add -A
git commit -m "feat: search page with Pagefind full-text search"
```
