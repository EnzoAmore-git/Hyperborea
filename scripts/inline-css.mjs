/**
 * Этап 7.2: inline критического CSS.
 * После сборки переносит единственный <link rel="stylesheet"> в <head>
 * как инлайновый <style> (убирает render-blocking запрос + ранний paint).
 * CSS ~7 КБ gzip — инлайн оправдан; эффект FCP на медленных сетях.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const dist = resolve(process.argv[2] || 'dist');
const indexHtml = join(dist, 'index.html');

const html = await readFile(indexHtml, 'utf8');
const linkRe = /<link rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/;
const match = html.match(linkRe);
if (!match) {
  console.log('inline-css: stylesheet link not found — skip');
  process.exit(0);
}
const [link, href] = match;
const cssName = href.slice(href.lastIndexOf('/') + 1);
const cssPath = join(dist, 'assets', cssName);
const css = await readFile(cssPath, 'utf8');
const inlined = html.replace(link, `<style id="critical-inline">${css}</style>`);
await writeFile(indexHtml, inlined);
console.log(`inline-css: inlined ${href} (${(css.length / 1024).toFixed(1)} KB)`);