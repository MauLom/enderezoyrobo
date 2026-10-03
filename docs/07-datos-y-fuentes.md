# Datos y fuentes

## Fuentes

- **Scryfall API** (https://scryfall.com/docs/api): catálogo, imágenes e IDs por impresión. Usar los *bulk data* diarios en vez de consultar carta por carta. Trae precios USD (TCGplayer) y EUR (Cardmarket).
- **MTGJSON** (https://mtgjson.com): precios diarios de varias fuentes, incluidas Card Kingdom, TCGplayer, Cardmarket y Cardsphere. Se une con Scryfall por `scryfallId`.
- **SCG**: sin API pública. Por ahora cada tienda declara su referencia en su perfil.
- **Tipo de cambio USD/EUR → MXN**: API SIE de Banxico (gratuita, con token), consultada una vez al día.

Verificar los términos de uso y los límites de cada fuente antes de implementar.

## Sincronización diaria

`scripts/sync-catalog.ts`, programado en `.github/workflows/sincronizar-catalogo.yml` a las 10:30 UTC (Scryfall publica su bulk cerca de las 09:00 UTC). También se puede lanzar a mano desde la pestaña Actions.

- **Catálogo:** bulk "Default Cards" de Scryfall en JSONL comprimido (~80 MB), una impresión por línea: cada carta en inglés, o en su idioma impreso si solo existe en uno. Se omiten las cartas solo digitales y las *art series*. En la corrida del 2026-09-28: 106,621 impresiones guardadas y 11,785 omitidas.
- **Precios:** los de Scryfall, TCGplayer (USD) y Cardmarket (EUR) por acabado. Los precios que Scryfall deja de reportar se borran.
- **Card Kingdom:** después del catálogo y del tipo de cambio, el job baja de MTGJSON `AllPricesToday.json.gz` (~5.5 MB) y `csv/cardIdentifiers.csv.gz` (~16 MB), cruza su `uuid` con el `scryfallId` y guarda el precio de venta (retail, no el de compra) por acabado (`src/lib/catalog/mtgjson.ts`). Se omiten las impresiones que no están en el catálogo; las cartas de dos caras traen un uuid por cara con el mismo id de Scryfall y cuentan una vez. Lo que MTGJSON deja de reportar se borra. En la corrida del 2026-10-02: 143,003 precios.
- **Tipo de cambio:** API SIE de Banxico con token gratuito (`BANXICO_TOKEN`), series SF43718 (FIX, USD) y SF46410 (EUR). Todavía no se ha probado con un token real.
- **Tamaño:** medido en la base local el 2026-10-02, la base completa pasó de 120 MB a 134 MB al agregar Card Kingdom. `price_reference` ocupa 75 MB (unas 437 mil filas: TCGplayer, Cardmarket y CK) y `card_printing` 46 MB, de los 500 MB del plan gratuito de Supabase.
- **Conexión:** en GitHub Actions `DATABASE_URL` debe ser la cadena del *Session pooler* de Supabase, porque la conexión directa solo es IPv6 y los runners no tienen IPv6.
- **Límites:** Scryfall pide un `User-Agent` propio y en ASCII (con acentos responde 403). GitHub desactiva los workflows programados después de 60 días sin actividad en el repositorio.

## Formatos de importación

- **Texto estilo Moxfield/Arena** (implementado, `src/lib/import/decklist.ts`): `1 Sol Ring (C21) 263`; set y número opcionales. Si faltan, se busca por nombre y se acepta cualquier impresión.
- **CSV de ManaBox y Moxfield** (`src/lib/import/collection-csv.ts`): las columnas se buscan por nombre. ManaBox: `Name`, `Set code`, `Collector number`, `Foil` (normal/foil/etched), `Quantity` y `Scryfall ID`; si el ID está en el catálogo se pide esa impresión exacta, si no, set y número, y si no, cualquiera. Moxfield: `Count`, `Name`, `Edition`, `Collector Number` y `Foil`. También acepta cualquier CSV con columnas de nombre y cantidad. Condición e idioma no se importan: en una want list son lo mínimo que se pide y se ajustan en cada carta. En "Nueva want list" el archivo se carga en la misma caja y el formato se detecta por el encabezado. Se confirmó a mano con exports reales de ambas aplicaciones el 2026-10-01; los archivos de `src/lib/import/fixtures/` son ejemplos, no esos exports.
- **CSV de inventario de tienda** (parser implementado en `src/lib/import/store-inventory.ts`, sin pantalla todavía): plantilla propia en `public/plantilla-inventario.csv` con columnas `carta,set,numero,condicion,idioma,foil,cantidad,precio` (precio en MXN). Acepta encabezados con acentos y mayúsculas, condiciones en abreviatura o completas ("Lightly Played") y precios con `$` y comas.

## Resolución de want lists contra el catálogo

Implementada en `src/lib/catalog/resolve.ts`; la búsqueda en la base la hace `buscar_impresiones`.

- El nombre se compara sin distinguir mayúsculas, con espacios y apóstrofos normalizados. Las cartas de dos caras se encuentran también por la cara frontal ("Delver of Secrets").
- Con set y número se pide esa impresión exacta. Si no existe, se acepta cualquier impresión y se avisa en la vista previa.
- Si varias cartas se llaman igual (una carta y su ficha), gana la que tiene más impresiones.
- Las líneas repetidas de la misma carta se suman. Las que no se encuentran se muestran como problema y no se guardan.

## Precio de referencia mostrado

En el detalle de una lista, cada carta muestra el precio de TCGplayer y, debajo, el de Card Kingdom (CK), ambos en USD, no foil y convertidos a MXN con el último tipo de cambio de Banxico. Si la carta pide una impresión exacta se usa el de esa impresión; si no, el más bajo entre todas sus impresiones (`resumen_cartas`). Sin tipo de cambio cargado se muestran en dólares. Cardmarket se calcula en la misma consulta pero todavía no se muestra.

## Modelo de datos

El esquema implementado está en `supabase/migrations/` y manda sobre este resumen. `20260929000000_consultas_want_lists.sql` agrega las funciones que usan las pantallas de listas (`buscar_impresiones`, `resumen_cartas`, `inventario_para`); son *security invoker*, así que respetan RLS.

- `card_printing`: id de Scryfall, oracle id, nombre, set, número, imagen, rareza.
- `price_reference`: printing, fuente (ck, tcgplayer, cardmarket), moneda, valor, acabado (nonfoil, foil, etched), fecha. Solo el último valor, sin historial.
- `profile`: usuario, nombre visible, tipo (jugador, vendedor, tienda), plan, verificado, zona de entrega (`delivery_zone`, municipio del área metropolitana, pública). El usuario cambia entre jugador y vendedor desde `/cuenta`; `store` solo al registrar una tienda (RLS). Las calificaciones van en la tabla `rating`.
- `contact`: WhatsApp privado de jugadores y vendedores; solo lo lee su dueño, y la otra parte de una oferta aceptada con `whatsapp_de_oferta` (ver 06).
- `store`: perfil, nombre, dirección, WhatsApp (público), referencia de precio declarada, `verified_at`, `inventory_updated_at`. El usuario la registra desde `/cuenta` (política "crear mi tienda", siempre sin verificar) y el trigger `al_registrar_tienda` pone su perfil como `store`. Estado: verificada si tiene `verified_at`, rechazada si tiene `store_rejection`, si no, pendiente.
- `store_rejection`: rechazo vigente de una tienda (motivo, quién y cuándo). Va aparte porque `store` es pública; el motivo solo lo leen la tienda y el staff. Si la tienda edita nombre, dirección, WhatsApp o referencia, el trigger `al_editar_tienda` lo borra y vuelve a pendiente.
- `staff`: owners y moderadores (`owner`, `moderator`). Sin política de escritura: se dan de alta con `npm run staff` para que ningún correo quede en el repositorio. `es_staff()` lo consulta; `verificar_tienda`, `rechazar_tienda`, `quitar_verificacion` y `tiendas_para_revisar` (con el correo de la cuenta) fallan si quien llama no es staff. Verificar y quitar la verificación pasan por `fijar_verificacion`, que mantiene `profile.verified` igual que `store.verified_at` y solo puede llamarla la conexión directa (`npm run tienda:verificar`, ver 09).
- `inventory_item`: vendedor, printing, condición, idioma, foil, cantidad, precio MXN.
- `want_list` / `want_list_item`: dueño, pública sí/no; oracle id o printing específico, cantidad, condición mínima, foil sí/no/indistinto.
- `offer`: want list, vendedor, precio total del lote, cartas incluidas, estado.
- `rating`: de quién, a quién, oferta relacionada, puntuación, comentario.

## Marketplace

La página pública de cada tienda (`/tiendas/<id>`, con el id de su perfil) usa la misma conversión (`toMarketOffer`) solo con su inventario (`getPublicStore` en `src/supabase/stores.ts`).

`/dashboard` muestra el inventario agrupado por carta (`src/lib/marketplace/listings.ts`). `src/supabase/marketplace.ts` trae las 200 ofertas más recientes con existencias, más todas las de las cartas que el usuario tiene en sus want lists, con los datos del vendedor y de su tienda. `/listas` usa la misma consulta solo con las cartas buscadas. El conteo de ofertas ahí y en el panel "Tu wishlist" aplica las mismas reglas que el matching de `/listas/<id>` (`matchesWant`).

## Reglas de matching

- Un item de want list sin impresión específica coincide con cualquier printing del mismo oracle id.
- Condición: el inventario cumple si es igual o mejor que la mínima pedida (NM > LP > MP > HP > DMG).
- Foil e idioma solo filtran si el comprador los especificó.
