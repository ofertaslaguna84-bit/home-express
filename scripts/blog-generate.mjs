#!/usr/bin/env node
/**
 * Genera un artículo del blog con Claude y lo guarda en blog/{slug}.json
 *
 *   node scripts/blog-generate.mjs              # el siguiente tema pendiente
 *   node scripts/blog-generate.mjs --slug=xxx   # un tema específico
 *   node scripts/blog-generate.mjs --todos      # todos los pendientes
 *
 * La IA escribe SOLO el contenido. La maquetación la pone build.mjs, para que
 * el estilo viva en un lugar y un rediseño no obligue a regenerar artículos.
 *
 * Necesita ANTHROPIC_API_KEY. Si no está en el entorno, se lee de los .env
 * locales de los otros proyectos (misma cuenta).
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BLOG = join(ROOT, 'blog');

// ── llave de API ────────────────────────────────────────────────────────────
function cargarLlave() {
  if (process.env.ANTHROPIC_API_KEY?.trim()) return;
  const candidatos = [
    join(process.env.HOME || '', 'Projects/adestajo/.env.local'),
    join(process.env.HOME || '', 'Projects/adestajo/.env.vercel.local'),
  ];
  for (const f of candidatos) {
    try {
      const m = readFileSync(f, 'utf8').match(/^ANTHROPIC_API_KEY="?([^"\n]+)"?/m);
      if (m) {
        process.env.ANTHROPIC_API_KEY = m[1].trim();
        return;
      }
    } catch {
      /* siguiente */
    }
  }
}
cargarLlave();

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Falta ANTHROPIC_API_KEY. Expórtala o ponla en el entorno de la Action.');
  process.exit(1);
}

const { marca, casas } = JSON.parse(readFileSync(join(ROOT, 'casas.json'), 'utf8'));
const { temas } = JSON.parse(readFileSync(join(ROOT, 'blog-temas.json'), 'utf8'));

const mxn = (n) => `$${Number(n).toLocaleString('es-MX')}`;
const precioAirbnb = (b) => Math.round(b / (1 - marca.comisionAirbnb) / 10) * 10;
const precioDirecto = (b) => Math.round((precioAirbnb(b) * (1 - marca.descuentoDirecto)) / 10) * 10;

// ── contexto real del negocio, para que la IA no invente ────────────────────
const CONTEXTO = `
NEGOCIO: ${marca.nombre}, renta de casas amuebladas en ${marca.ciudad}, ${marca.estado}.
Son ${casas.length} casas PROPIAS (no somos portal ni intermediario). El mismo dueño las
publica también en Airbnb, donde tiene ${marca.resenas} reseñas y ${marca.calificacion} de calificación.

CASAS (datos exactos, no inventar otros):
${casas
  .map(
    (c) =>
      `- ${c.nombre} (${c.zona}): ${c.huespedes} personas, ${c.recamaras} recámaras, ${c.camas} camas, ${c.banos} baños. ` +
      `${mxn(precioDirecto(c.baseNoche))}/noche directo (${mxn(precioAirbnb(c.baseNoche))} en Airbnb). ${c.destacados.join(', ')}.`
  )
  .join('\n')}

HECHOS QUE SÍ PUEDES USAR:
- Todas tienen clima, cocina equipada, wifi, estacionamiento, ropa de cama y toallas.
- Estancia mínima 2 noches, sin máximo. Hay estancias de hasta 6 meses.
- Facturamos CFDI. Es un diferenciador real: la mayoría de las rentas temporales de la zona no factura.
- Se reserva por WhatsApp (${marca.whatsappVisible}), con anticipo por transferencia. No hay motor de reservas en línea.
- Reservar directo cuesta menos que por Airbnb porque no se paga la comisión de plataforma
  (Airbnb cobra ${Math.round(marca.comisionAirbnb * 100)}% al anfitrión desde el 15 de septiembre de 2026).
- Precio de mercado en Torreón para casa amueblada por mes: entre $19,000 y $30,000, según si incluye servicios.
- Cobertura: Torreón, Gómez Palacio y Lerdo (La Laguna).

LO QUE NO DEBES HACER:
- No inventes precios, promociones, premios, años de experiencia ni número de clientes.
- No inventes nombres de colonias, calles, distancias en minutos ni datos del clima.
- No cites leyes, NOMs, artículos ni reglamentos: si no estás seguro, no lo menciones.
- No inventes testimonios ni casos de clientes.
- No digas que tenemos oficina física, recepción ni personal 24 horas.
- No prometas disponibilidad: siempre remite a preguntar por WhatsApp.
`.trim();

// ── prompt ──────────────────────────────────────────────────────────────────
function prompt(tema, yaEscritos) {
  return `Escribe un artículo para el blog de ${marca.nombre}.

TEMA: ${tema.titulo}
BÚSQUEDA QUE QUEREMOS GANAR: "${tema.busqueda}"
QUIÉN LO VA A LEER: ${tema.intencion}
ÁNGULO: ${tema.angulo}

${CONTEXTO}

${yaEscritos.length ? `ARTÍCULOS QUE YA EXISTEN (no repitas su contenido, puedes enlazarlos):\n${yaEscritos.map((a) => `- ${a.titulo} → /blog/${a.slug}/`).join('\n')}\n` : ''}
CÓMO ESCRIBIR:
- Español de México, natural, como le explicarías a un cliente por WhatsApp. Nada de lenguaje corporativo.
- Nada de "en el mundo actual", "sin duda", "es importante destacar", "descubre", "sumérgete".
- Directo al grano: la primera respuesta útil va en el primer párrafo, no después de tres de relleno.
- Entre 800 y 1,100 palabras. Mejor corto y útil que largo y relleno.
- Honesto: si algo tiene desventaja, dilo. Eso da más confianza que presumir.
- Vender poco. El artículo primero resuelve la duda; la mención de nuestras casas va al final y sin exagerar.

ESTRUCTURA (importante para buscadores y para IA):
- Arranca respondiendo la pregunta del título en 2 o 3 renglones, con números si aplica.
- Usa subtítulos <h2> con preguntas o frases que la gente busque de verdad.
- Mete al menos una tabla comparativa con datos concretos.
- Cierra con 3 preguntas frecuentes cortas.

Devuelve SOLO un objeto JSON, sin texto antes ni después, sin \`\`\`, con esta forma exacta:
{
  "titulo": "título del artículo, máximo 65 caracteres",
  "descripcion": "meta description de 140 a 158 caracteres, con la respuesta corta",
  "resumen": "un párrafo de 2 renglones que resume la respuesta. Es lo que un buscador de IA va a citar.",
  "keywords": ["4 a 6 términos de búsqueda reales"],
  "cuerpo": "el artículo en HTML: solo <h2>, <h3>, <p>, <ul>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <strong>, <a>. Sin <h1>, sin <html>, sin <body>, sin atributos style ni class.",
  "faqs": [{"q": "pregunta", "a": "respuesta de 2 a 4 renglones"}]
}`;
}

// ── extracción tolerante del JSON ───────────────────────────────────────────
function extraerJson(texto) {
  let t = texto.trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '');
  const i = t.indexOf('{');
  const j = t.lastIndexOf('}');
  if (i === -1 || j === -1) throw new Error('la respuesta no traía JSON');
  return JSON.parse(t.slice(i, j + 1));
}

// ── generación ──────────────────────────────────────────────────────────────
const client = new Anthropic();

async function generar(tema, yaEscritos) {
  console.log(`→ escribiendo: ${tema.titulo}`);

  // Streaming: el artículo es salida larga y así no se topa con el timeout HTTP.
  const stream = client.beta.messages.stream({
    model: 'claude-opus-5',
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    system:
      'Escribes contenido para negocios locales mexicanos. Tu regla número uno es no inventar datos: ' +
      'si un dato no viene en el contexto que te dan, no lo mencionas. Prefieres un artículo más corto y ' +
      'verificable que uno largo con relleno. Devuelves siempre JSON válido y nada más.',
    messages: [{ role: 'user', content: prompt(tema, yaEscritos) }],
  });

  const msg = await stream.finalMessage();

  if (msg.stop_reason === 'refusal') {
    throw new Error(`la API declinó: ${msg.stop_details?.category || 'sin categoría'}`);
  }

  const texto = msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  const art = extraerJson(texto);

  for (const campo of ['titulo', 'descripcion', 'resumen', 'cuerpo', 'faqs']) {
    if (!art[campo]) throw new Error(`falta el campo "${campo}" en la respuesta`);
  }

  const salida = {
    slug: tema.slug,
    titulo: art.titulo,
    descripcion: art.descripcion,
    resumen: art.resumen,
    keywords: art.keywords || [tema.busqueda],
    cuerpo: art.cuerpo,
    faqs: art.faqs,
    busqueda: tema.busqueda,
    fecha: new Date().toISOString().slice(0, 10),
    modelo: msg.model,
  };

  mkdirSync(BLOG, { recursive: true });
  writeFileSync(join(BLOG, `${tema.slug}.json`), JSON.stringify(salida, null, 2), 'utf8');

  const palabras = art.cuerpo.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  console.log(`  ✓ ${palabras} palabras · ${art.faqs.length} preguntas · blog/${tema.slug}.json`);
  return salida;
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  mkdirSync(BLOG, { recursive: true });
  const existentes = readdirSync(BLOG)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(BLOG, f), 'utf8')));

  const args = process.argv.slice(2);
  const slugPedido = args.find((a) => a.startsWith('--slug='))?.split('=')[1];
  const todos = args.includes('--todos');

  let pendientes = temas.filter((t) => !existsSync(join(BLOG, `${t.slug}.json`)));
  if (slugPedido) pendientes = temas.filter((t) => t.slug === slugPedido);
  else if (!todos) pendientes = pendientes.slice(0, 1);

  if (!pendientes.length) {
    console.log('No hay temas pendientes. Agrega más en blog-temas.json.');
    return;
  }

  const escritos = [...existentes];
  for (const tema of pendientes) {
    try {
      escritos.push(await generar(tema, escritos));
    } catch (e) {
      console.error(`  ✗ ${tema.slug}: ${e.message}`);
      if (!todos) process.exitCode = 1;
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
