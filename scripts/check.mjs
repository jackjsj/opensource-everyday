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

console.log(failures === 0 ? '\nAll checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);
