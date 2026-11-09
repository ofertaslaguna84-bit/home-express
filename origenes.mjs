/**
 * Páginas "hospedaje en Torreón para quien viene de fuera": por ciudad de origen y por
 * segmento × origen. Salen de origenes.json (distancias reales por carretera) y de casas.json
 * (precios). Devuelve objetos con la misma forma que landings.json, así que build.mjs las
 * maqueta con paginaLanding y entran solas a sitemap, llms.txt y llms-full.txt.
 *
 * Regla: el destino siempre es Torreón. No se crean páginas de Gómez Palacio ni Lerdo.
 */
export const FECHA_ORIGENES = '2026-11-08';
export const HUB_ORIGEN = 'hospedaje-por-ciudad-de-origen';

export function generarOrigenes({ datos, casas, noche, mxn, IVA_NOTA, cercaDe, LIMPIEZA }) {
  const { origenes, segmentos } = datos;
  const casa = (slug) => casas.find((c) => c.slug === slug);
  const lista = (slugs) => slugs.map(casa).filter(Boolean);
  const O = Object.fromEntries(origenes.map((o) => [o.slug, o]));
  const km = (n) => Number(n).toLocaleString('es-MX');
  const mediaHora = (x, modo) => (modo === 'abajo' ? Math.floor(x * 2) / 2 : Math.ceil(x * 2) / 2);
  const fmtH = (h) => (h % 1 ? `${Math.floor(h)}½` : String(h));
  const horas = (o) => {
    const a = mediaHora(o.km / 100, 'abajo');
    const b = Math.max(mediaHora(o.horaMax, 'arriba'), a + 0.5);
    return `entre ${fmtH(a)} y ${fmtH(b)} horas`;
  };
  const porPersona = (c) => Math.round(noche(c) / c.huespedes);
  const porCama = (c) => Math.round(noche(c) / c.camas);
  const minA = (c, prefijo) => {
    for (const lugares of Object.values(cercaDe(c))) {
      const x = lugares.find((l) => l.n.startsWith(prefijo));
      if (x) return x.min;
    }
    return null;
  };
  const salud = (c) => {
    const s = (cercaDe(c)['Salud'] || []).filter((x) => /hospital|sanatorio|centro médico/i.test(x.n));
    return s.length ? `${s[0].n} a ${s[0].min} min` : '—';
  };
  const mes = (c) => (c.precioMesSinServicios ? `${mxn(c.precioMesSinServicios)}${IVA_NOTA}` : 'se cotiza');
  const desde = (cs) => Math.min(...cs.map(noche));
  const de = (o) => (o.slug === 'cdmx' ? 'la Ciudad de México' : o.nombre);
  const DE = (o) => (o.slug === 'cdmx' ? 'La Ciudad de México' : o.nombre);
  const chip = (slug, texto) =>
    `<a href="../${slug}/" class="btn btn-out" style="margin:4px 6px 4px 0;text-transform:none;letter-spacing:0;font-size:13.5px;padding:10px 16px">${texto}</a>`;

  // Qué casas quedan del lado por donde se entra a Torreón
  const LLEGADA = {
    oriente: {
      casas: ['almendros', 'rosita', 'provitec', 'loft-tec'],
      txt: 'Viniendo por la autopista de Saltillo se entra a Torreón por el oriente, así que lo más práctico es quedarse de ese lado: Almendros (a 3 minutos del Parque Industrial Oriente y a 5 de la UA de C), La Rosita (a 6 minutos del Estadio Corona TSM) o, si el trabajo está en el centro o rumbo a Mieleras, Provitec.',
    },
    norte: {
      casas: ['gomez-11', 'linces', 'leones', 'cantera'],
      txt: 'Por la carretera 49 se entra a La Laguna por Gómez Palacio y se cruza a Torreón por el Periférico. Las casas de Los Viñedos (Linces, Leones) salen directo al Periférico y quedan a 7 minutos del aeropuerto; Casa Gómez 11 está en el límite de Torreón con Gómez Palacio.',
    },
    poniente: {
      casas: ['gomez-11', 'linces', 'leones', 'cantera'],
      txt: 'Desde el poniente se entra a La Laguna por Lerdo y Gómez Palacio y se cruza a Torreón. Casa Gómez 11 está en el límite de Torreón con Gómez Palacio, y las casas de Los Viñedos salen directo al Periférico; Cantera, en Senderos, queda a 7 minutos del Parque Industrial Lajat.',
    },
    avion: {
      casas: ['linces', 'leones', 'acacia', 'depa-los-angeles'],
      txt: 'Llegando en avión, lo más cerca del Aeropuerto Internacional de Torreón son las casas de Los Viñedos (Linces, Leones y Acacias), a unos 7 minutos. Si el trabajo está en el centro o cerca de un hospital, el Depa Los Ángeles queda a 3 minutos del Sanatorio Español y a 3 del Paseo Morelos.',
    },
  };

  const tablaPrecios = (cs, extra) => `<table><thead><tr><th>Casa</th><th>Zona</th><th>Personas</th><th>Camas</th><th>Noche${IVA_NOTA}</th>${extra ? `<th>${extra.th}</th>` : ''}<th>Mes sin servicios</th></tr></thead><tbody>${cs
    .map(
      (c) =>
        `<tr><td><a href="../casas/${c.slug}/">${c.nombre}</a></td><td>${c.zona}</td><td>${c.huespedes}</td><td>${c.camas}</td><td>${mxn(noche(c))}</td>${extra ? `<td>${extra.td(c)}</td>` : ''}<td>${mes(c)}</td></tr>`
    )
    .join('')}</tbody></table>`;

  const notaPrecios = `<p>Precios por casa completa, no por persona${IVA_NOTA ? ', más IVA' : ''}. La limpieza es aparte (${mxn(LIMPIEZA)}${IVA_NOTA} por semana). La tarifa por semana no se publica: se cotiza por WhatsApp con tus fechas.</p>`;

  /** {noche:slug} y {mes:slug} en los textos de origenes.json se llenan con el precio real de casas.json. */
  const llenar = (t) =>
    String(t || '').replace(/\{(noche|mes):([a-z0-9-]+)\}/g, (_, k, sl) => {
      const c = casa(sl);
      if (!c) throw new Error(`origenes.json: casa desconocida ${sl}`);
      if (k === 'noche') return `${mxn(noche(c))}${IVA_NOTA}`;
      if (!c.precioMesSinServicios) throw new Error(`origenes.json: ${sl} no tiene precio por mes`);
      return `${mxn(c.precioMesSinServicios)}${IVA_NOTA}`;
    });
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
  const paginas = [];

  // ── 1. Una página por ciudad de origen ──────────────────────────────────
  for (const o of origenes) {
    const ll = LLEGADA[o.llegada];
    const cs = lista(o.casas || [...new Set([...ll.casas, 'provitec', 'rosita', 'almendros', 'grande-14', 'linces', 'acacia'])]).slice(0, 6);
    const segs = segmentos.filter((s) => s.origenes.includes(o.slug));
    const slug = `hospedaje-torreon-desde-${o.slug}`;
    const barata = cs.reduce((a, b) => (porPersona(a) <= porPersona(b) ? a : b));
    paginas.push({
      slug,
      menu: `Desde ${o.nombre}`,
      origen: o.slug,
      titulo: `De ${de(o)} a Torreón: casa amueblada por noche, semana o mes`,
      desc: `Vienes de ${de(o)} a Torreón (${km(o.km)} km, ${horas(o)}). Casas completas para empresas, cuadrillas y familias desde ${mxn(desde(cs))}${IVA_NOTA} la noche, con factura y reserva directa.`,
      eyebrow: `${DE(o)} → Torreón · ${km(o.km)} km`,
      h1: `Hospedaje en Torreón si vienes de ${de(o)}, <em>casa completa</em>.`,
      lead: `De ${de(o)} a Torreón son unos ${km(o.km)} km por carretera, ${horas(o)} de camino. Si vienes por trabajo, por una obra, a un hospital o a un torneo, una casa amueblada completa sale mejor que varios cuartos de hotel: cocina, lavadora, clima y factura.`,
      wa: `Hola Hostalia, vamos de ${de(o)} a Torreón. Somos __ personas, del __ al __. ¿Qué casa nos recomiendan y cuánto sale?`,
      casas: cs.map((c) => c.slug),
      secciones: [
        {
          h2: `¿Qué tan lejos está Torreón de ${de(o)}?`,
          html: `<p>Son <strong>unos ${km(o.km)} km por carretera</strong> y, según paradas y tráfico, <strong>${horas(o)}</strong> de manejo hasta el centro de Torreón. ${o.ruta}</p>${o.vuelo ? `<p><strong>En avión:</strong> ${o.vuelo}</p>` : ''}<p>Ida y vuelta son ${km(o.km * 2)} km, por eso para cualquier trabajo de más de un par de días casi siempre conviene quedarse en Torreón en lugar de regresar.</p>`,
        },
        { h2: `¿Quién viaja de ${de(o)} a Torreón?`, html: `<p>${o.porque}</p><p>${o.consejo}</p>` },
        { h2: `Qué zona de Torreón te conviene llegando desde ${de(o)}`, html: `<p>${ll.txt}</p>` },
        {
          h2: 'Cuánto cuesta quedarse en Torreón',
          html: `<p>Estas son las casas que mejor quedan para quien llega desde ${de(o)}. La más económica por persona es <strong>${barata.nombre}</strong>: ${mxn(noche(barata))}${IVA_NOTA} la noche entre ${barata.huespedes}, unos ${mxn(porPersona(barata))} por persona.</p>${tablaPrecios(cs, { th: 'Por persona', td: (c) => mxn(porPersona(c)) })}${notaPrecios}`,
        },
        ...(segs.length
          ? [
              {
                h2: `Guías para quien viene de ${de(o)}`,
                html: `<p>${segs.map((s) => chip(`${s.slugBase}-${o.slug}`, s.menu)).join('')}${chip(HUB_ORIGEN, 'Todas las ciudades de origen')}</p>`,
              },
            ]
          : [{ h2: 'Más guías', html: `<p>${chip(HUB_ORIGEN, 'Hospedaje por ciudad de origen')}${chip('hospedaje-para-empresas-torreon', 'Hospedaje para empresas')}${chip('casas-amuebladas-renta-por-mes-torreon', 'Renta por mes')}</p>` }]),
      ],
      faqs: [
        { q: `¿Cuántos kilómetros hay de ${de(o)} a Torreón?`, a: `Unos ${km(o.km)} km por carretera, ${horas(o)} de manejo según paradas y tráfico.${o.vuelo ? ` ${o.vuelo}` : ''}` },
        { q: `¿Conviene ir y venir desde ${de(o)} o quedarse en Torreón?`, a: `Ida y vuelta son ${km(o.km * 2)} km al día. ${o.km <= 260 ? 'Se puede para un día suelto, pero para trabajos de varios días el cansancio, las casetas y la gasolina hacen que convenga quedarse.' : 'A esa distancia no es viable ir y venir: lo práctico es quedarse toda la estancia y, si son semanas, cotizar por semana o por mes.'}` },
        { q: '¿Cuánto cuesta por persona?', a: `Depende de la casa y de cuántos sean. Por ejemplo, ${barata.nombre} cuesta ${mxn(noche(barata))}${IVA_NOTA} la noche para ${barata.huespedes} personas, unos ${mxn(porPersona(barata))} por persona. Por mes hay tarifa mucho más baja.` },
        { q: `¿Facturan a empresas de ${o.estado}?`, a: 'Sí. Emitimos CFDI a nombre de cualquier razón social de México, con el IVA desglosado. Nos pasas tus datos fiscales al apartar.' },
        { q: '¿Puedo apartar sin conocer la casa?', a: 'Sí. Si vienes de fuera te mandamos por WhatsApp un video del recorrido de la casa. Se aparta con anticipo por transferencia y firmamos contrato de hospedaje con fechas y monto.' },
      ],
      relacionadas: [...segs.map((s) => `${s.slugBase}-${o.slug}`), HUB_ORIGEN, 'hospedaje-para-empresas-torreon', 'casas-amuebladas-renta-por-mes-torreon'],
      grupo: 'origen',
      publicado: FECHA_ORIGENES,
      actualizado: FECHA_ORIGENES,
    });
  }

  // ── 2. Segmento × origen ────────────────────────────────────────────────
  const COLUMNA = {
    cuadrillas: { th: 'Por cama', td: (c) => mxn(porCama(c)) },
    ingenieros: { th: 'Por persona', td: (c) => mxn(porPersona(c)) },
    medicos: { th: 'Hospital más cercano', td: salud },
    pacientes: { th: 'Hospital más cercano', td: salud },
    deportivos: { th: 'Al Estadio Corona', td: (c) => (minA(c, 'Estadio Corona') ? `${minA(c, 'Estadio Corona')} min` : '—') },
  };
  const PASOS = {
    cuadrillas: (o) => `<ul><li><strong>Nos dices cuántos son y cuántas camas necesitas.</strong> Para cuadrillas contamos camas, no recámaras.</li><li><strong>Te mandamos casa y precio cerrado</strong> por noche, semana o mes, con IVA desglosado.</li><li><strong>Se aparta con anticipo</strong> y la cuadrilla sale de ${de(o)} con la dirección y la hora de entrega.</li><li><strong>Si la obra se alarga</strong>, se extiende la estancia sin volver a hacer contrato nuevo.</li></ul>`,
    ingenieros: (o) => `<ul><li><strong>Fechas de arranque y número de técnicos.</strong> Si el proyecto puede alargarse, te cotizamos por semana o por mes.</li><li><strong>Una sola factura</strong> a nombre de tu empresa, aunque sean varias casas.</li><li><strong>Casa lista al llegar de ${de(o)}</strong>: camas hechas, WiFi y clima funcionando.</li><li><strong>Cambios de turno o de personal</strong> no requieren nueva reserva: la casa es de tu equipo durante la estancia.</li></ul>`,
    medicos: (o) => `<ul><li><strong>Nos dices en qué hospital rotas y por cuánto tiempo.</strong> Te recomendamos la opción más cerca.</li><li><strong>Contrato por el periodo de la rotación</strong>, sin aval ni contrato de un año.</li><li><strong>Si vienen dos o tres residentes de ${de(o)}</strong>, una casa compartida baja el costo por persona.</li><li><strong>Factura</strong> si la necesitas para tu beca o tu institución.</li></ul>`,
    pacientes: (o) => `<ul><li><strong>Nos dices en qué hospital está o se va a atender tu familiar.</strong></li><li><strong>Te mandamos la casa más cercana</strong> y el precio por noche; si el alta se retrasa, se alarga la estancia.</li><li><strong>Mínimo 2 noches</strong>, sin máximo: la familia puede rotar desde ${de(o)} sin cambiar de casa.</li><li><strong>Si alguien no puede subir escaleras</strong>, hay casas con recámara en planta baja.</li></ul>`,
    deportivos: (o) => `<ul><li><strong>Fechas del torneo y número de jugadores, cuerpo técnico y papás.</strong></li><li><strong>Si son muchos, dos casas cercanas</strong> para que el equipo no se disperse.</li><li><strong>Casa lista al llegar de ${de(o)}</strong>, con cocina para preparar la comida antes del partido.</li><li><strong>Factura</strong> a nombre del club, la liga o la escuela.</li></ul>`,
  };
  const FAQ_SEG = {
    cuadrillas: (o, cs, b) => [
      { q: `¿Cuánto cuesta hospedar una cuadrilla de ${de(o)} en Torreón?`, a: `Por casa completa, no por persona. ${b.nombre} tiene ${b.camas} camas y cuesta ${mxn(noche(b))}${IVA_NOTA} la noche, unos ${mxn(porCama(b))} por cama. Por mes la tarifa es mucho más baja; se cotiza con tus fechas.` },
      { q: '¿Cabe la camioneta y la herramienta?', a: 'Todas las casas tienen estacionamiento y varias cochera para dos autos. Dinos cuántos vehículos traen y te decimos cuál conviene.' },
    ],
    ingenieros: (o, cs, b) => [
      { q: `¿Qué casa conviene para técnicos de ${de(o)} que trabajan en planta?`, a: 'Depende de la planta. Provitec queda a 3 minutos de Peñoles, Los Viñedos a 4 de Lala y a 9 del Parque Industrial Lajat, y Almendros a 3 del Parque Industrial Oriente. Dinos la planta y te decimos cuál.' },
      { q: '¿Hay WiFi y lugar para trabajar?', a: 'Todas tienen WiFi. Casa Grande 14 y el Depa Los Ángeles tienen área para trabajar; en las demás se usa el comedor.' },
    ],
    medicos: (o) => [
      { q: `Vengo de ${de(o)} a la residencia, ¿hay contrato sin aval?`, a: 'Sí. Para estancias de 15 días a 6 meses no pedimos aval: contrato de hospedaje con fechas, monto y depósito en garantía que se devuelve al salir.' },
      { q: '¿Qué queda más cerca de los hospitales?', a: 'El Loft Tec queda a 3 minutos del Hospital Ángeles; el Depa Los Ángeles a 3 del Sanatorio Español y del Centro Médico; Provitec a 4 del Sanatorio Español.' },
    ],
    pacientes: (o) => [
      { q: `¿Dónde quedarse en Torreón si vengo de ${de(o)} a un hospital?`, a: 'Lo más cerca del Sanatorio Español son el Depa Los Ángeles (unos 3 minutos) y Provitec (unos 4); del Hospital Ángeles, el Loft Tec (unos 3 minutos). Dinos el hospital y te decimos cuál.' },
      { q: '¿Se puede alargar la estancia si el alta se retrasa?', a: 'Sí, si la casa está libre en esas fechas. Avísanos en cuanto sepas para apartarte las noches extra.' },
    ],
    deportivos: (o) => [
      { q: `¿Cuántos jugadores de ${de(o)} caben en una casa?`, a: 'La Rosita recibe hasta 16 personas, Casa Jardín 14 y Casa Grande 14 hasta 14, y Almendros y Provitec hasta 12. Para equipos grandes se rentan dos casas para las mismas fechas.' },
      { q: '¿Qué queda cerca del Estadio Corona?', a: 'La Rosita y Almendros quedan a unos 6 minutos del Estadio Corona TSM.' },
    ],
  };

  for (const s of segmentos) {
    const padre = s.padre;
    for (const os of s.origenes) {
      const o = O[os];
      const prefer = LLEGADA[o.llegada].casas;
      const combo = datos.combos?.[`${s.key}:${o.slug}`] || '';
      const nombreCorto = (c) => c.nombre.replace(/^Casa /, '');
      const mencionadas = casas.filter((c) => new RegExp(`\\b${nombreCorto(c)}\\b`).test(combo) && c.huespedes >= (s.key === 'medicos' || s.key === 'pacientes' ? 1 : 8));
      const segOrden = lista(s.casas).sort((a, b) => (prefer.includes(b.slug) ? 1 : 0) - (prefer.includes(a.slug) ? 1 : 0));
      const cs = [...new Set([...mencionadas, ...segOrden])].slice(0, 6);
      const b = s.key === 'cuadrillas' ? cs.reduce((x, y) => (porCama(x) <= porCama(y) ? x : y)) : cs.reduce((x, y) => (porPersona(x) <= porPersona(y) ? x : y));
      const slug = `${s.slugBase}-${o.slug}`;
      const otrasCiudades = s.origenes.filter((x) => x !== o.slug);
      const otrosSegs = segmentos.filter((x) => x.key !== s.key && x.origenes.includes(o.slug));
      paginas.push({
        slug,
        menu: `${s.menu} desde ${o.nombre}`,
        origen: o.slug,
        segmento: s.key,
        padre,
        titulo: s.titulo.replace('{o}', de(o)),
        desc: `${s.nombre.charAt(0).toUpperCase() + s.nombre.slice(1)} que viajan de ${de(o)} a Torreón (${km(o.km)} km): casas completas desde ${mxn(desde(cs))}${IVA_NOTA} la noche, por semana o por mes, con factura y reserva directa.`,
        eyebrow: `${s.menu} · ${DE(o)} → Torreón`,
        h1: `${s.titulo.replace('{o}', de(o)).replace(/^Hospedaje en Torreón para /, 'Hospedaje para ').replace(/^Dónde quedarse en Torreón/, 'Dónde quedarse')}, <em>en Torreón</em>.`,
        lead: `${s.necesidad.split(': ')[0].replace(/\.$/, '')}. Para ${s.nombre} que vienen de ${de(o)}, a ${km(o.km)} km, tenemos casas completas en Torreón por noche, semana o mes, con factura.`,
        wa: `Hola Hostalia, somos ${s.nombre} y vamos de ${de(o)} a Torreón. Somos __ personas, del __ al __. ¿Qué casa nos recomiendan?`,
        casas: cs.map((c) => c.slug),
        secciones: [
          { h2: `${s.menu} de ${de(o)} en Torreón: lo que conviene`, html: `<p>${llenar(datos.combos?.[`${s.key}:${o.slug}`])}</p>` },
          { h2: `Qué necesitan ${s.nombre} que vienen de ${de(o)}`, html: `<p>${s.necesidad}</p><p>De ${de(o)} a Torreón son <strong>unos ${km(o.km)} km, ${horas(o)}</strong> por carretera. ${o.ruta.split('. ')[0].replace(/\.$/, '')}.${o.vuelo ? ` ${o.vuelo}` : ''}</p>` },
          { h2: 'Dónde quedarse en Torreón', html: `<p>${s.zona}</p><p>${LLEGADA[o.llegada].txt.split('. ')[0].replace(/\.$/, '')}.</p>` },
          { h2: `Casas y precios para ${s.nombre}`, html: tablaPrecios(cs, COLUMNA[s.key]) + notaPrecios },
          { h2: 'Cómo se organiza la estancia', html: PASOS[s.key](o) + `<p>${o.consejo}</p>` },
          {
            h2: 'Más guías',
            html: `<p>${chip(padre, `${s.menu} en Torreón (guía general)`)}${chip(`hospedaje-torreon-desde-${o.slug}`, `Todo sobre venir desde ${o.nombre}`)}${otrosSegs.map((x) => chip(`${x.slugBase}-${o.slug}`, `${x.menu} desde ${o.nombre}`)).join('')}${chip(HUB_ORIGEN, 'Todas las ciudades de origen')}</p>`,
          },
        ],
        faqs: [
          ...FAQ_SEG[s.key](o, cs, b),
          { q: `¿Qué tan lejos está Torreón de ${de(o)}?`, a: `Unos ${km(o.km)} km por carretera, ${horas(o)} de manejo.` },
          { q: '¿Cuál es la estancia mínima?', a: '2 noches. No hay máxima: hay estancias de hasta 6 meses, y por mes la tarifa es mucho más baja que sumar noches.' },
          { q: '¿Facturan?', a: 'Sí, CFDI a nombre de la persona, empresa o institución que paga, con IVA desglosado.' },
        ],
        relacionadas: [padre, `hospedaje-torreon-desde-${o.slug}`, ...otrosSegs.map((x) => `${x.slugBase}-${o.slug}`), ...otrasCiudades.map((x) => `${s.slugBase}-${x}`), HUB_ORIGEN],
        grupo: 'origen',
        publicado: FECHA_ORIGENES,
        actualizado: FECHA_ORIGENES,
      });
    }
  }

  // ── 3. Extras: por mes para foráneos y personal que rota ─────────────────
  const conMes = casas.filter((c) => c.precioMesSinServicios).sort((a, b) => a.precioMesSinServicios - b.precioMesSinServicios);
  const tablaMes = `<table><thead><tr><th>Casa</th><th>Zona</th><th>Personas</th><th>Mes sin servicios</th><th>Mes con servicios</th><th>Por persona al mes</th></tr></thead><tbody>${conMes
    .map((c) => `<tr><td><a href="../casas/${c.slug}/">${c.nombre}</a></td><td>${c.zona}</td><td>${c.huespedes}</td><td>${mxn(c.precioMesSinServicios)}</td><td>${mxn(c.precioMesConServicios)}</td><td>${mxn(Math.round(c.precioMesConServicios / c.huespedes))}</td></tr>`)
    .join('')}</tbody></table>`;
  const cMes = conMes.reduce((x, y) => (x.precioMesConServicios / x.huespedes <= y.precioMesConServicios / y.huespedes ? x : y));
  const tablaOrigenes = (filtro = () => true) =>
    `<table><thead><tr><th>Vienes de</th><th>Km a Torreón</th><th>Tiempo en carretera</th><th>Guía</th></tr></thead><tbody>${origenes
      .filter(filtro)
      .map((o) => `<tr><td>${DE(o)}, ${o.estado}</td><td>${km(o.km)}</td><td>${horas(o).replace('entre ', '')}</td><td><a href="../hospedaje-torreon-desde-${o.slug}/">Ver guía</a></td></tr>`)
      .join('')}</tbody></table>`;

  paginas.push({
    slug: 'casa-amueblada-por-mes-torreon-trabajadores-foraneos',
    menu: 'Por mes para foráneos',
    titulo: 'Casa amueblada por mes en Torreón para trabajadores foráneos',
    desc: `Casas amuebladas por mes en Torreón para personal que viene de fuera: de ${mxn(conMes[0].precioMesSinServicios)} a ${mxn(conMes.at(-1).precioMesSinServicios)}${IVA_NOTA} al mes sin servicios, sin aval, con factura. De 10 a 16 personas por casa.`,
    eyebrow: 'Renta mensual · personal foráneo',
    h1: 'Casa amueblada por mes en Torreón para tu <em>personal foráneo</em>.',
    lead: 'Si tu empresa trae gente de otra ciudad por uno, tres o seis meses, una casa amueblada por mes sale mucho más barata que pagar noches: ya trae camas, cocina, lavadora, clima y WiFi, y se factura a nombre de la empresa.',
    wa: 'Hola Hostalia, necesito casa amueblada por mes en Torreón para personal foráneo. Somos __ personas, desde el __ por __ meses.',
    casas: conMes.map((c) => c.slug),
    secciones: [
      { h2: '¿Cuánto cuesta una casa amueblada por mes en Torreón?', html: `<p>Las casas con tarifa mensual publicada van de <strong>${mxn(conMes[0].precioMesSinServicios)} a ${mxn(conMes.at(-1).precioMesSinServicios)}${IVA_NOTA} al mes sin servicios</strong>. Con servicios (agua, luz, gas e internet) son ${mxn(3000)} más. Repartido entre quienes caben, la más económica por persona es ${cMes.nombre}: unos ${mxn(Math.round(cMes.precioMesConServicios / cMes.huespedes))} al mes por persona con servicios.</p>${tablaMes}<p>La limpieza semanal se cobra aparte (${mxn(LIMPIEZA)}${IVA_NOTA} por servicio). Las demás casas también se rentan por mes; su tarifa se cotiza por WhatsApp.</p>` },
      { h2: 'Por qué por mes y no por noche', html: '<p>Sumar noches durante un mes da una cifra mucho más alta que la tarifa mensual. Además, por mes la casa queda a nombre de tu equipo: entran y salen personas sin volver a reservar, y no hay que hacer check-in cada semana.</p><ul><li><strong>Sin aval</strong> ni contrato de un año: contrato de hospedaje por el periodo que necesites, de 1 a 6 meses.</li><li><strong>Factura CFDI</strong> mensual a nombre de la empresa.</li><li><strong>Depósito en garantía</strong> que se devuelve al salir.</li></ul>' },
      { h2: 'De dónde viene el personal foráneo', html: `<p>Lo que más se ve en Torreón es personal que llega por carretera desde el norte y el centro del país. Esta tabla te sirve para planear la llegada; cada guía trae qué zona de Torreón conviene según por dónde entras.</p>${tablaOrigenes()}` },
    ],
    faqs: [
      { q: '¿Cuánto cuesta rentar una casa amueblada por mes en Torreón?', a: `En Hostalia, de ${mxn(conMes[0].precioMesSinServicios)} a ${mxn(conMes.at(-1).precioMesSinServicios)}${IVA_NOTA} al mes sin servicios; con agua, luz, gas e internet incluidos, ${mxn(3000)} más. Las demás casas se cotizan por WhatsApp.` },
      { q: '¿Piden aval?', a: 'No. Para estancias de 15 días a 6 meses se firma contrato de hospedaje y se deja un depósito en garantía que se devuelve al salir.' },
      { q: '¿Se puede facturar cada mes?', a: 'Sí, CFDI mensual a nombre de la empresa, con IVA desglosado.' },
      { q: '¿Qué pasa si el proyecto se alarga?', a: 'Se extiende el contrato si la casa sigue libre. Avísanos con tiempo para apartarte el siguiente mes.' },
    ],
    relacionadas: [HUB_ORIGEN, 'casas-amuebladas-renta-por-mes-torreon', 'hospedaje-para-empresas-torreon', 'hospedaje-torreon-personal-que-rota-por-semana', 'hospedaje-torreon-desde-monterrey', 'hospedaje-torreon-desde-saltillo', 'hospedaje-torreon-desde-chihuahua'],
    grupo: 'origen',
    publicado: FECHA_ORIGENES,
    actualizado: FECHA_ORIGENES,
  });

  const grandes = casas.filter((c) => c.huespedes >= 10).sort((a, b) => porCama(a) - porCama(b)).slice(0, 6);
  paginas.push({
    slug: 'hospedaje-torreon-personal-que-rota-por-semana',
    menu: 'Personal que rota',
    titulo: 'Hospedaje en Torreón para personal que rota por semana o por turno',
    desc: 'Casa fija en Torreón para cuadrillas y técnicos que rotan: entra un grupo y sale otro sin volver a reservar. Por semana o por mes, con factura, de 10 a 16 personas por casa.',
    eyebrow: 'Rotación de personal · Torreón',
    h1: 'Una casa fija en Torreón para el personal que <em>rota</em>.',
    lead: 'Cuando tu gente trabaja por turnos o rota cada semana (sale uno, entra otro), reservar hotel cada vez es un desgaste. Con una casa fija por semana o por mes, el lugar es de tu equipo y solo cambian las personas.',
    wa: 'Hola Hostalia, tengo personal que rota por semana en Torreón. Necesito casa fija para __ personas desde el __.',
    casas: grandes.map((c) => c.slug),
    secciones: [
      { h2: 'Cómo funciona una casa para personal que rota', html: '<ul><li><strong>Apartas la casa por semana o por mes</strong>, no por persona.</li><li><strong>Entran y salen las personas que tú decidas</strong>, sin hacer reserva nueva ni check-in cada vez.</li><li><strong>La limpieza semanal</strong> se coordina con el cambio de grupo, para que el que llega encuentre la casa lista.</li><li><strong>Una sola factura</strong> por el periodo, a nombre de la empresa.</li></ul>' },
      { h2: 'Qué casas aguantan mejor la rotación', html: `<p>Para rotación conviene contar camas, porque quien llega cansado de un turno quiere su propia cama. Estas son las casas de 10 personas o más ordenadas por costo por cama:</p>${tablaPrecios(grandes, { th: 'Por cama', td: (c) => mxn(porCama(c)) })}${notaPrecios}` },
      { h2: 'Si tu personal viene de fuera', html: `<p>Si el equipo que rota viaja desde otra ciudad, la distancia define cuántas noches de llegada hay que contar:</p>${tablaOrigenes((o) => o.llegada !== 'avion')}` },
    ],
    faqs: [
      { q: '¿Puedo cambiar a las personas que se hospedan sin hacer nueva reserva?', a: 'Sí. La casa se aparta a nombre de la empresa por el periodo; solo nos avisas quién entra para la entrega de llaves.' },
      { q: '¿Cada cuánto se limpia?', a: `La limpieza es obligatoria, una vez por semana, y se cobra aparte: ${mxn(LIMPIEZA)}${IVA_NOTA} por servicio. Se puede coordinar con el día del cambio de grupo.` },
      { q: '¿Conviene por semana o por mes?', a: 'Si la rotación va a durar más de tres semanas, casi siempre conviene por mes. La tarifa por semana se cotiza por WhatsApp.' },
    ],
    relacionadas: [HUB_ORIGEN, 'hospedaje-cuadrillas-construccion-torreon', 'hospedaje-ingenieros-tecnicos-planta-torreon', 'casa-amueblada-por-mes-torreon-trabajadores-foraneos', 'casas-amuebladas-por-semana-torreon'],
    grupo: 'origen',
    publicado: FECHA_ORIGENES,
    actualizado: FECHA_ORIGENES,
  });

  // ── 4. Hub ──────────────────────────────────────────────────────────────
  const hubCasas = lista(['rosita', 'provitec', 'almendros', 'linces', 'grande-14', 'acacia']);
  paginas.unshift({
    slug: HUB_ORIGEN,
    menu: 'Por ciudad de origen',
    titulo: 'Hospedaje en Torreón por ciudad de origen: distancias, zonas y precios',
    desc: `Si vienes a Torreón desde Monterrey, Saltillo, Chihuahua, Durango, Zacatecas, CDMX u otra ciudad: kilómetros, horas de camino, qué zona te conviene y casas desde ${mxn(desde(hubCasas))}${IVA_NOTA} la noche.`,
    eyebrow: 'Hospedaje por ciudad de origen',
    h1: 'Vienes a Torreón de otra ciudad: <em>aquí te quedas</em>.',
    lead: 'Guías para quien viaja a Torreón por trabajo, obra, salud o torneo: cuántos kilómetros son desde tu ciudad, por dónde entras, qué zona de Torreón te queda mejor y cuánto cuesta una casa completa.',
    wa: 'Hola Hostalia, vamos a Torreón desde __. Somos __ personas, del __ al __. ¿Qué casa nos recomiendan?',
    casas: hubCasas.map((c) => c.slug),
    secciones: [
      { h2: '¿De qué ciudad vienes?', html: `<p>Distancias por carretera al centro de Torreón. El tiempo va de manejo continuo por autopista a un ritmo con paradas.</p>${tablaOrigenes()}` },
      ...segmentos.map((s) => ({
        h2: `${s.menu} que vienen de fuera`,
        html: `<p>${s.necesidad}</p><p>${s.origenes.map((x) => chip(`${s.slugBase}-${x}`, `Desde ${O[x].nombre}`)).join('')}${chip(s.padre, 'Guía general')}</p>`,
      })),
      { h2: 'Estancias largas y personal que rota', html: `<p>${chip('casa-amueblada-por-mes-torreon-trabajadores-foraneos', 'Casa por mes para foráneos')}${chip('hospedaje-torreon-personal-que-rota-por-semana', 'Personal que rota por semana')}${chip('hospedaje-para-empresas-torreon', 'Hospedaje para empresas')}</p>` },
    ],
    faqs: [
      { q: '¿De qué ciudades viene más gente a hospedarse en Torreón?', a: 'Por cercanía, de Saltillo, Durango, Monterrey, Chihuahua y Zacatecas por carretera, y de la Ciudad de México en avión. En esta página está la guía de cada una.' },
      { q: '¿Qué zona de Torreón conviene si vengo de fuera?', a: 'Depende de por dónde entras y a qué vienes. Desde Saltillo y Monterrey se entra por el oriente (Almendros, La Rosita, Provitec); desde Durango, Zacatecas y Chihuahua por Gómez Palacio y el Periférico (Los Viñedos, Gómez 11); en avión, lo más cercano al aeropuerto son las casas de Los Viñedos, a unos 7 minutos.' },
      { q: '¿Las casas están en Torreón?', a: 'Sí, todas las casas de Hostalia están en Torreón, Coahuila.' },
      { q: '¿Cómo reservo si estoy en otra ciudad?', a: 'Por WhatsApp: te mandamos video del recorrido, apartas con anticipo por transferencia y firmamos contrato de hospedaje. La dirección exacta se da al apartar.' },
    ],
    relacionadas: ['hospedaje-para-empresas-torreon', 'casas-amuebladas-renta-por-mes-torreon', 'hospedaje-cuadrillas-construccion-torreon', 'hospedaje-ingenieros-tecnicos-planta-torreon', 'hospedaje-medicos-residentes-torreon', 'hospedaje-equipos-deportivos-torneos-torreon'],
    grupo: 'origen',
    publicado: FECHA_ORIGENES,
    actualizado: FECHA_ORIGENES,
  });

  return paginas;
}
