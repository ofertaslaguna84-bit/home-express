import { leerReserva, guardarReserva, mp, mpActivo, avisar, resumenReserva } from './_lib.js';

/** Mercado Pago avisa aquí (notification_url). Siempre contestamos 200 rápido; la verdad se consulta a la API de MP. */
export default async function handler(req, res) {
  const q = req.query || {}; const b = (typeof req.body === 'object' && req.body) || {};
  const tipo = q.type || q.topic || b.type || (b.action || '').split('.')[0];
  const pagoId = (b.data && b.data.id) || q['data.id'] || q.id;
  res.status(200).end('ok');
  if (tipo !== 'payment' || !pagoId || !mpActivo()) return;
  try {
    const p = await mp(`/v1/payments/${pagoId}`);
    await aplicarPago(p);
  } catch (e) { console.error('webhook', e.message); }
}

export async function aplicarPago(p) {
  const id = p.external_reference || (p.metadata && p.metadata.reserva);
  const r = id && (await leerReserva(id));
  if (!r) return null;
  r.pagos = r.pagos || {};
  r.pagos[p.id] = { estado: p.status, detalle: p.status_detail, monto: p.transaction_amount, metodo: p.payment_method_id, fecha: p.date_approved || p.date_created };
  if (p.status === 'approved' && r.estado !== 'pagada') {
    r.estado = 'pagada'; r.pagada_en = p.date_approved || new Date().toISOString(); r.mp_payment_id = p.id; r.monto_pagado = p.transaction_amount;
    await guardarReserva(r);
    await avisar(`✅ PAGADA con Mercado Pago\n${resumenReserva(r)}`);
  } else if (['refunded', 'charged_back', 'cancelled'].includes(p.status) && r.estado === 'pagada') {
    r.estado = 'cancelada'; r.cancelada_por = `mp:${p.status}`;
    await guardarReserva(r);
    await avisar(`⚠️ Pago ${p.status} en Mercado Pago, reserva cancelada\n${resumenReserva(r)}`);
  } else {
    await guardarReserva(r);
  }
  return r;
}
