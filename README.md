# MazoTCG (nombre provisional)

Plataforma para comprar y vender cartas de TCG en Monterrey. Subes tu want list una vez y ves qué tiendas o vendedores tienen qué cartas, con precios de referencia (CK, TCGplayer, Cardmarket) lado a lado en MXN.

> El nombre "Mazo" es provisional: `mazo.mx` parece estar ocupado. Ver [decisiones abiertas](docs/06-decisiones-abiertas.md).

## Estado

Fase 1 (construir); plan de trabajo en [04](docs/04-plan-y-criterios.md#plan-de-trabajo) y en los [issues](https://github.com/MauLom/enderezoyrobo/issues) por [milestone](https://github.com/MauLom/enderezoyrobo/milestones). Hay andamiaje, esquema de base de datos, núcleo del dominio (parsers de listas e inventario, y matching) con pruebas, la sincronización diaria del catálogo y precios de Scryfall y Card Kingdom, el login con código por correo, una cuenta básica (nombre visible y salir) y el flujo del comprador: crear want lists pegando texto, ver qué tiendas las tienen con la mejor combinación y pedir por WhatsApp. Las ofertas sobre listas públicas tienen su lógica y su tabla, pero no pantalla. Falta completar la cuenta (WhatsApp, zona, tipo de cuenta), el flujo de la tienda (registro, verificación y subir inventario por CSV), el despliegue a producción y mostrar los precios de Cardmarket. Todas las pantallas comparten la identidad visual del diseño de Figma ([06](docs/06-decisiones-abiertas.md#identidad-visual-decidido-el-2026-09-30)). En `/dashboard` hay un marketplace con el diseño de Figma: inventario por carta, la wishlist del usuario y contacto por WhatsApp (ver [03](docs/03-mvp.md#marketplace-dashboard)). Detalle por punto en [03 - MVP](docs/03-mvp.md#estado-2026-09-30).

## Desarrollo

Requiere Node 24 y Docker o Podman para Supabase local.

```bash
npm install
cp .env.example .env.local
npm run db:start       # Supabase local y aplica las migraciones (Studio en http://127.0.0.1:54323)
npm run sync:catalogo  # carga catálogo, precios de Scryfall y de Card Kingdom (~25 s, ~120 MB)
npm run seed           # tiendas, jugadores, listas y ofertas de prueba (ver docs/08)
npm run dev            # servidor de desarrollo de Next.js
                       # los correos de login llegan a Mailpit: http://127.0.0.1:54324
npm test               # pruebas (vitest)
npm run lint
npm run typecheck
npm run preview        # build para Cloudflare y vista previa local con wrangler
npm run db:reset       # borra la base local y vuelve a aplicar las migraciones
npm run db:push        # aplica migraciones a la base de .env.development.local (la nube)
npm run db:types       # regenera src/supabase/database.types.ts tras cambiar el esquema
npm run db:stop
```

Los cambios en `supabase/config.toml` (por ejemplo, las plantillas de correo) se aplican al reiniciar con `npm run db:stop` y `npm run db:start`.

Para probar contra Supabase en la nube, ver [08 - Validación](docs/08-validacion.md).

Con Podman, exporta antes `DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock` (con `systemctl --user enable --now podman.socket`).

| Ruta | Contenido |
| --- | --- |
| `src/app/(app)/` | Páginas con barra superior y menú lateral: `/dashboard` (marketplace), `/listas`, `/listas/nueva`, `/listas/[id]` y `/cuenta` |
| `src/app/(publico)/` | Landing y `/entrar` |
| `src/app/_components/` | Shell, encabezado de página, íconos y modal de ofertas |
| `src/app/globals.css`, `plataforma.css`, `ui.ts` | Identidad visual: tokens de color, estilos del shell y clases compartidas |
| `src/app/auth/confirmar/` | Recibe el enlace del correo de acceso |
| `src/supabase/` | Clientes de Supabase, sesión (`getCurrentProfile`, `requireProfile`) y tipos generados |
| `src/proxy.ts` | Refresca la sesión y protege rutas |
| `src/lib/import/` | Parsers de listas en texto (Moxfield/Arena) y del CSV de inventario de tiendas |
| `src/lib/matching/` | Matching de want lists contra inventario y mejores combinaciones de tiendas |
| `src/lib/cards/` | Condiciones de carta |
| `src/lib/account/` | Validación de correo, código, nombre visible y ruta de regreso tras entrar |
| `src/lib/pricing/` | Conversión y formato de precios en MXN |
| `src/lib/contact/` | Enlaces y mensajes de WhatsApp |
| `src/lib/marketplace/` | Agrupación del inventario por carta y resumen de la wishlist |
| `src/lib/offers/` | Reglas de las ofertas por el lote de una lista pública |
| `src/lib/catalog/` | Conversión del bulk de Scryfall y de Banxico, y resolución de listas contra el catálogo |
| `scripts/` | Jobs que corren fuera de Next con `tsx`: sincronización del catálogo y datos de prueba |
| `.github/workflows/` | Sincronización diaria en GitHub Actions |
| `supabase/migrations/` | Esquema de Postgres con políticas RLS |
| `supabase/templates/` | Plantillas de correo de auth (código de acceso) |

## Documentación

| Doc | Contenido |
| --- | --- |
| [01 - Visión y problema](docs/01-vision-y-problema.md) | Problema, propuesta y restricciones |
| [02 - Modelo de negocio](docs/02-modelo-de-negocio.md) | Costos, planes, precios y punto de equilibrio |
| [03 - MVP](docs/03-mvp.md) | Alcance funcional, estado de cada punto, marketplace de `/dashboard` y qué queda fuera |
| [04 - Plan y criterios](docs/04-plan-y-criterios.md) | Plan de 3 meses, avance, plan de trabajo (issues por fase) y criterios de go/no-go |
| [05 - Riesgos](docs/05-riesgos.md) | Riesgos y mitigaciones |
| [06 - Decisiones abiertas](docs/06-decisiones-abiertas.md) | Nombre, stack, autenticación, identidad visual, oferta de lanzamiento, pendientes |
| [07 - Datos y fuentes](docs/07-datos-y-fuentes.md) | Scryfall, MTGJSON, sincronización, formatos de importación, marketplace, modelo de datos |
| [08 - Validación](docs/08-validacion.md) | Datos de prueba, casos que cubren y cómo probar contra Supabase en la nube |

Documento vivo original (con diagrama del plan): https://claude.ai/code/artifact/8c6fb82b-abaa-4fdd-96ce-bc890b71677d
