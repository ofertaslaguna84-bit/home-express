import { cors, json, leerReserva, mp, mpActivo, vigente, SITE, WHATSAPP } from './_lib.js';
import { aplicarPago } from './webhook.js';

/** Estado público de una reserva (página /reserva/). Si sigue pendiente, pregunta a Mercado Pago por si el webhook no llegó. */
export default async function handler(req, res) {
  if (cors(req, res)) return;
  let r = await leerReserva(String(req.query.id || '').toUpperCase());
  if (!r) return json(res, 404, { error: 'No encontramos esa reserva' });
  if (r.estado === 'pendiente' && r.modo === 'mercadopago' && mpActivo()) {
    try {
      const s = await mp(`/v1/payments/search?external_reference=${encodeURIComponent(r.id)}&sort=date_created&criteria=desc`);
      for (const p of s.results || []) { const nuevo = await aplicarPago(p); if (nuevo) r = nuevo; if (r.estado === 'pagada') break; }
    } catch (e) { console.error('estado/mp', e.message); }
  }
  const estado = r.estado === 'pendiente' && !vigente(r) ? 'expirada' : r.estado;
  res.setHeader('Cache-Control', 'no-store');
  json(res, 200, {
    id: r.id, estado, modo: r.modo, casa: r.casa, nombreCasa: r.nombreCasa, llegada: r.llegada, salida: r.salida, noches: r.noches,
    personas: r.personas, nombre: r.nombre.split(' ')[0], total: r.total, iva: r.iva, factura: r.factura, expira: r.expira,
    pagoUrl: estado === 'pendiente' ? r.mp_url : undefined,
    whatsapp: `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hola Hostalia, soy ${r.nombre}. Mi reserva ${r.id} de ${r.nombreCasa} (${r.llegada} al ${r.salida}).`)}`,
    casaUrl: `${SITE}/casas/${r.casa}/`,
  });
}
