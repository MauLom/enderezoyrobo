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
- **Precios:** los de Scryfall, TCGplayer (USD) y Cardmarket (EUR) por acabado. Los precios que Scryfall deja de reportar se borran. Card Kingdom desde MTGJSON queda pendiente: requiere cruzar los IDs de MTGJSON con los de Scryfall.
- **Tipo de cambio:** API SIE de Banxico con token gratuito (`BANXICO_TOKEN`), series SF43718 (FIX, USD) y SF46410 (EUR). Todavía no se ha probado con un token real.
- **Tamaño:** catálogo y precios ocupan ~85 MB de los 500 MB del plan gratuito de Supabase.
- **Conexión:** en GitHub Actions `DATABASE_URL` debe ser la cadena del *Session pooler* de Supabase, porque la conexión directa solo es IPv6 y los runners no tienen IPv6.
- **Límites:** Scryfall pide un `User-Agent` propio y en ASCII (con acentos responde 403). GitHub desactiva los workflows programados después de 60 días sin actividad en el repositorio.

## Formatos de importación

- **Texto estilo Moxfield/Arena:** `1 Sol Ring (C21) 263`; set y número opcionales. Si faltan, se busca por nombre y se acepta cualquier impresión.
- **CSV de ManaBox y Moxfield:** confirmar las columnas exactas con un export real antes de escribir el parser.
- **CSV de inventario de tienda:** plantilla propia (carta, set, número, condición, idioma, foil, cantidad, precio MXN).

## Modelo de datos

El esquema implementado está en `supabase/migrations/20260928000000_esquema_inicial.sql` y manda sobre este resumen.

- `card_printing`: id de Scryfall, oracle id, nombre, set, número, imagen, rareza.
- `price_reference`: printing, fuente (ck, tcgplayer, cardmarket), moneda, valor, acabado (nonfoil, foil, etched), fecha. Solo el último valor, sin historial.
- `profile`: usuario, tipo (jugador, vendedor, tienda), plan, verificado. Las calificaciones van en la tabla `rating`.
- `store`: perfil, dirección, WhatsApp, referencia de precio declarada, `inventory_updated_at`.
- `inventory_item`: vendedor, printing, condición, idioma, foil, cantidad, precio MXN.
- `want_list` / `want_list_item`: dueño, pública sí/no; oracle id o printing específico, cantidad, condición mínima, foil sí/no/indistinto.
- `offer`: want list, vendedor, precio total del lote, cartas incluidas, estado.
- `rating`: de quién, a quién, oferta relacionada, puntuación, comentario.

## Reglas de matching

- Un item de want list sin impresión específica coincide con cualquier printing del mismo oracle id.
- Condición: el inventario cumple si es igual o mejor que la mínima pedida (NM > LP > MP > HP > DMG).
- Foil e idioma solo filtran si el comprador los especificó.
