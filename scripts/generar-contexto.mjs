#!/usr/bin/env node
/**
 * Genera CONTEXTO.md — el brief del negocio para pegarlo en un proyecto de
 * Claude, o para tenerlo a la mano al contestar WhatsApp.
 *
 *   node scripts/generar-contexto.mjs
 *
 * Sale de casas.json, así que si cambian precios o casas basta con volverlo
 * a correr y no hay que actualizarlo a mano.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { marca, casas } = JSON.parse(readFileSync(join(ROOT, 'casas.json'), 'utf8'));
const SITIO = 'https://ofertaslaguna84-bit.github.io/home-express';

const mxn = (n) => `$${Number(n).toLocaleString('es-MX')}`;
const air = (b) => Math.round(b / (1 - marca.comisionAirbnb) / 10) * 10;
const dir = (b) => Math.round((air(b) * (1 - marca.descuentoDirecto)) / 10) * 10;
const porPersona = (c) => Math.round(dir(c.baseNoche) / c.huespedes);

const articulosCount = (() => {
  try {
    return readdirSync(join(ROOT, 'blog')).filter((f) => f.endsWith('.json')).length;
  } catch {
    return 0;
  }
})();

const hoy = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

const md = `# ${marca.nombre} — contexto para responder clientes

> Documento generado desde los datos reales del negocio. Última actualización: ${hoy}.
> Si cambian precios o casas: \`node scripts/generar-contexto.mjs\`

## Qué es el negocio

${marca.nombre} renta ${casas.length} casas **propias** amuebladas en ${marca.ciudad}, ${marca.estado}.
No es portal ni intermediario: son casas del mismo dueño, que también las publica
en Airbnb con ${marca.resenas} reseñas y ${marca.calificacion} de calificación.
Reservando directo sale más barato porque no se paga la comisión de plataforma.

**Sitio:** ${SITIO}
**WhatsApp:** ${marca.whatsappVisible}

---

## Comparación rápida

| Casa | Personas | Recámaras | Camas | Baños | Por noche | Mes sin serv. | Mes con serv. |
|---|---|---|---|---|---|---|---|
${casas
  .slice()
  .sort((a, b) => b.baseNoche - a.baseNoche)
  .map(
    (c) =>
      `| **${c.zona}** | ${c.huespedes} | ${c.recamaras} | ${c.camas} | ${c.banos} | ${mxn(dir(c.baseNoche))} | ${mxn(c.precioMesSinServicios)} | ${mxn(c.precioMesConServicios)} |`
  )
  .join('\n')}

**Cómo elegir rápido:**
- **Grupo grande con cada quien su cama** → ${casas.reduce((a, b) => (a.camas / a.huespedes > b.camas / b.huespedes ? a : b)).zona} (mejor proporción camas/persona)
- **Más personas** → ${casas.reduce((a, b) => (a.huespedes > b.huespedes ? a : b)).zona} (${Math.max(...casas.map((c) => c.huespedes))} personas)
- **Más económica** → ${casas.reduce((a, b) => (a.baseNoche < b.baseNoche ? a : b)).zona}
- **Quien no puede subir escaleras** → Almendros (recámara en planta baja)
- **Convivencia / fin de semana** → Cantera (palapa, asador, barra) o Lomas (alberca, asador)
- **Viaje de trabajo al centro** → Acacias (céntrica)

---

## Cada casa a detalle

${casas
  .map(
    (c) => `### ${c.zona} — ${c.nombre}

- **Capacidad:** ${c.huespedes} personas · ${c.recamaras} recámaras · ${c.camas} camas · ${c.banos} baños
- **Precio por noche:** ${mxn(dir(c.baseNoche))} entre semana · ${mxn(dir(c.baseFinde))} fin de semana
- **En Airbnb cuesta:** ${mxn(air(c.baseNoche))} — o sea que directo se ahorra ${mxn(air(c.baseNoche) - dir(c.baseNoche))} por noche
- **Por mes:** ${mxn(c.precioMesSinServicios)} sin servicios · ${mxn(c.precioMesConServicios)} con servicios (agua, luz, gas, internet)
- **Destaca por:** ${c.destacados.join(', ')}
- **Ficha:** ${SITIO}/casas/${c.slug}/

${c.resumen}`
  )
  .join('\n\n')}

---

## Reglas del negocio

- **Estancia mínima:** 2 noches. Máxima: no hay (las hay de hasta 6 meses).
- **Precios:** los publicados son **por noche, finales, con IVA incluido**.
- **Semana y mes:** hay mejor tarifa pero **no se publica** — se cotiza y es **negociable**.
  Referencias internas: semana ${Math.round(marca.descuentoSemana * 100)}% menos, mes ${Math.round(marca.descuentoMes * 100)}% menos sobre la noche;
  para estancias largas se usa el precio mensual de la tabla. El mensual tiene dos
  niveles: **sin servicios** y **con servicios** (agua, luz, gas e internet), $3,000
  de diferencia en todas las casas.
- **Factura:** sí, CFDI a nombre de la empresa. Es el diferenciador más fuerte: la
  mayoría de las rentas temporales de Torreón no factura.
- **Se aparta con anticipo** por transferencia; el resto se liquida al llegar.
- **Depósito en garantía** que se devuelve al salir.
- **Dirección exacta:** NUNCA se da antes de apartar. Solo colonia y ciudad.
- **Todas incluyen:** clima, cocina equipada, wifi, estacionamiento, ropa de cama y toallas.
- **Cobertura:** Torreón, Gómez Palacio y Lerdo.

## Lo que NO se debe decir

- No prometer disponibilidad sin revisar el calendario.
- No inventar precios de semana o mes: se cotizan.
- No dar la dirección exacta ni referencias de la calle.
- No decir que hay recepción, oficina ni personal 24 horas: no lo hay.
- No citar leyes, NOMs ni reglamentos.

---

## Respuestas listas para WhatsApp

**Preguntan por una casa en particular:**
> Claro que sí. [Casa] es para [N] personas, con [N] recámaras y [N] camas. Sale en $[precio] la noche entre semana. ¿Para qué fechas la ocupas y cuántas personas serían? Te confirmo disponibilidad.

**Preguntan el precio y se les hace caro:**
> Te entiendo. Ten en cuenta que es la casa completa, no por persona: entre [N] personas sale en $[precio] por cabeza la noche, con cocina equipada para que no gasten en comidas. En hotel serían [N] habitaciones aparte.

**Preguntan por estancia larga:**
> Para estancias de un mes o más manejamos tarifa especial, bastante abajo de la de por noche. Dime cuántas personas, qué fechas y por cuánto tiempo, y te paso el número cerrado. Facturamos si lo necesitas.

**Empresa que pide factura:**
> Sí facturamos, CFDI a nombre de tu empresa. Mándame los datos fiscales cuando apartes y la factura sale a nombre de la razón social. Si son varios trabajadores, una casa completa suele salir mejor que cuartos de hotel.

**Preguntan por qué es más barato que Airbnb:**
> Porque en Airbnb hay una comisión de plataforma. Al reservar directo esa comisión no existe y ese ahorro te lo paso a ti. Es la misma casa, el mismo anfitrión y las mismas llaves — de hecho ahí tengo ${marca.resenas} reseñas con ${marca.calificacion}.

**Piden la dirección antes de apartar:**
> Te paso la ubicación exacta en cuanto quede apartada. Por seguridad de los huéspedes no la publicamos. Está en la colonia [colonia], en [Torreón]. ¿Te late si te mando fotos y el video del recorrido mientras tanto?

---

## El sitio web

**${SITIO}** — publicado en GitHub Pages desde el repo \`ofertaslaguna84-bit/home-express\`.

Es un sitio estático generado por \`build.mjs\` desde \`casas.json\`. Todo sale de esa
única fuente: el precio de la tarjeta, el de los datos estructurados y el del
\`llms.txt\` son el mismo número, así que no se pueden desincronizar.

\`\`\`
node build.mjs      genera docs/ (lo que publica GitHub Pages)
\`\`\`

**Páginas:** portada, una ficha por casa, blog y ${articulosCount} artículos.

**Cómo se calculan los precios:** en \`casas.json\` se guarda la tarifa base (la del
calendario de Airbnb). El sitio calcula solo:
- Precio Airbnb = base ÷ (1 − ${Math.round(marca.comisionAirbnb * 100)}%), porque Airbnb cobra esa comisión al anfitrión desde el 15 de septiembre de 2026.
- Precio directo = precio Airbnb − ${Math.round(marca.descuentoDirecto * 100)}%. El descuento sale de la comisión que la plataforma ya no se lleva: el huésped paga menos y el dueño recibe más.

**Decisiones de diseño que NO hay que deshacer:**
- Los precios se muestran **finales, con IVA incluido**, no "+ IVA". Con "+ IVA" el
  precio directo quedaba por encima del de Airbnb en las cinco casas y se caía el
  único argumento del sitio.
- En escritorio el video es fondo de todo el hero con el texto encima; en celular
  se apila (video arriba, texto abajo) porque ahí el texto encima tapaba el video.
- La dirección exacta **nunca** se publica, solo colonia y ciudad.
- No se publican los porcentajes de descuento por semana o mes: se negocian.

---

## Airbnb

El dueño tiene **9 anuncios**, de los cuales **5 están publicados** (los de este
documento) y 4 sin publicar: Alojamiento para ejecutivos, Aeropuerto, Rioja y
Zona Industrial Galerías.

**Los títulos se reescribieron** el 26 de agosto de 2026 con esta fórmula:
\`Casa {N}px Facturamos | {ventaja} | {ventaja}\`. El motivo: de 18 competidores en
Torreón **solo uno** menciona que factura, y el límite de Airbnb es ~50 caracteres
con corte en ~32 en celular, así que "Facturamos" va al frente para que se alcance
a ver. También se corrigió que una casa anunciaba 10 personas cuando admite 12.

**Pendiente con fecha:** el **15 de septiembre de 2026** Airbnb cambia a tarifa
única y le cobra el ${Math.round(marca.comisionAirbnb * 100)}% completo al anfitrión. Si no suben los precios
mostrados antes de esa fecha, el dueño recibe ~13% menos por reserva sin que el
huésped pague menos. Hay que ajustarlo el 14 de septiembre.

---

## El blog

Se publica solo los **lunes y jueves** por GitHub Actions. Lo escribe **DeepSeek**
(barato) y si falla se pasa a **Claude** como respaldo, para que el cron no se
quede sin publicar.

Los temas salen de búsquedas reales de Google, medidas con autocompletar. Se
dejaron fuera a propósito los términos que suenan bien pero **nadie busca**:
"hospedaje corporativo", "renta corporativa", "alojamiento para empresas".
Lo que sí se busca: "casas amuebladas en renta torreon", "airbnb torreon",
"casa en renta para trabajadores", "hospedaje para trabajadores".

**Reglas duras del prompt** (no quitarlas, la IA inventa sin ellas):
- No inventar precios, colonias, distancias, leyes, NOMs ni testimonios.
- No multiplicar el precio por noche por 30 para dar un mensual: da una cifra
  irreal que espanta al cliente de estancia larga.
- No publicar los porcentajes de descuento.

---

## Pendientes

- [ ] **Dominio homeexpress.mx** — está libre, hay que comprarlo (~$450-700/año).
      Al comprarlo: \`SITIO=https://homeexpress.mx node build.mjs\`
- [ ] **Secret \`DEEPSEEK_API_KEY\`** en el repo para que el blog corra solo.
- [ ] **Ajustar precios de Airbnb** antes del 15 de septiembre de 2026.
- [ ] **Fotos**: las actuales son capturas de un video, verticales y con algo de
      movimiento. Una sesión horizontal con luz de mañana cambiaría el sitio de nivel.
`;

writeFileSync(join(ROOT, 'CONTEXTO.md'), md, 'utf8');
console.log(`✓ CONTEXTO.md — ${casas.length} casas · ${md.split('\n').length} líneas`);
