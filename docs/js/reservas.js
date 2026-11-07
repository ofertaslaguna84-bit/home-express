/* Hostalia · widget de reserva directa. Lee disponibilidad de reservas.hostalia.com.mx (iCal de Airbnb + reservas propias). */
(function () {
  var el = document.getElementById('reservar'); if (!el) return;
  var API = el.getAttribute('data-api') || 'https://reservas.hostalia.com.mx';
  var casa = el.getAttribute('data-casa');
  var css = '.rsv{margin:16px 0 6px}.rsv h3{font-size:15px;margin:0 0 8px;font-weight:800}.rsv-cal{border:1px solid var(--linea,#E8E4DE);padding:10px;background:#fff}.rsv-nav{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-weight:700;font-size:14px}.rsv-nav button{border:1px solid var(--linea,#E8E4DE);background:#fff;width:30px;height:30px;cursor:pointer;font-size:16px;line-height:1}.rsv-nav button:disabled{opacity:.3;cursor:default}.rsv-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px;text-align:center}.rsv-grid .d{font-size:10.5px;color:#5B6577;padding:2px 0;letter-spacing:.04em}.rsv-grid button{border:0;background:#fff;font:inherit;font-size:13px;padding:7px 0;cursor:pointer;border-radius:3px;color:#13203A}.rsv-grid button.no{color:#C3C8D2;text-decoration:line-through;cursor:not-allowed;background:#FAF9F7}.rsv-grid button.sel{background:#13203A;color:#fff;font-weight:700}.rsv-grid button.en{background:#F4EDE0}.rsv-grid button:not(.no):not(.sel):hover{background:#EEF1F6}.rsv-grid button.hoy{box-shadow:inset 0 0 0 1px #13203A}.rsv-grid button.co{cursor:pointer;color:#13203A;text-decoration:none;background:#fff}.rsv-sel{display:flex;gap:8px;margin:10px 0 0;font-size:13px}.rsv-sel div{flex:1;border:1px solid var(--linea,#E8E4DE);padding:7px 9px}.rsv-sel small{display:block;color:#5B6577;font-size:10.5px;text-transform:uppercase;letter-spacing:.06em}.rsv-sel b{font-size:13.5px}.rsv-msg{font-size:13px;color:#8A6A2F;margin-top:8px;min-height:1em}.rsv-cot{margin-top:12px;font-size:13.5px}.rsv-cot div{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--linea,#E8E4DE)}.rsv-cot .tot{font-weight:800;font-size:16px;border:0;padding-top:8px}.rsv-form{display:grid;gap:8px;margin-top:12px}.rsv-form input,.rsv-form select,.rsv-form textarea{width:100%;box-sizing:border-box;padding:10px 11px;border:1px solid var(--linea,#E8E4DE);font:inherit;font-size:14px;background:#fff}.rsv-form label.ck{display:flex;gap:8px;align-items:flex-start;font-size:13px;color:#5B6577;cursor:pointer}.rsv-form label.ck input{width:auto;margin-top:3px}.rsv-pagar{width:100%;justify-content:center;background:#009EE3!important;box-shadow:0 4px 14px rgba(0,158,227,.3)!important}.rsv-pagar:disabled{opacity:.6;cursor:wait}.rsv-err{color:#B42318;font-size:13px}.rsv-nota{font-size:12px;color:#5B6577;margin-top:8px;text-align:center}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MES3 = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var iso = function (y, m, d) { return y + '-' + pad(m + 1) + '-' + pad(d); };
  var ms = function (s) { return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)); };
  var suma = function (s, n) { var t = new Date(ms(s) + n * 864e5); return iso(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()); };
  var noches = function (a, b) { return Math.round((ms(b) - ms(a)) / 864e5); };
  var finde = function (s) { var d = new Date(ms(s)).getUTCDay(); return d === 5 || d === 6; };
  var bonita = function (s) { return +s.slice(8, 10) + ' ' + MES3[+s.slice(5, 7) - 1]; };
  var mxn = function (n) { return '$' + Number(n).toLocaleString('es-MX'); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var S = { datos: null, llegada: null, salida: null, y: 0, m: 0, msg: '', err: '', enviando: false, factura: false };
  var form = { personas: '', nombre: '', telefono: '', correo: '', notas: '' };

  function nocheLibre(d) {
    if (d < S.datos.hoy) return false;
    var b = S.datos.bloqueadas;
    for (var i = 0; i < b.length; i++) if (b[i][0] <= d && d < b[i][1]) return false;
    return true;
  }
  function puedeSalir(d) { // todas las noches entre llegada y d-1 libres y dentro del máximo
    if (!S.llegada || d <= S.llegada) return false;
    var n = noches(S.llegada, d); if (n > S.datos.maxNoches) return false;
    for (var x = S.llegada; x < d; x = suma(x, 1)) if (!nocheLibre(x)) return false;
    return true;
  }
  function cotizar() {
    var D = S.datos, n = noches(S.llegada, S.salida), hosp = 0;
    for (var x = S.llegada; x < S.salida; x = suma(x, 1)) hosp += finde(x) ? D.precioFinde : D.precioNoche;
    var desc = n >= 7 ? Math.round(hosp * D.descuentoSemana) : 0;
    var limp = D.limpiezaSemanal * Math.ceil(n / 7);
    var sub = hosp - desc + limp, iva = S.factura ? Math.round(sub * D.iva) : 0;
    return { n: n, hosp: hosp, desc: desc, limp: limp, sub: sub, iva: iva, total: sub + iva };
  }

  function clickDia(d) {
    S.msg = ''; S.err = '';
    if (!S.llegada || (S.llegada && S.salida)) {
      if (!nocheLibre(d)) { S.msg = 'Esa noche ya está ocupada'; return render(); }
      S.llegada = d; S.salida = null; S.msg = 'Ahora elige el día de salida';
    } else if (d <= S.llegada) {
      if (!nocheLibre(d)) { S.msg = 'Esa noche ya está ocupada'; return render(); }
      S.llegada = d;
    } else if (puedeSalir(d)) {
      if (noches(S.llegada, d) < S.datos.minNoches) { S.msg = 'Estancia mínima: ' + S.datos.minNoches + ' noches'; return render(); }
      S.salida = d;
    } else {
      S.msg = noches(S.llegada, d) > S.datos.maxNoches ? 'Para 4 semanas o más cotizamos por WhatsApp' : 'Hay noches ocupadas en medio; elige otra salida';
    }
    render();
  }

  function calendario() {
    var D = S.datos, y = S.y, m = S.m, prim = new Date(Date.UTC(y, m, 1)), dias = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    var off = (prim.getUTCDay() + 6) % 7; // lunes primero
    var hoyY = +D.hoy.slice(0, 4), hoyM = +D.hoy.slice(5, 7) - 1;
    var h = '<div class="rsv-nav"><button type="button" data-nav="-1" aria-label="Mes anterior"' + (y === hoyY && m === hoyM ? ' disabled' : '') + '>‹</button><span>' + MESES[m] + ' ' + y + '</span><button type="button" data-nav="1" aria-label="Mes siguiente">›</button></div><div class="rsv-grid">';
    'L,M,X,J,V,S,D'.split(',').forEach(function (d) { h += '<span class="d">' + d + '</span>'; });
    for (var i = 0; i < off; i++) h += '<span></span>';
    for (var d = 1; d <= dias; d++) {
      var f = iso(y, m, d), cl = [];
      var libre = nocheLibre(f);
      if (f === D.hoy) cl.push('hoy');
      if (f === S.llegada || f === S.salida) cl.push('sel');
      else if (S.llegada && S.salida && f > S.llegada && f < S.salida) cl.push('en');
      if (!libre) { if (S.llegada && !S.salida && puedeSalir(f)) cl.push('co'); else cl.push('no'); }
      h += '<button type="button" data-dia="' + f + '" class="' + cl.join(' ') + '">' + d + '</button>';
    }
    return h + '</div>';
  }

  function render() {
    var D = S.datos;
    if (!D) { el.innerHTML = '<h3>Reserva en línea</h3><p class="rsv-msg">' + (S.err || 'Cargando disponibilidad…') + '</p>'; return; }
    var h = '<h3>Reserva en línea</h3><div class="rsv-cal">' + calendario() + '</div>';
    h += '<div class="rsv-sel"><div><small>Llegada</small><b>' + (S.llegada ? bonita(S.llegada) : '—') + '</b></div><div><small>Salida</small><b>' + (S.salida ? bonita(S.salida) : '—') + '</b></div></div>';
    h += '<p class="rsv-msg">' + esc(S.msg || (S.llegada ? '' : 'Elige tu día de llegada')) + '</p>';
    if (S.llegada && S.salida) {
      var c = cotizar();
      h += '<div class="rsv-cot"><div><span>' + c.n + ' noches × ' + mxn(D.precioNoche) + '</span><b>' + mxn(c.hosp) + '</b></div>';
      if (c.desc) h += '<div><span>Descuento por semana (' + Math.round(D.descuentoSemana * 100) + '%)</span><b>−' + mxn(c.desc) + '</b></div>';
      h += '<div><span>Limpieza (' + Math.ceil(c.n / 7) + (c.n > 7 ? ' semanas' : ' vez') + ')</span><b>' + mxn(c.limp) + '</b></div>';
      if (S.factura) h += '<div><span>IVA 16%</span><b>' + mxn(c.iva) + '</b></div>';
      h += '<div class="tot"><span>Total</span><b>' + mxn(c.total) + ' MXN</b></div></div>';
      var ops = ''; for (var p = 1; p <= D.huespedes; p++) ops += '<option value="' + p + '"' + (String(p) === form.personas ? ' selected' : '') + '>' + p + ' persona' + (p > 1 ? 's' : '') + '</option>';
      h += '<form class="rsv-form"><select name="personas" required><option value="">¿Cuántas personas?</option>' + ops + '</select>' +
        '<input name="nombre" placeholder="Nombre completo" required minlength="3" value="' + esc(form.nombre) + '">' +
        '<input name="telefono" type="tel" placeholder="WhatsApp a 10 dígitos" required pattern="[0-9 ]{10,14}" value="' + esc(form.telefono) + '">' +
        '<input name="correo" type="email" placeholder="Correo (ahí llega tu comprobante)" required value="' + esc(form.correo) + '">' +
        '<textarea name="notas" rows="2" placeholder="Hora de llegada, empresa, algo que debamos saber (opcional)">' + esc(form.notas) + '</textarea>' +
        '<label class="ck"><input type="checkbox" name="factura"' + (S.factura ? ' checked' : '') + '> Necesito factura (se agrega el 16% de IVA; después de pagar nos mandas tus datos fiscales)</label>' +
        (S.err ? '<p class="rsv-err">' + esc(S.err) + '</p>' : '') +
        '<button class="btn btn-wa rsv-pagar" type="submit"' + (S.enviando ? ' disabled' : '') + '>' + (S.enviando ? 'Un momento…' : 'Pagar ' + mxn(c.total) + ' con Mercado Pago') + '</button>' +
        '<p class="rsv-nota">Tarjeta de crédito, débito o saldo de Mercado Pago. Las fechas quedan apartadas 2 horas mientras pagas. Confirmación inmediata.</p></form>';
    }
    el.innerHTML = h;
  }

  el.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.dia) return clickDia(b.dataset.dia);
    if (b.dataset.nav) { var t = new Date(Date.UTC(S.y, S.m + +b.dataset.nav, 1)); S.y = t.getUTCFullYear(); S.m = t.getUTCMonth(); render(); }
  });
  el.addEventListener('input', function (e) { var t = e.target; if (t.name in form) form[t.name] = t.value; });
  el.addEventListener('change', function (e) { if (e.target.name === 'factura') { S.factura = e.target.checked; render(); } if (e.target.name === 'personas') form.personas = e.target.value; });
  el.addEventListener('submit', function (e) {
    e.preventDefault(); if (S.enviando) return;
    S.err = ''; S.enviando = true; render();
    var cuerpo = { casa: casa, llegada: S.llegada, salida: S.salida, personas: form.personas, nombre: form.nombre, telefono: form.telefono, correo: form.correo, notas: form.notas, factura: S.factura };
    fetch(API + '/api/reservar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (x) { if (!x.ok) throw new Error(x.j.error || 'No se pudo crear la reserva'); window.location.href = x.j.url; })
      .catch(function (err) { S.enviando = false; S.err = err.message; render(); if (/disponibles/.test(err.message)) cargar(); });
  });

  function cargar() {
    fetch(API + '/api/disponibilidad?casa=' + encodeURIComponent(casa))
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error) throw new Error(d.error);
        S.datos = d; S.y = +d.hoy.slice(0, 4); S.m = +d.hoy.slice(5, 7) - 1;
        if (S.llegada && S.salida && !puedeSalir(S.salida)) { S.llegada = S.salida = null; }
        render();
      })
      .catch(function (e) { S.err = e.message + ' · Reserva por WhatsApp mientras tanto.'; render(); });
  }
  render(); cargar();
})();
