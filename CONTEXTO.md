# Home Express — contexto para responder clientes

> Documento generado desde los datos reales del negocio. Última actualización: 27 de agosto de 2026.
> Si cambian precios o casas: `node scripts/generar-contexto.mjs`

## Qué es el negocio

Home Express renta 5 casas **propias** amuebladas en Torreón, Coahuila.
No es portal ni intermediario: son casas del mismo dueño, que también las publica
en Airbnb con 84 reseñas y 4.9 de calificación.
Reservando directo sale más barato porque no se paga la comisión de plataforma.

**Sitio:** https://ofertaslaguna84-bit.github.io/home-express
**WhatsApp:** 870 148 4216

---

## Comparación rápida

| Casa | Personas | Recámaras | Camas | Baños | Por noche | Mes sin serv. | Mes con serv. |
|---|---|---|---|---|---|---|---|
| **Lomas** | 11 | 3 | 9 | 2 | $1,780 | $32,000 | $35,000 |
| **Almendros** | 12 | 3 | 8 | 2.5 | $1,710 | $33,000 | $36,000 |
| **Acacias** | 9 | 3 | 6 | 2 | $1,670 | $30,000 | $33,000 |
| **Sahuaro** | 9 | 3 | 5 | 2 | $1,400 | $29,000 | $32,000 |
| **Cantera** | 10 | 3 | 5 | 2 | $1,340 | $27,000 | $30,000 |

**Cómo elegir rápido:**
- **Grupo grande con cada quien su cama** → Lomas (mejor proporción camas/persona)
- **Más personas** → Almendros (12 personas)
- **Más económica** → Cantera
- **Quien no puede subir escaleras** → Almendros (recámara en planta baja)
- **Convivencia / fin de semana** → Cantera (palapa, asador, barra) o Lomas (alberca, asador)
- **Viaje de trabajo al centro** → Acacias (céntrica)

---

## Cada casa a detalle

### Lomas — Casa Lomas

- **Capacidad:** 11 personas · 3 recámaras · 9 camas · 2 baños
- **Precio por noche:** $1,780 entre semana · $1,980 fin de semana
- **En Airbnb cuesta:** $1,980 — o sea que directo se ahorra $200 por noche
- **Por mes:** $32,000 sin servicios · $35,000 con servicios (agua, luz, gas, internet)
- **Destaca por:** Alberca, Asador, Clima en toda la casa, 9 camas
- **Ficha:** https://ofertaslaguna84-bit.github.io/home-express/casas/lomas/

La más equipada para grupos: 9 camas repartidas en 3 recámaras, alberca y asador en el patio. Es la que mejor funciona cuando llega una cuadrilla completa y cada quien necesita su cama.

### Almendros — Casa Almendros

- **Capacidad:** 12 personas · 3 recámaras · 8 camas · 2.5 baños
- **Precio por noche:** $1,710 entre semana · $2,030 fin de semana
- **En Airbnb cuesta:** $1,900 — o sea que directo se ahorra $190 por noche
- **Por mes:** $33,000 sin servicios · $36,000 con servicios (agua, luz, gas, internet)
- **Destaca por:** 12 personas, Recámara en planta baja, 2 baños y medio, Alberca
- **Ficha:** https://ofertaslaguna84-bit.github.io/home-express/casas/almendros/

La de mayor capacidad y la única con recámara en planta baja, sin escaleras. Dos baños y medio, que con grupo grande se agradece por la mañana.

### Acacias — Casa Acacias

- **Capacidad:** 9 personas · 3 recámaras · 6 camas · 2 baños
- **Precio por noche:** $1,670 entre semana · $1,760 fin de semana
- **En Airbnb cuesta:** $1,850 — o sea que directo se ahorra $180 por noche
- **Por mes:** $30,000 sin servicios · $33,000 con servicios (agua, luz, gas, internet)
- **Destaca por:** Ubicación céntrica, Zona privada, Clima, 3 recámaras
- **Ficha:** https://ofertaslaguna84-bit.github.io/home-express/casas/acacia/

La mejor ubicada. Zona privada y céntrica, cerca de todo. La que más piden quienes vienen por trabajo a oficinas del centro y quieren moverse rápido.

### Cantera — Casa Cantera

- **Capacidad:** 10 personas · 3 recámaras · 5 camas · 2 baños
- **Precio por noche:** $1,340 entre semana · $1,500 fin de semana
- **En Airbnb cuesta:** $1,490 — o sea que directo se ahorra $150 por noche
- **Por mes:** $27,000 sin servicios · $30,000 con servicios (agua, luz, gas, internet)
- **Destaca por:** Palapa, Asador, Barra, Clima en toda la casa
- **Ficha:** https://ofertaslaguna84-bit.github.io/home-express/casas/cantera/

Palapa, asador y barra en el patio. Es la más económica de las cinco y la que mejor funciona para convivencias y fines de semana en familia.

### Sahuaro — Casa Sahuaro

- **Capacidad:** 9 personas · 3 recámaras · 5 camas · 2 baños
- **Precio por noche:** $1,400 entre semana · $1,770 fin de semana
- **En Airbnb cuesta:** $1,550 — o sea que directo se ahorra $150 por noche
- **Por mes:** $29,000 sin servicios · $32,000 con servicios (agua, luz, gas, internet)
- **Destaca por:** Fraccionamiento privado, Clima, Barra, 3 recámaras
- **Ficha:** https://ofertaslaguna84-bit.github.io/home-express/casas/sahuaro/

Dentro de fraccionamiento privado con acceso controlado. Tranquila y segura, buena opción para estancias largas de personal que se queda semanas.

---

## Reglas del negocio

- **Estancia mínima:** 2 noches. Máxima: no hay (las hay de hasta 6 meses).
- **Precios:** los publicados son **por noche, finales, con IVA incluido**.
- **Semana y mes:** hay mejor tarifa pero **no se publica** — se cotiza y es **negociable**.
  Referencias internas: semana 10% menos, mes 20% menos sobre la noche;
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
> Porque en Airbnb hay una comisión de plataforma. Al reservar directo esa comisión no existe y ese ahorro te lo paso a ti. Es la misma casa, el mismo anfitrión y las mismas llaves — de hecho ahí tengo 84 reseñas con 4.9.

**Piden la dirección antes de apartar:**
> Te paso la ubicación exacta en cuanto quede apartada. Por seguridad de los huéspedes no la publicamos. Está en la colonia [colonia], en [Torreón]. ¿Te late si te mando fotos y el video del recorrido mientras tanto?

---

## El sitio web

**https://ofertaslaguna84-bit.github.io/home-express** — publicado en GitHub Pages desde el repo `ofertaslaguna84-bit/home-express`.

Es un sitio estático generado por `build.mjs` desde `casas.json`. Todo sale de esa
única fuente: el precio de la tarjeta, el de los datos estructurados y el del
`llms.txt` son el mismo número, así que no se pueden desincronizar.

```
node build.mjs      genera docs/ (lo que publica GitHub Pages)
```

**Páginas:** portada, una ficha por casa, blog y 8 artículos.

**Cómo se calculan los precios:** en `casas.json` se guarda la tarifa base (la del
calendario de Airbnb). El sitio calcula solo:
- Precio Airbnb = base ÷ (1 − 16%), porque Airbnb cobra esa comisión al anfitrión desde el 15 de septiembre de 2026.
- Precio directo = precio Airbnb − 10%. El descuento sale de la comisión que la plataforma ya no se lleva: el huésped paga menos y el dueño recibe más.

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
`Casa {N}px Facturamos | {ventaja} | {ventaja}`. El motivo: de 18 competidores en
Torreón **solo uno** menciona que factura, y el límite de Airbnb es ~50 caracteres
con corte en ~32 en celular, así que "Facturamos" va al frente para que se alcance
a ver. También se corrigió que una casa anunciaba 10 personas cuando admite 12.

**Pendiente con fecha:** el **15 de septiembre de 2026** Airbnb cambia a tarifa
única y le cobra el 16% completo al anfitrión. Si no suben los precios
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
      Al comprarlo: `SITIO=https://homeexpress.mx node build.mjs`
- [ ] **Secret `DEEPSEEK_API_KEY`** en el repo para que el blog corra solo.
- [ ] **Ajustar precios de Airbnb** antes del 15 de septiembre de 2026.
- [ ] **Fotos**: las actuales son capturas de un video, verticales y con algo de
      movimiento. Una sesión horizontal con luz de mañana cambiaría el sitio de nivel.
