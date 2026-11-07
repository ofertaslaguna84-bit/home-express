import {
  CASAS, cors, json, bloqueos, libre, cotizar, esFecha, noches, hoyTorreon, nuevoId, guardarReserva,
  mpActivo, mp, SITE, API, isoTorreon, HOLD_MP_MIN, HOLD_TRANSFER_MIN, MAX_NOCHES, fechaBonita, avisar, resumenReserva,
} from './_lib.js';

export default async function handler(req, res) {
  if (cors(req, res)) return;
  if (req.method !== 'POST') return json(res, 405, { error: 'POST' });
  const b = typeof req.body === 'object' && req.body ? req.body : {};
  const casa = CASAS[b.casa];
  const { llegada, salida } = b;
  const personas = parseInt(b.personas, 10);
  const nombre = String(b.nombre || '').trim().slice(0, 80);
  const telefono = String(b.telefono || '').replace(/\D/g, '').slice(-10);
  const correo = String(b.correo || '').trim().toLowerCase().slice(0, 120);
  const factura = Boolean(b.factura);
  const notas = String(b.notas || '').trim().slice(0, 500);

  if (!casa) return json(res, 400, { error: 'Casa inválida' });
  if (!esFecha(llegada) || !esFecha(salida)) return json(res, 400, { error: 'Fechas inválidas' });
  const hoy = hoyTorreon();
  if (llegada < hoy) return json(res, 400, { error: 'La llegada no puede ser antes de hoy' });
  const n = noches(llegada, salida);
  if (n < (casa.minNoches || 2)) return json(res, 400, { error: `Estancia mínima: ${casa.minNoches || 2} noches` });
  if (n > MAX_NOCHES) return json(res, 400, { error: 'Para estancias de 4 semanas o más cotizamos por WhatsApp' });
  if (!(personas >= 1 && personas <= casa.huespedes)) return json(res, 400, { error: `Máximo ${casa.huespedes} personas` });
  if (nombre.length < 3) return json(res, 400, { error: 'Escribe tu nombre completo' });
  if (telefono.length !== 10) return json(res, 400, { error: 'Teléfono a 10 dígitos' });
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo)) return json(res, 400, { error: 'Correo inválido' });

  let lista;
  try { lista = await bloqueos(casa.slug); } catch { return json(res, 503, { error: 'No pudimos leer el calendario ahorita. Intenta de nuevo en un minuto.' }); }
  if (!libre(llegada, salida, lista)) return json(res, 409, { error: 'Esas fechas ya no están disponibles. Elige otras.' });

  const q = cotizar(casa, llegada, salida, factura);
  const conMP = mpActivo();
  const ahora = Date.now();
  const r = {
    id: nuevoId(), casa: casa.slug, nombreCasa: casa.nombre, llegada, salida, noches: n, personas,
    nombre, telefono, correo, factura, notas, ...q,
    modo: conMP ? 'mercadopago' : 'transferencia', estado: 'pendiente',
    creada: new Date(ahora).toISOString(), expira: new Date(ahora + (conMP ? HOLD_MP_MIN : HOLD_TRANSFER_MIN) * 60e3).toISOString(),
    origen: req.headers.referer || '', ip: (req.headers['x-forwarded-for'] || '').split(',')[0],
  };

  if (conMP) {
    try {
      const pref = await mp('/checkout/preferences', {
        method: 'POST',
        headers: { 'X-Idempotency-Key': r.id },
        body: JSON.stringify({
          items: [{ id: casa.slug, title: `${casa.nombre} · ${n} noches · ${fechaBonita(llegada)} a ${fechaBonita(salida)}`, description: `Renta directa en Hostalia, ${personas} personas`, category_id: 'travels', quantity: 1, unit_price: r.total, currency_id: 'MXN' }],
          payer: { name: nombre, email: correo, phone: { area_code: telefono.slice(0, 3), number: telefono.slice(3) } },
          external_reference: r.id,
          notification_url: `${API}/api/webhook?reserva=${r.id}`,
          back_urls: { success: `${SITE}/reserva/?id=${r.id}`, pending: `${SITE}/reserva/?id=${r.id}`, failure: `${SITE}/reserva/?id=${r.id}&pago=fallo` },
          auto_return: 'approved',
          statement_descriptor: 'HOSTALIA',
          expires: true, expiration_date_from: isoTorreon(ahora), expiration_date_to: isoTorreon(ahora + HOLD_MP_MIN * 60e3),
          /** Solo pagos instantáneos: efectivo (OXXO) tardaría días y las fechas no pueden quedar apartadas tanto. */
          payment_methods: { excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }], installments: 12 },
          metadata: { reserva: r.id, casa: casa.slug },
        }),
      });
      r.mp_preference_id = pref.id; r.mp_url = pref.init_point;
    } catch (e) {
      console.error('MP preferencia', e.message, e.data);
      return json(res, 502, { error: 'Mercado Pago no respondió. Intenta de nuevo o escríbenos por WhatsApp.' });
    }
  }
  await guardarReserva(r);
  avisar(`🏠 Nueva reserva ${r.estado.toUpperCase()} (${r.modo})\n${resumenReserva(r)}\n${API}/?key=…`).catch(() => {});
  json(res, 200, { ok: true, id: r.id, modo: r.modo, total: r.total, url: r.mp_url || `${SITE}/reserva/?id=${r.id}` });
}
