# Home Express

Sitio de renta de casas amuebladas en Torreón, Coahuila. Cinco casas propias,
por noche / semana / mes, con factura.

## Cómo funciona

Todo el sitio se genera desde `casas.json`. Precios, fichas, FAQ, schema y
`llms.txt` salen de esa única fuente para que nunca se desincronicen: el precio
de la tarjeta, el del JSON-LD y el del llms.txt son el mismo número.

```
node build.mjs      # genera docs/
```

`docs/` es lo que publica GitHub Pages.

## Precios

En `casas.json` se guarda la **tarifa base** (la del calendario de Airbnb).
El sitio calcula solo:

- **Precio Airbnb** = base ÷ (1 − 0.16). Airbnb cobra 16% al anfitrión desde el
  15 de septiembre de 2026, así que ese es el precio que el huésped verá allá.
- **Precio directo** = precio Airbnb − 10%. El descuento sale de la comisión que
  la plataforma ya no se lleva: el huésped paga menos y el anfitrión recibe más.

Para cambiar el descuento, mover `marca.descuentoDirecto` en `casas.json`.

## Pendientes

- [ ] Confirmar el número de WhatsApp (`marca.whatsapp`)
- [ ] Definir `precioMes` de cada casa (mercado: $23,000–$30,000 para casa de 10)
- [ ] Fotos: las actuales son capturas de video, verticales y con algo de
      movimiento. Sirven, pero una sesión de fotos horizontal cambiaría el sitio.
- [ ] Blog con IA + SEO/GEO
- [ ] Conectar dominio
