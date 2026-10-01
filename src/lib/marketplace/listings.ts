import type { Condition } from "@/lib/cards/condition";

/**
 * Vista de marketplace: el inventario de tiendas y vendedores agrupado por
 * carta (oracle id), con la oferta más barata primero.
 */

export type MarketOffer = {
  id: string;
  oracleId: string;
  cardName: string;
  setCode: string;
  setName: string;
  imageUri: string | null;
  condition: Condition;
  language: string;
  foil: boolean;
  quantity: number;
  priceMxnCents: number;
  sellerId: string;
  sellerName: string;
  isStore: boolean;
  verified: boolean;
  whatsapp: string | null;
  location: string | null;
  updatedAt: string;
};

export type CardListing = {
  oracleId: string;
  name: string;
  /** Imagen, set y condición de la oferta más barata. */
  imageUri: string | null;
  setCode: string;
  setName: string;
  condition: Condition;
  bestPriceMxnCents: number;
  offers: MarketOffer[];
  sellerCount: number;
  /** La carta está en alguna want list del usuario. */
  wanted: boolean;
  /** Fecha de la oferta más reciente, para ordenar. */
  latestAt: string;
};

const byPrice = (a: MarketOffer, b: MarketOffer) => a.priceMxnCents - b.priceMxnCents || a.id.localeCompare(b.id);

/**
 * Agrupa ofertas por carta. Ignora las que no tienen existencias y las
 * repetidas (mismo id). Las cartas buscadas van primero; después, las de
 * oferta más reciente.
 */
export function groupListings(offers: MarketOffer[], wantedOracleIds: ReadonlySet<string> = new Set()): CardListing[] {
  const seen = new Set<string>();
  const groups = new Map<string, MarketOffer[]>();
  for (const offer of offers) {
    if (offer.quantity <= 0 || seen.has(offer.id)) continue;
    seen.add(offer.id);
    const group = groups.get(offer.oracleId);
    if (group) group.push(offer);
    else groups.set(offer.oracleId, [offer]);
  }

  const listings = [...groups.entries()].map(([oracleId, group]): CardListing => {
    group.sort(byPrice);
    const best = group[0];
    return {
      oracleId,
      name: best.cardName,
      imageUri: best.imageUri ?? group.find((o) => o.imageUri)?.imageUri ?? null,
      setCode: best.setCode,
      setName: best.setName,
      condition: best.condition,
      bestPriceMxnCents: best.priceMxnCents,
      offers: group,
      sellerCount: new Set(group.map((o) => o.sellerId)).size,
      wanted: wantedOracleIds.has(oracleId),
      latestAt: group.reduce((max, o) => (o.updatedAt > max ? o.updatedAt : max), group[0].updatedAt),
    };
  });

  return listings.sort(
    (a, b) => Number(b.wanted) - Number(a.wanted) || b.latestAt.localeCompare(a.latestAt) || a.name.localeCompare(b.name),
  );
}

/** Filtra por nombre sin distinguir mayúsculas ni acentos. Menos de 2 letras no filtra. */
export function searchListings(listings: CardListing[], query: string): CardListing[] {
  const q = normalize(query);
  if (q.length < 2) return listings;
  return listings.filter((l) => normalize(l.name).includes(q));
}

function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export type WishlistCard = {
  oracleId: string;
  name: string;
  setCode: string | null;
  quantity: number;
  offerCount: number;
  bestPriceMxnCents: number | null;
};

export type WantedCard = { listId: string; oracleId: string; name: string; setCode: string | null; quantity: number };

/**
 * Cartas de las want lists del usuario con cuántas ofertas hay de cada una.
 * Una carta en varias listas se suma. Las que tienen ofertas van primero.
 */
export function summarizeWishlist(wanted: WantedCard[], listings: CardListing[]): WishlistCard[] {
  const byOracle = new Map(listings.map((l) => [l.oracleId, l]));
  const cards = new Map<string, WishlistCard>();
  for (const w of wanted) {
    const current = cards.get(w.oracleId);
    if (current) {
      current.quantity += w.quantity;
      continue;
    }
    const listing = byOracle.get(w.oracleId);
    cards.set(w.oracleId, {
      oracleId: w.oracleId,
      name: w.name,
      setCode: w.setCode,
      quantity: w.quantity,
      offerCount: listing?.offers.length ?? 0,
      bestPriceMxnCents: listing?.bestPriceMxnCents ?? null,
    });
  }
  return [...cards.values()].sort(
    (a, b) => Number(b.offerCount > 0) - Number(a.offerCount > 0) || a.name.localeCompare(b.name),
  );
}

/** "JP" para "Javier Peña"; "MA" para "mazo". Ignora palabras que no empiezan con letra, como "(prueba)". */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /^\p{L}/u.test(w));
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[words.length - 1][0];
  return letters.toUpperCase();
}
