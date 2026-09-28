# Datos y fuentes

## Fuentes

- **Scryfall API** (https://scryfall.com/docs/api): catálogo, imágenes e IDs por impresión. Usar los *bulk data* diarios en vez de consultar carta por carta. Trae precios USD (TCGplayer) y EUR (Cardmarket).
- **MTGJSON** (https://mtgjson.com): precios diarios de varias fuentes, incluidas Card Kingdom, TCGplayer, Cardmarket y Cardsphere. Se une con Scryfall por `scryfallId`.
- **SCG**: sin API pública. Por ahora cada tienda declara su referencia en su perfil.
- **Tipo de cambio USD/EUR → MXN**: una fuente gratuita (por ejemplo, Banxico) consultada una vez al día.

Verificar los términos de uso y los límites de cada fuente antes de implementar.

## Formatos de importación

- **Texto estilo Moxfield/Arena:** `1 Sol Ring (C21) 263`; set y número opcionales. Si faltan, se busca por nombre y se acepta cualquier impresión.
- **CSV de ManaBox y Moxfield:** confirmar las columnas exactas con un export real antes de escribir el parser.
- **CSV de inventario de tienda:** plantilla propia (carta, set, número, condición, idioma, foil, cantidad, precio MXN).

## Modelo de datos inicial (borrador)

- `card_printing`: id de Scryfall, oracle id, nombre, set, número, imagen, rareza.
- `price_reference`: printing, fuente (ck, tcgplayer, cardmarket), moneda, valor, foil, fecha.
- `profile`: usuario, tipo (jugador, vendedor, tienda), plan, verificado, calificación.
- `store`: perfil, dirección, WhatsApp, referencia de precio declarada, `inventory_updated_at`.
- `inventory_item`: vendedor, printing, condición, idioma, foil, cantidad, precio MXN.
- `want_list` / `want_list_item`: dueño, pública sí/no; oracle id o printing específico, cantidad, condición mínima, foil sí/no/indistinto.
- `offer`: want list, vendedor, precio total del lote, cartas incluidas, estado.
- `rating`: de quién, a quién, oferta relacionada, puntuación, comentario.

## Reglas de matching

- Un item de want list sin impresión específica coincide con cualquier printing del mismo oracle id.
- Condición: el inventario cumple si es igual o mejor que la mínima pedida (NM > LP > MP > HP > DMG).
- Foil e idioma solo filtran si el comprador los especificó.
