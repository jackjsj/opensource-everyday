# Task 3 Report: Homepage — Report List + Tag Filter

## Status

DONE

## What was implemented

Replaced the placeholder `src/pages/index.astro` with the full homepage that:

- Loads all `reports` collection entries via `getCollection` and sorts by date descending.
- Renders a hero section with the site title and tagline.
- Collects the deduplicated, sorted tag set across all reports and passes it to `TagFilter`.
- Renders a responsive `.report-grid` of `.report-card-wrapper` wrappers, each carrying a `data-tags` attribute used by the client-side filter.

Created two new components:

- `src/components/ReportCard.astro` — receives a `CollectionEntry<'reports'>` and renders a card linking to `/reports/{id}/` with title, overall rating badge, description, date, and tag chips.
- `src/components/TagFilter.astro` — renders the "全部" plus per-tag buttons and ships a small client script that toggles `active` and shows/hides `.report-card-wrapper` elements based on their `data-tags`.

All styling comes from the existing CSS variables and classes already defined in `src/styles/global.css` (`.report-grid`, `.report-card`, `.tag-filter`, `.tag-btn`, `.rating-badge`, `.tag`, etc.). No CSS changes were needed.

Added Task 3 checks to `scripts/check.mjs` asserting that the built `index.html` contains `Redis`, `report-card`, `tag-btn`, and the `database` tag.

## Files changed

- Created: `src/components/ReportCard.astro`
- Created: `src/components/TagFilter.astro`
- Modified: `src/pages/index.astro`
- Modified: `scripts/check.mjs`
- Updated: `.superharness/tasks/07-15-opensource-site/sdd/progress.md`

## Verification

- `npm run build` — succeeds, generates `dist/index.html` (1 page).
- `npm test` — all 3 checks PASS (homepage exists, content collection builds, homepage lists reports).
- Built HTML inspection confirms: 3 `report-card` occurrences, 5 `tag-btn` buttons, 1 `rating-badge`, and the card link resolves to `/reports/redis/`.

## Post-review fixes

Two review issues were addressed:

1. `ReportCard.astro` now prefixes the card link with `import.meta.env.BASE_URL` so it resolves under the `/opensource-everyday` base path. The literal review instruction (`${import.meta.env.BASE_URL}reports/...`) produced `/opensource-everydayreports/...` because the configured `base` has no trailing slash; I added the separator (`/reports/...`) so the prefix actually works, yielding `/opensource-everyday/reports/redis/`.
2. `TagFilter.astro` tag matching switched from substring (`cardTags.includes(tag)`) to exact token matching (`cardTags.split(',').includes(tag)`), preventing false positives like a `cache` tag matching `caching`.

Rebuilt and re-ran `npm test` — all 3 checks still PASS.

## Commit

`4878a52 feat: homepage with report list and tag filter` (original)
Follow-up: `fix: base path prefix in report cards and exact tag matching in filter`

## Self-review notes

- Implementation matches the task brief exactly; no speculative abstractions or extra features added.
- The card links to `/reports/redis/`; the detail route is not part of Task 3 (it is a later task), so the link 404s until that route exists. This is expected and consistent with the spec.
- The TagFilter client script uses `querySelectorAll` on `.report-card-wrapper`, which the homepage renders, so filtering works for the single Redis report. With one report the filter is functionally limited but correct; it scales as more reports are added in later tasks.
- The commit also swept in pre-existing untracked SDD files (review packages, task briefs, progress, trace.jsonl) that were already on disk; these were not created by this task and are left as-is per surgical-change guidance.
