import { CASAS, todasReservas, leerReserva, guardarReserva, vigente, esFecha, nuevoId, fechaBonita, mxn, json, API } from './_lib.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const okKey = (req) => { const k = process.env.ADMIN_KEY; const q = (req.query && req.query.key) || (req.body && req.body.key); return k && q && q === k; };

/** Panel mínimo para Pedro: lista de reservas, cancelar y bloquear fechas (un bloqueo aquí tapa el sitio y los dos anuncios de Airbnb). */
export default async function handler(req, res) {
  if (!okKey(req)) { res.status(401).setHeader('Content-Type', 'text/html; charset=utf-8'); return res.end('<p style="font-family:sans-serif;padding:40px">Hostalia reservas · falta la llave (?key=…)</p>'); }
  const key = req.query.key || req.body.key;
  let aviso = '';
  if (req.method === 'POST') {
    const b = req.body || {};
    try {
      if (b.accion === 'cancelar') {
        const r = await leerReserva(String(b.id || '').toUpperCase());
        if (!r) throw new Error('No existe ' + b.id);
        r.estado = 'cancelada'; r.cancelada_por = 'admin'; await guardarReserva(r); aviso = `Cancelada ${r.id}`;
      } else if (b.accion === 'bloquear') {
        const casa = CASAS[b.casa];
        if (!casa || !esFecha(b.inicio) || !esFecha(b.fin) || b.fin <= b.inicio) throw new Error('Casa o fechas inválidas');
        const r = { id: nuevoId(), casa: casa.slug, nombreCasa: casa.nombre, llegada: b.inicio, salida: b.fin, noches: 0, personas: 0, nombre: `Bloqueo: ${String(b.nota || '').slice(0, 80)}`, telefono: '', correo: '', total: 0, modo: 'admin', estado: 'bloqueo', creada: new Date().toISOString(), expira: '9999' };
        await guardarReserva(r); aviso = `Bloqueado ${casa.nombre} ${b.inicio} → ${b.fin} (${r.id})`;
      }
    } catch (e) { aviso = 'Error: ' + e.message; }
  }
  const todas = await todasReservas();
  if (req.query.formato === 'json') return json(res, 200, todas);
  const fila = (r) => `<tr class="${esc(r.estado)}${vigente(r) ? '' : ' muerta'}"><td><code>${esc(r.id)}</code></td><td>${esc(r.nombreCasa)}</td><td>${fechaBonita(r.llegada)} → ${fechaBonita(r.salida)}<br><small>${r.noches || ''} ${r.noches ? 'noches' : ''}</small></td><td>${esc(r.nombre)}<br><small>${esc(r.telefono)} · ${esc(r.correo)}</small>${r.notas ? `<br><small><i>${esc(r.notas)}</i></small>` : ''}</td><td>${r.personas || ''}</td><td>${r.total ? mxn(r.total) : ''}${r.factura ? '<br><small>con factura</small>' : ''}</td><td><b>${esc(r.estado)}</b>${r.estado === 'pendiente' && vigente(r) ? `<br><small>aparta hasta ${new Date(r.expira).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })}</small>` : ''}${r.estado === 'pendiente' && !vigente(r) ? '<br><small>expirada</small>' : ''}<br><small>${esc(r.modo)}</small></td><td><small>${new Date(r.creada).toLocaleString('es-MX', { timeZone: 'America/Monterrey' })}</small></td><td>${vigente(r) ? `<form method="post"><input type="hidden" name="key" value="${esc(key)}"><input type="hidden" name="accion" value="cancelar"><input type="hidden" name="id" value="${esc(r.id)}"><button onclick="return confirm('¿Cancelar ${esc(r.id)}? Libera las fechas.')">Cancelar</button></form>` : ''}</td></tr>`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Hostalia · reservas</title>
<style>body{font-family:-apple-system,Segoe UI,sans-serif;margin:0;padding:18px;color:#13203A;background:#F7F5F1}h1{font-size:20px;margin:0 0 12px}table{width:100%;border-collapse:collapse;background:#fff;font-size:13.5px}th,td{padding:8px;border-bottom:1px solid #E8E4DE;text-align:left;vertical-align:top}th{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:#5B6577}tr.pagada td:first-child{border-left:4px solid #1a7f37}tr.pendiente td:first-child{border-left:4px solid #d4a017}tr.bloqueo td:first-child{border-left:4px solid #5B6577}tr.muerta{opacity:.45}small{color:#5B6577}code{font-weight:700}form{display:inline}button{cursor:pointer}.caja{background:#fff;padding:12px 14px;border:1px solid #E8E4DE;margin-bottom:14px;display:flex;gap:10px;flex-wrap:wrap;align-items:end}.caja label{display:flex;flex-direction:column;font-size:12px;color:#5B6577}.caja input,.caja select{padding:6px 8px;font-size:14px}.aviso{background:#FFF6D6;padding:10px 14px;margin-bottom:12px;border:1px solid #F0D98A}.leyenda{font-size:12.5px;color:#5B6577;margin:0 0 12px}</style></head><body>
<h1>Hostalia · reservas directas</h1>
<p class="leyenda">Las <b>pagadas</b>, los <b>bloqueos</b> y las <b>pendientes vigentes</b> apartan fechas en el sitio y en los anuncios de Airbnb (vía iCal, Airbnb tarda hasta 3 h en refrescar). Los calendarios para Airbnb: ${Object.values(CASAS).map((c) => c.listings.map((l) => `<a href="${API}/ical/${l.id}.ics">${esc(c.nombre)} ${l.id.slice(-4)}</a>`).join(' · ')).join(' · ')}</p>
${aviso ? `<div class="aviso">${esc(aviso)}</div>` : ''}
<form class="caja" method="post"><input type="hidden" name="key" value="${esc(key)}"><input type="hidden" name="accion" value="bloquear"><b>Bloquear fechas</b><label>Casa<select name="casa">${Object.values(CASAS).map((c) => `<option value="${c.slug}">${esc(c.nombre)}</option>`).join('')}</select></label><label>Desde (llegada)<input type="date" name="inicio" required></label><label>Hasta (salida)<input type="date" name="fin" required></label><label>Nota<input name="nota" placeholder="mantenimiento, cliente directo…"></label><button>Bloquear</button></form>
<table><thead><tr><th>ID</th><th>Casa</th><th>Fechas</th><th>Huésped</th><th>Pax</th><th>Total</th><th>Estado</th><th>Creada</th><th></th></tr></thead><tbody>${todas.map(fila).join('') || '<tr><td colspan="9">Sin reservas todavía</td></tr>'}</tbody></table>
</body></html>`;
  res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8'); res.setHeader('Cache-Control', 'no-store'); res.end(html);
}
