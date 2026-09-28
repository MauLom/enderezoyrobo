# MazoTCG (nombre provisional)

Plataforma para comprar y vender cartas de TCG en Monterrey. Subes tu want list una vez y ves qué tiendas o vendedores tienen qué cartas, con precios de referencia (CK, TCGplayer, Cardmarket) lado a lado en MXN.

> El nombre "Mazo" es provisional: `mazo.mx` parece estar ocupado. Ver [decisiones abiertas](docs/06-decisiones-abiertas.md).

## Estado

Fase 1 (construir). Hay andamiaje, esquema de base de datos, núcleo del dominio (parsers de listas e inventario, y matching) con pruebas, y la sincronización diaria del catálogo y precios de Scryfall. Todavía no hay pantallas: la app solo muestra el landing.

## Desarrollo

Requiere Node 24 y Docker o Podman para Supabase local.

```bash
npm install
cp .env.example .env.local
npm run db:start       # Supabase local y aplica las migraciones (Studio en http://127.0.0.1:54323)
npm run sync:catalogo  # carga catálogo y precios de Scryfall (~7 s, ~85 MB)
npm run dev            # servidor de desarrollo de Next.js
npm test               # pruebas (vitest)
npm run lint
npm run typecheck
npm run preview        # build para Cloudflare y vista previa local con wrangler
npm run db:reset       # borra la base local y vuelve a aplicar las migraciones
npm run db:stop
```

Con Podman, exporta antes `DOCKER_HOST=unix:///run/user/$UID/podman/podman.sock` (con `systemctl --user enable --now podman.socket`).

| Ruta | Contenido |
| --- | --- |
| `src/lib/import/` | Parsers de listas en texto (Moxfield/Arena) y del CSV de inventario de tiendas |
| `src/lib/matching/` | Matching de want lists contra inventario y mejores combinaciones de tiendas |
| `src/lib/cards/` | Condiciones de carta |
| `src/lib/catalog/` | Conversión del bulk de Scryfall y del tipo de cambio de Banxico a filas de la base |
| `scripts/` | Jobs que corren fuera de Next con `tsx` (sincronización del catálogo) |
| `.github/workflows/` | Sincronización diaria en GitHub Actions |
| `supabase/migrations/` | Esquema de Postgres con políticas RLS |

## Documentación

| Doc | Contenido |
| --- | --- |
| [01 - Visión y problema](docs/01-vision-y-problema.md) | Problema, propuesta y restricciones |
| [02 - Modelo de negocio](docs/02-modelo-de-negocio.md) | Costos, planes, precios y punto de equilibrio |
| [03 - MVP](docs/03-mvp.md) | Alcance funcional y qué queda fuera |
| [04 - Plan y criterios](docs/04-plan-y-criterios.md) | Plan de 3 meses y criterios de go/no-go |
| [05 - Riesgos](docs/05-riesgos.md) | Riesgos y mitigaciones |
| [06 - Decisiones abiertas](docs/06-decisiones-abiertas.md) | Nombre, stack, oferta de lanzamiento |
| [07 - Datos y fuentes](docs/07-datos-y-fuentes.md) | Scryfall, MTGJSON, sincronización, formatos de importación, modelo de datos |

Documento vivo original (con diagrama del plan): https://claude.ai/code/artifact/8c6fb82b-abaa-4fdd-96ce-bc890b71677d
