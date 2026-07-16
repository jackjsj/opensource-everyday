import { defineConfig } from 'astro/config';

// GitHub Pages serves at /opensource-everyday, Aone Pages serves at root.
// Set ASTRO_BASE_PATH env var to override; defaults to '/' for Aone Pages.
const base = process.env.ASTRO_BASE_PATH ?? '/';

export default defineConfig({
  base,
});
