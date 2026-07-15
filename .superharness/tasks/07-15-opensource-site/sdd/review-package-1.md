# Review Package for Task 1

## Paths

- Task brief: .superharness/tasks/07-15-opensource-site/sdd/task-brief-1.md
- Implementer report: .superharness/tasks/07-15-opensource-site/sdd/report-1.md
- Diff range: 7a70b33..c3675e4

## Global Constraints (from plan.md, verbatim)

- All color/font/spacing values must come from CSS variables defined in `src/styles/global.css`, sourced from Supabase DESIGN.md tokens
- All reports are Markdown files in `src/content/reports/`, frontmatter must match schema in `src/content.config.ts`
- Site base path is `/opensource-everyday` for GitHub Pages project deployment
- Report content sections 1-7 are Markdown; section 8 (评分) is auto-rendered from frontmatter `ratings` via RatingBar component
- No external runtime dependencies beyond Astro and Pagefind
