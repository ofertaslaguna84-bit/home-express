#!/usr/bin/env node
/**
 * Avisa a buscadores (Bing, Yandex, Seznam, Naver… vía api.indexnow.org) de URLs nuevas o cambiadas.
 * Mismo mecanismo que ghspecialist-web/scripts/indexnow.mjs. La llave pública vive en
 * docs/f3a9c1d2e4b5674890ab1c2d3e4f5a6b.txt (no es secreta: IndexNow la pide publicada).
 *
 *   node scripts/indexnow.mjs /blog/mi-articulo/ /hospedaje-torreon-desde-monterrey/
 *   node scripts/indexnow.mjs --sitemap          # todas las URLs del sitemap
 *   node scripts/indexnow.mjs --desde=2026-11-08 # las del sitemap con lastmod >= esa fecha
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://hostalia.com.mx';
const HOST = 'hostalia.com.mx';
const KEY = 'f3a9c1d2e4b5674890ab1c2d3e4f5a6b';

function delSitemap(desde) {
  const xml = readFileSync(join(ROOT, 'docs', 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].filter(([, , mod]) => !desde || mod >= desde).map(([, loc]) => loc);
}

const args = process.argv.slice(2);
const desde = args.find((a) => a.startsWith('--desde='))?.split('=')[1];
let urls = args.includes('--sitemap') || desde ? delSitemap(desde) : args.filter((a) => !a.startsWith('--'));
urls = urls.map((u) => (u.startsWith('http') ? u : `${SITE}${u.startsWith('/') ? u : `/${u}`}`)).filter((u) => u.includes(HOST));

if (!urls.length) {
  console.log('Sin URLs que avisar.');
  process.exit(0);
}

for (let i = 0; i < urls.length; i += 500) {
  const urlList = urls.slice(i, i + 500);
  const r = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${SITE}/${KEY}.txt`, urlList }),
  });
  console.log(`[indexnow] ${r.status} ${r.statusText} (${urlList.length} URLs)`);
  if (r.status >= 400) console.log((await r.text()).slice(0, 200));
}
