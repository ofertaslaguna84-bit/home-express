import { casaPorListing, reservasVigentes, eventosAirbnb, SITE } from './_lib.js';

/**
 * Calendario que cada anuncio de Airbnb importa desde Hostalia: reservas directas + bloqueos del admin
 * + las RESERVAS del anuncio gemelo (solo "Reserved": los bloqueos no se reenvían para no crear ecos entre gemelos).
 */
export default async function handler(req, res) {
  const listing = String(req.query.listing || '');
  const casa = casaPorListing(listing);
  if (!casa) return res.status(404).end('listing desconocido');
  const propias = await reservasVigentes(casa.slug);
  const gemelos = casa.listings.filter((l) => l.id !== listing);
  const deGemelos = (await Promise.all(gemelos.map((l) => eventosAirbnb(l).catch(() => [])))).flat().filter((e) => e.reservado);
  const ahora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const dia = (s) => s.replace(/-/g, '');
  const ev = (uid, inicio, fin, resumen) => ['BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${ahora}`, `DTSTART;VALUE=DATE:${dia(inicio)}`, `DTEND;VALUE=DATE:${dia(fin)}`, `SUMMARY:${resumen}`, 'END:VEVENT'];
  const lineas = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', `PRODID:-//Hostalia//Reservas//ES`, 'CALSCALE:GREGORIAN', `X-WR-CALNAME:Hostalia ${casa.nombre}`,
    ...propias.flatMap((r) => ev(`hostalia-${r.id}@hostalia.com.mx`, r.llegada, r.salida, r.estado === 'bloqueo' ? 'Hostalia (bloqueado)' : 'Hostalia (reservado)')),
    ...deGemelos.flatMap((e) => ev(`gemelo-${e.listing}-${(e.uid || e.inicio).replace(/[^A-Za-z0-9@.-]/g, '')}`, e.inicio, e.fin, 'Airbnb gemelo (reservado)')),
    'END:VCALENDAR',
  ];
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).end(lineas.join('\r\n') + '\r\n');
}
