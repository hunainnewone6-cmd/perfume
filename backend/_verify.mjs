/* Comprehensive verification for Maison Nera backend project */
'use strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const BASE = 'http://localhost:3000';
const ROOT = 'c:\\Users\\Hunain\\Desktop\\perfume';

const problems = [];
const ok = (msg) => console.log('  OK   ' + msg);
const bad = (msg) => { problems.push(msg); console.log('  FAIL ' + msg); };

async function fetchText(url) {
  const res = await fetch(url);
  return { res, text: await res.text() };
}

const PAGES = [
  { url: BASE + '/',          file: 'index.html' },
  { url: BASE + '/shop.html', file: 'shop.html' },
  { url: BASE + '/admin',     file: 'admin\\index.html' }
];

const localTargets = new Set(['/admin', '/', '/shop.html', '/index.html']);
const pageHtml = {};

for (const p of PAGES) {
  const { res, text } = await fetchText(p.url);
  pageHtml[p.url] = text;
  localTargets.add(p.url);
  if (res.status !== 200) bad(`${p.url} returned ${res.status}`);
  else ok(`${p.url} -> ${res.status}`);

  const attrRe = /(?:href|src)\s*=\s*"([^"]+)"/g;
  let m;
  while ((m = attrRe.exec(text)) !== null) localTargets.add(new URL(m[1], p.url).href);
}

const adminM = pageHtml[BASE + '/admin'].match(/stylesheet[^>]*href="([^"]+)"/);
if (adminM && adminM[1] !== '/admin/admin.css') {
  bad('admin stylesheet link points to ' + adminM[1] + ' (expected /admin/admin.css)');
}
if (!pageHtml[BASE + '/admin'].includes('src="/admin/admin.js"')) {
  bad('admin script does not point to /admin/admin.js');
}

const seen = new Set();
for (const t of localTargets) {
  if (!t.startsWith(BASE) || seen.has(t)) continue;
  seen.add(t);
  try {
    const res = await fetch(t);
    if (res.status >= 400) bad(`${t} -> ${res.status}`);
    else ok(`${t} -> ${res.status} (${res.headers.get('content-type') || '?'})`);
  } catch (e) {
    bad(`${t} -> fetch error: ${e.message}`);
  }
}
function extractFrags(html) { return new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1])); }
const idsByPage = {};
for (const p of PAGES) idsByPage[p.url] = extractFrags(pageHtml[p.url]);

for (const p of PAGES) {
  const text = pageHtml[p.url];
  const hrefRe = /href\s*=\s*"([^"]*#[^"]*)"/g;
  let m;
  while ((m = hrefRe.exec(text)) !== null) {
    const raw = m[1];
    if (/^https?:/.test(raw)) continue;
    const [targetPath, frag] = raw.split('#');
    if (!frag) continue;
    const resolved = new URL(targetPath || p.url, p.url);
    let targetText = pageHtml[resolved.href.split('#')[0]];
    if (targetText === undefined) {
      try { targetText = (await fetchText(resolved.href)).text; pageHtml[resolved.href] = targetText; }
      catch { bad(`anchor target page ${resolved.href} unreachable`); continue; }
    }
    if (!extractFrags(targetText).has(frag)) bad(`fragment '#${frag}' missing on ${resolved.href}`);
  }
}

for (const api of ['/api', '/api/products']) {
  const { res, text } = await fetchText(BASE + api);
  if (res.status !== 200) bad(`${api} -> ${res.status}`);
  else {
    ok(`${api} -> ${res.status}`);
    try {
      const data = JSON.parse(text);
      if (api === '/api/products' && !Array.isArray(data)) bad('/api/products did not return an array');
    } catch { bad(`${api} did not return valid JSON`); }
  }
}

function idsFromJS(jsPath) {
  const src = readFileSync(join(ROOT, jsPath), 'utf8');
  const ids = new Set();
  const re = /\$\('#([A-Za-z0-9_-]+)'\)/g;
  let m;
  while ((m = re.exec(src)) !== null) ids.add(m[1]);
  return ids;
}
const mainIds = idsFromJS('js\\main.js');
const indexIds = extractFrags(pageHtml[BASE + '/']);
const shopIds = extractFrags(pageHtml[BASE + '/shop.html']);
for (const id of mainIds) {
  const any = indexIds.has(id) || shopIds.has(id);
  if (any) ok(`main.js id #${id} present`);
  else bad(`main.js references #${id} but it exists on neither home nor shop page`);
}
const adminIds = idsFromJS('admin\\admin.js');
const adminPageIds = extractFrags(pageHtml[BASE + '/admin']);
for (const id of adminIds) {
  if (adminPageIds.has(id)) ok(`admin.js id #${id} present`);
  else bad(`admin.js references #${id} but admin page has no such id`);
}

for (const p of PAGES) {
  const all = [...pageHtml[p.url].matchAll(/id="([^"]+)"/g)].map((m) => m[1]);
  const dup = all.filter((x, i) => all.indexOf(x) !== i);
  if (dup.length) bad(`duplicate ids on ${p.url}: ${[...new Set(dup)].join(', ')}`);
  else ok(`no duplicate ids on ${p.url}`);
}

for (const css of ['css\\styles.css', 'admin\\admin.css']) {
  const cssText = readFileSync(join(ROOT, css), 'utf8');
  const urls = [...cssText.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map((m) => m[1]);
  if (urls.length === 0) ok(`${css} has no local url() refs`);
  else bad(`${css} references files: ${urls.join(', ')}`);
}

console.log('\n==== RESULT ====');
console.log(problems.length === 0 ? 'ALL CHECKS PASSED' : problems.length + ' PROBLEM(S) FOUND');
process.exit(problems.length === 0 ? 0 : 1);