import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
let failures = 0;

function readPage(path) {
  const filePath = join(dist, path);
  if (!existsSync(filePath)) throw new Error(`File not found: ${filePath}`);
  return readFileSync(filePath, 'utf-8');
}

function readLinkedCss(html) {
  const match = html.match(/href="([^"]+\.css)"/);
  if (!match) return '';
  const cssPath = match[1].replace(/^\/opensource-everyday\//, '');
  const filePath = join(dist, cssPath);
  if (!existsSync(filePath)) return '';
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
  const content = html + readLinkedCss(html);
  assertIncludes(content, '<html', 'missing html tag');
  assertIncludes(content, '--color-primary', 'missing CSS variable');
  assertIncludes(content, '每天一个开源项目', 'missing site title');
  assertIncludes(content, '首页', 'missing nav link');
});

// Task 2 checks
test('content collection builds without error', () => {
  const html = readPage('index.html');
  assertIncludes(html, '<html', 'build should succeed with content config');
});

// Task 3 checks
test('homepage lists reports', () => {
  const html = readPage('index.html');
  assertIncludes(html, 'Redis', 'homepage should list Redis report');
  assertIncludes(html, 'report-card', 'missing report card class');
  assertIncludes(html, 'tag-btn', 'missing tag filter buttons');
  assertIncludes(html, 'database', 'missing database tag');
});

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

// Task 5 checks
test('search page exists', () => {
  const html = readPage('search/index.html');
  assertIncludes(html, 'pagefind', 'missing pagefind script');
  assertIncludes(html, 'id="search"', 'missing search container');
});

// Task 6 checks
test('categories page exists', () => {
  const html = readPage('categories/index.html');
  assertIncludes(html, 'database', 'missing database category');
  assertIncludes(html, 'Redis', 'missing Redis under a category');
  assertIncludes(html, 'category-group', 'missing category group');
});

// Task 7 checks
test('leaderboard page exists', () => {
  const html = readPage('leaderboard/index.html');
  assertIncludes(html, 'leaderboard-table', 'missing leaderboard table');
  assertIncludes(html, 'dim-tab', 'missing dimension tabs');
  assertIncludes(html, 'Redis', 'missing Redis entry');
  assertIncludes(html, '综合', 'missing overall dimension tab');
});

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

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
