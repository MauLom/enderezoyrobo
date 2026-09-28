# Modelo de negocio

## Costos

Con capas gratuitas, el MVP cuesta unos $20–40 MXN al mes. El primer salto real es a ~$500 MXN al mes cuando crece la base de datos.

| Concepto | Opción | Fase MVP (MXN/mes) | Al crecer (MXN/mes) |
| --- | --- | --- | --- |
| Dominio | .com o .mx | ~$25 (anual prorrateado) | ~$25 |
| Frontend + API | Vercel o Cloudflare Pages (gratis) | $0 | $0–380 |
| Base de datos + auth | Supabase (gratis) | $0 | ~$460 (Pro, 25 USD) |
| Catálogo y precios | Scryfall API + MTGJSON | $0 | $0 |
| Correo transaccional | Resend (gratis) | $0 | $0–380 |
| **Total** | | **~$25** | **~$500–900** |

Cifras aproximadas, sin verificar contra los precios actuales de cada servicio; tipo de cambio ~18.5 MXN/USD.

Reglas para mantener el costo en cero:

- Guardar solo los campos del catálogo que se usan. Las imágenes se sirven desde Scryfall, no se almacenan.
- Actualizar precios una vez al día con un job programado, no por consulta.
- No usar servicios con cobro por uso sin tope hasta que haya ingresos.

## Planes

Los compradores usan todo gratis. Los vendedores pagan por herramientas y visibilidad, nunca por la insignia de confianza (esa se gana con verificación de identidad y calificaciones).

| Plan | Precio (MXN) | Para quién | Incluye |
| --- | --- | --- | --- |
| Comprador | Gratis | Jugadores | Want lists ilimitadas, importación desde Moxfield/ManaBox, matching, precios en MXN |
| Vendedor básico | Gratis | Jugadores que venden su bulk | Verificación, hasta 100 cartas en inventario, 5 ofertas al mes sobre listas públicas |
| Vendedor Pro | $149/mes o $1,490/año | Vendedores frecuentes | Inventario ilimitado, alertas de listas que su inventario cubre, ofertas ilimitadas, prioridad en el matching |
| Tienda | $399/mes o $3,990/año | Tiendas físicas | Todo lo de Pro, página de tienda, varios usuarios, calendario de torneos, exportación de inventario, datos de demanda local |

Ingresos complementarios, solo cuando haya tráfico:

- Publicaciones destacadas: $29 MXN por lote o subasta, 7 días.
- Anuncios nativos de tiendas y eventos locales a precio fijo. Sin redes de anuncios (AdSense y similares dejan ~$50–180 USD/mes a esta escala y afean el producto).

**Oferta de lanzamiento (pendiente de confirmar):** las primeras 5 tiendas usan el plan Tienda gratis 3 meses y después pagan $199 MXN/mes de por vida.

## Proyección y punto de equilibrio

Punto de equilibrio: ~$500 MXN/mes = 3 vendedores Pro, o 1 tienda + 1 Pro. El riesgo real no es el costo, sino que las tiendas no mantengan su inventario actualizado.

| Escenario | Momento | Tiendas de pago | Vendedores Pro | Ingreso (MXN/mes) | Costo (MXN/mes) | Neto (MXN/mes) |
| --- | --- | --- | --- | --- | --- | --- |
| Pesimista | Mes 4 | 2 fundadoras ($199) | 0 | $398 | ~$25 | +$373 |
| Base | Mes 4 | 4 fundadoras ($199) | 5 | $1,541 | ~$500 | +$1,041 |
| Optimista | Mes 12 | 5 fundadoras + 5 nuevas ($399) | 20 | $5,970 | ~$900 | +$5,070 |

Es un proyecto que se paga solo, no un ingreso; ese es el objetivo de esta fase.
