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

## Stack (propuesta, no decidido)

- Next.js (App Router) + TypeScript, igual que otros proyectos del autor.
- Supabase: Postgres + auth + storage en el plan gratuito.
- Hosting en Vercel o Cloudflare Pages (plan gratuito).
- Job diario (cron de Vercel o GitHub Actions) para sincronizar catálogo y precios.
