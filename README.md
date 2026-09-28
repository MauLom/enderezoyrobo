# MazoTCG (nombre provisional)

Plataforma para comprar y vender cartas de TCG en Monterrey. Subes tu want list una vez y ves qué tiendas o vendedores tienen qué cartas, con precios de referencia (CK, TCGplayer, Cardmarket) lado a lado en MXN.

> El nombre "Mazo" es provisional: `mazo.mx` parece estar ocupado. Ver [decisiones abiertas](docs/06-decisiones-abiertas.md).

## Estado

Fase 1 (construir). Hay andamiaje, esquema de base de datos, núcleo del dominio (parsers de listas e inventario, y matching) con pruebas, la sincronización diaria del catálogo y precios de Scryfall, y el login con código por correo (`/entrar`, `/cuenta`). Faltan las pantallas de want lists e inventario.

## Desarrollo

Requiere Node 24 y Docker o Podman para Supabase local.

```bash
npm install
cp .env.example .env.local
npm run db:start       # Supabase local y aplica las migraciones (Studio en http://127.0.0.1:54323)
npm run sync:catalogo  # carga catálogo y precios de Scryfall (~7 s, ~85 MB)
npm run dev            # servidor de desarrollo de Next.js
                       # los correos de login llegan a Mailpit: http://127.0.0.1:54324
npm test               # pruebas (vitest)
npm run lint
npm run typecheck
npm run preview        # build para Cloudflare y vista previa local con wrangler
npm run db:reset       # borra la base local y vuelve a aplicar las migraciones
npm run db:types       # regenera src/supabase/database.types.ts tras cambiar el esquema
npm run db:stop
```

Los cambios en `supabase/config.toml` (por ejemplo, las plantillas de correo) se aplican al reiniciar con `npm run db:stop` y `npm run db:start`.

Con Podman, exporta antes `DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock` (con `systemctl --user enable --now podman.socket`).

| Ruta | Contenido |
| --- | --- |
| `src/app/` | Páginas: landing, `/entrar` (login) y `/cuenta` |
| `src/supabase/` | Clientes de Supabase, sesión (`getCurrentProfile`, `requireProfile`) y tipos generados |
| `src/proxy.ts` | Refresca la sesión y protege rutas |
| `src/lib/import/` | Parsers de listas en texto (Moxfield/Arena) y del CSV de inventario de tiendas |
| `src/lib/matching/` | Matching de want lists contra inventario y mejores combinaciones de tiendas |
| `src/lib/cards/` | Condiciones de carta |
| `src/lib/account/` | Validación de correo, código y nombre visible |
| `src/lib/catalog/` | Conversión del bulk de Scryfall y del tipo de cambio de Banxico a filas de la base |
| `scripts/` | Jobs que corren fuera de Next con `tsx` (sincronización del catálogo) |
| `.github/workflows/` | Sincronización diaria en GitHub Actions |
| `supabase/migrations/` | Esquema de Postgres con políticas RLS |
| `supabase/templates/` | Plantillas de correo de auth (código de acceso) |

## Documentación

| Doc | Contenido |
| --- | --- |
| [01 - Visión y problema](docs/01-vision-y-problema.md) | Problema, propuesta y restricciones |
| [02 - Modelo de negocio](docs/02-modelo-de-negocio.md) | Costos, planes, precios y punto de equilibrio |
| [03 - MVP](docs/03-mvp.md) | Alcance funcional y qué queda fuera |
| [04 - Plan y criterios](docs/04-plan-y-criterios.md) | Plan de 3 meses y criterios de go/no-go |
| [05 - Riesgos](docs/05-riesgos.md) | Riesgos y mitigaciones |
| [06 - Decisiones abiertas](docs/06-decisiones-abiertas.md) | Nombre, stack, autenticación, oferta de lanzamiento, pendientes |
| [07 - Datos y fuentes](docs/07-datos-y-fuentes.md) | Scryfall, MTGJSON, sincronización, formatos de importación, modelo de datos |

Documento vivo original (con diagrama del plan): https://claude.ai/code/artifact/8c6fb82b-abaa-4fdd-96ce-bc890b71677d
