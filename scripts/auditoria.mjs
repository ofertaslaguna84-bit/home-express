#!/usr/bin/env node
/** Auditoría local de docs/: enlaces internos rotos, títulos y metas fuera de rango, canonical, JSON-LD inválido, imágenes sin alt. */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
const OUT = resolve('docs');
const htmls = [];
const IGNORAR = /\/reserva\//;
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f.endsWith('.html')) htmls.push(p); } })(OUT);
const rotos = [], titulos = [], metas = [], sinCanon = [], ldMal = [], sinAlt = [];
const verbose = process.argv.includes('--verbose');
for (const h of htmls.filter((x) => !IGNORAR.test(x))) {
  const t = readFileSync(h, 'utf8');
  const rel = h.slice(OUT.length);
  const title = (t.match(/<title>([^<]*)<\/title>/) || [, ''])[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  const desc = (t.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"');
  if (!/noindex/.test(t)) {
    if (title.length < 30 || title.length > 60) titulos.push([rel, title.length, title]);
    if (desc.length < 120 || desc.length > 160) metas.push([rel, desc.length, desc.slice(0, 80)]);
    if (!/<link rel="canonical"/.test(t)) sinCanon.push(rel);
  }
  for (const m of t.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) { try { JSON.parse(m[1]); } catch (e) { ldMal.push([rel, e.message.slice(0, 60)]); } }
  for (const m of t.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(m[0])) sinAlt.push([rel, m[0].slice(0, 80)]);
  for (const m of t.matchAll(/(?:href|src)="([^"#?]+)[^"]*"/g)) {
    const u = m[1];
    if (/^(https?:|mailto:|tel:|data:|whatsapp:|\/\/)/.test(u) || u === '' ) continue;
    let p = u.startsWith('/') ? join(OUT, u) : resolve(dirname(h), u);
    if (u.endsWith('/')) p = join(p, 'index.html');
    if (!existsSync(p) && !existsSync(p + '/index.html') && !existsSync(p + '.html')) rotos.push([rel, u]);
  }
}
const uniq = (a) => [...new Set(a.map((x) => JSON.stringify(x)))].map((x) => JSON.parse(x));
console.log(`páginas: ${htmls.length}`);
console.log(`enlaces internos rotos: ${uniq(rotos).length}`); if (verbose) uniq(rotos).slice(0, 40).forEach((x) => console.log('  ', ...x));
console.log(`títulos fuera de 30–60: ${titulos.length}`); if (verbose) titulos.slice(0, 40).forEach((x) => console.log('  ', x[1], x[0], '|', x[2]));
console.log(`metas fuera de 120–160: ${metas.length}`); if (verbose) metas.slice(0, 40).forEach((x) => console.log('  ', x[1], x[0]));
console.log(`sin canonical: ${sinCanon.length}`, verbose ? sinCanon.slice(0, 10) : '');
console.log(`JSON-LD inválido: ${ldMal.length}`, ldMal.slice(0, 5));
console.log(`img sin alt: ${sinAlt.length}`, verbose ? sinAlt.slice(0, 10) : '');
