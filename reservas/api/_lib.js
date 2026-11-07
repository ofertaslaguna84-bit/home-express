/**
 * Hostalia · reservas directas. Librería compartida por los endpoints.
 * Datos: Vercel Blob privado (reservas/<id>.json). Disponibilidad: iCal de Airbnb + reservas propias.
 */
import { put, get, list } from '@vercel/blob';
import casasJson from '../casas-api.json' with { type: 'json' };

export const SITE = process.env.SITE_URL || 'https://hostalia.com.mx';
export const API = process.env.API_URL || 'https://reservas.hostalia.com.mx';
export const WHATSAPP = casasJson.marca.whatsapp;
export const MARCA = casasJson.marca;
/** Minutos que una reserva pendiente aparta las fechas. */
export const HOLD_MP_MIN = 120;
export const HOLD_TRANSFER_MIN = 24 * 60;
export const MAX_NOCHES = 27;

const ICALS = JSON.parse(process.env.ICAL_JSON || '{}');

/** Casas con reserva en línea: traen listings de Airbnb (los gemelos) y precio. */
export const CASAS = Object.fromEntries(
  casasJson.casas.filter((c) => c.reservaEnLinea).map((c) => [c.slug, { ...c, listings: (c.airbnbIds || []).map((id) => ({ id, ical: ICALS[id] })) }]),
);

export function casaPorListing(listingId) {
  return Object.values(CASAS).find((c) => c.listings.some((l) => l.id === listingId));
}

// ───────────────────────────────────────────── http
const ORIGENES = [SITE, SITE.replace('https://', 'https://www.'), 'https://ofertaslaguna84-bit.github.io'];
export function cors(req, res) {
  const o = req.headers.origin || '';
  if (ORIGENES.includes(o) || /^http:\/\/localhost(:\d+)?$/.test(o)) res.setHeader('Access-Control-Allow-Origin', o);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}
export const json = (res, status, obj) => { res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(obj)); };

// ───────────────────────────────────────────── fechas (todo en YYYY-MM-DD)
export const esFecha = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z'));
export const aDia = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
export const deDia = (ms) => new Date(ms).toISOString().slice(0, 10);
export const sumaDias = (s, n) => deDia(aDia(s) + n * 864e5);
export const noches = (a, b) => Math.round((aDia(b) - aDia(a)) / 864e5);
/** Hoy en Torreón (UTC-6 fijo). */
export const hoyTorreon = () => new Date(Date.now() - 6 * 3600e3).toISOString().slice(0, 10);
export const esFinde = (s) => { const d = new Date(aDia(s)).getUTCDay(); return d === 5 || d === 6; };
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const fechaBonita = (s) => `${+s.slice(8, 10)} ${MESES[+s.slice(5, 7) - 1]} ${s.slice(0, 4)}`;
export const mxn = (n) => '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
/** ISO con offset de Torreón, como lo pide Mercado Pago (yyyy-MM-ddTHH:mm:ss.SSS-06:00). */
export const isoTorreon = (ms) => new Date(ms - 6 * 3600e3).toISOString().replace('Z', '-06:00');

/** Rangos [inicio, fin) se traslapan si hay al menos una noche en común. */
export const traslapa = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

// ───────────────────────────────────────────── iCal
export function parseIcal(texto) {
  const lineas = texto.replace(/\r\n[ \t]/g, '').replace(/\r/g, '').split('\n');
  const eventos = [];
  let ev = null;
  for (const l of lineas) {
    if (l === 'BEGIN:VEVENT') ev = {};
    else if (l === 'END:VEVENT') { if (ev && ev.inicio && ev.fin) eventos.push(ev); ev = null; }
    else if (ev) {
      const i = l.indexOf(':'); if (i < 0) continue;
      const clave = l.slice(0, i).split(';')[0], val = l.slice(i + 1);
      const dia = (v) => `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
      if (clave === 'DTSTART') ev.inicio = dia(val);
      else if (clave === 'DTEND') ev.fin = dia(val);
      else if (clave === 'SUMMARY') ev.resumen = val;
      else if (clave === 'UID') ev.uid = val;
      else if (clave === 'DESCRIPTION') ev.descripcion = val;
    }
  }
  return eventos;
}

const cacheIcal = new Map();
/** Eventos del iCal de un anuncio de Airbnb; caché de 10 min por instancia. */
export async function eventosAirbnb(listing) {
  if (!listing.ical) return [];
  const c = cacheIcal.get(listing.id);
  if (c && Date.now() - c.t < 10 * 60e3) return c.eventos;
  try {
    const r = await fetch(listing.ical, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Hostalia-reservas/1.0' } });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const eventos = parseIcal(await r.text()).map((e) => ({ ...e, listing: listing.id, origen: 'airbnb', reservado: /reserved/i.test(e.resumen || '') }));
    cacheIcal.set(listing.id, { t: Date.now(), eventos });
    return eventos;
  } catch (e) {
    console.error('ical', listing.id, e.message);
    if (c) return c.eventos; // mejor viejo que nada
    throw new Error('No se pudo leer el calendario de Airbnb');
  }
}

// ───────────────────────────────────────────── reservas en Blob
const ruta = (id) => `reservas/${id}.json`;
export const nuevoId = () => 'H' + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase();

export async function guardarReserva(r) {
  r.actualizada = new Date().toISOString();
  await put(ruta(r.id), JSON.stringify(r), { access: 'private', addRandomSuffix: false, allowOverwrite: true, contentType: 'application/json' });
  return r;
}
export async function leerReserva(id) {
  if (!/^[A-Z0-9]{6,16}$/.test(id || '')) return null;
  const b = await get(ruta(id), { access: 'private', useCache: false });
  if (!b) return null;
  return JSON.parse(await new Response(b.stream).text());
}
export async function todasReservas() {
  const out = []; let cursor;
  do {
    const p = await list({ prefix: 'reservas/', cursor, limit: 1000 });
    out.push(...p.blobs); cursor = p.hasMore ? p.cursor : undefined;
  } while (cursor);
  const lectura = await Promise.all(out.map(async (b) => { const g = await get(b.pathname, { access: 'private', useCache: false }); return g ? JSON.parse(await new Response(g.stream).text()) : null; }));
  return lectura.filter(Boolean).sort((a, b) => (a.creada < b.creada ? 1 : -1));
}
/** Vigente = aparta fechas: pagada, bloqueo del admin, o pendiente que no ha expirado. */
export const vigente = (r) => r.estado === 'pagada' || r.estado === 'bloqueo' || (r.estado === 'pendiente' && r.expira > new Date().toISOString());
export const reservasVigentes = async (slug) => (await todasReservas()).filter((r) => r.casa === slug && vigente(r));

// ───────────────────────────────────────────── disponibilidad y precio
/** Noches ocupadas de una casa: Airbnb (los dos anuncios, reservas y bloqueos) + reservas directas vigentes. */
export async function bloqueos(slug) {
  const casa = CASAS[slug];
  const [air, propias] = await Promise.all([Promise.all(casa.listings.map(eventosAirbnb)), reservasVigentes(slug)]);
  return [
    ...air.flat().map((e) => ({ inicio: e.inicio, fin: e.fin, origen: 'airbnb' })),
    ...propias.map((r) => ({ inicio: r.llegada, fin: r.salida, origen: r.estado === 'bloqueo' ? 'bloqueo' : 'directa' })),
  ];
}
export const libre = (llegada, salida, lista) => !lista.some((b) => traslapa(llegada, salida, b.inicio, b.fin));

export function cotizar(casa, llegada, salida, factura) {
  const n = noches(llegada, salida);
  let hospedaje = 0;
  for (let d = llegada; d < salida; d = sumaDias(d, 1)) hospedaje += esFinde(d) ? casa.precioFinde : casa.precioNoche;
  const descuentoPct = n >= 7 ? MARCA.descuentoSemana : 0;
  const descuento = Math.round(hospedaje * descuentoPct);
  const limpieza = MARCA.limpiezaSemanal * Math.ceil(n / 7);
  const subtotal = hospedaje - descuento + limpieza;
  const iva = factura ? Math.round(subtotal * MARCA.iva) : 0;
  return { noches: n, hospedaje, descuentoPct, descuento, limpieza, subtotal, iva, total: subtotal + iva };
}

// ───────────────────────────────────────────── Mercado Pago
export const MP_TOKEN = process.env.MP_ACCESS_TOKEN || '';
export const mpActivo = () => MP_TOKEN.length > 20;
export async function mp(path, init = {}) {
  const r = await fetch('https://api.mercadopago.com' + path, {
    ...init,
    headers: { Authorization: `Bearer ${MP_TOKEN}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
    signal: AbortSignal.timeout(15000),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(data.message || `Mercado Pago ${r.status}`); e.data = data; throw e; }
  return data;
}

// ───────────────────────────────────────────── aviso a Pedro (Telegram opcional)
export async function avisar(texto) {
  const t = process.env.TELEGRAM_BOT_TOKEN, c = process.env.TELEGRAM_CHAT_ID;
  if (!t || !c) return;
  try { await fetch(`https://api.telegram.org/bot${t}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: c, text: texto }) }); } catch (e) { console.error('telegram', e.message); }
}

export const resumenReserva = (r) => `${r.nombreCasa} · ${fechaBonita(r.llegada)} → ${fechaBonita(r.salida)} (${r.noches} noches) · ${r.personas} personas · ${r.nombre} · ${r.telefono} · ${mxn(r.total)}`;
