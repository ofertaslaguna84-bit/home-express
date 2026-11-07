import { CASAS, cors, json, bloqueos, hoyTorreon, MARCA, MAX_NOCHES } from './_lib.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  const casa = CASAS[req.query.casa];
  if (!casa) return json(res, 404, { error: 'Casa sin reserva en línea' });
  try {
    const hoy = hoyTorreon();
    const lista = (await bloqueos(casa.slug)).filter((b) => b.fin > hoy);
    // Se publican solo fechas, nunca el origen ni el huésped.
    const rangos = lista.map((b) => [b.inicio, b.fin]).sort();
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=600');
    json(res, 200, {
      casa: casa.slug, nombre: casa.nombre, hoy,
      precioNoche: casa.precioNoche, precioFinde: casa.precioFinde, huespedes: casa.huespedes,
      minNoches: casa.minNoches || 2, maxNoches: MAX_NOCHES,
      limpiezaSemanal: MARCA.limpiezaSemanal, descuentoSemana: MARCA.descuentoSemana, iva: MARCA.iva,
      bloqueadas: rangos,
    });
  } catch (e) {
    console.error(e);
    json(res, 503, { error: 'No pudimos leer el calendario ahorita. Intenta de nuevo o escríbenos por WhatsApp.' });
  }
}
