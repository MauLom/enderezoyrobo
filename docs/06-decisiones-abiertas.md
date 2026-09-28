# Decisiones abiertas

## Nombre

"Mazo" es el favorito, pero `mazo.mx` parece ocupado. "MazoTCG" es solo el nombre de trabajo de esta carpeta.

Otros candidatos (disponibilidad revisada con `whois` el 2026-09-28, sin confirmar con un registrador):

| Nombre | Idea | Dominio que parecía libre |
| --- | --- | --- |
| Cartapacio | Palabra vieja para carpeta/portafolio (la *binder*); sirve para cualquier TCG | `cartapacio.mx` |
| Carta Regia | Juego de palabras con *regio* (Monterrey); amarra la marca a la ciudad | `cartaregia.mx` |
| La Carpeta | "¿Qué traes en la carpeta?" | `lacarpeta.gg`, `carpetatcg.com` |
| Sobre | El booster, común a todos los TCGs | `sobre.gg` |
| Cartero | "Carta" + quien te trae las ofertas | `cartero.gg`, `carteromx.com` |
| Mazo | Término universal | `mazo.gg` |

`enderezoyrobo.com` estaba libre: buena opción para blog o comunidad de Magic, no para la plataforma (no sirve para otros TCGs). Nota: `.mx` cuesta ~$20–30 USD/año y `.gg` ~$60–80 USD/año (aproximado).

## Oferta de lanzamiento para tiendas

- Opción A: plan Tienda gratis 3 meses, luego $199 MXN/mes de por vida.
- Opción B: cobrar desde el mes 1 con descuento.

## Stack (decidido el 2026-09-28)

- Next.js (App Router) + TypeScript.
- Supabase: Postgres + auth + storage en el plan gratuito. Migraciones en `supabase/migrations/`.
- Hosting en Cloudflare Workers vía OpenNext (`@opennextjs/cloudflare`). Se descartó Vercel porque su plan Hobby no permite uso comercial y en diciembre empezamos a cobrar.
- Sin R2 ni Cloudflare Images: R2 pide tarjeta registrada y las imágenes de cartas se sirven desde Scryfall.
- Sincronización diaria de catálogo y precios en GitHub Actions: los bulk de Scryfall y MTGJSON son demasiado grandes para una función serverless.
- Solo se guarda el último precio por carta, fuente y acabado (sin historial), para no pasar de los 500 MB del plan gratuito de Supabase.
