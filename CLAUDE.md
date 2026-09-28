# MazoTCG

Marketplace "soft social" de cartas TCG para Monterrey (MX). Empieza solo con Magic: The Gathering. Nombre provisional.

Lee `docs/` antes de proponer cambios de alcance. Resumen de lo que no se negocia:

- **Costo casi cero.** El fundador absorbe como máximo 3 meses de costo. Si después de eso los servidores siguen saliendo de su bolsillo, el proyecto se cierra. Prefiere capas gratuitas (Vercel/Cloudflare, Supabase, Resend) y evita servicios con cobro por uso sin tope.
- **El dinero no pasa por la plataforma.** Nada de pagos, escrow ni envíos en el MVP. Los tratos se cierran por WhatsApp o en tienda.
- **Compradores siempre gratis.** Los ingresos vienen de planes para vendedores y tiendas (herramientas y visibilidad, nunca la insignia de confianza).
- **Alcance del MVP:** want lists, inventario de tiendas por CSV, matching, precios de referencia en MXN y ofertas sobre listas públicas. Subastas, pagos, feed social y otros TCGs quedan fuera (ver `docs/03-mvp.md`).
- **Identidad de cartas:** usar los IDs de Scryfall como llave de cada impresión desde el día uno.

## Convenciones

- UI, documentación y mensajes de commit en español.
- Precios mostrados en MXN; guardar también el valor original y su moneda.
- Stack: Next.js + TypeScript en Cloudflare Workers (OpenNext) y Supabase. Detalle y razones en `docs/06-decisiones-abiertas.md`.
- La lógica de dominio (parsers, matching) vive en `src/lib/` como TypeScript puro con pruebas en vitest; no debe depender de Next ni de Supabase.
- Los jobs (sincronización de catálogo) viven en `scripts/`, corren con `tsx` y solo hacen E/S; la conversión de datos va en `src/lib/`.
- Montos en MXN como enteros en centavos (`*_mxn_cents`).
- Antes de dar algo por terminado: `npm test`, `npm run lint` y `npm run typecheck`.

@AGENTS.md
