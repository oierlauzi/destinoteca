#!/usr/bin/env node
// Checks the built site for links that forget the base path.
//
// The site is published under /destinoteca/, and Astro only prefixes the URLs
// it generates itself. A hand-written href="/catalogo/" in a template or in a
// Markdown body builds without complaint and is a 404 once deployed. This
// reads every HTML file in dist/ and fails if a site-absolute href, src or
// srcset points anywhere outside the base.
//
// Usage: node tools/check-dist.mjs [dist] [base]

import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const base = (process.argv[3] ?? '/destinoteca/').replace(/\/?$/, '/');

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

/** Every URL in the attributes that make the browser fetch or navigate. */
function* urls(html) {
  for (const match of html.matchAll(/\s(?:href|src|action|poster)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    yield match[1] ?? match[2];
  }
  for (const match of html.matchAll(/\ssrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    for (const candidate of (match[1] ?? match[2]).split(',')) yield candidate.trim().split(/\s+/)[0];
  }
  for (const match of html.matchAll(/http-equiv\s*=\s*["']refresh["'][^>]*content\s*=\s*["'][^"']*url=([^"']*)["']/gi)) {
    yield match[1];
  }
}

let files = 0;
const problems = [];
try {
  for await (const file of htmlFiles(dist)) {
    files++;
    const html = await readFile(file, 'utf8');
    for (const url of urls(html)) {
      // Site-absolute means one leading slash; "//host" is another site.
      if (!url || !url.startsWith('/') || url.startsWith('//')) continue;
      if (url === base.slice(0, -1) || url.startsWith(base)) continue;
      problems.push(`${relative(dist, file)}: ${url}`);
    }
  }
} catch (error) {
  console.error(`check-dist: cannot read "${dist}" (${error.code ?? error.message}). Run "npm run build" first.`);
  process.exit(2);
}

if (files === 0) {
  console.error(`check-dist: no HTML files in "${dist}". Run "npm run build" first.`);
  process.exit(2);
}
if (problems.length > 0) {
  console.error(`check-dist: ${problems.length} link(s) outside ${base}. Build internal links with href() from src/site/url.ts, and use relative links in Markdown.\n`);
  for (const problem of problems) console.error(`  ${problem}`);
  process.exit(1);
}
console.log(`check-dist: ${files} pages, every internal link is under ${base}`);
