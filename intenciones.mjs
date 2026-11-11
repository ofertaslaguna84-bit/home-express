/**
 * Páginas de intención: uso × zona, zonas nuevas, temporadas y guías comparativas (GEO).
 * Devuelven objetos con la misma forma que landings.json, así que build.mjs las maqueta con
 * paginaLanding y entran solas a sitemap, llms.txt, llms-full.txt y al hub /zonas/.
 *
 * Reglas: todos los números salen de casas.json y lugares.json; nada de nombres de clientes;
 * la calle de las casas nunca se publica, solo la colonia.
 */
export const FECHA_INTENCIONES = '2026-11-11';

export function generarIntenciones({ casas, lugares, noche, finde, mxn, IVA_NOTA, LIMPIEZA, HOY }) {
  const paginas = [];
  const zonaKey = (c) => lugares.casaZona[c.slug] || 'torreon';
  const cercaDe = (c) => lugares.cerca[zonaKey(c)] || {};
  const cercaZona = (z) => lugares.cerca[z] || {};
  const casasZona = (z) => casas.filter((c) => zonaKey(c) === z);
  const porPersona = (c) => Math.round(noche(c) / c.huespedes);
  const porCama = (c) => Math.round(noche(c) / c.camas);
  const conAlberca = (c) => c.destacados.some((d) => /alberca/i.test(d)) || /alberca/i.test(c.resumen);
  const conAsador = (c) => c.destacados.some((d) => /asador|palapa/i.test(d)) || /asador|palapa/i.test(c.resumen);
  const plantaBaja = (c) => c.destacados.some((d) => /planta baja/i.test(d)) || /planta baja/i.test(c.resumen);
  const mes = (c) => (c.precioMesSinServicios ? `${mxn(c.precioMesSinServicios)}${IVA_NOTA}` : 'se cotiza');
  const lista = (slugs) => slugs.map((s) => casas.find((c) => c.slug === s)).filter(Boolean);
  const chip = (slug, txt) => `<a href="../${slug}/" class="btn btn-out" style="margin:4px 6px 4px 0;text-transform:none;letter-spacing:0;font-size:13.5px;padding:10px 16px">${txt}</a>`;
  const ficha = (c) => `<a href="../casas/${c.slug}/">${c.nombre}</a>`;
  const y = (arr) => arr.join(', ').replace(/, ([^,]*)$/, ' y $1');
  const notaPrecios = `<p style="font-size:13px;color:var(--gris)">Precios por casa completa, por noche, reservando directo${IVA_NOTA}. Limpieza obligatoria aparte: ${mxn(LIMPIEZA)}${IVA_NOTA} por semana. Por semana y por mes el precio baja: se cotiza con tus fechas.</p>`;

  /** Minutos desde la zona de la casa a un lugar cuyo nombre empiece así (o null). */
  const minA = (c, ...prefijos) => {
    for (const cat of Object.values(cercaDe(c))) {
      for (const p of prefijos) {
        const x = cat.find((l) => l.n.toLowerCase().startsWith(p.toLowerCase()));
        if (x) return x.min;
      }
    }
    return null;
  };
  const minZona = (z, ...prefijos) => {
    for (const cat of Object.values(cercaZona(z))) {
      for (const p of prefijos) {
        const x = cat.find((l) => l.n.toLowerCase().startsWith(p.toLowerCase()));
        if (x) return x.min;
      }
    }
    return null;
  };
  const lugaresDe = (z, categoria, n = 3) => (cercaZona(z)[categoria] || []).slice(0, n);
  const fmtLugares = (items) => y(items.map((l) => `${l.n.replace(/ de$/, '')} (${l.min} min)`));

  /** Tabla comparativa de casas con una columna extra según el uso. */
  const tabla = (cs, extra) => `<table class="tabla"><thead><tr><th>Casa</th><th>Personas</th><th>Recámaras</th><th>Por noche</th><th>Por mes</th>${extra ? `<th>${extra.th}</th>` : ''}</tr></thead><tbody>${cs
    .map(
      (c) =>
        `<tr><td>${ficha(c)}<br><small style="color:var(--gris)">${c.zona}</small></td><td>${c.huespedes}</td><td>${c.recamaras}${c.banos ? ` · ${c.banos} baños` : ''}</td><td>${mxn(noche(c))}${IVA_NOTA}</td><td>${mes(c)}</td>${extra ? `<td>${extra.td(c)}</td>` : ''}</tr>`
    )
    .join('')}</tbody></table>`;

  // ── Zonas: cómo es cada una, en palabras propias ─────────────────────────────────────
  const ZONAS = {
    vinedos: {
      slug: 'los-vinedos',
      nombre: 'Los Viñedos',
      corto: 'Viñedos',
      como: 'Los Viñedos es el fraccionamiento de casas con alberca al oriente de Torreón: privadas con acceso controlado, calles tranquilas y salida rápida al Periférico. De ahí se llega en pocos minutos a la planta de Lala, al aeropuerto y al Parque Industrial Lajat, y Galerías Laguna queda a seis minutos para el súper y los restaurantes.',
      industria: ['Lala', 'Parque Industrial Lajat', 'Aeropuerto'],
    },
    senderos: {
      slug: 'senderos',
      nombre: 'Residencial Senderos y La Cantera',
      corto: 'Senderos',
      como: 'Senderos es la zona nueva del norte de Torreón: fraccionamientos recientes, Costco a tres minutos, la Universidad Iberoamericana al lado y restaurantes a la mano. Es la salida natural hacia el Parque Industrial Lajat y hacia la carretera a Saltillo y Monterrey.',
      industria: ['Parque Industrial Lajat', 'Lala', 'Aeropuerto'],
    },
    provitec: {
      slug: 'provitec',
      nombre: 'Provitec',
      corto: 'Provitec',
      como: 'Provitec está a un costado del Instituto Tecnológico de La Laguna y a cinco minutos del centro: es la zona más céntrica de Hostalia. Peñoles, la Cruz Roja y el Sanatorio Español quedan a tres o cuatro minutos, el Bosque Venustiano Carranza a tres y el Tec de Monterrey a diez.',
      industria: ['Peñoles', 'Central de Autobuses', 'Aeropuerto'],
    },
    alebrijes: {
      slug: 'alebrijes-residencial',
      nombre: 'Alebrijes Residencial',
      corto: 'Alebrijes',
      como: 'Alebrijes Residencial es un fraccionamiento cerrado nuevo rumbo a la antigua carretera a San Pedro, al norte de Torreón, a cuatro minutos del Parque Industrial Lajat y a siete de Lala. Costco y los restaurantes de Senderos quedan a cinco o seis minutos; Galerías Laguna a nueve.',
      industria: ['Parque Industrial Lajat', 'Lala', 'Aeropuerto'],
    },
    alicante: {
      slug: 'senderos-de-alicante',
      nombre: 'Senderos de Alicante',
      corto: 'Alicante',
      como: 'Senderos de Alicante es una cerrada con caseta de vigilancia, área verde y juegos infantiles en Ampliación Senderos, al norte de la ciudad. Es de las zonas más tranquilas para familias: Costco a seis minutos, la Ibero a siete y el Parque Industrial Lajat a ocho.',
      industria: ['Parque Industrial Lajat', 'Lala', 'Aeropuerto'],
    },
    santorini: {
      slug: 'villas-santorini',
      nombre: 'Villas Santorini',
      corto: 'Santorini',
      como: 'Villas Santorini está a cinco minutos de Galerías Laguna y de la Feria de Torreón, al oriente de la ciudad, con el aeropuerto a nueve minutos y Lala a siete. Fraccionamiento cerrado, casas nuevas y todo lo del día a día a menos de diez minutos.',
      industria: ['Lala', 'Aeropuerto', 'Parque Industrial Lajat'],
    },
    almendros: {
      slug: 'los-almendros',
      nombre: 'Los Almendros',
      corto: 'Almendros',
      como: 'Los Almendros está al sur-oriente de Torreón, a tres minutos del Parque Industrial Oriente, a cinco de Ciudad Universitaria de la UA de C y a seis del Estadio Corona. Es la zona que conviene si el trabajo o el evento está por el Periférico sur y la salida a la carretera a San Pedro.',
      industria: ['Parque Industrial Oriente', 'Parque Industrial Ferropuerto', 'Central de Autobuses'],
    },
    gomez: {
      slug: 'limite-con-gomez-palacio',
      nombre: 'límite Torreón – Gómez Palacio',
      corto: 'límite con Gómez',
      como: 'Son casas en Torreón pero a un paso del puente a Gómez Palacio: el centro de Gómez queda a ocho minutos, el Paseo Morelos a nueve y Peñoles a trece. Conviene a quien trabaja o tiene familia en Gómez o Lerdo y quiere la oferta de Torreón sin cruzar el río todos los días.',
      industria: ['Peñoles', 'Aeropuerto', 'Central de Autobuses'],
    },
    torreon: {
      slug: 'torreon-centro-y-poniente',
      nombre: 'Torreón, centro y poniente',
      corto: 'centro-poniente',
      como: 'Casas en colonias consolidadas del centro-poniente de Torreón: el aeropuerto a cinco minutos, la Central de Autobuses a seis, Peñoles a siete y el Bosque Venustiano Carranza a cuatro. Para quien quiere estar cerca de todo y no depender del Periférico.',
      industria: ['Peñoles', 'Aeropuerto', 'Central de Autobuses'],
    },
    rosita: {
      slug: 'ampliacion-la-rosita',
      nombre: 'Ampliación La Rosita',
      corto: 'La Rosita',
      como: 'Ampliación La Rosita está al sur de Torreón, a seis minutos de Ciudad Universitaria y del Estadio Corona, y a nueve del Parque Industrial Oriente. Es donde está la casa más grande de Hostalia, para dieciséis personas.',
      industria: ['Parque Industrial Oriente', 'Central de Autobuses', 'Parque Industrial Mieleras'],
    },
    tec: {
      slug: 'zona-tec-de-monterrey',
      nombre: 'zona Tec de Monterrey',
      corto: 'zona Tec',
      como: 'La zona del Tec de Monterrey Campus Laguna, al sur de la ciudad, tiene el Hospital Ángeles a tres minutos, Intermall a tres y la Central de Autobuses a siete. Es la zona médica y universitaria de Torreón.',
      industria: ['Central de Autobuses', 'Peñoles', 'Aeropuerto'],
    },
  };

  /** Casas para una zona y un uso: primero las de la zona, luego las que mejor caben (capacidad), máximo 5. */
  const casasPara = (z, filtro, minPax = 1, n = 5) => {
    const dentro = casasZona(z).filter((c) => c.huespedes >= minPax && filtro(c));
    const fuera = casas.filter((c) => zonaKey(c) !== z && c.huespedes >= minPax && filtro(c)).sort((a, b) => b.huespedes - a.huespedes);
    const vecinas = { vinedos: ['santorini', 'alebrijes', 'senderos'], senderos: ['alicante', 'alebrijes', 'vinedos'], provitec: ['torreon', 'tec', 'gomez'], alebrijes: ['senderos', 'alicante', 'vinedos'], alicante: ['senderos', 'alebrijes', 'vinedos'], santorini: ['vinedos', 'alebrijes', 'senderos'], almendros: ['rosita', 'tec', 'torreon'], gomez: ['torreon', 'provitec'], torreon: ['provitec', 'gomez', 'tec'], rosita: ['almendros', 'tec'], tec: ['provitec', 'torreon', 'rosita'] }[z] || [];
    const ordenadas = [...fuera].sort((a, b) => vecinas.indexOf(zonaKey(a)) - vecinas.indexOf(zonaKey(b)) || b.huespedes - a.huespedes);
    const cercanas = ordenadas.filter((c) => vecinas.includes(zonaKey(c)));
    const resto = ordenadas.filter((c) => !vecinas.includes(zonaKey(c)));
    return { dentro, lista: [...dentro, ...cercanas, ...resto].slice(0, Math.max(n, dentro.length)) };
  };

  // ── Usos ──────────────────────────────────────────────────────────────────────────────
  const USOS = {
    cuadrillas: {
      slug: 'hospedaje-cuadrillas',
      menu: 'Cuadrillas',
      grupoMenu: 'Cuadrillas y personal de obra',
      minPax: 8,
      filtro: () => true,
      titulo: (Z) => `Hospedaje para cuadrillas en ${Z.nombre}, Torreón: casa completa`,
      eyebrow: (Z) => `Cuadrillas · ${Z.nombre}`,
      h1: (Z) => `Casa para tu cuadrilla en ${Z.nombre}, <em>con factura</em>.`,
      lead: (Z, cs) => `Casas completas de ${Math.min(...cs.map((c) => c.huespedes))} a ${Math.max(...cs.map((c) => c.huespedes))} personas en ${Z.nombre} y alrededores, con camas reales, cocina, lavadora y lugar para las camionetas. Un solo contrato, un solo CFDI, el personal junto y a minutos de ${fmtLugares(lugaresDe(Z.key, 'Trabajo e industria', 2))}.`,
      wa: (Z) => `Hola Hostalia, necesito casa para una cuadrilla en ${Z.nombre} o cerca. Somos __ personas, del __ al __. ¿Precio con factura?`,
      secciones: (Z, cs, dentro) => [
        {
          h2: `Por qué una casa en ${Z.nombre} y no cuartos de hotel`,
          html: `<p>Cuando llegan ocho, diez o dieciséis trabajadores a una obra, el hotel multiplica todo: un cuarto por cada dos, comidas fuera tres veces al día y nadie sabe dónde anda quién. En una casa de Hostalia pagas <strong>un precio por la casa completa</strong>, el equipo cocina y lava su ropa, y la camioneta se queda dentro de la privada. ${dentro.length ? `En ${Z.nombre} tenemos ${dentro.length === 1 ? 'una casa' : `${dentro.length} casas`}: ${y(dentro.map((c) => `${ficha(c)} para ${c.huespedes}`))}.` : `En ${Z.nombre} no tenemos casa propia, pero las de abajo quedan a pocos minutos.`} ${Z.como}</p><p>Lo que más pesa en una cuadrilla no es el precio por noche sino el precio por cama: en ${cs[0].nombre} sale en unos <strong>${mxn(porCama(cs[0]))} por cama por noche</strong> (${mxn(noche(cs[0]))}${IVA_NOTA} entre ${cs[0].camas} camas), y por mes baja más.</p>`,
        },
        {
          h2: 'Qué tan cerca queda el trabajo',
          html: `<p>Desde ${Z.nombre}: ${fmtLugares(lugaresDe(Z.key, 'Trabajo e industria', 4))}. ${y(lugaresDe(Z.key, 'Súper y compras', 2).map((l) => `${l.n} a ${l.min} min`))} para surtir la despensa de la semana.</p>`,
        },
        {
          h2: 'Las casas que sirven para una cuadrilla',
          html: `${tabla(cs, { th: 'Por cama / noche', td: (c) => mxn(porCama(c)) })}${notaPrecios}`,
        },
        {
          h2: 'Cómo funciona para la empresa',
          html: `<ul><li><strong>Contrato de hospedaje</strong> con fechas, monto y reglas de la casa por escrito.</li><li><strong>CFDI</strong> a nombre de la razón social, con el IVA desglosado.</li><li><strong>Pago por transferencia</strong>: anticipo para apartar y el resto al llegar; por mes se paga por adelantado.</li><li><strong>Limpieza semanal</strong> obligatoria (${mxn(LIMPIEZA)}${IVA_NOTA}) con cambio de sábanas y toallas.</li><li><strong>Rotación de personal</strong>: si cambia la gente a mitad del proyecto no pasa nada, el contrato es por la casa.</li></ul>`,
        },
      ],
      faqs: (Z, cs) => [
        { q: `¿Cuántas personas caben en una casa de Hostalia en ${Z.nombre}?`, a: `Las casas que recomendamos para cuadrillas en ${Z.nombre} y alrededores van de ${Math.min(...cs.map((c) => c.huespedes))} a ${Math.max(...cs.map((c) => c.huespedes))} personas, con camas individuales y matrimoniales de verdad, no sofás contados como camas.` },
        { q: '¿Cuánto sale por trabajador por noche?', a: `Depende de la casa: ${y(cs.slice(0, 3).map((c) => `${c.nombre} ${mxn(porPersona(c))} por persona (${mxn(noche(c))}${IVA_NOTA} entre ${c.huespedes})`))}. Por mes el precio total baja y el cálculo por persona también.` },
        { q: '¿Pueden entrar las camionetas de la obra?', a: 'Sí. Las casas tienen cochera o estacionamiento dentro de privadas con acceso controlado; si traen vehículos grandes o remolque avísanos para asignar la casa con más espacio.' },
        { q: '¿Facturan y firman contrato?', a: 'Sí: CFDI a nombre de la empresa y contrato de hospedaje por escrito. Es lo normal con las constructoras y contratistas que traen personal a La Laguna.' },
        { q: '¿Qué pasa si la obra se alarga?', a: 'Se extiende el contrato con las mismas condiciones si la casa está libre; por eso conviene avisar con una o dos semanas de anticipación. En estancias de más de un mes se cotiza tarifa mensual.' },
      ],
    },
    ingenieros: {
      slug: 'hospedaje-ingenieros-tecnicos',
      menu: 'Ingenieros y técnicos',
      grupoMenu: 'Ingenieros y técnicos de proyecto',
      minPax: 7,
      filtro: () => true,
      titulo: (Z) => `Casa amueblada para ingenieros y técnicos en ${Z.nombre}, Torreón`,
      eyebrow: (Z) => `Proyectos industriales · ${Z.nombre}`,
      h1: (Z) => `Hospedaje para el equipo de proyecto en ${Z.nombre}, <em>listo para entrar</em>.`,
      lead: (Z) => `Para ingenieros, supervisores y técnicos que vienen por semanas o meses a una planta, un parque industrial o una obra eléctrica: casa completa con clima, wifi, cocina y lavadora en ${Z.nombre}, a minutos de ${fmtLugares(lugaresDe(Z.key, 'Trabajo e industria', 2))}, con factura y contrato.`,
      wa: (Z) => `Hola Hostalia, somos un equipo de proyecto y necesitamos casa en ${Z.nombre} o cerca por __ semanas. Somos __ personas. ¿Disponibilidad y precio con factura?`,
      secciones: (Z, cs, dentro) => [
        {
          h2: `Qué necesita un equipo de proyecto y qué tiene ${Z.nombre}`,
          html: `<p>Un equipo técnico no viene de vacaciones: llega a las seis de la mañana a planta, regresa tarde y necesita dormir bien, lavar la ropa de trabajo y tener internet estable para reportar. ${Z.como} ${dentro.length ? `Aquí tenemos ${y(dentro.map((c) => `${ficha(c)} (${c.huespedes} personas, ${c.recamaras} recámaras)`))}.` : 'Las casas de abajo son las más cercanas a esta zona.'}</p><p>Todas traen <strong>minisplit en recámaras y áreas comunes</strong>, wifi, cocina equipada, lavadora, ropa de cama y toallas. El equipo entra con la maleta y nada más.</p>`,
        },
        {
          h2: 'Tiempos reales a las zonas de trabajo',
          html: `<p>Desde ${Z.nombre}: ${fmtLugares(lugaresDe(Z.key, 'Trabajo e industria', 4))}. Para comer cerca de la casa: ${fmtLugares(lugaresDe(Z.key, 'Comer y café', 3))}.</p>`,
        },
        {
          h2: 'Casas para el equipo',
          html: `${tabla(cs, { th: 'Por persona / noche', td: (c) => mxn(porPersona(c)) })}${notaPrecios}`,
        },
        {
          h2: 'Por semanas o por meses',
          html: `<p>La mayoría de los proyectos industriales duran de tres semanas a seis meses. Para esas estancias cotizamos <strong>precio por mes</strong> (${y(cs.filter((c) => c.precioMesSinServicios).slice(0, 3).map((c) => `${c.nombre} ${mes(c)}`)) || 'se cotiza por WhatsApp'}) con dos modalidades: sin servicios, o con agua, luz, gas e internet incluidos. La limpieza semanal con cambio de blancos se cobra aparte (${mxn(LIMPIEZA)}${IVA_NOTA}). El contrato es por la casa: si rota el personal, no cambia nada.</p>`,
        },
      ],
      faqs: (Z, cs) => [
        { q: '¿Tienen internet suficiente para trabajar desde la casa?', a: 'Sí, todas tienen wifi. Si el equipo necesita videollamadas simultáneas o VPN de la empresa, dinos cuántos son para confirmarte la casa con mejor conexión.' },
        { q: `¿A cuánto está ${Z.nombre} de las zonas industriales?`, a: `${fmtLugares(lugaresDe(Z.key, 'Trabajo e industria', 4))}.` },
        { q: '¿Se puede facturar a una empresa de fuera de Coahuila?', a: 'Sí, el CFDI sale a cualquier razón social de México con el IVA desglosado. Nos pasas la constancia de situación fiscal al apartar.' },
        { q: '¿Cuánto sale por mes?', a: `${y(cs.filter((c) => c.precioMesSinServicios).slice(0, 3).map((c) => `${c.nombre} ${mes(c)} sin servicios`)) || 'Se cotiza según la casa y la duración'}; con servicios (agua, luz, gas e internet) sube ${mxn(3000)}. Limpieza semanal aparte.` },
        { q: '¿Qué pasa si el proyecto termina antes?', a: 'En estancias por mes se paga mes por mes, por adelantado; si terminan antes, avísanos con anticipación y ajustamos el siguiente periodo. Lo dejamos por escrito en el contrato.' },
      ],
    },
    familias: {
      slug: 'casa-para-familias',
      menu: 'Familias',
      grupoMenu: 'Familias de visita',
      minPax: 6,
      filtro: () => true,
      titulo: (Z) => `Casa amueblada para familias en ${Z.nombre}, Torreón: por noche o semana`,
      eyebrow: (Z) => `Familias · ${Z.nombre}`,
      h1: (Z) => `Toda la familia junta en ${Z.nombre}, <em>sin incomodar a nadie</em>.`,
      lead: (Z, cs) => `Si vienen a Torreón a ver a los suyos, a una boda, a una graduación o a pasar unos días, una casa completa en ${Z.nombre} para ${Math.min(...cs.map((c) => c.huespedes))} a ${Math.max(...cs.map((c) => c.huespedes))} personas sale mejor que tres cuartos de hotel: cocina para el desayuno de todos, sala para la sobremesa y clima en cada recámara.`,
      wa: (Z) => `Hola Hostalia, somos una familia de __ personas y buscamos casa en ${Z.nombre} del __ al __. ¿Qué nos recomiendan?`,
      secciones: (Z, cs, dentro) => [
        {
          h2: `Cómo es quedarse en familia en ${Z.nombre}`,
          html: `<p>${Z.como} ${dentro.length ? `Aquí están ${y(dentro.map((c) => `${ficha(c)} para ${c.huespedes}${conAlberca(c) ? ', con alberca' : ''}${plantaBaja(c) ? ', con recámara en planta baja' : ''}`))}.` : 'Las casas de abajo quedan a minutos de esta zona.'}</p><p>Lo que agradecen las familias: <strong>recámaras separadas</strong> para abuelos, papás y niños, cocina para no desayunar fuera todos los días, lavadora si la visita es larga, y estacionamiento dentro. ${cs.some(conAlberca) ? `${y(cs.filter(conAlberca).map((c) => c.nombre))} ${cs.filter(conAlberca).length === 1 ? 'tiene' : 'tienen'} alberca para las tardes de calor.` : ''}</p>`,
        },
        {
          h2: 'Qué hay cerca para la familia',
          html: `<p>Para comer: ${fmtLugares(lugaresDe(Z.key, 'Comer y café', 3))}. Súper y plazas: ${fmtLugares(lugaresDe(Z.key, 'Súper y compras', 3))}. Para salir: ${fmtLugares(lugaresDe(Z.key, 'Para salir', 3))}. Si alguien se siente mal: ${fmtLugares(lugaresDe(Z.key, 'Salud', 2))}.</p>`,
        },
        {
          h2: 'Las casas para familias en esta zona',
          html: `${tabla(cs, { th: 'Alberca / asador', td: (c) => [conAlberca(c) ? 'alberca' : null, conAsador(c) ? 'asador' : null].filter(Boolean).join(' y ') || '—' })}${notaPrecios}`,
        },
        {
          h2: 'Cómo reservar para una familia',
          html: `<p>Dinos cuántos adultos y cuántos niños son y las fechas. Te mandamos video del recorrido si no conoces la casa, apartas con un anticipo por transferencia o en línea con tarjeta en las casas que lo tienen habilitado, y llegas con la casa lista: camas hechas, toallas y clima encendido. Estancia mínima de 2 noches; en fin de semana el precio es un poco distinto al de entre semana.</p>`,
        },
      ],
      faqs: (Z, cs) => [
        { q: '¿Aceptan niños y bebés?', a: 'Sí. Si necesitas cuna o silla alta dinos al reservar para confirmarte en qué casa la hay.' },
        { q: `¿Cuál es la casa más grande cerca de ${Z.nombre}?`, a: `${cs.reduce((a, b) => (a.huespedes >= b.huespedes ? a : b)).nombre}, para ${Math.max(...cs.map((c) => c.huespedes))} personas con ${cs.reduce((a, b) => (a.huespedes >= b.huespedes ? a : b)).recamaras} recámaras.` },
        { q: '¿Se puede hacer carne asada?', a: `${cs.some(conAsador) ? `Sí, en ${y(cs.filter(conAsador).map((c) => c.nombre))} hay asador o palapa. En las demás hay patio o cochera, pero sin asador fijo.` : 'En estas casas no hay asador fijo; si es importante para la reunión dinos y te pasamos las que sí lo tienen.'}` },
        { q: '¿Cuánto cuesta el fin de semana?', a: `${y(cs.slice(0, 3).map((c) => `${c.nombre} ${mxn(finde(c))}${IVA_NOTA} la noche de viernes o sábado`))}. Entre semana es un poco menos.` },
        { q: '¿Hay que llevar sábanas o toallas?', a: 'No. Todas las casas se entregan con ropa de cama, toallas, cocina equipada y productos básicos de limpieza. Solo traen su maleta.' },
      ],
    },
    pacientes: {
      slug: 'hospedaje-pacientes-familiares',
      menu: 'Hospitales',
      grupoMenu: 'Pacientes y familiares (hospitales)',
      minPax: 4,
      filtro: () => true,
      titulo: (Z) => `Hospedaje cerca de hospitales en ${Z.nombre}, Torreón: casa para familiares`,
      eyebrow: (Z) => `Hospitales · ${Z.nombre}`,
      h1: (Z) => `Casa para acompañar a un paciente, cerca de los hospitales de <em>${Z.nombre}</em>.`,
      lead: (Z) => `Cuando alguien de la familia se atiende en Torreón, la familia necesita dormir, cocinar y estar a minutos del hospital, por días o por semanas. Casa completa en ${Z.nombre}: ${fmtLugares(lugaresDe(Z.key, 'Salud', 3))}.`,
      wa: (Z) => `Hola Hostalia, venimos a Torreón a acompañar a un familiar en el hospital. Somos __ personas, por __ días, cerca de ${Z.nombre}. ¿Qué casa nos queda?`,
      secciones: (Z, cs, dentro) => [
        {
          h2: `Hospitales y clínicas cerca de ${Z.nombre}`,
          html: `<p>Desde esta zona: ${fmtLugares(lugaresDe(Z.key, 'Salud', 3))}. ${Z.como}</p><p>${dentro.length ? `En ${Z.nombre} tenemos ${y(dentro.map((c) => `${ficha(c)} para ${c.huespedes}${plantaBaja(c) ? ', con recámara en planta baja (sin escaleras)' : ''}`))}.` : 'Las casas de abajo son las más cercanas a estos hospitales.'} ${cs.some(plantaBaja) ? `Si el paciente va a convalecer en la casa, ${y(cs.filter(plantaBaja).map((c) => c.nombre))} tiene recámara en planta baja.` : 'Si el paciente va a convalecer en la casa y no puede subir escaleras, dínoslo: te decimos cuál conviene.'}</p>`,
        },
        {
          h2: 'Por qué una casa y no un hotel junto al hospital',
          html: `<p>Las estancias médicas se alargan: una cirugía programada se vuelve una semana, un tratamiento se vuelve un mes. En una casa la familia come en casa, lava la ropa, descansa por turnos y no paga por persona. <strong>Precio por casa</strong>: desde ${mxn(Math.min(...cs.map(noche)))}${IVA_NOTA} la noche para ${cs.reduce((a, b) => (noche(a) <= noche(b) ? a : b)).huespedes} personas, y por semana o por mes baja.</p>`,
        },
        { h2: 'Casas cercanas', html: `${tabla(cs, { th: 'Hospital más cercano', td: (c) => { const s = (cercaDe(c)['Salud'] || []).filter((x) => /hospital|sanatorio|centro médico|cruz roja/i.test(x.n)); return s.length ? `${s[0].n} · ${s[0].min} min` : '—'; } })}${notaPrecios}` },
        {
          h2: 'Lo práctico',
          html: `<ul><li>Farmacias y súper: ${fmtLugares(lugaresDe(Z.key, 'Súper y compras', 2))}.</li><li>Comida cerca: ${fmtLugares(lugaresDe(Z.key, 'Comer y café', 3))}.</li><li>Entrada flexible: si llegan de madrugada o salen del hospital tarde, coordinamos la hora por WhatsApp.</li><li>Se puede extender la estancia día por día si el alta se retrasa, mientras la casa esté libre.</li></ul>`,
        },
      ],
      faqs: (Z, cs) => [
        { q: `¿Qué hospital queda más cerca de las casas en ${Z.nombre}?`, a: `${fmtLugares(lugaresDe(Z.key, 'Salud', 3))}.` },
        { q: '¿Puedo rentar solo por tres o cuatro noches?', a: 'Sí, la estancia mínima es de 2 noches y se puede ir extendiendo. Si ya saben que serán semanas, cotizamos por semana o por mes desde el inicio.' },
        { q: '¿Hay casa sin escaleras para un paciente?', a: `${cs.some(plantaBaja) ? `${y(cs.filter(plantaBaja).map((c) => c.nombre))} tiene recámara en planta baja.` : 'En esta zona las recámaras están en planta alta; dinos la situación del paciente y te pasamos la casa con recámara abajo.'}` },
        { q: '¿Facturan si lo paga una aseguradora o una empresa?', a: 'Sí, emitimos CFDI a nombre de quien pague: persona física, empresa o aseguradora.' },
        { q: '¿Aceptan llegadas de noche?', a: 'Sí, coordinando la hora por WhatsApp el mismo día. Entendemos que los horarios de hospital no se eligen.' },
      ],
    },
    estudiantes: {
      slug: 'hospedaje-universidades',
      menu: 'Universidades',
      grupoMenu: 'Estudiantes, papás y graduaciones',
      minPax: 4,
      filtro: () => true,
      titulo: (Z) => `Hospedaje cerca de universidades en ${Z.nombre}, Torreón: papás y graduaciones`,
      eyebrow: (Z) => `Universidades · ${Z.nombre}`,
      h1: (Z) => `Casa cerca de la universidad en ${Z.nombre}: <em>mudanza, exámenes y graduación</em>.`,
      lead: (Z) => `Para los papás que vienen a dejar al hijo, a la semana de exámenes o a la graduación, y para grupos de estudiantes en prácticas o congresos: casa completa en ${Z.nombre}, a minutos de ${fmtLugares(lugaresDe(Z.key, 'Escuelas y universidades', 2))}.`,
      wa: (Z) => `Hola Hostalia, venimos a Torreón por la universidad (graduación / mudanza / congreso). Somos __ personas del __ al __, cerca de ${Z.nombre}. ¿Qué casa nos recomiendan?`,
      secciones: (Z, cs, dentro) => [
        {
          h2: `Universidades cerca de ${Z.nombre}`,
          html: `<p>${fmtLugares(lugaresDe(Z.key, 'Escuelas y universidades', 3))}. ${Z.como}</p><p>${dentro.length ? `En la zona tenemos ${y(dentro.map((c) => `${ficha(c)} (${c.huespedes} personas)`))}.` : 'Las casas de abajo son las que más cerca quedan.'} Los fines de semana de graduación (mayo, junio y diciembre) se llenan con semanas de anticipación: conviene apartar en cuanto tengas la fecha.</p>`,
        },
        {
          h2: 'Para qué la usan',
          html: `<ul><li><strong>Graduación:</strong> abuelos, papás y hermanos en una sola casa, con sala para la comida después de la ceremonia.</li><li><strong>Mudanza al inicio del semestre:</strong> una semana para instalar al hijo, con cocina y lavadora.</li><li><strong>Equipos y congresos:</strong> grupos de estudiantes o profesores que vienen a competencias académicas o deportivas.</li><li><strong>Estancias de un semestre:</strong> por mes, para profesores visitantes o grupos de prácticas, con factura a la institución si la necesitan.</li></ul>`,
        },
        { h2: 'Casas para esta zona', html: `${tabla(cs, { th: 'Universidad más cercana', td: (c) => { const u = (cercaDe(c)['Escuelas y universidades'] || [])[0]; return u ? `${u.n} · ${u.min} min` : '—'; } })}${notaPrecios}` },
        { h2: 'Qué hay alrededor', html: `<p>Para comer: ${fmtLugares(lugaresDe(Z.key, 'Comer y café', 3))}. Súper y plazas: ${fmtLugares(lugaresDe(Z.key, 'Súper y compras', 2))}. Para salir: ${fmtLugares(lugaresDe(Z.key, 'Para salir', 3))}.</p>` },
      ],
      faqs: (Z, cs) => [
        { q: `¿Qué universidades quedan cerca de ${Z.nombre}?`, a: `${fmtLugares(lugaresDe(Z.key, 'Escuelas y universidades', 3))}.` },
        { q: '¿Rentan por un semestre a estudiantes?', a: 'Rentamos por mes a grupos o a familias; para un semestre completo cotizamos tarifa mensual con contrato. No rentamos por cuarto individual: siempre es la casa completa.' },
        { q: '¿Se puede facturar a la universidad?', a: 'Sí, emitimos CFDI a nombre de la institución o de la empresa que pague.' },
        { q: '¿Cuánto cuesta un fin de semana de graduación?', a: `${y(cs.slice(0, 3).map((c) => `${c.nombre} ${mxn(finde(c))}${IVA_NOTA} la noche para ${c.huespedes}`))}. Mínimo 2 noches.` },
        { q: '¿Con cuánta anticipación hay que apartar?', a: 'Para graduaciones y fin de semestre, de 3 a 6 semanas. Para una visita normal, con unos días basta si hay casa libre.' },
      ],
    },
    mes: {
      slug: 'renta-por-mes',
      menu: 'Por mes',
      grupoMenu: 'Renta por mes, casa amueblada',
      minPax: 1,
      filtro: () => true,
      titulo: (Z) => `Renta por mes de casa amueblada en ${Z.nombre}, Torreón: sin aval`,
      eyebrow: (Z) => `Por mes · ${Z.nombre}`,
      h1: (Z) => `Casa amueblada por mes en ${Z.nombre}, <em>sin aval ni contrato de un año</em>.`,
      lead: (Z) => `Para quien llega a Torreón por un proyecto, un cambio de trabajo, una obra o mientras encuentra casa definitiva: casa completa en ${Z.nombre} lista para entrar, por uno o varios meses, con servicios opcionales, limpieza semanal y factura.`,
      wa: (Z) => `Hola Hostalia, busco casa amueblada por mes en ${Z.nombre} o cerca, para __ personas, desde el __. ¿Precio por mes con y sin servicios?`,
      secciones: (Z, cs, dentro) => [
        {
          h2: `Qué incluye rentar por mes en ${Z.nombre}`,
          html: `<p>Entras con la maleta: muebles, cocina equipada, blancos, clima, wifi y lavadora ya están. No hay aval, no hay fiador, no hay contrato de un año: <strong>contrato de hospedaje mes por mes</strong>, se paga por adelantado y se renueva mientras la necesites. ${Z.como}</p><p>${dentro.length ? `En esta zona: ${y(dentro.map((c) => `${ficha(c)} (${c.huespedes} personas) ${c.precioMesSinServicios ? `desde ${mes(c)} al mes` : 'con precio mensual a cotizar'}`))}.` : 'Las casas de abajo son las más cercanas a esta zona.'}</p>`,
        },
        {
          h2: 'Con servicios o sin servicios',
          html: `<p>El precio por mes se publica en dos niveles. <strong>Sin servicios:</strong> tú pagas agua, luz, gas e internet según consumo. <strong>Con servicios:</strong> todo incluido con un tope razonable de consumo, ${mxn(3000)} más al mes. En las dos, la limpieza semanal con cambio de sábanas y toallas se cobra aparte (${mxn(LIMPIEZA)}${IVA_NOTA} por servicio) y es obligatoria. Para estancias por mes se pide un depósito en garantía que se devuelve al salir.</p>`,
        },
        { h2: 'Casas con precio por mes cerca de aquí', html: `${tabla(cs, { th: 'Por mes con servicios', td: (c) => (c.precioMesConServicios ? `${mxn(c.precioMesConServicios)}${IVA_NOTA}` : 'se cotiza') })}${notaPrecios}` },
        { h2: 'La zona en el día a día', html: `<p>Súper: ${fmtLugares(lugaresDe(Z.key, 'Súper y compras', 3))}. Comer: ${fmtLugares(lugaresDe(Z.key, 'Comer y café', 3))}. Trabajo: ${fmtLugares(lugaresDe(Z.key, 'Trabajo e industria', 3))}. Salud: ${fmtLugares(lugaresDe(Z.key, 'Salud', 2))}.</p>` },
      ],
      faqs: (Z, cs) => [
        { q: '¿Piden aval o fiador?', a: 'No. Es un contrato de hospedaje mes por mes con pago por adelantado y un depósito en garantía que se devuelve al salir. Para empresas, factura CFDI.' },
        { q: `¿Cuánto cuesta por mes en ${Z.nombre}?`, a: `${y(cs.filter((c) => c.precioMesSinServicios).slice(0, 3).map((c) => `${c.nombre} ${mes(c)} sin servicios`)) || 'Depende de la casa y de los meses'}; con servicios incluidos sube ${mxn(3000)}. Limpieza semanal aparte.` },
        { q: '¿Puedo quedarme solo un mes?', a: 'Sí. Un mes es la estancia mínima para tarifa mensual; para menos tiempo aplica la tarifa por noche o por semana.' },
        { q: '¿Qué pasa con los servicios si consumo mucho?', a: 'En la modalidad con servicios hay un tope de consumo normal para una casa habitada; si se rebasa por mucho (por ejemplo clima las 24 horas en todas las recámaras en verano) se cobra la diferencia. Lo dejamos claro en el contrato.' },
        { q: '¿Puedo ver la casa antes?', a: 'Sí, si estás en Torreón te la mostramos. Si vienes de fuera te mandamos video completo del recorrido por WhatsApp.' },
      ],
    },
  };

  const COMBOS = {
    cuadrillas: ['vinedos', 'senderos', 'provitec', 'almendros', 'gomez', 'rosita'],
    ingenieros: ['vinedos', 'alebrijes', 'alicante', 'santorini', 'provitec', 'almendros'],
    familias: ['vinedos', 'senderos', 'alebrijes', 'santorini', 'provitec', 'torreon'],
    pacientes: ['provitec', 'tec', 'torreon', 'almendros', 'rosita'],
    estudiantes: ['tec', 'provitec', 'almendros', 'senderos', 'vinedos'],
    mes: ['vinedos', 'provitec', 'alebrijes', 'alicante', 'santorini', 'almendros'],
  };

  const slugCombo = (u, z) => `${USOS[u].slug}-${ZONAS[z].slug}-torreon`;

  for (const [u, zonas] of Object.entries(COMBOS)) {
    const U = USOS[u];
    for (const z of zonas) {
      const Z = { key: z, ...ZONAS[z] };
      const { dentro, lista: cs } = casasPara(z, U.filtro, U.minPax);
      if (!cs.length) continue;
      const hermanas = zonas.filter((o) => o !== z).slice(0, 3).map((o) => slugCombo(u, o));
      paginas.push({
        slug: slugCombo(u, z),
        menu: `${U.menu} · ${Z.corto}`,
        grupo: 'uso',
        uso: u,
        zonaKey: z,
        titulo: U.titulo(Z),
        desc: `${U.lead(Z, cs).replace(/<[^>]+>/g, '')}`.slice(0, 300),
        eyebrow: U.eyebrow(Z),
        h1: U.h1(Z),
        lead: U.lead(Z, cs),
        wa: U.wa(Z),
        casas: cs.map((c) => c.slug),
        secciones: [...U.secciones(Z, cs, dentro), { h2: 'Más guías de esta zona y de este tipo de viaje', html: `<p>${hermanas.map((s) => { const o = zonas.find((zz) => slugCombo(u, zz) === s); return chip(s, `${U.menu} · ${ZONAS[o].corto}`); }).join('')}${Object.keys(USOS).filter((x) => x !== u && COMBOS[x].includes(z)).map((x) => chip(slugCombo(x, z), `${USOS[x].menu} · ${Z.corto}`)).join('')}</p>` }],
        faqs: U.faqs(Z, cs),
        relacionadas: [...hermanas, ...Object.keys(USOS).filter((x) => x !== u && COMBOS[x].includes(z)).map((x) => slugCombo(x, z))].slice(0, 6),
        publicado: FECHA_INTENCIONES,
        actualizado: FECHA_INTENCIONES,
      });
    }
  }

  // ── Zonas nuevas (las tres casas nuevas y Los Almendros) ─────────────────────────────
  for (const z of ['alebrijes', 'alicante', 'santorini', 'almendros']) {
    const Z = { key: z, ...ZONAS[z] };
    const { dentro, lista: cs } = casasPara(z, () => true, 1, 5);
    const c0 = dentro[0] || cs[0];
    const usosZona = Object.keys(USOS).filter((u) => COMBOS[u].includes(z));
    paginas.push({
      slug: `casas-en-renta-${Z.slug}-torreon`,
      menu: Z.nombre,
      grupo: 'zonas',
      zonaKey: z,
      titulo: `Casas amuebladas en renta en ${Z.nombre}, Torreón: por noche o por mes`,
      desc: `Casa amueblada en ${Z.nombre}, Torreón: ${c0.huespedes} personas, ${c0.recamaras} recámaras, desde ${mxn(noche(c0))}${IVA_NOTA} la noche o por mes. A minutos de ${fmtLugares(lugaresDe(z, 'Trabajo e industria', 2))}. Con factura y reserva directa.`,
      eyebrow: `${Z.nombre} · Torreón`,
      h1: `Casa amueblada en ${Z.nombre}, <em>lista para entrar</em>.`,
      lead: `${Z.como}`,
      wa: `Hola Hostalia, me interesa la casa de ${Z.nombre}. Somos __ personas, del __ al __. ¿Está libre y cuánto sale?`,
      casas: cs.map((c) => c.slug),
      secciones: [
        {
          h2: `La casa de Hostalia en ${Z.nombre}`,
          html: dentro.length
            ? dentro.map((c) => `<p><strong>${ficha(c)}</strong>: ${c.resumen} Hasta ${c.huespedes} personas en ${c.recamaras} recámaras con ${c.camas} camas${c.banos ? ` y ${c.banos} baños` : ''}. ${y(c.destacados)}. ${mxn(noche(c))}${IVA_NOTA} la noche entre semana y ${mxn(finde(c))}${IVA_NOTA} en fin de semana; por mes ${mes(c)}.</p>`).join('')
            : `<p>En ${Z.nombre} no tenemos casa propia en este momento; estas son las más cercanas.</p>`,
        },
        {
          h2: `Qué hay cerca de ${Z.nombre}`,
          html: `<ul><li><strong>Trabajo e industria:</strong> ${fmtLugares(lugaresDe(z, 'Trabajo e industria', 4))}.</li><li><strong>Súper y plazas:</strong> ${fmtLugares(lugaresDe(z, 'Súper y compras', 3))}.</li><li><strong>Comer y café:</strong> ${fmtLugares(lugaresDe(z, 'Comer y café', 4))}.</li><li><strong>Salud:</strong> ${fmtLugares(lugaresDe(z, 'Salud', 3))}.</li><li><strong>Escuelas y universidades:</strong> ${fmtLugares(lugaresDe(z, 'Escuelas y universidades', 3))}.</li><li><strong>Para salir:</strong> ${fmtLugares(lugaresDe(z, 'Para salir', 3))}.</li></ul>`,
        },
        { h2: 'Comparada con las casas vecinas', html: `${tabla(cs, { th: 'Fin de semana', td: (c) => `${mxn(finde(c))}${IVA_NOTA}` })}${notaPrecios}` },
        { h2: `Para qué sirve ${Z.nombre}`, html: `<p>${usosZona.map((u) => chip(slugCombo(u, z), `${USOS[u].grupoMenu}`)).join('')}</p>` },
      ],
      faqs: [
        { q: `¿Cuánto cuesta la casa de ${Z.nombre} por noche?`, a: `${mxn(noche(c0))}${IVA_NOTA} entre semana y ${mxn(finde(c0))}${IVA_NOTA} viernes y sábado, por la casa completa para ${c0.huespedes} personas. Limpieza aparte ${mxn(LIMPIEZA)}${IVA_NOTA} por semana.` },
        { q: `¿Cuántas personas caben?`, a: `Hasta ${c0.huespedes} personas en ${c0.recamaras} recámaras con ${c0.camas} camas${c0.banos ? ` y ${c0.banos} baños` : ''}.` },
        { q: `¿Qué tan lejos está ${Z.nombre} de la zona industrial y del aeropuerto?`, a: `${fmtLugares(lugaresDe(z, 'Trabajo e industria', 4))}.` },
        { q: '¿Se renta por mes?', a: `Sí. ${c0.precioMesSinServicios ? `Por mes sale en ${mes(c0)} sin servicios y ${mxn(c0.precioMesConServicios)}${IVA_NOTA} con agua, luz, gas e internet.` : 'El precio por mes se cotiza por WhatsApp según los meses y si quieres servicios incluidos.'} Sin aval, contrato mes por mes.` },
        { q: '¿Facturan?', a: 'Sí, CFDI a nombre de tu empresa o a tu nombre, con el IVA desglosado.' },
        { q: '¿Se puede reservar en línea?', a: `${c0.reservaEnLinea ? 'Sí: en la ficha de la casa ves el calendario con las fechas libres y apartas con tarjeta o transferencia.' : 'Por ahora se reserva por WhatsApp: te confirmamos disponibilidad y apartas con anticipo por transferencia.'}` },
      ],
      relacionadas: usosZona.map((u) => slugCombo(u, z)).slice(0, 4),
      publicado: FECHA_INTENCIONES,
      actualizado: FECHA_INTENCIONES,
    });
  }

  // ── Temporadas ────────────────────────────────────────────────────────────────────────
  const albercas = casas.filter(conAlberca);
  const grandes = [...casas].sort((a, b) => b.huespedes - a.huespedes).slice(0, 6);
  const top = (n, f = () => true) => [...casas].filter(f).sort((a, b) => b.huespedes - a.huespedes).slice(0, n);
  const TEMPORADAS = [
    {
      slug: 'hospedaje-maraton-lala-2027-torreon',
      menu: 'Maratón Lala 2027',
      titulo: 'Hospedaje para el Maratón Lala 2027 en Torreón: casas para corredores',
      desc: `El Maratón Lala 2027 es el domingo 7 de marzo. Casas completas en Torreón para corredores y acompañantes, de 8 a 16 personas, cerca de la salida en Gómez Palacio y de la meta en el Bosque Venustiano Carranza. Desde ${mxn(Math.min(...casas.map(noche)))}${IVA_NOTA} la noche.`,
      eyebrow: 'Maratón Lala · 7 de marzo de 2027',
      h1: 'Maratón Lala 2027: <em>la casa para todo el equipo de corredores</em>.',
      lead: 'La edición 38 del Maratón Internacional Lala se corre el domingo 7 de marzo de 2027: sale del Parque Industrial Lagunero en Gómez Palacio y termina en el Bosque Venustiano Carranza, en Torreón. Los grupos de corredores que vienen de fuera llegan el viernes o el sábado y se van el domingo o el lunes. Una casa completa resuelve la cena de pasta, el desayuno a las 4:30 y el descanso después de la meta.',
      wa: 'Hola Hostalia, venimos al Maratón Lala 2027. Somos __ corredores y acompañantes, del __ al __ de marzo. ¿Qué casa nos recomiendan?',
      casas: top(6),
      secciones: (cs) => [
        { h2: 'Dónde conviene quedarse para el maratón', html: `<p>La meta está en el Bosque Venustiano Carranza, al poniente de Torreón. Las casas de ${y(casas.filter((c) => (minA(c, 'Bosque') || 99) <= 6).map((c) => `${ficha(c)} (${minA(c, 'Bosque')} min al Bosque)`))} son las más cercanas a la meta. La salida es en Gómez Palacio; desde las casas del límite con Gómez el traslado es corto y el resto de la ciudad está a 15 o 20 minutos a esa hora, sin tráfico.</p><p>Las casas con alberca (${y(albercas.map((c) => c.nombre))}) son las favoritas de los grupos grandes para la tarde del domingo.</p>` },
        { h2: 'Fechas pico: aparta con tiempo', html: `<p>El fin de semana del maratón es el de mayor ocupación del año en Torreón después de Semana Santa: hoteles llenos y precios altos. Nuestras casas se reservan con uno o dos meses de anticipación y para esas noches aplica tarifa de temporada. Mínimo 2 noches (viernes y sábado, o sábado y domingo).</p>` },
        { h2: 'Casas para equipos de corredores', html: `${tabla(cs, { th: 'Al Bosque V. Carranza', td: (c) => (minA(c, 'Bosque') ? `${minA(c, 'Bosque')} min` : '—') })}${notaPrecios}` },
        { h2: 'Lo que un corredor agradece', html: `<ul><li>Cocina equipada para la cena de carbohidratos del sábado y el desayuno antes de salir.</li><li>Clima en cada recámara para dormir bien el sábado.</li><li>Lavadora para la ropa de la carrera.</li><li>Estacionamiento dentro para llegar en caravana.</li><li>Check-out flexible el domingo si lo pides al reservar, para bañarse después de la meta.</li></ul>` },
      ],
      faqs: (cs) => [
        { q: '¿Cuándo es el Maratón Lala 2027?', a: 'El domingo 7 de marzo de 2027, edición 38. Salida en el Parque Industrial Lagunero (Gómez Palacio) y meta en el Bosque Venustiano Carranza (Torreón).' },
        { q: '¿Qué casa queda más cerca de la meta?', a: `${y(casas.filter((c) => (minA(c, 'Bosque') || 99) <= 6).map((c) => `${c.nombre}, a ${minA(c, 'Bosque')} minutos`)) || 'Pregúntanos por WhatsApp'}.` },
        { q: '¿Cuánto cuesta el fin de semana del maratón?', a: `Para esas noches aplica tarifa de temporada; el precio normal de fin de semana va de ${mxn(Math.min(...cs.map(finde)))} a ${mxn(Math.max(...cs.map(finde)))}${IVA_NOTA} por casa completa. Pide la cotización con tus fechas.` },
        { q: '¿Podemos salir tarde el domingo?', a: 'Si lo pides al reservar y la casa no tiene entrada ese mismo día, sí. Lo confirmamos por escrito.' },
        { q: '¿Reciben equipos grandes?', a: `Sí: la casa más grande recibe ${Math.max(...casas.map((c) => c.huespedes))} personas y se pueden combinar dos casas en la misma zona para un club completo.` },
      ],
    },
    {
      slug: 'casas-navidad-y-ano-nuevo-torreon',
      menu: 'Navidad y Año Nuevo',
      titulo: 'Casas para Navidad y Año Nuevo en Torreón: toda la familia junta',
      desc: `Casas completas en Torreón para la cena de Navidad y Año Nuevo con la familia que viene de fuera: de 8 a 16 personas, con cocina, comedor, patio y en varias alberca. Fechas del 24 al 25 y del 31 de diciembre al 1 de enero con tarifa de temporada. Desde ${mxn(Math.min(...casas.map(noche)))}${IVA_NOTA}.`,
      eyebrow: 'Diciembre · Navidad y Año Nuevo',
      h1: 'Navidad y Año Nuevo en Torreón: <em>una casa para que nadie se quede en hotel</em>.',
      lead: 'Diciembre en Torreón se llena de familia que regresa: hijos que viven en Monterrey, hermanos en Chihuahua, primos en Estados Unidos. Cuando la casa de los papás ya no da, una casa completa cerca resuelve la cena, el intercambio y las mañanas sin que nadie duerma en el sillón.',
      wa: 'Hola Hostalia, buscamos casa para Navidad / Año Nuevo en Torreón. Somos __ personas, del __ al __ de diciembre. ¿Qué casa nos recomiendan?',
      casas: top(7),
      secciones: (cs) => [
        { h2: 'Qué casa para qué reunión', html: `<p>Para la cena con 12 o 16 personas: ${y(grandes.slice(0, 3).map((c) => `${ficha(c)} (${c.huespedes})`))}. Para una familia de 8 a 10 que quiere patio y asador: ${y(casas.filter(conAsador).slice(0, 3).map((c) => ficha(c)))}. Si hay niños y hace sol al mediodía, ${y(albercas.slice(0, 3).map((c) => ficha(c)))} tienen alberca.</p><p>Todas se entregan con cocina equipada y refrigerador grande para la cena; comedor para sentarse todos; clima para las noches frías de diciembre en La Laguna.</p>` },
        { h2: 'Fechas y precios de temporada', html: `<p>Las noches del 24 y 25 de diciembre y del 30, 31 de diciembre y 1 de enero tienen tarifa de temporada y son las que primero se van. Las del 26 al 29 y del 2 al 6 de enero van con precio de puente. Mínimo 2 noches. Si quieres la casa para toda la semana entre Navidad y Año Nuevo, cotizamos el bloque completo.</p>` },
        { h2: 'Casas para diciembre', html: `${tabla(cs, { th: 'Patio / alberca', td: (c) => [conAlberca(c) ? 'alberca' : null, conAsador(c) ? 'asador' : null].filter(Boolean).join(' y ') || 'patio' })}${notaPrecios}` },
        { h2: 'Reglas de la casa en fiestas', html: `<p>Son casas en privadas con vecinos: música a volumen de casa, no de salón, y respeto al horario de descanso del fraccionamiento. Cohetes no. El número de personas es el de la reserva; si vienen más invitados a cenar y no a dormir, avísanos para confirmar que la casa lo permite.</p>` },
      ],
      faqs: () => [
        { q: '¿Se puede rentar solo el 24 y 25 de diciembre?', a: 'Sí, el mínimo es de 2 noches. Esas dos son las de mayor demanda del mes: conviene apartar desde noviembre.' },
        { q: '¿Las casas tienen todo para cocinar la cena?', a: 'Sí: estufa, horno en la mayoría, refrigerador, ollas, sartenes, vajilla y cubiertos para la capacidad de la casa. Si van a cocinar para más personas de las que duermen, dinos para pasarte la casa con cocina más grande.' },
        { q: '¿Podemos poner árbol y adornos?', a: 'Sí, mientras no se claven ni peguen cosas en paredes y se retiren al salir.' },
        { q: '¿Cuánto sube el precio en Navidad y Año Nuevo?', a: 'Las noches pico tienen tarifa de temporada; te la damos cerrada por WhatsApp con tus fechas. Lo que no cambia: precio por casa, no por persona, y factura si la necesitas.' },
        { q: '¿Hay alberca climatizada?', a: 'No, las albercas no están climatizadas. En diciembre sirven para el mediodía soleado, no para la noche.' },
      ],
    },
    {
      slug: 'hospedaje-buen-fin-y-puente-revolucion-torreon',
      menu: 'Buen Fin y puente de noviembre',
      titulo: 'Hospedaje en Torreón para el Buen Fin y el puente de la Revolución',
      desc: 'Casas completas en Torreón para el puente del 20 de noviembre y el Buen Fin: familias que vienen de compras a Galerías Laguna y Costco, equipos de ventas y grupos de fuera. De 7 a 16 personas, con estacionamiento, cocina y clima. Reserva directa con factura.',
      eyebrow: 'Noviembre · Buen Fin y 20 de noviembre',
      h1: 'Puente de noviembre y Buen Fin en Torreón: <em>casa cerca de las plazas</em>.',
      lead: 'El puente del 20 de noviembre y el Buen Fin caen juntos: familias de Durango, Chihuahua y Zacatecas vienen a Torreón de compras y equipos comerciales llegan a cubrir las plazas. Las casas más buscadas esos días son las que quedan a minutos de Galerías Laguna, Costco e Intermall, con cochera para guardar las compras.',
      wa: 'Hola Hostalia, buscamos casa para el puente de noviembre / Buen Fin en Torreón. Somos __ personas, del __ al __. ¿Qué tienen cerca de las plazas?',
      casas: [...casas].sort((a, b) => (minA(a, 'Galerías') || 99) - (minA(b, 'Galerías') || 99)).slice(0, 6),
      secciones: (cs) => [
        { h2: 'Las casas más cerca de las plazas', html: `<p>Galerías Laguna, Costco e Intermall son los tres puntos del Buen Fin. ${y(cs.slice(0, 4).map((c) => `${ficha(c)} está a ${minA(c, 'Galerías')} min de Galerías y a ${minA(c, 'Costco') || '—'} de Costco`))}. Todas tienen cochera o estacionamiento dentro de la privada para dejar el coche cargado sin preocuparse.</p>` },
        { h2: 'Para equipos de ventas y promotores', html: `<p>Si tu empresa manda promotores o vendedores a cubrir el Buen Fin en La Laguna, una casa completa para el equipo sale mejor que cuartos de hotel esos días, cuando los hoteles suben de precio: cocina para desayunar antes de abrir la tienda, lavadora para el uniforme y factura CFDI a nombre de la empresa.</p>` },
        { h2: 'Casas para el puente', html: `${tabla(cs, { th: 'A Galerías Laguna', td: (c) => (minA(c, 'Galerías') ? `${minA(c, 'Galerías')} min` : '—') })}${notaPrecios}` },
        { h2: 'Qué más hacer ese fin de semana', html: `<p>Además de las compras: la Feria de Torreón cuando coincide, el Bosque Venustiano Carranza, el Paseo Morelos en el centro y el Cristo de las Noas. Desde las casas del oriente todo queda a menos de 20 minutos.</p>` },
      ],
      faqs: (cs) => [
        { q: '¿Qué casa queda más cerca de Galerías Laguna?', a: `${cs[0].nombre}, a ${minA(cs[0], 'Galerías')} minutos; luego ${y(cs.slice(1, 3).map((c) => `${c.nombre} (${minA(c, 'Galerías')} min)`))}.` },
        { q: '¿Suben los precios en el Buen Fin?', a: 'Las noches del puente y del Buen Fin tienen tarifa de temporada, menor que la de Navidad. Te la damos cerrada por WhatsApp con tus fechas.' },
        { q: '¿Facturan a la empresa si viene un equipo de ventas?', a: 'Sí, CFDI a nombre de la razón social, con contrato de hospedaje si lo requieren.' },
        { q: '¿Cuántas noches mínimo?', a: 'Dos. El puente suele ser de viernes a lunes; se puede tomar completo o solo dos noches.' },
        { q: '¿Hay lugar para dos coches?', a: `Sí en la mayoría: ${y(casas.filter((c) => c.destacados.some((d) => /2 autos|dos autos/i.test(d))).map((c) => c.nombre)) || 'pregunta por la casa que te interese'} tienen cochera para dos.` },
      ],
    },
  ];
  for (const t of TEMPORADAS) {
    const cs = t.casas;
    paginas.push({
      slug: t.slug,
      menu: t.menu,
      grupo: 'temporada',
      titulo: t.titulo,
      desc: t.desc,
      eyebrow: t.eyebrow,
      h1: t.h1,
      lead: t.lead,
      wa: t.wa,
      casas: cs.map((c) => c.slug),
      secciones: t.secciones(cs),
      faqs: t.faqs(cs),
      relacionadas: TEMPORADAS.filter((o) => o.slug !== t.slug).map((o) => o.slug).concat(['casas-con-asador-y-alberca-posadas-fin-de-ano-torreon', 'hospedaje-peregrinos-cristo-de-las-noas-semana-santa-torreon', 'hospedaje-feria-torreon-y-eventos']),
      publicado: FECHA_INTENCIONES,
      actualizado: FECHA_INTENCIONES,
    });
  }

  // ── Por número de personas: "casa para 8 / 10 / 12 / 16 en Torreón" ──────────────────
  for (const n of [6, 8, 10, 12, 14, 16]) {
    const exactas = casas.filter((c) => c.huespedes === n);
    const caben = casas.filter((c) => c.huespedes >= n).sort((a, b) => a.huespedes - b.huespedes || noche(a) - noche(b));
    const cs = [...exactas, ...caben.filter((c) => !exactas.includes(c))].slice(0, 7);
    if (!cs.length) continue;
    const baratas = [...cs].sort((a, b) => noche(a) - noche(b));
    const pp = (c) => Math.round(noche(c) / n);
    const zonas = [...new Set(cs.map((c) => ZONAS[zonaKey(c)]?.nombre || c.zona))];
    paginas.push({
      slug: `casa-para-${n}-personas-torreon`,
      menu: `Casa para ${n}`,
      grupo: 'personas',
      titulo: `Casa para ${n} personas en Torreón: amueblada, por noche o mes`,
      desc: `Casas amuebladas en Torreón para ${n} personas: ${cs.length} opciones con camas reales, clima, cocina y estacionamiento, desde ${mxn(noche(baratas[0]))}${IVA_NOTA} la noche por casa (${mxn(pp(baratas[0]))} por persona). En ${y(zonas.slice(0, 4))}. Con factura y reserva directa.`,
      eyebrow: `Casas para ${n} personas · Torreón`,
      h1: `Casa para ${n} personas en Torreón, <em>${n >= 12 ? 'todos bajo el mismo techo' : 'con camas de verdad para todos'}</em>.`,
      lead: `${exactas.length ? `${exactas.length === 1 ? 'Una casa pensada' : `${exactas.length} casas pensadas`} exactamente para ${n}` : `Casas donde caben ${n}`} y, si el grupo crece, las siguientes por tamaño. Precio por casa completa, no por persona: la más económica para ${n} es ${baratas[0].nombre}, ${mxn(noche(baratas[0]))}${IVA_NOTA} la noche, ${mxn(pp(baratas[0]))} por persona.`,
      wa: `Hola Hostalia, somos ${n} personas y buscamos casa en Torreón del __ al __. ¿Cuál nos recomiendan y cuánto sale?`,
      casas: cs.map((c) => c.slug),
      secciones: [
        {
          h2: `Cómo se reparten ${n} personas en estas casas`,
          html: `<p>Contamos camas, no sillones. ${y(cs.slice(0, 4).map((c) => `${ficha(c)}: ${c.huespedes} personas en ${c.recamaras} recámaras con ${c.camas} camas${c.banos ? ` y ${c.banos} baños` : ''}`))}. ${n >= 10 ? 'Con grupos de este tamaño lo que más se agradece son los baños: por eso lo ponemos en la tabla.' : 'Para una familia de este tamaño conviene fijarse en las recámaras separadas y si hay patio o alberca.'}</p>`,
        },
        { h2: `Casas para ${n} en Torreón, comparadas`, html: `${tabla(cs, { th: `Por persona (${n})`, td: (c) => mxn(pp(c)) })}${notaPrecios}` },
        {
          h2: 'En qué zona están',
          html: `<p>${y(zonas)}. ${cs.slice(0, 3).map((c) => `${c.nombre} queda a ${minA(c, 'Parque Industrial', 'Peñoles', 'Lala') || '—'} min de la zona industrial más cercana y a ${minA(c, 'Aeropuerto') || '—'} del aeropuerto.`).join(' ')} Si vienen por trabajo, elige por la zona; si vienen de visita, por alberca y patio.</p>`,
        },
        {
          h2: `Precio por persona para ${n}`,
          html: `<p>En una casa el precio es por la casa; dividido entre ${n} sale en ${mxn(pp(baratas[0]))} por persona en ${baratas[0].nombre} y ${mxn(pp(baratas[baratas.length - 1]))} en ${baratas[baratas.length - 1].nombre}. Un hotel cobra por habitación: para ${n} personas son ${Math.ceil(n / 2)} habitaciones dobles. Por semana y por mes el precio de la casa baja.</p>`,
        },
      ],
      faqs: [
        { q: `¿Cuál es la casa más barata para ${n} personas en Torreón?`, a: `${baratas[0].nombre}: ${mxn(noche(baratas[0]))}${IVA_NOTA} la noche por la casa completa, ${mxn(pp(baratas[0]))} por persona entre ${n}. Limpieza aparte ${mxn(LIMPIEZA)}${IVA_NOTA} por semana.` },
        { q: `¿Caben ${n} personas de verdad o es contando sillones?`, a: `Caben con camas. ${y(cs.slice(0, 3).map((c) => `${c.nombre} tiene ${c.camas} camas para ${c.huespedes}`))}. Si prefieren una cama por persona, dinos y te decimos cuál conviene.` },
        { q: `¿Y si somos ${n + 1} o ${n + 2}?`, a: `${caben.filter((c) => c.huespedes >= n + 2).length ? `Hay casa para más: ${y(caben.filter((c) => c.huespedes >= n + 2).slice(0, 3).map((c) => `${c.nombre} para ${c.huespedes}`))}.` : `La casa más grande recibe ${Math.max(...casas.map((c) => c.huespedes))} personas; para grupos mayores combinamos dos casas en la misma zona.`}` },
        { q: '¿Se puede facturar?', a: 'Sí, CFDI por el total a nombre de la empresa o de quien pague.' },
        { q: '¿Cuántas noches mínimo?', a: 'Dos. Por semana y por mes hay mejor tarifa.' },
      ],
      relacionadas: [6, 8, 10, 12, 14, 16].filter((m) => m !== n && casas.some((c) => c.huespedes >= m)).map((m) => `casa-para-${m}-personas-torreon`).slice(0, 5),
      publicado: FECHA_INTENCIONES,
      actualizado: FECHA_INTENCIONES,
    });
  }

  // ── Guías comparativas (GEO): afirmaciones cortas con número y fuente interna ─────────
  const hotelDoble = 1200; // supuesto explícito: rango bajo de hotel de negocios en Torreón, habitación doble por noche
  const diez = casas.filter((c) => c.huespedes >= 10);
  const barata10 = diez.reduce((a, b) => (porPersona(a) <= porPersona(b) ? a : b));
  const casa10 = casas.find((c) => c.slug === 'leones') || diez[0];
  const semanaCasa = (c) => noche(c) * 5 + finde(c) * 2 + LIMPIEZA;
  const GUIAS = [
    {
      slug: 'casa-o-hotel-para-10-personas-en-torreon-cuanto-cuesta',
      menu: 'Casa vs hotel para 10',
      titulo: 'Casa o hotel para 10 personas en Torreón: cuánto cuesta cada opción',
      desc: `Comparativa con cifras: hospedar a 10 personas una semana en Torreón en hotel (5 habitaciones dobles) frente a una casa completa de Hostalia. Precio por noche, por persona, comidas, lavandería y factura. Casa desde ${mxn(noche(casa10))}${IVA_NOTA} la noche para 10.`,
      eyebrow: 'Guía con cifras · actualizada el ' + HOY,
      h1: '¿Casa o hotel para 10 personas en Torreón? <em>Las cuentas, sin rodeos.</em>',
      lead: `Un grupo de 10 personas en hotel ocupa 5 habitaciones dobles. En una casa de Hostalia ocupa una casa. La diferencia no es solo el precio por noche: son las comidas fuera, la lavandería, el estacionamiento y dónde se junta el equipo. Aquí están los números con los precios reales de nuestras casas al ${HOY}.`,
      wa: 'Hola Hostalia, somos 10 personas y estamos comparando hotel contra casa en Torreón. ¿Me pasan precio por una semana con factura?',
      casas: diez.slice(0, 6),
      secciones: (cs) => [
        { h2: 'La comparación base: una semana, 10 personas', html: `<p><strong>Hotel:</strong> 5 habitaciones dobles a ${mxn(hotelDoble)} la noche (rango bajo de hotel de negocios en Torreón, tarifa pública sin desayuno) son ${mxn(hotelDoble * 5)} por noche y ${mxn(hotelDoble * 5 * 7)} por 7 noches, más IVA en la mayoría de los casos. Sin cocina: 10 personas comiendo fuera tres veces al día a ${mxn(120)} por comida son ${mxn(10 * 3 * 120 * 7)} más a la semana.</p><p><strong>Casa Hostalia:</strong> ${casa10.nombre} para ${casa10.huespedes} cuesta ${mxn(noche(casa10))}${IVA_NOTA} entre semana y ${mxn(finde(casa10))}${IVA_NOTA} viernes y sábado: ${mxn(semanaCasa(casa10))}${IVA_NOTA} la semana completa con la limpieza semanal incluida en la cuenta. Con cocina equipada el gasto de comida baja a la mitad o menos haciendo súper.</p><p>Resumen: <strong>la casa cuesta alrededor de un tercio del hotel por noche</strong> para el mismo grupo (${mxn(noche(casa10))} contra ${mxn(hotelDoble * 5)}), y el ahorro en comidas se suma aparte.</p>` },
        { h2: 'Precio por persona por noche, casa por casa', html: `${tabla(cs, { th: 'Por persona / noche', td: (c) => mxn(porPersona(c)) })}<p>La más económica por persona es <strong>${barata10.nombre}</strong>: ${mxn(porPersona(barata10))} por persona por noche (${mxn(noche(barata10))}${IVA_NOTA} entre ${barata10.huespedes}). En hotel, una cama en habitación doble sale en ${mxn(hotelDoble / 2)} por persona.</p>${notaPrecios}` },
        { h2: 'Lo que el precio no muestra', html: `<ul><li><strong>Comidas:</strong> la cocina equipada es el ahorro más grande en estancias de una semana o más.</li><li><strong>Lavandería:</strong> todas las casas tienen lavadora; en hotel se paga por pieza o se busca lavandería.</li><li><strong>Estacionamiento:</strong> dentro de la privada, sin costo, con espacio para camionetas.</li><li><strong>Espacio común:</strong> sala y comedor para juntas, cenas de equipo o simplemente convivir.</li><li><strong>Factura:</strong> CFDI por el total, igual que el hotel, pero con un solo proveedor y un solo contrato.</li><li><strong>Lo que el hotel tiene y la casa no:</strong> recepción 24 horas, limpieza diaria y desayuno buffet. Si eso pesa más que el ahorro, el hotel es la opción.</li></ul>` },
        { h2: 'Cuándo conviene cada una', html: `<p><strong>Hotel</strong> para estancias de 1 o 2 noches, personas que viajan solas o que necesitan servicio diario. <strong>Casa completa</strong> para grupos de 6 o más, estancias de 3 noches en adelante, familias, cuadrillas y equipos de proyecto; y siempre que haya que facturar un monto grande a un solo proveedor.</p>` },
      ],
      faqs: (cs) => [
        { q: '¿Cuánto cuesta hospedar a 10 personas una semana en Torreón en casa?', a: `En ${casa10.nombre}, ${mxn(semanaCasa(casa10))}${IVA_NOTA} por 7 noches (5 entre semana a ${mxn(noche(casa10))} y 2 de fin de semana a ${mxn(finde(casa10))}, más la limpieza semanal de ${mxn(LIMPIEZA)}). Es por la casa completa, no por persona.` },
        { q: '¿Y en hotel?', a: `Con 5 habitaciones dobles a ${mxn(hotelDoble)} la noche, ${mxn(hotelDoble * 5 * 7)} por 7 noches, sin comidas. Es un supuesto de rango bajo; en temporada alta o con desayuno incluido sube.` },
        { q: '¿El precio de la casa incluye limpieza?', a: `No, la limpieza es obligatoria y se cobra aparte: ${mxn(LIMPIEZA)}${IVA_NOTA} por servicio, una vez por semana. Por eso la incluimos en el cálculo semanal.` },
        { q: '¿Cuál es la casa más barata por persona?', a: `${barata10.nombre}: ${mxn(porPersona(barata10))} por persona por noche con la casa llena (${barata10.huespedes} personas).` },
        { q: '¿Facturan igual que un hotel?', a: 'Sí, CFDI con el IVA desglosado por el total de la estancia, a nombre de la empresa.' },
      ],
    },
    {
      slug: 'cuanto-cuesta-hospedar-una-cuadrilla-un-mes-en-torreon',
      menu: 'Cuadrilla por mes: costo',
      titulo: 'Cuánto cuesta hospedar una cuadrilla un mes en Torreón (con cifras)',
      desc: `Costo real de hospedar de 8 a 16 trabajadores un mes en Torreón en casa completa: renta mensual con y sin servicios, limpieza semanal, depósito y factura. Desde ${mxn(Math.min(...casas.filter((c) => c.precioMesSinServicios).map((c) => c.precioMesSinServicios)))}${IVA_NOTA} al mes por casa.`,
      eyebrow: 'Guía con cifras · actualizada el ' + HOY,
      h1: 'Hospedar una cuadrilla un mes en Torreón: <em>cuánto cuesta de verdad</em>.',
      lead: 'Las constructoras y contratistas que traen personal a La Laguna preguntan lo mismo: cuánto me va a costar al mes, qué incluye y qué no. Aquí está la cuenta completa con los precios publicados de nuestras casas, sin letra chica.',
      wa: 'Hola Hostalia, necesito cotizar una cuadrilla de __ personas por __ meses en Torreón, con factura. ¿Me pasan precio por mes con y sin servicios?',
      casas: casas.filter((c) => c.precioMesSinServicios && c.huespedes >= 8).sort((a, b) => b.huespedes - a.huespedes).slice(0, 6),
      secciones: (cs) => [
        { h2: 'La cuenta de un mes, concepto por concepto', html: `<ol><li><strong>Renta mensual de la casa:</strong> ${y(cs.slice(0, 4).map((c) => `${ficha(c)} (${c.huespedes} personas) ${mes(c)} sin servicios`))}.</li><li><strong>Servicios</strong> (agua, luz, gas e internet): incluidos por ${mxn(3000)} más al mes, o por consumo si prefieres pagarlos tú.</li><li><strong>Limpieza semanal obligatoria</strong> con cambio de sábanas y toallas: ${mxn(LIMPIEZA)}${IVA_NOTA} por servicio, ${mxn(LIMPIEZA * 4)} al mes.</li><li><strong>Depósito en garantía:</strong> un mes de renta, se devuelve al salir si la casa se entrega bien.</li><li><strong>IVA:</strong> 16% sobre renta, servicios y limpieza, desglosado en el CFDI.</li></ol><p>Ejemplo con ${cs[0].nombre} para ${cs[0].huespedes}: ${mxn(cs[0].precioMesConServicios)} con servicios + ${mxn(LIMPIEZA * 4)} de limpieza = <strong>${mxn(cs[0].precioMesConServicios + LIMPIEZA * 4)}${IVA_NOTA} al mes</strong>, unos ${mxn(Math.round((cs[0].precioMesConServicios + LIMPIEZA * 4) / cs[0].huespedes))} por trabajador al mes, o ${mxn(Math.round((cs[0].precioMesConServicios + LIMPIEZA * 4) / cs[0].huespedes / 30))} por trabajador por día.</p>` },
        { h2: 'Casas con precio por mes para cuadrillas', html: `${tabla(cs, { th: 'Por trabajador / mes (con servicios)', td: (c) => mxn(Math.round((c.precioMesConServicios + LIMPIEZA * 4) / c.huespedes)) })}${notaPrecios}` },
        { h2: 'Comparado con otras opciones', html: `<p>Un campamento o casa compartida informal suele salir más barato en papel pero sin factura, sin clima en todas las recámaras y sin nadie que responda si falla el boiler a las 5 de la mañana. Un hotel para 10 trabajadores un mes, a ${mxn(hotelDoble)} la habitación doble, son ${mxn(hotelDoble * 5 * 30)}: más de tres veces la casa, sin cocina. La casa completa queda en medio: formal, con factura y con el personal junto.</p>` },
        { h2: 'Cómo se contrata', html: `<p>Contrato de hospedaje mes por mes, pago por adelantado por transferencia, depósito de un mes, CFDI a nombre de la razón social. Si el proyecto se alarga, se renueva con las mismas condiciones mientras la casa esté libre; por eso conviene avisar con dos semanas. Si rota el personal no cambia nada: el contrato es por la casa.</p>` },
      ],
      faqs: (cs) => [
        { q: '¿Cuánto cuesta por mes una casa para 10 trabajadores en Torreón?', a: `${y(cs.filter((c) => c.huespedes >= 10).slice(0, 3).map((c) => `${c.nombre} (${c.huespedes}) ${mes(c)} sin servicios o ${mxn(c.precioMesConServicios)}${IVA_NOTA} con servicios`))}. Más limpieza semanal de ${mxn(LIMPIEZA)}${IVA_NOTA}.` },
        { q: '¿Qué incluye "con servicios"?', a: `Agua, luz, gas e internet con un tope de consumo normal para una casa habitada, por ${mxn(3000)} más que la renta sin servicios.` },
        { q: '¿Piden depósito?', a: 'Sí, un mes de renta en garantía, que se devuelve al entregar la casa en orden.' },
        { q: '¿Cuánto sale por trabajador al día?', a: `Con ${cs[0].nombre} llena (${cs[0].huespedes} personas), unos ${mxn(Math.round((cs[0].precioMesConServicios + LIMPIEZA * 4) / cs[0].huespedes / 30))} por trabajador por día con servicios y limpieza incluidos, más IVA.` },
        { q: '¿Facturan el total?', a: 'Sí, CFDI por renta, servicios y limpieza con el IVA desglosado, a nombre de la empresa.' },
      ],
    },
    {
      slug: 'airbnb-o-reservar-directo-en-hostalia-torreon',
      menu: 'Airbnb vs directo',
      titulo: 'Airbnb o reservar directo en Hostalia: qué cambia y cuánto ahorras',
      desc: 'Las mismas casas de Hostalia están en Airbnb y en hostalia.com.mx. Reservar directo evita la comisión de la plataforma, permite factura CFDI y contrato, y se puede pagar con tarjeta o transferencia en línea. Comparación punto por punto con precios reales.',
      eyebrow: 'Guía · misma casa, dos formas de reservar',
      h1: 'Airbnb o directo: <em>misma casa, misma llave, distinto precio</em>.',
      lead: 'Varias casas de Hostalia están publicadas en Airbnb desde hace años, con más de 80 reseñas y 4.9 de calificación. También se pueden reservar directo aquí. No es una trampa ni una copia: es el mismo anfitrión decidiendo que la comisión de la plataforma se la quede el huésped.',
      wa: 'Hola Hostalia, vi su casa en Airbnb y quiero saber el precio reservando directo, con factura.',
      casas: casas.filter((c) => c.airbnbId || (c.airbnbIds || []).length).slice(0, 6),
      secciones: (cs) => [
        { h2: 'Qué cambia al reservar directo', html: `<table class="tabla"><thead><tr><th></th><th>En Airbnb</th><th>Directo en Hostalia</th></tr></thead><tbody><tr><td>Precio</td><td>Incluye la comisión de la plataforma</td><td>Más bajo: sin comisión, mismo anfitrión</td></tr><tr><td>Factura</td><td>Airbnb factura su servicio, no el hospedaje completo</td><td>CFDI por el total, a nombre de tu empresa</td></tr><tr><td>Contrato</td><td>Términos de la plataforma</td><td>Contrato de hospedaje con fechas, monto y reglas</td></tr><tr><td>Pago</td><td>Tarjeta en la plataforma</td><td>Tarjeta o transferencia en línea en la ficha de la casa, o anticipo por transferencia</td></tr><tr><td>Estancias por mes</td><td>Descuento mensual fijo de la plataforma</td><td>Precio por mes negociado, con o sin servicios</td></tr><tr><td>Reseñas y garantía</td><td>Las de Airbnb (ahí seguimos publicados)</td><td>Las mismas casas y el mismo anfitrión; el calendario está sincronizado con Airbnb</td></tr></tbody></table>` },
        { h2: 'Las casas que están en los dos lados', html: `${tabla(cs, { th: 'Reserva en línea aquí', td: (c) => (c.reservaEnLinea ? 'Sí, con calendario' : 'Por WhatsApp') })}${notaPrecios}` },
        { h2: 'Cuándo sí conviene Airbnb', html: `<p>Si prefieres pagar con la protección de la plataforma y no necesitas factura ni contrato, Airbnb está bien y ahí nos encuentras. Si eres empresa, vienes por semanas o quieres el mejor precio, reserva directo: es la misma casa.</p>` },
        { h2: 'Cómo se evita el doble booking', html: `<p>Los calendarios de Airbnb y de hostalia.com.mx están conectados por iCal: una reserva en un lado bloquea el otro. Si reservas aquí, la casa deja de aparecer libre en Airbnb en cuestión de horas.</p>` },
      ],
      faqs: () => [
        { q: '¿Es la misma casa que veo en Airbnb?', a: 'Sí. Mismo anfitrión, misma casa, misma llave. Las fotos del sitio y de Airbnb son del mismo lugar.' },
        { q: '¿Por qué es más barato directo?', a: 'Porque no hay comisión de plataforma. Ese porcentaje se lo queda el huésped en forma de precio más bajo.' },
        { q: '¿Puedo pagar con tarjeta?', a: 'Sí, en las casas con reserva en línea pagas con tarjeta o transferencia desde la ficha; en las demás, anticipo por transferencia.' },
        { q: '¿Qué pasa si cancelo?', a: 'Avísanos por WhatsApp; en reservas cortas buscamos mover fechas antes que cancelar, y en estancias largas las condiciones van en el contrato.' },
        { q: '¿Y la factura?', a: 'Reservando directo emitimos CFDI por el total del hospedaje a nombre de tu empresa o a tu nombre.' },
      ],
    },
    {
      slug: 'que-incluye-una-casa-amueblada-en-renta-en-torreon',
      menu: 'Qué incluye una casa amueblada',
      titulo: 'Qué incluye una casa amueblada en renta en Torreón (y qué no)',
      desc: 'Lista completa de lo que trae una casa amueblada de Hostalia en Torreón: muebles, cocina equipada, blancos, clima, wifi, lavadora, estacionamiento; qué se cobra aparte (limpieza semanal, servicios por mes) y qué debes llevar. Útil para comparar con otras rentas temporales.',
      eyebrow: 'Guía · lo que traes y lo que ya está',
      h1: 'Qué incluye una casa amueblada en Torreón: <em>la lista completa</em>.',
      lead: '"Amueblada" significa cosas distintas según quién renta. En Hostalia significa que entras con la maleta y nada más. Esta es la lista exacta, casa por casa, de lo que ya está, lo que se cobra aparte y lo que te toca traer.',
      wa: 'Hola Hostalia, quiero confirmar qué incluye la casa antes de reservar. Somos __ personas.',
      casas: casas.slice(0, 6),
      secciones: (cs) => [
        { h2: 'Lo que ya está en todas las casas', html: `<ul><li><strong>Muebles completos:</strong> camas con colchón, sala, comedor, clóset o ropero.</li><li><strong>Cocina equipada:</strong> estufa, refrigerador, microondas en la mayoría, ollas, sartenes, vajilla, vasos y cubiertos para la capacidad de la casa.</li><li><strong>Blancos:</strong> sábanas, almohadas, cobijas y toallas por persona, con cambio en la limpieza semanal.</li><li><strong>Clima:</strong> minisplit en recámaras y áreas comunes.</li><li><strong>Wifi</strong> y TV.</li><li><strong>Lavadora</strong> (y en algunas secadora).</li><li><strong>Estacionamiento</strong> dentro de privada o cochera techada.</li><li><strong>Agua caliente</strong> con boiler.</li><li><strong>Productos básicos</strong> al llegar: papel, jabón, bolsas.</li></ul>` },
        { h2: 'Lo que se cobra aparte', html: `<ul><li><strong>Limpieza:</strong> obligatoria, ${mxn(LIMPIEZA)}${IVA_NOTA} por servicio, una vez por semana, con cambio de sábanas y toallas. Si la quieres más seguido se cotiza.</li><li><strong>Servicios en renta por mes:</strong> agua, luz, gas e internet van incluidos por ${mxn(3000)} más al mes o se pagan por consumo. Por noche y por semana ya están incluidos.</li><li><strong>IVA:</strong> los precios se publican más IVA y se desglosa en la factura.</li><li><strong>Depósito en garantía</strong> en estancias por mes: un mes de renta, reembolsable.</li></ul>` },
        { h2: 'Lo que te toca traer', html: `<p>Ropa, artículos personales, la despensa (hay súper a menos de 10 minutos de todas las casas) y, si vienes por meses, lo que haga tuya la casa. No hace falta traer sábanas, toallas, trastes ni ventilador.</p>` },
        { h2: 'Extras que cambian por casa', html: `${tabla(cs, { th: 'Lo que la distingue', td: (c) => y(c.destacados.slice(0, 3)) })}${notaPrecios}` },
      ],
      faqs: () => [
        { q: '¿Hay que llevar sábanas y toallas?', a: 'No. Se entregan por persona y se cambian en la limpieza semanal.' },
        { q: '¿La cocina tiene lo necesario para cocinar a diario?', a: 'Sí: estufa, refrigerador, ollas, sartenes, vajilla y cubiertos para la capacidad de la casa. Si van a cocinar para más gente de la que duerme, avísanos.' },
        { q: '¿El internet y la luz están incluidos?', a: 'Por noche y por semana, sí. Por mes eliges: incluidos por un monto fijo o pagarlos por consumo.' },
        { q: '¿Tienen lavadora?', a: 'Todas tienen lavadora; algunas también secadora. Está en la ficha de cada casa.' },
        { q: '¿Aceptan mascotas?', a: 'Depende de la casa y del tamaño de la mascota. Pregúntanos por WhatsApp antes de reservar.' },
      ],
    },
    {
      slug: 'zonas-de-torreon-donde-quedarse-segun-a-que-vienes',
      menu: 'Zonas de Torreón: dónde quedarse',
      titulo: 'Zonas de Torreón para quedarse según a qué vienes: guía con minutos',
      desc: 'Qué zona de Torreón conviene según el motivo del viaje: zona industrial y Lajat, Peñoles y centro, Tec y hospitales, Parque Industrial Oriente y UA de C, límite con Gómez Palacio. Minutos reales a cada punto y la casa amueblada de Hostalia en cada zona.',
      eyebrow: 'Guía · minutos reales desde cada zona',
      h1: 'Dónde quedarse en Torreón <em>según a qué vienes</em>.',
      lead: 'Torreón se cruza en 25 minutos sin tráfico, pero a las 7 de la mañana la zona equivocada te cuesta una hora al día. Esta guía dice qué zona conviene para cada motivo de viaje, con los minutos medidos desde cada colonia donde tenemos casa.',
      wa: 'Hola Hostalia, vengo a Torreón a __ (planta / hospital / universidad / evento). ¿En qué zona me conviene quedarme y qué casa tienen ahí?',
      casas: ['leones', 'provitec', 'almendros', 'alebrijes', 'santorini', 'gomez-11'].map((s) => casas.find((c) => c.slug === s)).filter(Boolean),
      secciones: (cs) => [
        { h2: 'Si vienes a la zona industrial del norte (Lajat, Lala, aeropuerto)', html: `<p>Quédate en ${y(['vinedos', 'alebrijes', 'senderos', 'santorini', 'alicante'].map((z) => `${ZONAS[z].nombre} (Lajat a ${minZona(z, 'Parque Industrial Lajat')} min, Lala a ${minZona(z, 'Lala')} min)`))}. Casas: ${y(['vinedos', 'alebrijes', 'senderos', 'santorini', 'alicante'].flatMap((z) => casasZona(z)).slice(0, 6).map(ficha))}.</p>` },
        { h2: 'Si vienes a Peñoles, al centro o al Tec de La Laguna', html: `<p>Provitec: Peñoles a ${minZona('provitec', 'Peñoles')} min, el centro a ${minZona('provitec', 'Paseo Morelos')} min, el Tecnológico de La Laguna a ${minZona('provitec', 'Instituto Tecnológico')} min. Casa: ${ficha(casas.find((c) => c.slug === 'provitec'))} para 12. También las casas del centro-poniente: ${y(casasZona('torreon').slice(0, 3).map(ficha))}.</p>` },
        { h2: 'Si vienes al Tec de Monterrey o al Hospital Ángeles', html: `<p>Zona Tec: Hospital Ángeles a ${minZona('tec', 'Hospital Ángeles')} min, Tec a ${minZona('tec', 'Tec de Monterrey')} min, Intermall a ${minZona('tec', 'Intermall')} min. Casa: ${y(casasZona('tec').map(ficha))}. Para familias grandes, Provitec queda a ${minZona('provitec', 'Tec de Monterrey')} min del Tec.</p>` },
        { h2: 'Si vienes al Parque Industrial Oriente, a la UA de C o al Estadio', html: `<p>Los Almendros: Parque Industrial Oriente a ${minZona('almendros', 'Parque Industrial Oriente')} min, Ciudad Universitaria a ${minZona('almendros', 'UA de C')} min, Estadio Corona a ${minZona('almendros', 'Estadio')} min. Casas: ${y([...casasZona('almendros'), ...casasZona('rosita')].map(ficha))}.</p>` },
        { h2: 'Si tu trabajo o tu familia está en Gómez Palacio o Lerdo', html: `<p>Casas en el límite Torreón – Gómez Palacio: centro de Gómez a ${minZona('gomez', 'Centro de Gómez')} min, Paseo Morelos a ${minZona('gomez', 'Paseo Morelos')} min. ${y(casasZona('gomez').map(ficha))}.</p>` },
        { h2: 'Las casas, una por zona', html: `${tabla(cs, { th: 'Zona', td: (c) => ZONAS[zonaKey(c)]?.nombre || c.zona })}${notaPrecios}` },
      ],
      faqs: () => [
        { q: '¿Cuánto se hace de un lado a otro de Torreón?', a: 'Entre 20 y 30 minutos sin tráfico por el Periférico; en hora pico puede ser el doble. Por eso conviene elegir la zona según el destino diario.' },
        { q: '¿Cuál es la mejor zona para trabajar en la zona industrial?', a: `Los Viñedos, Alebrijes, Senderos y Santorini: el Parque Industrial Lajat queda entre ${Math.min(...['vinedos', 'alebrijes', 'senderos', 'santorini'].map((z) => minZona(z, 'Parque Industrial Lajat') || 99))} y ${Math.max(...['vinedos', 'alebrijes', 'senderos', 'santorini'].map((z) => minZona(z, 'Parque Industrial Lajat') || 0))} minutos.` },
        { q: '¿Y para hospitales?', a: `Provitec (Sanatorio Español a ${minZona('provitec', 'Sanatorio')} min) y la zona Tec (Hospital Ángeles a ${minZona('tec', 'Hospital Ángeles')} min).` },
        { q: '¿Tienen casa en Gómez Palacio o Lerdo?', a: 'No, todas están en Torreón; las del límite con Gómez quedan a menos de 10 minutos del centro de Gómez Palacio.' },
        { q: '¿Cómo sé qué casa está libre?', a: 'En las fichas con reserva en línea ves el calendario; en las demás, escríbenos por WhatsApp con tus fechas.' },
      ],
    },
  ];
  for (const g of GUIAS) {
    const cs = g.casas;
    paginas.push({
      slug: g.slug,
      menu: g.menu,
      grupo: 'guias',
      titulo: g.titulo,
      desc: g.desc,
      eyebrow: g.eyebrow,
      h1: g.h1,
      lead: g.lead,
      wa: g.wa,
      casas: cs.map((c) => c.slug),
      secciones: g.secciones(cs),
      faqs: g.faqs(cs),
      relacionadas: GUIAS.filter((o) => o.slug !== g.slug).map((o) => o.slug),
      publicado: FECHA_INTENCIONES,
      actualizado: FECHA_INTENCIONES,
    });
  }

  return paginas;
}
