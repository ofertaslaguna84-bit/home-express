/**
 * SEO local de Torreón (19 nov 2026): páginas de intención alta que faltaban.
 *   · "cerca de" un punto concreto (aeropuerto, Lajat, Peñoles, Galerías, Ibero, Tec de La Laguna, hospitales, central)
 *   · por rumbo de la ciudad (norte, oriente, sur)
 *   · por tipo de casa (departamentos, recámara en planta baja, privada con seguridad)
 *   · por forma de contratar (sin aval, con factura, fin de semana) y por motivo (graduaciones, reubicación, auditorías)
 * Misma forma que landings.json: build.mjs las maqueta con paginaLanding y entran solas a sitemap, llms.txt y /zonas/.
 *
 * Reglas (las mismas de intenciones.mjs, más dos):
 *   · todos los precios salen de casas.json y todos los minutos de lugares.json; si un minuto no está, no se escribe;
 *   · solo Torreón como ubicación de las casas;
 *   · las casas sin colonia confirmada (zona genérica "torreon") no entran a los rankings de cercanía;
 *   · nada de nombres de clientes; la calle nunca se publica.
 */
export const FECHA_LOCALES = '2026-11-19';

export function generarLocales({ casas, lugares, noche, finde, mxn, IVA_NOTA, LIMPIEZA }) {
  const paginas = [];
  const zonaKey = (c) => lugares.casaZona[c.slug] || 'torreon';
  const ZN = {
    vinedos: 'Los Viñedos', provitec: 'Provitec', almendros: 'Los Almendros', rosita: 'Ampliación La Rosita', senderos: 'Residencial Senderos',
    'los-angeles': 'Ampliación Los Ángeles', tec: 'la zona Tec de Monterrey', gomez: 'el límite de Torreón con Gómez Palacio', santorini: 'Villas Santorini',
    alebrijes: 'Alebrijes Residencial', torreon: 'Torreón',
  };
  const zn = (c) => ZN[zonaKey(c)] || c.zona;
  /** Casas cuya colonia está confirmada: las únicas de las que se publican minutos. */
  const ubicada = (c) => zonaKey(c) !== 'torreon';
  const cercaZona = (z) => lugares.cerca[z] || {};
  /** Sin repetidos del tipo "Hospital Ángeles" / "Hospital Ángeles Torreón". */
  const lugaresDe = (z, categoria, n = 3) => (cercaZona(z)[categoria] || []).filter((l, i, a) => !a.slice(0, i).some((o) => l.n.startsWith(o.n))).slice(0, n);
  const y = (arr) => (arr.length < 2 ? arr.join('') : `${arr.slice(0, -1).join(', ')} ${/^(<[^>]+>)*h?i/i.test(arr[arr.length - 1]) ? 'e' : 'y'} ${arr[arr.length - 1]}`);
  const limpio = (n) => n.replace(/^Aeropuerto Internacional de$/, 'Aeropuerto de Torreón').replace(/ de$/, ' de Torreón');
  const fmtLugares = (items) => y(items.map((l) => `${limpio(l.n)} (${l.min} min)`));
  const html = (s) => String(s).replace(/&/g, '&amp;');
  const ficha = (c) => `<a href="../casas/${c.slug}/">${c.nombre}</a>`;
  const liga = (slug, txt) => `<a href="../${slug}/">${txt}</a>`;
  const mes = (c) => (c.precioMesSinServicios ? `${mxn(c.precioMesSinServicios)}${IVA_NOTA}` : 'se cotiza');
  const precio = (c) => `${mxn(noche(c))}${IVA_NOTA}`;
  const texto = (c) => `${c.destacados.join(' ')} ${c.resumen}`;
  const conAlberca = (c) => /alberca/i.test(texto(c));
  const conAsador = (c) => /asador|palapa/i.test(texto(c));
  const plantaBaja = (c) => /planta baja/i.test(texto(c));
  const enPrivada = (c) => /privada con|privada cerrada|zona privada|fraccionamiento cerrado|acceso controlado/i.test(texto(c));
  const esDepa = (c) => /^(depa|loft)/.test(c.slug);
  const porSlug = (...slugs) => slugs.map((s) => casas.find((c) => c.slug === s)).filter(Boolean);
  const rango = (cs, f) => { const v = cs.map(f); const a = Math.min(...v), b = Math.max(...v); return a === b ? `${a}` : `${a} a ${b}`; };
  const notaPrecios = `<p style="font-size:13px;color:var(--gris)">Precios por casa completa, por noche, reservando directo${IVA_NOTA}. Limpieza obligatoria aparte: ${mxn(LIMPIEZA)}${IVA_NOTA} por semana. Por semana y por mes el precio baja: se cotiza con tus fechas.</p>`;
  const notaMinutos = `<p style="font-size:13px;color:var(--gris)">Minutos en coche estimados desde la colonia de cada casa, no desde la puerta: la calle exacta se comparte al confirmar la reserva. En hora pico puede ser más.</p>`;

  /** Minutos de la colonia de la casa a un lugar cuyo nombre empiece así (o null si no está medido). */
  const minA = (c, prefijo) => {
    for (const cat of Object.values(cercaZona(zonaKey(c)))) {
      const x = cat.find((l) => l.n.toLowerCase().startsWith(prefijo.toLowerCase()));
      if (x) return x.min;
    }
    return null;
  };
  /** Casas con colonia confirmada ordenadas por minutos a un lugar. */
  const cercanas = (prefijo, { n = 6, max = 99 } = {}) =>
    casas
      .filter(ubicada)
      .map((c) => ({ c, min: minA(c, prefijo) }))
      .filter((x) => x.min != null && x.min <= max)
      .sort((a, b) => a.min - b.min || b.c.huespedes - a.c.huespedes)
      .slice(0, n);

  /** "La más cercana" con empates: si varias casas marcan los mismos minutos se nombran todas. */
  const primeras = (t) => t.filter((x) => x.min === t[0].min);
  const cercaTxt = (t, f = (c) => c.nombre) => {
    const e = primeras(t);
    const resto = t.filter((x) => x.min > t[0].min).slice(0, 3);
    return `${y(e.map((x) => f(x.c)))}, en ${y([...new Set(e.map((x) => zn(x.c)))])}, a unos ${t[0].min} minutos en coche.${resto.length ? ` Después ${y(resto.map((x) => `${f(x.c)} (${x.min} min)`))}.` : ''}`;
  };

  const tabla = (cs, extra) => `<table class="tabla"><thead><tr><th>Casa</th><th>Personas</th><th>Recámaras</th><th>Por noche</th><th>Por mes</th>${extra ? `<th>${extra.th}</th>` : ''}</tr></thead><tbody>${cs
    .map(
      (c) =>
        `<tr><td>${ficha(c)}<br><small style="color:var(--gris)">${zn(c)[0].toUpperCase()}${zn(c).slice(1)}</small></td><td>${c.huespedes}</td><td>${c.recamaras}${c.banos ? ` · ${c.banos} baños` : ''}</td><td>${precio(c)}</td><td>${mes(c)}</td>${extra ? `<td>${extra.td(c)}</td>` : ''}</tr>`
    )
    .join('')}</tbody></table>`;

  const pagina = (p) =>
    paginas.push({ clientes: false, pie: false, publicado: FECHA_LOCALES, actualizado: FECHA_LOCALES, ...p, casas: p.casas.map((c) => c.slug) });

  // ══════════════════════════════════════════════════════════ 1. Cerca de un punto concreto
  /** Cada punto trae su propio texto; lo único común es la tabla de minutos y lo que hay alrededor. */
  const PUNTOS = [
    {
      slug: 'hospedaje-cerca-aeropuerto-torreon',
      prefijo: 'Aeropuerto',
      aCorto: 'al aeropuerto',
      menu: 'Cerca del aeropuerto',
      grupo: 'zonas',
      max: 15,
      titulo: 'Hospedaje cerca del aeropuerto de Torreón',
      desc: (t) => `Casas amuebladas completas a ${t[0].min} minutos del aeropuerto de Torreón, para ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas. Por noche, semana o mes, con factura.`,
      eyebrow: 'Aeropuerto Internacional de Torreón',
      h1: 'Casa completa cerca del <em>aeropuerto de Torreón</em>.',
      lead: (t) => `Si llegas en avión a Torreón con tu equipo o con la familia, lo que conviene es dormir del lado del aeropuerto: ${y([...new Set(t.map((x) => zn(x.c)))].slice(0, 3))} quedan de ${t[0].min} a ${t[t.length - 1].min} minutos de la terminal. Casa completa con cocina, clima y estacionamiento, por noche, por semana o por mes.`,
      wa: 'Hola Hostalia, llegamos en avión a Torreón y buscamos casa cerca del aeropuerto. Somos __ personas, del __ al __. ¿Qué tienen libre?',
      intro: (t) => ({
        h2: 'Para quién sirve quedarse del lado del aeropuerto',
        html: `<p>El aeropuerto está al oriente de la ciudad, pegado al Periférico. Quedarse de ese lado sirve sobre todo a tres tipos de viaje: <strong>equipos de empresa</strong> que aterrizan y al día siguiente entran a planta, <strong>familias</strong> que vienen a un evento y no quieren cruzar la ciudad con maletas, y <strong>personal que rota</strong> cada semana o cada quince días y vuela de regreso a casa.</p><p>Lo más cercano: ${cercaTxt(t, ficha)} ${t.filter((x) => conAlberca(x.c)).length ? `De ellas, ${y(t.filter((x) => conAlberca(x.c)).map((x) => x.c.nombre))} ${t.filter((x) => conAlberca(x.c)).length === 1 ? 'tiene' : 'tienen'} alberca.` : ''}</p>`,
      }),
      cierre: () => ({
        h2: 'Si tu vuelo llega tarde o sale temprano',
        html: `<p>La entrada es a partir de las 3 de la tarde y la salida antes de las 11 de la mañana. Si el vuelo aterriza de noche o sale de madrugada, dinos el número de vuelo al reservar: la hora de entrega se coordina por WhatsApp ese mismo día, siempre que la casa no tenga otra entrada o salida. La estancia mínima es de 2 noches.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué casa de Hostalia queda más cerca del aeropuerto de Torreón?', a: cercaTxt(t) },
        { q: '¿Cuánto cuesta una casa cerca del aeropuerto?', a: `De ${mxn(Math.min(...t.map((x) => noche(x.c))))} a ${mxn(Math.max(...t.map((x) => noche(x.c))))}${IVA_NOTA} la noche por la casa completa, según la casa. La limpieza se cobra aparte: ${mxn(LIMPIEZA)}${IVA_NOTA} por semana.` },
        { q: '¿Pueden recibirnos si el vuelo llega de noche?', a: 'Sí, coordinando la hora por WhatsApp el mismo día. La entrada normal es a partir de las 3 de la tarde.' },
        { q: '¿Tienen transporte del aeropuerto a la casa?', a: 'No ofrecemos traslado. Las casas tienen estacionamiento por si rentan coche, y el trayecto en taxi o aplicación es corto desde estas colonias.' },
        { q: '¿Se puede facturar a la empresa?', a: 'Sí, CFDI por el total del hospedaje a nombre de la razón social, con el IVA desglosado.' },
      ],
      relacionadas: ['casas-en-renta-los-vinedos-torreon', 'casas-en-renta-villas-santorini-torreon', 'casas-en-renta-oriente-de-torreon', 'hospedaje-cerca-parque-industrial-lajat-torreon', 'hospedaje-torreon-personal-que-rota-por-semana', 'hospedaje-por-ciudad-de-origen'],
    },
    {
      slug: 'hospedaje-cerca-parque-industrial-lajat-torreon',
      prefijo: 'Parque Industrial Lajat',
      aCorto: 'a Lajat',
      menu: 'Cerca del Parque Industrial Lajat',
      grupo: 'empresas',
      max: 15,
      titulo: 'Hospedaje cerca del Parque Industrial Lajat',
      desc: (t) => `Casas amuebladas a ${t[0].min} minutos del Parque Industrial Lajat, en Torreón, para ingenieros, técnicos y cuadrillas de ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas. Con factura CFDI.`,
      eyebrow: 'Parque Industrial Lajat · norte de Torreón',
      h1: 'Hospedaje para tu equipo cerca del <em>Parque Industrial Lajat</em>.',
      lead: (t) => `Para el personal que entra a una planta de Lajat por semanas o meses: casas completas en ${y([...new Set(t.map((x) => zn(x.c)))].slice(0, 3))}, de ${t[0].min} a ${t[t.length - 1].min} minutos del parque. Un contrato, una factura y el equipo junto, con cocina, lavadora y clima.`,
      wa: 'Hola Hostalia, traemos personal al Parque Industrial Lajat. Somos __ personas por __ semanas. ¿Qué casa queda más cerca y cuánto sale con factura?',
      intro: (t) => ({
        h2: 'Qué casa queda a cuántos minutos de Lajat',
        html: `<p>Lajat está al norte de Torreón. Las colonias con casa que le quedan más cerca son ${y([...new Set(t.map((x) => zn(x.c)))])}. La más cercana es ${ficha(t[0].c)}, a ${t[0].min} minutos: ${t[0].c.huespedes} personas en ${t[0].c.recamaras} recámaras con ${t[0].c.camas} camas.</p><p>Si el equipo es de más de ${t[0].c.huespedes}, mira ${y(t.filter((x) => x.c.huespedes > t[0].c.huespedes).slice(0, 3).map((x) => `${ficha(x.c)} (${x.c.huespedes} personas, ${x.min} min)`)) || 'las demás de la tabla'}. Para un grupo grande también se pueden tomar dos casas de la misma zona.</p>`,
      }),
      cierre: (t) => ({
        h2: 'Cómo se contrata para una empresa',
        html: `<ul><li><strong>Contrato de hospedaje</strong> a nombre de la razón social, con fechas, monto y reglas de la casa.</li><li><strong>CFDI</strong> por el total, con el IVA desglosado.</li><li><strong>Por mes:</strong> ${y(t.filter((x) => x.c.precioMesSinServicios).slice(0, 3).map((x) => `${x.c.nombre} ${mes(x.c)} sin servicios`)) || 'se cotiza por WhatsApp'}; con agua, luz, gas e internet incluidos son ${mxn(3000)} más. Las casas sin precio mensual publicado se cotizan.</li><li><strong>Rotación:</strong> el contrato es por la casa, no por persona; si cambia el personal a mitad del proyecto no hay que rehacer nada.</li></ul><p>Más detalle en ${liga('hospedaje-ingenieros-tecnicos-planta-torreon', 'hospedaje para ingenieros y técnicos de planta')} y en ${liga('cuanto-cuesta-hospedar-una-cuadrilla-un-mes-en-torreon', 'cuánto cuesta hospedar una cuadrilla un mes')}.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué casa queda más cerca del Parque Industrial Lajat?', a: cercaTxt(t) },
        { q: '¿Cuántas personas caben por casa?', a: `De ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas según la casa, con camas reales. Para equipos más grandes se combinan dos casas de la misma zona.` },
        { q: '¿Cuánto cuesta por noche?', a: `De ${mxn(Math.min(...t.map((x) => noche(x.c))))} a ${mxn(Math.max(...t.map((x) => noche(x.c))))}${IVA_NOTA} por la casa completa. Por semana y por mes baja; se cotiza con las fechas del proyecto.` },
        { q: '¿Hay lugar para las camionetas?', a: 'Las casas tienen cochera o estacionamiento. Si traen vehículos grandes o remolque avísanos antes para decirte en cuál caben.' },
        { q: '¿Qué pasa si el proyecto se alarga?', a: 'Se extiende el contrato con las mismas condiciones mientras la casa esté libre. Conviene avisar con una o dos semanas.' },
      ],
      relacionadas: ['hospedaje-ingenieros-tecnicos-planta-torreon', 'hospedaje-cuadrillas-construccion-torreon', 'casas-en-renta-alebrijes-residencial-torreon', 'casas-en-renta-norte-de-torreon', 'hospedaje-parque-industrial-oriente', 'hospedaje-cerca-de-mieleras'],
    },
    {
      slug: 'hospedaje-cerca-penoles-torreon',
      prefijo: 'Peñoles',
      aCorto: 'a Peñoles',
      menu: 'Cerca de Peñoles',
      grupo: 'empresas',
      max: 13,
      titulo: 'Hospedaje cerca de Peñoles en Torreón',
      desc: (t) => `Casa y departamento amueblados a ${t[0].min} y ${t[1].min} minutos de Peñoles, en Torreón, para contratistas y personal de ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas. Con factura.`,
      eyebrow: 'Peñoles · zona centro de Torreón',
      h1: 'Hospedaje para contratistas cerca de <em>Peñoles</em>.',
      lead: (t) => `Para contratistas, proveedores y técnicos que entran a la planta de Peñoles en Torreón: ${t[0].c.nombre} queda a ${t[0].min} minutos y ${t[1].c.nombre} a ${t[1].min}. Casa completa por noche, semana o mes, con contrato y CFDI a nombre de tu empresa.`,
      wa: 'Hola Hostalia, traemos personal a Peñoles en Torreón. Somos __ personas del __ al __. ¿Qué casa queda cerca y cuánto sale con factura?',
      intro: (t) => ({
        h2: 'Las casas que quedan a la mano',
        html: `<p>${ficha(t[0].c)} está en ${zn(t[0].c)}, a ${t[0].min} minutos de Peñoles: ${t[0].c.huespedes} personas en ${t[0].c.recamaras} recámaras con ${t[0].c.camas} camas${plantaBaja(t[0].c) ? ', una de las recámaras en planta baja' : ''}. Es la que más se acomoda a una cuadrilla o a un equipo de mantenimiento completo.</p><p>${ficha(t[1].c)}, en ${zn(t[1].c)}, queda a ${t[1].min} minutos y recibe ${t[1].c.huespedes} personas en ${t[1].c.camas} camas. ${t.length > 2 ? `Un poco más retiradas: ${y(t.slice(2).map((x) => `${ficha(x.c)} (${x.c.huespedes} personas, ${x.min} min)`))}.` : ''}</p>`,
      }),
      cierre: (t) => ({
        h2: 'Estancias cortas de mantenimiento y estancias largas de proyecto',
        html: `<p>Para una entrada de pocos días aplica el precio por noche, con mínimo de 2. Para proyectos de varias semanas se cotiza por semana o por mes${t[0].c.precioMesSinServicios ? `: ${t[0].c.nombre} está en ${mes(t[0].c)} al mes sin servicios y ${mxn(t[0].c.precioMesConServicios)}${IVA_NOTA} con agua, luz, gas e internet` : ''}. La limpieza semanal con cambio de sábanas y toallas es obligatoria y va aparte (${mxn(LIMPIEZA)}${IVA_NOTA}).</p><p>${t[0].c.nombre} y las demás casas grandes tienen lavadora para la ropa de trabajo, cocina equipada y clima. Lee también ${liga('hospedaje-ingenieros-tecnicos-planta-torreon', 'hospedaje para técnicos de planta: arranques, paros y proyectos')}.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué casa queda más cerca de Peñoles en Torreón?', a: `${t[0].c.nombre}, en ${zn(t[0].c)}, a unos ${t[0].min} minutos en coche; luego ${t[1].c.nombre}, a ${t[1].min}.` },
        { q: '¿Cuánto cuesta por noche?', a: `${y(t.slice(0, 3).map((x) => `${x.c.nombre} ${mxn(noche(x.c))}${IVA_NOTA} para ${x.c.huespedes} personas`))}. Es precio por casa completa, no por persona.` },
        { q: '¿Facturan a contratistas de fuera de Coahuila?', a: 'Sí, el CFDI sale a cualquier razón social de México. Nos pasas la constancia de situación fiscal al apartar.' },
        { q: '¿Se puede rentar solo unos días?', a: 'Sí, desde 2 noches. Si el trabajo se alarga se va extendiendo mientras la casa esté libre.' },
        { q: '¿Hay cocina y lavadora?', a: 'Todas tienen cocina equipada, ropa de cama y toallas; la lavadora está en casi todas y viene indicada en la ficha de cada casa.' },
      ],
      relacionadas: ['casas-en-renta-provitec-torreon', 'hospedaje-centro-torreon', 'hospedaje-ingenieros-tecnicos-planta-torreon', 'hospedaje-cuadrillas-provitec-torreon', 'hospedaje-con-factura-torreon', 'hospedaje-para-empresas-torreon'],
    },
    {
      slug: 'hospedaje-cerca-galerias-laguna-torreon',
      prefijo: 'Galerías',
      aCorto: 'a Galerías Laguna',
      menu: 'Cerca de Galerías Laguna',
      grupo: 'zonas',
      max: 9,
      titulo: 'Hospedaje cerca de Galerías Laguna, Torreón',
      desc: (t) => `Casas amuebladas a ${t[0].min} minutos de Galerías Laguna, en Torreón: ${t.length} opciones para ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas, varias con alberca. Por noche o por mes, con factura.`,
      eyebrow: 'Galerías Laguna · oriente de Torreón',
      h1: 'Casa completa a minutos de <em>Galerías Laguna</em>.',
      lead: (t) => `Galerías Laguna es la referencia del oriente de Torreón: quien viene de compras, a la Feria o a un evento por ese rumbo busca quedarse cerca. Tenemos ${t.length} casas de ${t[0].min} a ${t[t.length - 1].min} minutos, para ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas.`,
      wa: 'Hola Hostalia, buscamos casa cerca de Galerías Laguna en Torreón. Somos __ personas, del __ al __. ¿Qué tienen?',
      intro: (t) => ({
        h2: 'Qué casas quedan cerca y cuál conviene',
        html: `<p>Lo más cercano: ${cercaTxt(t, ficha)} ${t.filter((x) => conAlberca(x.c)).length ? `Si vienen en familia y quieren alberca: ${y(t.filter((x) => conAlberca(x.c)).map((x) => `${ficha(x.c)} (${x.min} min)`))}.` : ''} ${t.filter((x) => conAsador(x.c)).length ? `Con asador: ${y(t.filter((x) => conAsador(x.c)).map((x) => x.c.nombre))}.` : ''}</p><p>La Feria de Torreón queda por el mismo rumbo${minA(t[0].c, 'Feria') ? `, a ${minA(t[0].c, 'Feria')} minutos de ${zn(t[0].c)}` : ''}. Para las fechas de feria y conciertos hay una guía aparte: ${liga('hospedaje-feria-torreon-y-eventos', 'hospedaje para la Feria de Torreón y eventos')}.</p>`,
      }),
      cierre: () => ({
        h2: 'Fines de semana y puentes',
        html: `<p>Los fines de semana de compras (Buen Fin, puentes, diciembre) son los que primero se ocupan en estas casas. La estancia mínima es de 2 noches; viernes y sábado tienen un precio distinto al de entre semana en algunas casas, y en fechas pico aplica tarifa de temporada que te damos cerrada por WhatsApp. Mira también ${liga('casa-para-fin-de-semana-torreon', 'casas para fin de semana en Torreón')}.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué casa queda más cerca de Galerías Laguna?', a: cercaTxt(t) },
        { q: '¿Cuánto cuesta la noche?', a: `De ${mxn(Math.min(...t.map((x) => noche(x.c))))} a ${mxn(Math.max(...t.map((x) => noche(x.c))))}${IVA_NOTA} entre semana por la casa completa. En fin de semana algunas casas cambian de precio; está en la ficha de cada una.` },
        { q: '¿Tienen alberca?', a: `${t.filter((x) => conAlberca(x.c)).length ? `${y(t.filter((x) => conAlberca(x.c)).map((x) => x.c.nombre))} ${t.filter((x) => conAlberca(x.c)).length === 1 ? 'tiene' : 'tienen'} alberca; no están climatizadas.` : 'Estas casas no tienen alberca; pregunta por las de Los Viñedos.'}` },
        { q: '¿Hay cochera?', a: 'Sí, las casas tienen cochera o estacionamiento para dejar el coche dentro.' },
        { q: '¿Cuántas noches mínimo?', a: 'Dos noches.' },
      ],
      relacionadas: ['casas-en-renta-villas-santorini-torreon', 'casas-en-renta-los-vinedos-torreon', 'hospedaje-feria-torreon-y-eventos', 'hospedaje-buen-fin-y-puente-revolucion-torreon', 'casas-con-alberca-torreon', 'casas-en-renta-oriente-de-torreon'],
    },
    {
      slug: 'hospedaje-cerca-universidad-iberoamericana-torreon',
      prefijo: 'Universidad Iberoamericana',
      aCorto: 'a la Ibero',
      menu: 'Cerca de la Ibero',
      grupo: 'zonas',
      max: 12,
      titulo: 'Hospedaje cerca de la Ibero Torreón',
      desc: (t) => `Casas amuebladas a ${t[0].min} minutos de la Universidad Iberoamericana Torreón, para papás, graduaciones y congresos: de ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas. Reserva directa.`,
      eyebrow: 'Universidad Iberoamericana Torreón',
      h1: 'Casa completa cerca de la <em>Ibero Torreón</em>.',
      lead: (t) => `Para los papás que vienen a la graduación, a dejar al hijo al inicio del semestre o a un congreso en la Universidad Iberoamericana: casas completas en ${y([...new Set(t.map((x) => zn(x.c)))].slice(0, 3))}, de ${t[0].min} a ${t[t.length - 1].min} minutos del campus.`,
      wa: 'Hola Hostalia, venimos a la Ibero Torreón (graduación / congreso / mudanza). Somos __ personas, del __ al __. ¿Qué casa queda cerca?',
      intro: (t) => ({
        h2: 'Las casas más cercanas al campus',
        html: `<p>La Ibero está en el norte de Torreón, junto a Residencial Senderos. Ahí mismo tenemos ${y(t.filter((x) => zonaKey(x.c) === 'senderos').map((x) => `${ficha(x.c)} (${x.c.huespedes} personas)`)) || 'casas cercanas'}, a ${t[0].min} minutos. ${t.filter((x) => zonaKey(x.c) !== 'senderos').length ? `También quedan cerca ${y(t.filter((x) => zonaKey(x.c) !== 'senderos').slice(0, 3).map((x) => `${ficha(x.c)} en ${zn(x.c)} (${x.min} min)`))}.` : ''}</p><p>Para una comida después de la ceremonia, ${y(t.filter((x) => conAsador(x.c)).map((x) => `${x.c.nombre} (${x.min} min)`)) || 'pregunta por las casas con patio'} ${t.filter((x) => conAsador(x.c)).length === 1 ? 'tiene' : 'tienen'} asador o palapa. La casa es para quienes duermen ahí; si llegan más invitados a comer, avísanos antes.</p>`,
      }),
      cierre: () => ({
        h2: 'Graduaciones: con cuánto tiempo apartar',
        html: `<p>Los fines de semana de graduación (mayo, junio y diciembre) se llenan con semanas de anticipación. Lo normal es apartar de 3 a 6 semanas antes, en cuanto la universidad confirme la fecha. Estancia mínima de 2 noches. Hay una guía completa en ${liga('casas-para-graduaciones-torreon', 'casas para graduaciones en Torreón')}.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué casa queda más cerca de la Ibero Torreón?', a: cercaTxt(t) },
        { q: '¿Cuánto cuesta el fin de semana de graduación?', a: `${y(t.slice(0, 3).map((x) => `${x.c.nombre} ${mxn(finde(x.c))}${IVA_NOTA} la noche de viernes o sábado para ${x.c.huespedes}`))}. Mínimo 2 noches.` },
        { q: '¿Rentan por semestre a estudiantes?', a: 'Rentamos por mes la casa completa a familias o grupos, con contrato. No rentamos por cuarto.' },
        { q: '¿Qué hay cerca para comer y surtir?', a: `Desde Residencial Senderos: ${fmtLugares(lugaresDe('senderos', 'Súper y compras', 2))}; para comer, ${fmtLugares(lugaresDe('senderos', 'Comer y café', 3))}.` },
        { q: '¿Se puede facturar a la universidad o a una empresa?', a: 'Sí, CFDI a nombre de quien pague.' },
      ],
      relacionadas: ['hospedaje-universidades-senderos-torreon', 'casas-en-renta-senderos-la-rosita-torreon', 'casas-para-graduaciones-torreon', 'casas-en-renta-norte-de-torreon', 'hospedaje-cerca-tec-de-monterrey-torreon', 'hospedaje-cerca-uadec-torreon'],
    },
    {
      slug: 'hospedaje-cerca-tecnologico-de-la-laguna-torreon',
      prefijo: 'Instituto Tecnológico de La Laguna',
      aCorto: 'al Tec de La Laguna',
      menu: 'Cerca del Tec de La Laguna',
      grupo: 'zonas',
      max: 13,
      titulo: 'Hospedaje cerca del Tec de La Laguna, Torreón',
      desc: (t) => `Casa para ${t[0].c.huespedes} personas a ${t[0].min} minutos del Instituto Tecnológico de La Laguna, en Torreón, y ${t.length - 1} opciones más a menos de 15 minutos. Por noche o por mes, con factura.`,
      eyebrow: 'Instituto Tecnológico de La Laguna',
      h1: 'Hospedaje cerca del <em>Tecnológico de La Laguna</em>.',
      lead: (t) => `${t[0].c.nombre} está a ${t[0].min} minutos del Instituto Tecnológico de La Laguna y recibe ${t[0].c.huespedes} personas: sirve para equipos que vienen a concursos y congresos, para familias en graduación y para personal que trabaja por el centro de Torreón.`,
      wa: 'Hola Hostalia, venimos al Tecnológico de La Laguna en Torreón. Somos __ personas, del __ al __. ¿Qué casa queda cerca?',
      intro: (t) => ({
        h2: 'La casa de Provitec y las demás opciones',
        html: `<p>${ficha(t[0].c)} está en ${zn(t[0].c)}, a un costado del Tecnológico: ${t[0].c.huespedes} personas en ${t[0].c.recamaras} recámaras con ${t[0].c.camas} camas${plantaBaja(t[0].c) ? ', una recámara en planta baja' : ''}. Para un equipo de estudiantes con sus profesores o para la familia completa en una graduación es la más práctica.</p>${t.length > 1 ? `<p>Otras opciones, de más cerca a más lejos: ${y(t.slice(1).map((x) => `${ficha(x.c)} (${x.c.huespedes} personas, ${zn(x.c)}, ${x.min} min)`))}.</p>` : ''}`,
      }),
      cierre: (t) => ({
        h2: 'Para qué la rentan',
        html: `<ul><li><strong>Concursos y congresos:</strong> delegaciones de otros tecnológicos que vienen varios días; una casa para ${t[0].c.huespedes} evita repartir al grupo en hoteles.</li><li><strong>Graduaciones:</strong> conviene apartar de 3 a 6 semanas antes.</li><li><strong>Profesores visitantes y residencias:</strong> por mes${t[0].c.precioMesSinServicios ? `, ${t[0].c.nombre} en ${mes(t[0].c)} sin servicios` : ', se cotiza'}.</li></ul><p>Rentamos siempre la casa completa, no por cuarto. Si la paga la institución, emitimos CFDI a su nombre.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué casa queda más cerca del Tecnológico de La Laguna?', a: cercaTxt(t) },
        { q: '¿Cuánto cuesta por noche?', a: `${y(t.slice(0, 3).map((x) => `${x.c.nombre} ${mxn(noche(x.c))}${IVA_NOTA} para ${x.c.huespedes} personas`))}. Precio por casa completa.` },
        { q: '¿Rentan cuartos a estudiantes?', a: 'No. Rentamos la casa completa por noche, semana o mes a familias, grupos o instituciones.' },
        { q: '¿Qué hay cerca?', a: `Desde Provitec: ${fmtLugares(lugaresDe('provitec', 'Para salir', 2))}; salud, ${fmtLugares(lugaresDe('provitec', 'Salud', 2))}.` },
        { q: '¿Facturan a una institución educativa?', a: 'Sí, CFDI a nombre de la institución con el IVA desglosado.' },
      ],
      relacionadas: ['casas-en-renta-provitec-torreon', 'hospedaje-universidades-provitec-torreon', 'hospedaje-centro-torreon', 'casas-para-graduaciones-torreon', 'hospedaje-equipos-deportivos-torneos-torreon', 'hospedaje-cerca-tec-de-monterrey-torreon'],
    },
    {
      slug: 'hospedaje-cerca-hospital-angeles-torreon',
      prefijo: 'Hospital Ángeles',
      aCorto: 'al Hospital Ángeles',
      menu: 'Cerca del Hospital Ángeles',
      grupo: 'motivo',
      max: 17,
      n: 5,
      titulo: 'Hospedaje cerca del Hospital Ángeles Torreón',
      desc: (t) => `Loft a ${t[0].min} minutos del Hospital Ángeles Torreón y casas completas a ${t[1].min} y ${t[2].min} minutos para la familia del paciente. Por noche, semana o mes, con cocina y factura.`,
      eyebrow: 'Hospital Ángeles Torreón',
      h1: 'Dónde quedarse cerca del <em>Hospital Ángeles Torreón</em>.',
      lead: (t) => `Si un familiar se opera o se atiende en el Hospital Ángeles, ${t[0].c.nombre} queda a ${t[0].min} minutos y sirve para ${t[0].c.huespedes} personas; si viene toda la familia, ${t[1].c.nombre} (${t[1].c.huespedes} personas) está a ${t[1].min} minutos. Con cocina equipada para estancias que se alargan.`,
      wa: 'Hola Hostalia, tenemos un familiar en el Hospital Ángeles de Torreón. Somos __ personas, por __ días. ¿Qué nos queda cerca?',
      intro: (t) => ({
        h2: 'Una opción para pocos y otra para la familia completa',
        html: `<p><strong>Para una o dos personas que acompañan:</strong> ${ficha(t[0].c)}, a ${t[0].min} minutos. ${t[0].c.resumen}</p><p><strong>Para la familia completa:</strong> ${y(t.slice(1).map((x) => `${ficha(x.c)} (${x.c.huespedes} personas, ${x.min} min)`))}. ${t.filter((x) => plantaBaja(x.c)).length ? `${y(t.filter((x) => plantaBaja(x.c)).map((x) => x.c.nombre))} ${t.filter((x) => plantaBaja(x.c)).length === 1 ? 'tiene' : 'tienen'} recámara en planta baja, que ayuda cuando el paciente sale del hospital y todavía no puede subir escaleras.` : ''}</p>`,
      }),
      cierre: () => ({
        h2: 'Cuando no se sabe cuántos días van a ser',
        html: `<p>Con una cirugía o un tratamiento casi nunca se sabe la fecha de salida. Se reserva desde 2 noches y se va extendiendo día por día mientras la casa esté libre; si desde el principio saben que serán semanas, conviene cotizar por semana o por mes. La hora de entrada se coordina por WhatsApp si llegan de madrugada o salen tarde del hospital.</p><p>Si el paciente se atiende en otro hospital, mira ${liga('hospedaje-cerca-de-hospitales-torreon', 'hospedaje cerca de hospitales en Torreón')} y ${liga('hospedaje-cerca-sanatorio-espanol-torreon', 'cerca del Sanatorio Español')}.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué queda más cerca del Hospital Ángeles Torreón?', a: `${t[0].c.nombre}, a unos ${t[0].min} minutos en coche, para ${t[0].c.huespedes} personas. Para familias más grandes, ${y(t.slice(1, 3).map((x) => `${x.c.nombre} (${x.c.huespedes} personas, ${x.min} min)`))}.` },
        { q: '¿Cuánto cuesta por noche?', a: `${y(t.slice(0, 3).map((x) => `${x.c.nombre} ${mxn(noche(x.c))}${IVA_NOTA}`))}, por la casa completa.` },
        { q: '¿Se puede extender la estancia si el alta se retrasa?', a: 'Sí, día por día mientras la casa esté libre. Avísanos en cuanto sepan.' },
        { q: '¿Hay alguna casa sin escaleras?', a: `${t.filter((x) => plantaBaja(x.c)).length ? `${y(t.filter((x) => plantaBaja(x.c)).map((x) => x.c.nombre))} ${t.filter((x) => plantaBaja(x.c)).length === 1 ? 'tiene' : 'tienen'} recámara en planta baja.` : 'Dinos la situación del paciente y te decimos cuál conviene.'}` },
        { q: '¿Facturan si paga una aseguradora o una empresa?', a: 'Sí, emitimos CFDI a nombre de quien pague.' },
      ],
      relacionadas: ['hospedaje-cerca-de-hospitales-torreon', 'hospedaje-pacientes-familiares-zona-tec-de-monterrey-torreon', 'hospedaje-cerca-sanatorio-espanol-torreon', 'hospedaje-medicos-residentes-torreon', 'casa-con-recamara-en-planta-baja-torreon', 'hospedaje-cerca-tec-de-monterrey-torreon'],
    },
    {
      slug: 'hospedaje-cerca-sanatorio-espanol-torreon',
      prefijo: 'Sanatorio Español',
      aCorto: 'al Sanatorio Español',
      menu: 'Cerca del Sanatorio Español',
      grupo: 'motivo',
      max: 13,
      n: 5,
      titulo: 'Hospedaje cerca del Sanatorio Español, Torreón',
      desc: (t) => `Departamento a ${t[0].min} minutos y casa para ${t[1].c.huespedes} personas a ${t[1].min} minutos del Sanatorio Español de Torreón, para familiares de pacientes. Por noche, semana o mes.`,
      eyebrow: 'Sanatorio Español · Torreón',
      h1: 'Dónde quedarse cerca del <em>Sanatorio Español</em> de Torreón.',
      lead: (t) => `Para la familia que acompaña a un paciente en el Sanatorio Español: ${t[0].c.nombre} queda a ${t[0].min} minutos (${t[0].c.huespedes} personas) y ${t[1].c.nombre} a ${t[1].min} (${t[1].c.huespedes} personas). Con cocina, lavadora y clima, desde 2 noches y extendiendo según avance el tratamiento.`,
      wa: 'Hola Hostalia, tenemos un familiar en el Sanatorio Español de Torreón. Somos __ personas, por __ días. ¿Qué nos queda cerca?',
      intro: (t) => ({
        h2: 'Las dos que quedan a menos de cinco minutos',
        html: `<p>${ficha(t[0].c)}, en ${zn(t[0].c)}: ${t[0].c.resumen.replace(/\s*\d\.\d+ en Airbnb\.?/, '')}</p><p>${ficha(t[1].c)}, en ${zn(t[1].c)}: ${t[1].c.huespedes} personas en ${t[1].c.recamaras} recámaras con ${t[1].c.camas} camas${plantaBaja(t[1].c) ? ', una recámara en planta baja para quien no puede subir escaleras' : ''}.</p>${t.length > 2 ? `<p>Un poco más retiradas: ${y(t.slice(2).map((x) => `${ficha(x.c)} (${x.c.huespedes} personas, ${x.min} min)`))}.</p>` : ''}`,
      }),
      cierre: (t) => ({
        h2: 'Qué más hay cerca de esas casas',
        html: `<p>Desde ${zn(t[0].c)}: ${html(fmtLugares(lugaresDe(zonaKey(t[0].c), 'Salud', 2)))}; para comer, ${html(fmtLugares(lugaresDe(zonaKey(t[0].c), 'Comer y café', 3)))}. Desde ${zn(t[1].c)}: ${html(fmtLugares(lugaresDe(zonaKey(t[1].c), 'Salud', 2)))}.</p><p>La familia cocina en casa, lava la ropa y descansa por turnos; el precio es por la casa, no por persona. Si no saben cuántos días serán, se extiende sobre la marcha mientras esté libre. Guía general: ${liga('hospedaje-cerca-de-hospitales-torreon', 'hospedaje cerca de hospitales en Torreón')}.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué queda más cerca del Sanatorio Español de Torreón?', a: `${t[0].c.nombre}, a unos ${t[0].min} minutos en coche, y ${t[1].c.nombre}, a ${t[1].min}.` },
        { q: '¿Cuánto cuesta por noche?', a: `${y(t.slice(0, 2).map((x) => `${x.c.nombre} ${mxn(noche(x.c))}${IVA_NOTA} para ${x.c.huespedes} personas`))}. Limpieza aparte, ${mxn(LIMPIEZA)}${IVA_NOTA} por semana.` },
        { q: '¿Se puede rentar por semana o por mes?', a: 'Sí. Desde 2 noches, por semana o por mes; en estancias largas el precio baja y se cotiza con tus fechas.' },
        { q: '¿Aceptan llegadas de noche?', a: 'Sí, coordinando la hora por WhatsApp el mismo día.' },
        { q: '¿Facturan?', a: 'Sí, CFDI a nombre de la persona, la empresa o la aseguradora que pague.' },
      ],
      relacionadas: ['hospedaje-cerca-de-hospitales-torreon', 'hospedaje-pacientes-familiares-provitec-torreon', 'hospedaje-cerca-hospital-angeles-torreon', 'hospedaje-centro-torreon', 'hospedaje-medicos-residentes-torreon', 'casa-con-recamara-en-planta-baja-torreon'],
    },
    {
      slug: 'hospedaje-cerca-central-de-autobuses-torreon',
      prefijo: 'Central de Autobuses',
      aCorto: 'a la Central',
      menu: 'Cerca de la Central de Autobuses',
      grupo: 'zonas',
      max: 13,
      titulo: 'Casas cerca de la Central de Autobuses de Torreón',
      desc: (t) => `Casas y departamentos amueblados de ${t[0].min} a ${t[t.length - 1].min} minutos de la Central de Autobuses de Torreón, para ${rango(t.map((x) => x.c), (c) => c.huespedes)} personas. Por noche o por mes, con factura.`,
      eyebrow: 'Central de Autobuses de Torreón',
      h1: 'Hospedaje cerca de la <em>Central de Autobuses de Torreón</em>.',
      lead: (t) => `Si el grupo llega a Torreón en autobús, conviene una casa a pocos minutos de la Central: ${y(t.slice(0, 3).map((x) => `${x.c.nombre} a ${x.min} min`))}. Casa completa con cocina y clima, por noche, semana o mes.`,
      wa: 'Hola Hostalia, llegamos a Torreón en autobús y buscamos casa cerca de la Central. Somos __ personas, del __ al __. ¿Qué tienen?',
      intro: (t) => ({
        h2: 'Qué casa según cuántos llegan',
        html: `<p><strong>Hasta ${t[0].c.huespedes} personas:</strong> ${ficha(t[0].c)}, en ${zn(t[0].c)}, a ${t[0].min} minutos de la Central.</p><p><strong>Grupos y cuadrillas:</strong> ${y(t.slice(1).map((x) => `${ficha(x.c)} (${x.c.huespedes} personas, ${zn(x.c)}, ${x.min} min)`))}.</p><p>Es lo que usan las cuadrillas que la empresa manda en autobús, los equipos deportivos que viajan en camión y las familias que vienen de visita sin coche.</p>`,
      }),
      cierre: () => ({
        h2: 'Si vienen sin coche',
        html: `<p>Al elegir casa fíjate en lo que queda cerca para el día a día, porque sin coche es lo que más pesa: en la ficha de cada casa está la lista de súper, comida y hospitales con los minutos desde la colonia. Si el grupo llega en un camión rentado, dinos el tamaño del vehículo para confirmar dónde puede estacionarse.</p><p>¿De qué ciudad vienen? Hay guías con distancia y zona recomendada en ${liga('hospedaje-por-ciudad-de-origen', 'hospedaje en Torreón por ciudad de origen')}.</p>`,
      }),
      faqs: (t) => [
        { q: '¿Qué casa queda más cerca de la Central de Autobuses de Torreón?', a: cercaTxt(t) },
        { q: '¿Cuánto cuesta por noche?', a: `De ${mxn(Math.min(...t.map((x) => noche(x.c))))} a ${mxn(Math.max(...t.map((x) => noche(x.c))))}${IVA_NOTA} por la casa completa, según el tamaño.` },
        { q: '¿Recogen en la Central?', a: 'No ofrecemos traslado; el trayecto en taxi o aplicación es corto desde estas colonias.' },
        { q: '¿Podemos llegar de madrugada?', a: 'La entrada es desde las 3 de la tarde; si el autobús llega a otra hora se coordina por WhatsApp, sujeto a que la casa esté lista.' },
        { q: '¿Cuántas noches mínimo?', a: 'Dos noches.' },
      ],
      relacionadas: ['hospedaje-por-ciudad-de-origen', 'hospedaje-cuadrillas-construccion-torreon', 'hospedaje-equipos-deportivos-torneos-torreon', 'casas-en-renta-provitec-torreon', 'hospedaje-centro-torreon', 'hospedaje-cerca-aeropuerto-torreon'],
    },
  ];

  for (const P of PUNTOS) {
    const t = cercanas(P.prefijo, { n: P.n || 6, max: P.max });
    if (t.length < 2) continue;
    const cs = t.map((x) => x.c);
    const z0 = zonaKey(cs[0]);
    pagina({
      slug: P.slug,
      menu: P.menu,
      grupo: P.grupo,
      titulo: P.titulo,
      desc: P.desc(t),
      eyebrow: P.eyebrow,
      h1: P.h1,
      lead: P.lead(t),
      wa: P.wa,
      casas: cs,
      secciones: [
        P.intro(t),
        { h2: `Minutos en coche ${P.aCorto}, casa por casa`, html: `${tabla(cs, { th: `${P.aCorto[0].toUpperCase()}${P.aCorto.slice(1)}`, td: (c) => `${minA(c, P.prefijo)} min` })}${notaMinutos}${notaPrecios}` },
        { h2: `Qué más queda cerca de ${ZN[z0]}`.replace('cerca de el ', 'cerca del '), html: `<ul><li><strong>Súper y plazas:</strong> ${html(fmtLugares(lugaresDe(z0, 'Súper y compras', 3)))}.</li><li><strong>Comer:</strong> ${html(fmtLugares(lugaresDe(z0, 'Comer y café', 3)))}.</li><li><strong>Salud:</strong> ${html(fmtLugares(lugaresDe(z0, 'Salud', 2)))}.</li><li><strong>Trabajo e industria:</strong> ${html(fmtLugares(lugaresDe(z0, 'Trabajo e industria', 3)))}.</li></ul>` },
        P.cierre(t),
      ],
      faqs: P.faqs(t),
      relacionadas: P.relacionadas,
    });
  }

  // ══════════════════════════════════════════════════════════ 2. Por rumbo de la ciudad
  const RUMBOS = [
    {
      slug: 'casas-en-renta-norte-de-torreon',
      rumbo: 'norte',
      zonas: ['senderos', 'alebrijes'],
      que: 'El norte es la parte nueva de Torreón: fraccionamientos recientes, Costco y la Universidad Iberoamericana, y la salida hacia el Parque Industrial Lajat.',
      quien: 'Conviene a equipos que trabajan en Lajat, a familias que vienen a la Ibero y a quien prefiere casas nuevas en fraccionamiento.',
      relacionadas: ['casas-en-renta-senderos-la-rosita-torreon', 'casas-en-renta-alebrijes-residencial-torreon', 'hospedaje-cerca-parque-industrial-lajat-torreon', 'hospedaje-cerca-universidad-iberoamericana-torreon', 'casas-en-renta-oriente-de-torreon', 'casas-en-renta-sur-de-torreon'],
    },
    {
      slug: 'casas-en-renta-oriente-de-torreon',
      rumbo: 'oriente',
      zonas: ['vinedos', 'santorini'],
      que: 'El oriente es el lado del aeropuerto, Galerías Laguna y la Feria de Torreón, con salida rápida al Periférico. Aquí está la mayoría de las casas con alberca.',
      quien: 'Conviene a quien llega en avión, a familias que quieren alberca y a personal que trabaja en la zona industrial de ese lado.',
      relacionadas: ['casas-en-renta-los-vinedos-torreon', 'casas-en-renta-villas-santorini-torreon', 'hospedaje-cerca-aeropuerto-torreon', 'hospedaje-cerca-galerias-laguna-torreon', 'casas-con-alberca-torreon', 'casas-en-renta-norte-de-torreon'],
    },
    {
      slug: 'casas-en-renta-sur-de-torreon',
      rumbo: 'sur',
      zonas: ['almendros', 'rosita', 'tec'],
      que: 'El sur y el sur-oriente son la zona de Ciudad Universitaria de la UA de C, el Estadio Corona, el Tec de Monterrey con el Hospital Ángeles, y el Parque Industrial Oriente.',
      quien: 'Conviene a cuadrillas y técnicos del Parque Industrial Oriente, a familias que vienen a un partido o a la universidad, y a quien acompaña a un paciente.',
      relacionadas: ['casas-en-renta-los-almendros-torreon', 'hospedaje-parque-industrial-oriente', 'hospedaje-cerca-uadec-torreon', 'hospedaje-cerca-estadio-corona-tsm-torreon', 'hospedaje-cerca-hospital-angeles-torreon', 'casas-en-renta-oriente-de-torreon'],
    },
  ];
  for (const R of RUMBOS) {
    const cs = casas.filter((c) => R.zonas.includes(zonaKey(c)));
    if (!cs.length) continue;
    const zonas = R.zonas.filter((z) => cs.some((c) => zonaKey(c) === z));
    const baratas = [...cs].sort((a, b) => noche(a) - noche(b));
    const grande = cs.reduce((a, b) => (a.huespedes >= b.huespedes ? a : b));
    const cuantas = `${cs.length} ${cs.some(esDepa) ? 'opciones amuebladas' : cs.length === 1 ? 'casa' : 'casas'}`;
    pagina({
      slug: R.slug,
      menu: `${R.rumbo[0].toUpperCase()}${R.rumbo.slice(1)} de Torreón`,
      grupo: 'zonas',
      titulo: `Casas amuebladas en renta al ${R.rumbo} de Torreón`,
      desc: `${cs.some(esDepa) ? `${cs.length} opciones amuebladas` : `${cs.length} casas amuebladas`} en renta al ${R.rumbo} de Torreón, en ${y(zonas.map((z) => ZN[z]))}: para ${rango(cs, (c) => c.huespedes)} personas, desde ${precio(baratas[0])} la noche. Con factura.`,
      eyebrow: `${R.rumbo[0].toUpperCase()}${R.rumbo.slice(1)} de Torreón · ${cs.length} casas`,
      h1: `Casas amuebladas en renta al <em>${R.rumbo} de Torreón</em>.`,
      lead: `${R.que} Tenemos ${cuantas} en ${y(zonas.map((z) => ZN[z]))}, para ${rango(cs, (c) => c.huespedes)} personas, por noche, por semana o por mes.`,
      wa: `Hola Hostalia, busco casa amueblada al ${R.rumbo} de Torreón. Somos __ personas, del __ al __. ¿Qué tienen libre?`,
      casas: cs,
      secciones: [
        { h2: `Qué hay al ${R.rumbo} de Torreón y a quién le conviene`, html: `<p>${R.que} ${R.quien}</p><p>La más económica de este rumbo es ${ficha(baratas[0])}, ${precio(baratas[0])} la noche para ${baratas[0].huespedes} personas${grande === baratas[0] ? ', ' : '; '}${grande === baratas[0] ? `y es también la más grande del rumbo` : `la más grande, ${ficha(grande)}, para ${grande.huespedes}`}.</p>` },
        {
          h2: 'Colonia por colonia',
          html: zonas
            .map((z) => {
              const zc = cs.filter((c) => zonaKey(c) === z);
              return `<h3>${ZN[z][0].toUpperCase()}${ZN[z].slice(1)}</h3><p>${y(zc.map((c) => `${ficha(c)} (${c.huespedes} personas, ${precio(c)})`))}.</p><ul><li><strong>Trabajo e industria:</strong> ${html(fmtLugares(lugaresDe(z, 'Trabajo e industria', 3)))}.</li><li><strong>Súper y plazas:</strong> ${html(fmtLugares(lugaresDe(z, 'Súper y compras', 2)))}.</li><li><strong>Escuelas y salud:</strong> ${html(fmtLugares([...lugaresDe(z, 'Escuelas y universidades', 1), ...lugaresDe(z, 'Salud', 1)]))}.</li></ul>`;
            })
            .join('') + notaMinutos,
        },
        { h2: `Las casas del ${R.rumbo}, comparadas`, html: `${tabla(cs, { th: 'Lo que la distingue', td: (c) => c.destacados.filter((d) => !/^\d+ personas$/.test(d)).slice(0, 2).join(' · ') })}${notaPrecios}` },
        { h2: 'Si tu destino está en otro rumbo', html: `<p>Torreón se cruza rápido por el Periférico, pero en hora pico la zona equivocada cuesta tiempo todos los días. Compara con ${RUMBOS.filter((o) => o.slug !== R.slug).map((o) => liga(o.slug, `las casas del ${o.rumbo}`)).join(', con ')} y con ${liga('hospedaje-centro-torreon', 'las del centro')}, o lee ${liga('zonas-de-torreon-donde-quedarse-segun-a-que-vienes', 'en qué zona quedarse según a qué vienes')}.</p>` },
      ],
      faqs: [
        { q: `¿En qué colonias del ${R.rumbo} de Torreón tienen casa?`, a: `En ${y(zonas.map((z) => `${ZN[z]} (${cs.filter((c) => zonaKey(c) === z).length})`))}. La calle exacta se comparte al confirmar la reserva.` },
        { q: `¿Cuánto cuesta rentar una casa amueblada al ${R.rumbo} de Torreón?`, a: `De ${mxn(noche(baratas[0]))} a ${mxn(noche(baratas[baratas.length - 1]))}${IVA_NOTA} la noche por la casa completa. ${cs.some((c) => c.precioMesSinServicios) ? `Por mes, ${y(cs.filter((c) => c.precioMesSinServicios).slice(0, 3).map((c) => `${c.nombre} ${mes(c)} sin servicios`))}.` : 'Por mes se cotiza por WhatsApp.'}` },
        { q: '¿Cuál es la más grande de este rumbo?', a: `${grande.nombre}, para ${grande.huespedes} personas en ${grande.recamaras} recámaras con ${grande.camas} camas.` },
        { q: '¿Tienen alberca?', a: `${cs.filter(conAlberca).length ? `${y(cs.filter(conAlberca).map((c) => c.nombre))} ${cs.filter(conAlberca).length === 1 ? 'tiene' : 'tienen'} alberca. No están climatizadas.` : 'Las casas de este rumbo no tienen alberca; las que sí tienen están en Los Viñedos y Los Almendros.'}` },
        { q: '¿Se rentan por mes y con factura?', a: 'Sí: contrato de hospedaje mes por mes, sin aval, y CFDI a nombre de la persona o empresa que pague.' },
      ],
      relacionadas: R.relacionadas,
    });
  }

  // ══════════════════════════════════════════════════════════ 3. Por tipo, forma de contratar y motivo
  const conMes = casas.filter((c) => c.precioMesSinServicios).sort((a, b) => a.precioMesSinServicios - b.precioMesSinServicios);
  const mesMin = conMes[0];
  const mesMax = conMes[conMes.length - 1];

  // ── Departamentos y loft
  {
    const cs = casas.filter(esDepa).sort((a, b) => a.huespedes - b.huespedes);
    if (cs.length >= 2) {
      const ch = cs[0];
      const gr = cs[cs.length - 1];
      pagina({
        slug: 'departamentos-amueblados-en-renta-torreon',
        menu: 'Departamentos amueblados',
        grupo: 'tipo',
        titulo: 'Departamentos amueblados en renta en Torreón',
        desc: `${cs.length} departamentos amueblados en renta en Torreón para ${rango(cs, (c) => c.huespedes)} personas, desde ${precio(ch)} la noche: cocina, clima, wifi y estacionamiento. Por noche, semana o mes, con factura.`,
        eyebrow: 'Departamentos y loft · Torreón',
        h1: 'Departamentos amueblados en Torreón, <em>listos para entrar</em>.',
        lead: `Cuando una casa para diez es demasiado: ${cs.length} opciones más chicas, amuebladas y equipadas, desde ${precio(ch)} la noche. ${y(cs.map((c) => `${c.nombre} para ${c.huespedes}`))}. Se rentan completos, por noche, por semana o por mes.`,
        wa: 'Hola Hostalia, busco departamento amueblado en Torreón para __ personas, del __ al __. ¿Cuál está libre y cuánto sale?',
        casas: cs,
        secciones: [
          { h2: 'Cuál es cuál', html: cs.map((c) => `<p><strong>${ficha(c)}</strong> · ${c.huespedes} personas · ${precio(c)} la noche. ${c.resumen.replace(/\s*\d\.\d+ en Airbnb\.?/, '')}</p>`).join('') },
          { h2: 'Comparados', html: `${tabla(cs, { th: 'Camas', td: (c) => c.camas })}${notaPrecios}` },
          {
            h2: 'Dónde están',
            html: `<ul>${cs
              .map((c) => (ubicada(c) ? `<li><strong>${c.nombre}</strong>, ${zn(c)}: ${html(fmtLugares([...lugaresDe(zonaKey(c), 'Salud', 1), ...lugaresDe(zonaKey(c), 'Escuelas y universidades', 1), ...lugaresDe(zonaKey(c), 'Súper y compras', 1)]))}.</li>` : `<li><strong>${c.nombre}</strong>, en Torreón: la colonia te la decimos por WhatsApp según a dónde vayas a diario.</li>`))
              .join('')}</ul>${notaMinutos}`,
          },
          { h2: 'Por noche o por mes', html: `<p>Por noche, desde 2 noches. Por mes, el precio de los departamentos se cotiza por WhatsApp según los meses y si quieres agua, luz, gas e internet incluidos; el contrato es de hospedaje, mes por mes y sin aval. La limpieza semanal con cambio de sábanas y toallas se cobra aparte (${mxn(LIMPIEZA)}${IVA_NOTA}).</p><p>Si al final son más personas, mira ${liga('casa-para-8-personas-torreon', 'casas para 8')} o ${liga('casa-para-10-personas-torreon', 'casas para 10')}.</p>` },
        ],
        faqs: [
          { q: '¿Cuánto cuesta un departamento amueblado en Torreón por noche?', a: `${y(cs.map((c) => `${c.nombre} ${mxn(noche(c))}${IVA_NOTA} para ${c.huespedes} personas`))}. Limpieza aparte, ${mxn(LIMPIEZA)}${IVA_NOTA} por semana.` },
          { q: '¿Cuál es el más económico?', a: `${ch.nombre}: ${mxn(noche(ch))}${IVA_NOTA} la noche, para ${ch.huespedes} personas.` },
          { q: '¿Se rentan por mes?', a: 'Sí, con contrato de hospedaje mes por mes y sin aval. El precio mensual de los departamentos se cotiza por WhatsApp.' },
          { q: '¿Tienen estacionamiento?', a: 'Sí, todos tienen estacionamiento, además de cocina, clima y wifi.' },
          { q: '¿Rentan por cuarto?', a: `No, se renta el departamento completo. El más grande es ${gr.nombre}, para ${gr.huespedes} personas.` },
        ],
        relacionadas: ['hospedaje-centro-torreon', 'hospedaje-cerca-tec-de-monterrey-torreon', 'hospedaje-medicos-residentes-torreon', 'casas-amuebladas-renta-por-mes-torreon', 'casa-para-6-personas-torreon', 'casa-para-8-personas-torreon'],
      });
    }
  }

  // ── Recámara en planta baja
  {
    const cs = casas.filter(plantaBaja);
    if (cs.length) {
      pagina({
        slug: 'casa-con-recamara-en-planta-baja-torreon',
        menu: 'Recámara en planta baja',
        grupo: 'tipo',
        titulo: 'Casa con recámara en planta baja en Torreón',
        desc: `Casas amuebladas en Torreón con recámara en planta baja, para adultos mayores o para quien se recupera de una cirugía: ${y(cs.map((c) => `${c.nombre} (${c.huespedes} personas)`))}. Con factura.`,
        eyebrow: 'Sin subir escaleras · Torreón',
        h1: 'Casa con recámara en planta baja, <em>sin subir escaleras</em>.',
        lead: `La mayoría de las casas de fraccionamiento en Torreón tienen todas las recámaras arriba. Si viajan con los abuelos, con alguien recién operado o con una persona que no puede subir escaleras, estas son las que tienen recámara abajo: ${y(cs.map((c) => `${c.nombre}, para ${c.huespedes} personas`))}.`,
        wa: 'Hola Hostalia, necesitamos casa con recámara en planta baja en Torreón. Somos __ personas, del __ al __. ¿Cuál está libre?',
        casas: cs,
        secciones: [
          { h2: 'Las casas con recámara abajo', html: cs.map((c) => `<p><strong>${ficha(c)}</strong>, en ${zn(c)}: ${c.huespedes} personas en ${c.recamaras} recámaras con ${c.camas} camas${c.banos ? ` y ${c.banos} baños` : ''}. ${c.destacados.filter((d) => !/^\d+ personas/.test(d)).join(' · ')}. ${precio(c)} la noche${c.precioMesSinServicios ? ` o ${mes(c)} al mes sin servicios` : ''}.</p>`).join('') },
          { h2: 'Qué confirmar antes de reservar', html: `<p>"Recámara en planta baja" resuelve dormir sin subir escaleras; lo demás depende de cada persona. Antes de apartar dinos por WhatsApp qué necesitan y te contestamos con fotos o video de la casa:</p><ul><li>si el baño que usará esa persona está en la misma planta y cómo es la regadera;</li><li>si hay escalón en la entrada o entre la cochera y la casa;</li><li>el ancho de las puertas, si usa silla de ruedas o andadera;</li><li>qué cama tiene la recámara de abajo.</li></ul><p>Preferimos decirte que una casa no te sirve a que lleguen y no funcione.</p>` },
          { h2: 'Comparadas', html: `${tabla(cs, { th: 'Hospital más cercano', td: (c) => { const s = (cercaZona(zonaKey(c))['Salud'] || []).filter((x) => /hospital|sanatorio/i.test(x.n))[0]; return s && ubicada(c) ? `${s.n} · ${s.min} min` : '—'; } })}${notaMinutos}${notaPrecios}` },
          { h2: 'Para estancias médicas', html: `<p>Si el motivo del viaje es una cirugía o un tratamiento, mira también ${liga('hospedaje-cerca-de-hospitales-torreon', 'hospedaje cerca de hospitales en Torreón')}, ${liga('hospedaje-cerca-hospital-angeles-torreon', 'cerca del Hospital Ángeles')} y ${liga('hospedaje-cerca-sanatorio-espanol-torreon', 'cerca del Sanatorio Español')}. Se reserva desde 2 noches y se extiende mientras la casa esté libre.</p>` },
        ],
        faqs: [
          { q: '¿Qué casas de Hostalia tienen recámara en planta baja?', a: `${y(cs.map((c) => `${c.nombre}, en ${zn(c)}, para ${c.huespedes} personas`))}.` },
          { q: '¿Cuánto cuestan?', a: `${y(cs.map((c) => `${c.nombre} ${mxn(noche(c))}${IVA_NOTA} la noche${c.precioMesSinServicios ? ` o ${mes(c)} al mes sin servicios` : ''}`))}.` },
          { q: '¿El baño también está en planta baja?', a: 'Depende de la casa y de qué tipo de baño necesiten. Pregúntanos por WhatsApp y te mandamos fotos o video antes de reservar.' },
          { q: '¿Sirven para silla de ruedas?', a: 'No están adaptadas como vivienda accesible. Dinos las medidas y necesidades y revisamos puertas y accesos contigo antes de apartar.' },
          { q: '¿Se puede rentar por semanas mientras dura la recuperación?', a: 'Sí, por semana o por mes, con contrato de hospedaje y sin aval.' },
        ],
        relacionadas: ['hospedaje-cerca-de-hospitales-torreon', 'hospedaje-cerca-hospital-angeles-torreon', 'hospedaje-cerca-sanatorio-espanol-torreon', 'renta-temporal-torreon-familias', 'casas-en-renta-provitec-torreon', 'casas-en-renta-los-almendros-torreon'],
      });
    }
  }

  // ── En privada / fraccionamiento cerrado
  {
    const cs = casas.filter(enPrivada);
    if (cs.length >= 3) {
      const frase = (c) => c.destacados.find((d) => /privada|acceso controlado|seguridad/i.test(d) && !/alberca/i.test(d)) || (/fraccionamiento cerrado/i.test(c.resumen) ? 'En fraccionamiento cerrado' : 'En privada');
      pagina({
        slug: 'casas-en-privada-con-seguridad-torreon',
        menu: 'En privada con seguridad',
        grupo: 'tipo',
        titulo: 'Casas en privada con seguridad en Torreón',
        desc: `${cs.length} casas amuebladas en renta en privadas y fraccionamientos cerrados de Torreón, para ${rango(cs, (c) => c.huespedes)} personas, desde ${mxn(Math.min(...cs.map(noche)))}${IVA_NOTA} la noche. Por noche o por mes.`,
        eyebrow: 'Privadas y fraccionamientos cerrados · Torreón',
        h1: 'Casas amuebladas en <em>privada con acceso controlado</em>.',
        lead: `Para quien llega a una ciudad que no conoce, o deja a la familia mientras trabaja, la privada da tranquilidad: entrada controlada, calles sin paso y el coche adentro. Estas ${cs.length} casas están en privadas o fraccionamientos cerrados de ${y([...new Set(cs.map(zn))])}.`,
        wa: 'Hola Hostalia, busco casa amueblada en privada con seguridad en Torreón. Somos __ personas, del __ al __. ¿Qué tienen?',
        casas: cs,
        secciones: [
          { h2: 'Cómo es cada una', html: `<ul>${cs.map((c) => `<li><strong>${ficha(c)}</strong>, ${zn(c)} · ${frase(c)} · ${c.huespedes} personas · ${precio(c)} la noche.</li>`).join('')}</ul><p>Lo que dice cada renglón es lo que está en la ficha de la casa. Si para ti es importante que haya caseta con vigilante, cámaras o un horario de acceso en particular, pregúntanos por esa casa antes de reservar y te lo confirmamos.</p>` },
          { h2: 'Comparadas', html: `${tabla(cs, { th: 'Alberca / asador', td: (c) => [conAlberca(c) ? 'alberca' : null, conAsador(c) ? 'asador' : null].filter(Boolean).join(' y ') || '—' })}${notaPrecios}` },
          { h2: 'Vivir unas semanas en una privada', html: `<p>Una privada tiene vecinos y reglamento: volumen de casa, respeto al horario de descanso, las personas que duermen son las de la reserva y no se permiten fiestas. A cambio, la estancia es tranquila. Al confirmar te pasamos cómo se entra al fraccionamiento y dónde se estaciona.</p><p>Por mes se firma contrato de hospedaje, sin aval: ${liga('renta-casa-amueblada-sin-aval-torreon', 'cómo se renta sin aval')}.</p>` },
        ],
        faqs: [
          { q: '¿Qué casas de Hostalia están en privada o fraccionamiento cerrado?', a: `${y(cs.map((c) => `${c.nombre} (${zn(c)})`))}.` },
          { q: '¿Cuánto cuestan?', a: `De ${mxn(Math.min(...cs.map(noche)))} a ${mxn(Math.max(...cs.map(noche)))}${IVA_NOTA} la noche por la casa completa, según la casa.` },
          { q: '¿Tienen vigilancia las 24 horas?', a: 'Depende del fraccionamiento. Pregúntanos por la casa que te interesa y te confirmamos cómo es el acceso antes de reservar.' },
          { q: '¿Pueden entrar visitas?', a: 'Sí, de visita. Las personas que duermen en la casa son las de la reserva y no se permiten fiestas.' },
          { q: '¿Publican la dirección?', a: 'No. En el sitio solo aparece la colonia; la calle exacta se comparte al confirmar la reserva.' },
        ],
        relacionadas: ['casas-en-renta-los-vinedos-torreon', 'casas-en-renta-alebrijes-residencial-torreon', 'renta-temporal-torreon-familias', 'renta-casa-amueblada-sin-aval-torreon', 'casas-con-alberca-torreon', 'casas-en-renta-oriente-de-torreon'],
      });
    }
  }

  // ── Sin aval
  if (conMes.length) {
    pagina({
      slug: 'renta-casa-amueblada-sin-aval-torreon',
      menu: 'Renta sin aval',
      grupo: 'estancia',
      titulo: 'Renta de casa amueblada sin aval en Torreón',
      desc: `Casas amuebladas en renta sin aval ni fiador en Torreón: contrato de hospedaje mes por mes, depósito de un mes y factura. ${conMes.length} casas de ${mxn(mesMin.precioMesSinServicios)} a ${mxn(mesMax.precioMesSinServicios)}${IVA_NOTA} al mes.`,
      eyebrow: 'Sin aval · sin fiador · sin contrato de un año',
      h1: 'Casa amueblada en Torreón <em>sin aval ni fiador</em>.',
      lead: `Rentar casa en Torreón por la vía tradicional pide aval con propiedad, contrato de un año y la casa vacía. Aquí es distinto: contrato de hospedaje mes por mes, pago por adelantado y un depósito que se devuelve al salir. ${conMes.length} casas amuebladas de ${mxn(mesMin.precioMesSinServicios)} a ${mxn(mesMax.precioMesSinServicios)}${IVA_NOTA} al mes.`,
      wa: 'Hola Hostalia, busco casa amueblada por mes en Torreón sin aval. Somos __ personas, desde el __, por __ meses. ¿Qué tienen?',
      casas: conMes,
      secciones: [
        { h2: 'Qué se pide en lugar del aval', html: `<ul><li><strong>Contrato de hospedaje</strong> por escrito, mes por mes, con fechas, monto, qué incluye y reglas de la casa.</li><li><strong>El mes por adelantado</strong>, por transferencia.</li><li><strong>Depósito en garantía</strong> equivalente a un mes de renta, que se devuelve al entregar la casa en orden.</li><li><strong>Datos de quien firma</strong>; si paga una empresa, el contrato va a nombre de la razón social y se emite CFDI.</li></ul><p>No se pide aval, fiador ni compromiso de un año. Se renueva mes con mes mientras la necesites y la casa esté libre.</p>` },
        { h2: 'Casas con precio por mes publicado', html: `${tabla(conMes, { th: 'Por mes con servicios', td: (c) => `${mxn(c.precioMesConServicios)}${IVA_NOTA}` })}<p style="font-size:13px;color:var(--gris)">"Con servicios" incluye agua, luz, gas e internet con un tope de consumo normal. La limpieza semanal con cambio de sábanas y toallas es obligatoria y va aparte: ${mxn(LIMPIEZA)}${IVA_NOTA} por servicio. Las casas que no aparecen aquí también se rentan por mes; su precio se cotiza por WhatsApp.</p>` },
        { h2: 'A quién le sirve', html: `<ul><li><strong>Recién llegados</strong> que todavía no tienen quién les firme de aval en Torreón.</li><li><strong>Personal de proyecto</strong> que viene por tres o seis meses y no puede firmar un año.</li><li><strong>Familias entre una casa y otra</strong>, o en remodelación: ${liga('renta-temporal-torreon-familias', 'renta temporal para familias')}.</li><li><strong>Empresas</strong> que reubican a alguien y quieren una sola factura: ${liga('casa-amueblada-reubicacion-personal-torreon', 'casa para personal reubicado')}.</li></ul>` },
        { h2: 'Qué cuesta más que una renta tradicional y por qué', html: `<p>Una casa amueblada por mes cuesta más que una vacía con contrato anual: incluye muebles, cocina equipada, blancos, clima, wifi y lavadora, y no te amarra un año. La cuenta que conviene hacer es contra lo que saldría amueblar una casa para unos meses, o contra un hotel por el mismo tiempo. La ${liga('casas-amuebladas-renta-por-mes-torreon', 'guía de renta por mes')} trae el detalle de cada modalidad.</p>` },
      ],
      faqs: [
        { q: '¿De verdad no piden aval?', a: 'No. Se firma un contrato de hospedaje mes por mes, se paga el mes por adelantado y se deja un depósito en garantía de un mes, que se devuelve al salir.' },
        { q: '¿Cuánto cuesta por mes?', a: `De ${mxn(mesMin.precioMesSinServicios)}${IVA_NOTA} (${mesMin.nombre}, ${mesMin.huespedes} personas) a ${mxn(mesMax.precioMesSinServicios)}${IVA_NOTA} (${mesMax.nombre}, ${mesMax.huespedes} personas) sin servicios; con agua, luz, gas e internet incluidos son ${mxn(3000)} más.` },
        { q: '¿Cuál es el plazo mínimo?', a: 'Un mes para tarifa mensual. Para menos tiempo aplica el precio por noche o por semana.' },
        { q: '¿Me devuelven el depósito?', a: 'Sí, al entregar la casa en orden.' },
        { q: '¿Puedo quedarme más de seis meses?', a: 'Sí, el contrato se renueva mes con mes mientras la casa esté libre.' },
        { q: '¿Dan factura?', a: 'Sí, CFDI con el IVA desglosado a nombre de la persona o empresa que paga.' },
      ],
      relacionadas: ['casas-amuebladas-renta-por-mes-torreon', 'renta-temporal-torreon-familias', 'casa-amueblada-reubicacion-personal-torreon', 'cuanto-cuesta-hospedar-una-cuadrilla-un-mes-en-torreon', 'que-incluye-una-casa-amueblada-en-renta-en-torreon', 'departamentos-amueblados-en-renta-torreon'],
    });
  }

  // ── Con factura
  {
    const cs = porSlug('leones', 'provitec', 'rosita', 'grande-14', 'depa-7', 'alebrijes', 'santorini');
    pagina({
      slug: 'hospedaje-con-factura-torreon',
      menu: 'Hospedaje con factura',
      grupo: 'empresas',
      titulo: 'Hospedaje con factura en Torreón: casas completas',
      desc: `Hospedaje con factura CFDI en Torreón: casas completas para ${rango(cs, (c) => c.huespedes)} personas, con contrato a nombre de la empresa e IVA desglosado. Desde ${mxn(Math.min(...cs.map(noche)))}${IVA_NOTA} la noche por casa.`,
      eyebrow: 'CFDI · contrato · un solo proveedor',
      h1: 'Hospedaje en Torreón <em>con factura CFDI</em> por el total.',
      lead: 'Si tu empresa necesita comprobar el hospedaje, aquí la factura no es un favor: todos los precios se publican más IVA y el CFDI sale por el total a nombre de la razón social, con contrato de hospedaje por escrito. Un proveedor, una factura, el equipo completo en una casa.',
      wa: 'Hola Hostalia, necesito hospedaje con factura en Torreón para __ personas, del __ al __. ¿Disponibilidad y precio? Les paso la constancia fiscal.',
      casas: cs,
      secciones: [
        { h2: 'Qué se factura y cómo', html: `<ul><li><strong>El total del hospedaje</strong>, con el IVA del 16% desglosado.</li><li><strong>La limpieza semanal</strong> (${mxn(LIMPIEZA)}${IVA_NOTA} por servicio) y, en renta por mes, <strong>los servicios</strong> si los contratas incluidos, en la misma factura.</li><li><strong>A nombre de quien paga:</strong> empresa, persona física, institución o aseguradora, de cualquier estado de México.</li><li><strong>Datos:</strong> nos mandas la constancia de situación fiscal al apartar.</li></ul>` },
        { h2: 'Contrato y pago', html: `<p>Además del CFDI se firma un <strong>contrato de hospedaje</strong> con fechas, monto, qué incluye y reglas de la casa; para empresas, a nombre de la razón social. El pago es por transferencia: en estancias por noche o semana se aparta con anticipo y se liquida al llegar; por mes se paga el mes por adelantado y se deja un depósito en garantía de un mes.</p><p>En las casas con reserva en línea también se puede pagar con tarjeta desde la ficha.</p>` },
        { h2: 'Casas que más piden las empresas', html: `${tabla(cs, { th: 'Camas', td: (c) => c.camas })}${notaPrecios}` },
        { h2: 'Por qué una casa y no varias habitaciones', html: `<p>Un grupo en hotel son varias habitaciones, varias noches y a veces varias facturas. En una casa es un concepto y un monto. El detalle con números está en ${liga('casa-o-hotel-para-10-personas-en-torreon-cuanto-cuesta', 'casa o hotel para 10 personas')}; si lo que hospedas es personal de obra, en ${liga('hospedaje-cuadrillas-construccion-torreon', 'hospedaje para cuadrillas')}; y si vienes de Airbnb, en ${liga('airbnb-o-reservar-directo-en-hostalia-torreon', 'Airbnb o reservar directo')}.</p>` },
      ],
      faqs: [
        { q: '¿Facturan el hospedaje en Torreón?', a: 'Sí. CFDI por el total del hospedaje con el IVA desglosado, a nombre de la empresa o persona que paga.' },
        { q: '¿Los precios ya incluyen IVA?', a: 'No, los precios publicados son más IVA. El IVA se desglosa en la factura.' },
        { q: '¿Pueden facturar a una empresa de otro estado?', a: 'Sí, a cualquier razón social de México. Solo necesitamos la constancia de situación fiscal.' },
        { q: '¿Facturan una estancia corta?', a: 'Sí. La estancia mínima es de 2 noches y se factura igual que una estancia larga.' },
        { q: '¿También hay contrato?', a: 'Sí, contrato de hospedaje por escrito; para empresas se firma a nombre de la razón social.' },
        { q: '¿Cómo se paga?', a: 'Por transferencia bancaria; en las casas con reserva en línea, también con tarjeta.' },
      ],
      relacionadas: ['hospedaje-para-empresas-torreon', 'hospedaje-cuadrillas-construccion-torreon', 'hospedaje-ingenieros-tecnicos-planta-torreon', 'casa-o-hotel-para-10-personas-en-torreon-cuanto-cuesta', 'airbnb-o-reservar-directo-en-hostalia-torreon', 'hospedaje-auditores-consultores-capacitacion-torreon'],
    });
  }

  // ── Fin de semana
  {
    const base = [...casas.filter(conAlberca), ...casas.filter((c) => conAsador(c) && !conAlberca(c)), ...porSlug('jardin-14', 'senderos', 'rosita')];
    const cs = [...new Set(base)].slice(0, 8);
    const baratas = [...cs].sort((a, b) => finde(a) - finde(b));
    pagina({
      slug: 'casa-para-fin-de-semana-torreon',
      menu: 'Fin de semana',
      grupo: 'estancia',
      titulo: 'Casa para fin de semana en Torreón con alberca',
      desc: `Casas completas para fin de semana en Torreón, con alberca, asador o jardín: de ${rango(cs, (c) => c.huespedes)} personas, desde ${mxn(finde(baratas[0]))}${IVA_NOTA} la noche de viernes o sábado. Mínimo 2 noches.`,
      eyebrow: 'Viernes a domingo · Torreón',
      h1: 'Casa para el fin de semana en Torreón, <em>con alberca o asador</em>.',
      lead: `Para la reunión de la familia, los primos que vienen de fuera o un fin de semana distinto sin salir de la ciudad: casas completas con alberca, asador, palapa o jardín, para ${rango(cs, (c) => c.huespedes)} personas. La noche de viernes o sábado va desde ${mxn(finde(baratas[0]))}${IVA_NOTA} por la casa.`,
      wa: 'Hola Hostalia, buscamos casa para un fin de semana en Torreón. Somos __ personas, del viernes __ al domingo __. ¿Cuál tienen libre?',
      casas: cs,
      secciones: [
        { h2: 'Cuál según el plan', html: `<ul><li><strong>Con alberca:</strong> ${y(cs.filter(conAlberca).map((c) => `${ficha(c)} (${c.huespedes})`))}. Las albercas no están climatizadas.</li><li><strong>Con asador o palapa:</strong> ${y(cs.filter(conAsador).map((c) => `${ficha(c)} (${c.huespedes})`))}.</li><li><strong>Para grupos grandes:</strong> ${y([...cs].sort((a, b) => b.huespedes - a.huespedes).slice(0, 3).map((c) => `${ficha(c)} (${c.huespedes})`))}.</li></ul>` },
        { h2: 'Precio de viernes y sábado, casa por casa', html: `${tabla(cs, { th: 'Viernes y sábado', td: (c) => `${mxn(finde(c))}${IVA_NOTA}` })}<p style="font-size:13px;color:var(--gris)">"Por noche" es el precio de domingo a jueves; la última columna, el de viernes y sábado. Casa completa, reservando directo. En puentes y fechas pico aplica tarifa de temporada. Limpieza aparte: ${mxn(LIMPIEZA)}${IVA_NOTA}.</p>` },
        { h2: 'Lo que hay que saber antes', html: `<ul><li><strong>Mínimo 2 noches.</strong> Lo usual es viernes y sábado.</li><li><strong>Entrada</strong> desde las 3 de la tarde y <strong>salida</strong> antes de las 11 de la mañana; si quieren salir más tarde el domingo, pídanlo al reservar.</li><li><strong>Personas:</strong> las que duermen son las de la reserva. Si llegan invitados a comer, avísanos antes.</li><li><strong>No son salones de fiestas:</strong> están en fraccionamientos con vecinos; música a volumen de casa.</li></ul>` },
        { h2: 'Fechas especiales', html: `<p>Si el fin de semana cae en puente o temporada, mira ${liga('hospedaje-buen-fin-y-puente-revolucion-torreon', 'Buen Fin y puente de noviembre')}, ${liga('casas-navidad-y-ano-nuevo-torreon', 'Navidad y Año Nuevo')}, ${liga('casas-para-graduaciones-torreon', 'graduaciones')} o ${liga('casas-para-bodas-y-eventos-torreon', 'bodas y XV años')}.</p>` },
      ],
      faqs: [
        { q: '¿Cuánto cuesta una casa para fin de semana en Torreón?', a: `La noche de viernes o sábado va de ${mxn(finde(baratas[0]))} a ${mxn(finde(baratas[baratas.length - 1]))}${IVA_NOTA} por la casa completa. La más económica es ${baratas[0].nombre}, para ${baratas[0].huespedes} personas.` },
        { q: '¿Qué casas tienen alberca?', a: `${y(cs.filter(conAlberca).map((c) => c.nombre))}. No están climatizadas.` },
        { q: '¿Se puede rentar solo el sábado?', a: 'No, la estancia mínima es de 2 noches.' },
        { q: '¿Se puede hacer una fiesta?', a: 'No se permiten fiestas ni más personas durmiendo que las de la reserva. Una comida familiar sí; si vienen invitados que no duermen, avísanos antes.' },
        { q: '¿A qué hora se entra y se sale?', a: 'Entrada desde las 3 de la tarde y salida antes de las 11 de la mañana. Otro horario se coordina por WhatsApp si la casa no tiene entrada o salida ese día.' },
      ],
      relacionadas: ['casas-con-alberca-torreon', 'casas-con-asador-y-alberca-posadas-fin-de-ano-torreon', 'casas-en-renta-por-noche-torreon', 'casas-para-bodas-y-eventos-torreon', 'casa-para-10-personas-torreon', 'hospedaje-cerca-galerias-laguna-torreon'],
    });
  }

  // ── Graduaciones
  {
    const uni = (c) => (ubicada(c) ? (cercaZona(zonaKey(c))['Escuelas y universidades'] || [])[0] : null);
    const cs = casas.filter((c) => ubicada(c) && c.huespedes >= 8 && uni(c) && uni(c).min <= 12).sort((a, b) => uni(a).min - uni(b).min || b.huespedes - a.huespedes).slice(0, 8);
    if (cs.length >= 3) {
      pagina({
        slug: 'casas-para-graduaciones-torreon',
        menu: 'Graduaciones',
        grupo: 'temporada',
        titulo: 'Casas para graduaciones en Torreón',
        desc: `Casas completas en Torreón para la familia que viene a una graduación: de ${rango(cs, (c) => c.huespedes)} personas, a minutos de la Ibero, la UA de C y el Tecnológico de La Laguna. Aparta con 3 a 6 semanas.`,
        eyebrow: 'Mayo, junio y diciembre · Torreón',
        h1: 'Graduación en Torreón: <em>una casa para toda la familia</em>.',
        lead: 'A una graduación llegan los abuelos, los tíos y los hermanos que viven fuera, todos el mismo fin de semana que las demás familias. Una casa completa cerca de la universidad resuelve dónde duermen todos y dónde se juntan después de la ceremonia.',
        wa: 'Hola Hostalia, venimos a una graduación en Torreón (universidad: __). Somos __ personas, del __ al __. ¿Qué casa nos recomiendan?',
        casas: cs,
        secciones: [
          {
            h2: 'Qué casa según la universidad',
            html: `<ul>${[
              ['Universidad Iberoamericana', 'Universidad Iberoamericana Torreón'],
              ['UA de C', 'UA de C, Ciudad Universitaria'],
              ['Instituto Tecnológico de La Laguna', 'Instituto Tecnológico de La Laguna'],
              ['Tec de Monterrey', 'Tec de Monterrey Campus Laguna'],
            ]
              .map(([pref, nombre]) => {
                const t = cercanas(pref, { n: 3, max: 13 }).filter((x) => x.c.huespedes >= 8);
                return t.length ? `<li><strong>${nombre}:</strong> ${y(t.map((x) => `${ficha(x.c)} (${x.c.huespedes} personas, ${x.min} min)`))}.</li>` : '';
              })
              .join('')}</ul>${notaMinutos}`,
          },
          { h2: 'Casas para la familia completa', html: `${tabla(cs, { th: 'Universidad más cercana', td: (c) => `${uni(c).n} · ${uni(c).min} min` })}${notaPrecios}` },
          { h2: 'Con cuánto tiempo apartar', html: `<p>Los fines de semana de graduación (mayo, junio y diciembre) son de los que primero se llenan. Lo normal es apartar de 3 a 6 semanas antes, en cuanto la universidad confirme la fecha. Estancia mínima de 2 noches; lo usual es llegar el viernes y salir el domingo.</p>` },
          { h2: 'La comida después de la ceremonia', html: `<p>${cs.filter(conAsador).length ? `${y(cs.filter(conAsador).map((c) => ficha(c)))} ${cs.filter(conAsador).length === 1 ? 'tiene' : 'tienen'} asador o palapa. ` : ''}${cs.filter(conAlberca).length ? `${y(cs.filter(conAlberca).map((c) => ficha(c)))} ${cs.filter(conAlberca).length === 1 ? 'tiene' : 'tienen'} alberca. ` : ''}Todas tienen cocina equipada, comedor y sala. La casa es para quienes duermen ahí: si llegan más invitados a comer, avísanos antes para confirmarlo, y recuerda que están en fraccionamientos con vecinos, no son salones de fiestas.</p>` },
        ],
        faqs: [
          { q: '¿Con cuánta anticipación hay que apartar para una graduación?', a: 'De 3 a 6 semanas. Mayo, junio y diciembre se llenan pronto.' },
          { q: '¿Cuánto cuesta el fin de semana?', a: `${y(cs.slice(0, 3).map((c) => `${c.nombre} ${mxn(finde(c))}${IVA_NOTA} la noche de viernes o sábado para ${c.huespedes}`))}. Mínimo 2 noches.` },
          { q: '¿Cuál es la más grande?', a: `${cs.reduce((a, b) => (a.huespedes >= b.huespedes ? a : b)).nombre}, para ${Math.max(...cs.map((c) => c.huespedes))} personas. Para familias más grandes se pueden tomar dos casas en la misma zona.` },
          { q: '¿Podemos hacer la comida de graduación en la casa?', a: 'Una comida familiar sí. Si vienen invitados que no duermen en la casa, avísanos antes; no se permiten fiestas.' },
          { q: '¿Pueden salir tarde el domingo?', a: 'Si lo piden al reservar y la casa no tiene entrada ese mismo día, sí.' },
        ],
        relacionadas: ['hospedaje-cerca-universidad-iberoamericana-torreon', 'hospedaje-cerca-uadec-torreon', 'hospedaje-cerca-tecnologico-de-la-laguna-torreon', 'hospedaje-cerca-tec-de-monterrey-torreon', 'casa-para-fin-de-semana-torreon', 'casas-para-bodas-y-eventos-torreon'],
      });
    }
  }

  // ── Personal reubicado
  {
    const cs = [...porSlug('santorini', 'alebrijes'), ...conMes.filter((c) => c.huespedes <= 12)].slice(0, 7);
    pagina({
      slug: 'casa-amueblada-reubicacion-personal-torreon',
      menu: 'Personal reubicado',
      grupo: 'empresas',
      titulo: 'Casa amueblada para personal reubicado en Torreón',
      desc: `Casa amueblada por mes en Torreón para el personal que tu empresa reubica: lista para entrar, sin aval, con contrato y CFDI a nombre de la empresa. Desde ${mxn(mesMin.precioMesSinServicios)}${IVA_NOTA} al mes.`,
      eyebrow: 'Reubicación de personal · Torreón',
      h1: 'Casa lista para el personal que tu empresa <em>reubica en Torreón</em>.',
      lead: 'Cuando la empresa mueve a un gerente, a un ingeniero con su familia o a un equipo que arranca una operación, los primeros meses son los difíciles: no conocen la ciudad y no hay tiempo de amueblar. Una casa amueblada por mes resuelve ese tramo, con factura a la empresa y sin aval.',
      wa: 'Hola Hostalia, mi empresa reubica personal a Torreón. Necesitamos casa amueblada para __ personas, desde el __, por __ meses, con factura. ¿Qué tienen?',
      casas: cs,
      secciones: [
        { h2: 'Qué resuelve para Recursos Humanos', html: `<ul><li><strong>Entrada inmediata:</strong> muebles, cocina equipada, blancos, clima, wifi y lavadora ya están.</li><li><strong>Sin aval ni contrato anual:</strong> contrato de hospedaje mes por mes a nombre de la empresa.</li><li><strong>Un solo CFDI al mes</strong> por renta, limpieza y, si se contratan incluidos, servicios.</li><li><strong>Mes por mes:</strong> se paga por adelantado y se renueva mientras haga falta; cuando la persona encuentra casa definitiva, avisa con anticipación y ya no se renueva.</li></ul>` },
        { h2: 'Elegir la zona antes que la casa', html: `<p>Para alguien que no conoce Torreón, la zona pesa más que la casa. Según dónde esté el trabajo: al norte, ${liga('casas-en-renta-norte-de-torreon', 'Senderos y Alebrijes')}; al oriente, ${liga('casas-en-renta-oriente-de-torreon', 'Los Viñedos y Villas Santorini')}; al sur, ${liga('casas-en-renta-sur-de-torreon', 'Los Almendros y La Rosita')}; por el centro, ${liga('casas-en-renta-provitec-torreon', 'Provitec')}. La guía ${liga('zonas-de-torreon-donde-quedarse-segun-a-que-vienes', 'en qué zona quedarse según a qué vienes')} trae los minutos a cada punto.</p>` },
        { h2: 'Casas que se usan para reubicación', html: `${tabla(cs, { th: 'Por mes con servicios', td: (c) => (c.precioMesConServicios ? `${mxn(c.precioMesConServicios)}${IVA_NOTA}` : 'se cotiza') })}<p style="font-size:13px;color:var(--gris)">Precio por mes sin servicios en la columna "Por mes"; con agua, luz, gas e internet incluidos en la última. Limpieza semanal obligatoria aparte: ${mxn(LIMPIEZA)}${IVA_NOTA} por servicio. Depósito en garantía de un mes, reembolsable.</p>` },
        { h2: 'Si la persona llega antes que la familia', html: `<p>Es común que primero llegue quien trabaja y la familia semanas después. Para ese primer tramo puede bastar un ${liga('departamentos-amueblados-en-renta-torreon', 'departamento amueblado')} y después cambiar a una casa. También podemos enseñar la casa por video antes de que viajen.</p>` },
      ],
      faqs: [
        { q: '¿Cuánto cuesta por mes una casa amueblada para personal reubicado?', a: `De ${mxn(mesMin.precioMesSinServicios)} a ${mxn(mesMax.precioMesSinServicios)}${IVA_NOTA} sin servicios según la casa; con servicios incluidos son ${mxn(3000)} más. Las casas sin precio mensual publicado se cotizan.` },
        { q: '¿El contrato puede ir a nombre de la empresa?', a: 'Sí, contrato de hospedaje y CFDI a nombre de la razón social.' },
        { q: '¿Cuál es el plazo mínimo?', a: 'Un mes para tarifa mensual; se renueva mes con mes.' },
        { q: '¿Piden aval o depósito?', a: 'Aval no. Depósito en garantía de un mes, que se devuelve al entregar la casa en orden.' },
        { q: '¿Se puede ver la casa antes?', a: 'Sí. En Torreón la mostramos; a quien viene de fuera le mandamos video del recorrido por WhatsApp.' },
      ],
      relacionadas: ['renta-casa-amueblada-sin-aval-torreon', 'casas-amuebladas-renta-por-mes-torreon', 'renta-temporal-torreon-familias', 'hospedaje-con-factura-torreon', 'hospedaje-para-empresas-torreon', 'casas-en-privada-con-seguridad-torreon'],
    });
  }

  // ── Auditores, consultores y capacitación
  {
    const trabajo = (c) => /área para trabajar/i.test(texto(c));
    const camaPropia = (c) => c.camas >= c.huespedes - 1;
    const cs = [...new Set([...casas.filter(trabajo), ...casas.filter(camaPropia), ...porSlug('familiar-10', 'santorini', 'alebrijes')])].slice(0, 7);
    pagina({
      slug: 'hospedaje-auditores-consultores-capacitacion-torreon',
      menu: 'Auditores y consultores',
      grupo: 'empresas',
      titulo: 'Hospedaje para auditores y consultores en Torreón',
      desc: `Casas y departamentos amueblados en Torreón para equipos de auditoría, consultoría y capacitación de ${rango(cs, (c) => c.huespedes)} personas: wifi, área para trabajar y factura. Desde ${mxn(Math.min(...cs.map(noche)))}${IVA_NOTA} la noche.`,
      eyebrow: 'Auditorías · consultoría · capacitación',
      h1: 'Hospedaje para equipos de <em>auditoría, consultoría y capacitación</em>.',
      lead: 'Un equipo que viene una, dos o tres semanas a auditar, implementar un sistema o dar un curso trabaja de día con el cliente y de noche cierra pendientes. En una casa hay mesa para trabajar juntos, wifi, cocina y una sola factura para el proyecto.',
      wa: 'Hola Hostalia, somos un equipo de __ personas (auditoría / consultoría / capacitación) y estaremos en Torreón del __ al __. ¿Qué casa nos recomiendan, con factura?',
      casas: cs,
      secciones: [
        { h2: 'Qué casa según el equipo', html: `<ul>${casas.filter(trabajo).length ? `<li><strong>Con área para trabajar:</strong> ${y(casas.filter(trabajo).map((c) => `${ficha(c)} (${c.huespedes} personas)`))}.</li>` : ''}${cs.filter(camaPropia).length ? `<li><strong>Una cama por persona, o casi:</strong> ${y(cs.filter(camaPropia).map((c) => `${ficha(c)} (${c.camas} camas para ${c.huespedes})`))}.</li>` : ''}<li><strong>Más recámaras para más privacidad:</strong> ${y([...cs].sort((a, b) => b.recamaras - a.recamaras).slice(0, 2).map((c) => `${ficha(c)} (${c.recamaras} recámaras)`))}.</li></ul><p>Todas tienen wifi. Si el equipo va a tener videollamadas simultáneas o usa VPN de la empresa, dinos cuántos son para recomendarte la casa.</p>` },
        { h2: 'Comparadas', html: `${tabla(cs, { th: 'Camas', td: (c) => c.camas })}${notaPrecios}` },
        { h2: 'Cómo se acomoda al calendario del proyecto', html: `<p>Estos proyectos suelen ir por semanas: llegar el domingo o el lunes y salir el viernes. Se cotiza por semana con tus fechas; si el equipo regresa en varias visitas, dinos el calendario completo para apartar la misma casa. Estancia mínima de 2 noches. Si el personal rota cada semana, mira ${liga('hospedaje-torreon-personal-que-rota-por-semana', 'hospedaje para personal que rota por semana')}.</p>` },
        { h2: 'Factura al proyecto', html: `<p>CFDI por el total a nombre de tu firma, con el IVA desglosado, y contrato de hospedaje por escrito. Detalle en ${liga('hospedaje-con-factura-torreon', 'hospedaje con factura en Torreón')}.</p>` },
      ],
      faqs: [
        { q: '¿Las casas tienen internet para trabajar?', a: 'Sí, todas tienen wifi. Para videollamadas simultáneas o VPN, dinos cuántas personas son y te recomendamos la casa.' },
        { q: '¿Hay casas con una cama por persona?', a: `${cs.filter(camaPropia).length ? `${y(cs.filter(camaPropia).slice(0, 3).map((c) => `${c.nombre} tiene ${c.camas} camas para ${c.huespedes} personas`))}.` : 'Dinos cuántos son y te decimos cuál conviene.'}` },
        { q: '¿Cuánto cuesta por noche?', a: `De ${mxn(Math.min(...cs.map(noche)))} a ${mxn(Math.max(...cs.map(noche)))}${IVA_NOTA} por la casa o departamento completo. Por semana se cotiza con tus fechas.` },
        { q: '¿Se puede reservar de lunes a viernes?', a: 'Sí, desde 2 noches y en los días que necesiten.' },
        { q: '¿Facturan a una firma de fuera de Coahuila?', a: 'Sí, CFDI a cualquier razón social de México.' },
      ],
      relacionadas: ['hospedaje-con-factura-torreon', 'hospedaje-para-empresas-torreon', 'hospedaje-torreon-personal-que-rota-por-semana', 'casas-amuebladas-por-semana-torreon', 'departamentos-amueblados-en-renta-torreon', 'hospedaje-ingenieros-tecnicos-planta-torreon'],
    });
  }

  return paginas;
}
