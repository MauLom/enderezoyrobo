/**
 * Conversión de cartas del bulk "Default Cards" de Scryfall a filas del
 * catálogo (card_printing) y de precios de referencia (price_reference).
 *
 * Solo se guardan los campos que la app usa; las imágenes se sirven desde
 * Scryfall. Scryfall trae precios de TCGplayer (USD) y Cardmarket (EUR).
 */

export type ScryfallCard = {
  id: string;
  oracle_id?: string;
  name: string;
  set: string;
  set_name: string;
  collector_number: string;
  lang: string;
  rarity: string;
  released_at?: string;
  layout: string;
  games: string[];
  image_uris?: { normal?: string };
  card_faces?: { oracle_id?: string; image_uris?: { normal?: string } }[];
  prices: Record<string, string | null>;
};

export type PrintingRow = {
  id: string;
  oracleId: string;
  name: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  lang: string;
  rarity: string;
  imageUri: string | null;
  releasedAt: string | null;
};

export type PriceSource = "ck" | "tcgplayer" | "cardmarket";
export type CardFinish = "nonfoil" | "foil" | "etched";

export type PriceRow = {
  printingId: string;
  source: PriceSource;
  finish: CardFinish;
  currency: "USD" | "EUR";
  /** Texto decimal tal como viene de la fuente ("0.38"), para no perder precisión. */
  amount: string;
  asOf: string;
};

const PRICE_FIELDS: Record<string, Pick<PriceRow, "source" | "finish" | "currency">> = {
  usd: { source: "tcgplayer", finish: "nonfoil", currency: "USD" },
  usd_foil: { source: "tcgplayer", finish: "foil", currency: "USD" },
  usd_etched: { source: "tcgplayer", finish: "etched", currency: "USD" },
  eur: { source: "cardmarket", finish: "nonfoil", currency: "EUR" },
  eur_foil: { source: "cardmarket", finish: "foil", currency: "EUR" },
  eur_etched: { source: "cardmarket", finish: "etched", currency: "EUR" },
};

/**
 * Fila de catálogo para una carta, o null si no se vende en papel: cartas solo
 * digitales (Arena, MTGO) y las "art series", que no son cartas de juego.
 */
export function toPrinting(card: ScryfallCard): PrintingRow | null {
  if (!card.games.includes("paper") || card.layout === "art_series") return null;

  // Las cartas reversibles no traen oracle_id arriba, solo en cada cara.
  const oracleId = card.oracle_id ?? card.card_faces?.[0]?.oracle_id;
  if (!oracleId) return null;

  return {
    id: card.id,
    oracleId,
    name: card.name,
    setCode: card.set,
    setName: card.set_name,
    collectorNumber: card.collector_number,
    lang: card.lang,
    rarity: card.rarity,
    imageUri: card.image_uris?.normal ?? card.card_faces?.[0]?.image_uris?.normal ?? null,
    releasedAt: card.released_at ?? null,
  };
}

/** Precios de referencia de una carta; ignora los que Scryfall no tiene. */
export function toPrices(card: ScryfallCard, asOf: string): PriceRow[] {
  const rows: PriceRow[] = [];
  for (const [field, meta] of Object.entries(PRICE_FIELDS)) {
    const amount = card.prices[field];
    if (amount == null || !/^\d+(\.\d+)?$/.test(amount)) continue;
    rows.push({ printingId: card.id, ...meta, amount, asOf });
  }
  return rows;
}
