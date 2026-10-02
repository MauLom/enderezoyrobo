import "server-only";
import { sellerWhatsapp } from "@/lib/contact/seller-contact";
import { type CardListing, groupListings, type MarketOffer, type WantedCard } from "@/lib/marketplace/listings";
import { getDealContacts } from "./contacts";
import type { Client } from "./query";
import { createClient } from "./server";

// Ofertas recientes que se muestran en el marketplace, además de todas las de
// las cartas que el usuario busca.
const RECENT_LIMIT = 200;

export const OFFER_COLUMNS =
  "id, printing_id, condition, language, foil, quantity, price_mxn_cents, updated_at, seller_id, card_printing!inner(oracle_id, name, set_code, set_name, image_uri), profile(display_name, kind, store(name, verified_at, whatsapp, address, inventory_updated_at))";

export type MarketplaceData = {
  listings: CardListing[];
  wanted: WantedCard[];
};

/**
 * Marketplace del usuario. Con `recent: false` solo trae las ofertas de las
 * cartas que busca (para la vista de sus listas).
 */
export async function getMarketplace(ownerId: string, { recent: withRecent = true } = {}): Promise<MarketplaceData> {
  const supabase = await createClient();
  const [wanted, contacts, recent] = await Promise.all([
    loadWanted(supabase, ownerId),
    getDealContacts(),
    withRecent
      ? supabase
          .from("inventory_item")
          .select(OFFER_COLUMNS)
          .gt("quantity", 0)
          .order("updated_at", { ascending: false })
          .limit(RECENT_LIMIT)
      : null,
  ]);
  if (recent?.error) throw recent.error;

  const wantedIds = [...new Set(wanted.map((w) => w.oracleId))];
  let forWanted: NonNullable<NonNullable<typeof recent>["data"]> = [];
  if (wantedIds.length) {
    const { data, error } = await supabase
      .from("inventory_item")
      .select(OFFER_COLUMNS)
      .gt("quantity", 0)
      .in("card_printing.oracle_id", wantedIds);
    if (error) throw error;
    forWanted = data;
  }

  const offers = [...(recent?.data ?? []), ...forWanted].map((r) => toMarketOffer(r, contacts));

  return {
    listings: groupListings(offers, new Set(wantedIds)),
    wanted,
  };
}

type OfferRow = {
  id: string;
  condition: MarketOffer["condition"];
  language: string;
  foil: boolean;
  quantity: number;
  price_mxn_cents: number;
  updated_at: string;
  seller_id: string;
  printing_id: string;
  card_printing: { oracle_id: string; name: string; set_code: string; set_name: string; image_uri: string | null };
  profile: {
    display_name: string;
    kind: string;
    store: { name: string; verified_at: string | null; whatsapp: string | null; address: string | null; inventory_updated_at: string | null } | null;
  } | null;
};

/** Un renglón de inventario (consultado con OFFER_COLUMNS) como oferta del marketplace. */
export function toMarketOffer(r: OfferRow, contacts: ReadonlyMap<string, string>): MarketOffer {
  const store = r.profile?.store ?? null;
  const isStore = r.profile?.kind === "store" && store !== null;
  return {
    id: r.id,
    oracleId: r.card_printing.oracle_id,
    printingId: r.printing_id,
    cardName: r.card_printing.name,
    setCode: r.card_printing.set_code,
    setName: r.card_printing.set_name,
    imageUri: r.card_printing.image_uri,
    condition: r.condition,
    language: r.language,
    foil: r.foil,
    quantity: r.quantity,
    priceMxnCents: r.price_mxn_cents,
    sellerId: r.seller_id,
    sellerName: (isStore ? store?.name : null) ?? r.profile?.display_name ?? "Vendedor",
    isStore,
    verified: store?.verified_at != null,
    whatsapp: sellerWhatsapp({ id: r.seller_id, isStore, storeWhatsapp: store?.whatsapp ?? null }, contacts),
    location: store?.address ?? null,
    updatedAt: (isStore ? store?.inventory_updated_at : null) ?? r.updated_at,
  };
}

/** Cartas de todas las want lists del usuario. */
async function loadWanted(supabase: Client, ownerId: string): Promise<WantedCard[]> {
  const { data, error } = await supabase
    .from("want_list_item")
    .select("want_list_id, oracle_id, printing_id, quantity, min_condition, foil, language, card_printing(name, set_code), want_list!inner(owner_id)")
    .eq("want_list.owner_id", ownerId);
  if (error) throw error;
  if (data.length === 0) return [];

  // Los renglones sin impresión exacta solo traen el oracle id: el nombre sale del resumen.
  const missing = [...new Set(data.filter((i) => !i.card_printing).map((i) => i.oracle_id))];
  const names = new Map<string, string>();
  if (missing.length) {
    const { data: summaries, error: summaryError } = await supabase.rpc("resumen_cartas", { oracle_ids: missing });
    if (summaryError) throw summaryError;
    for (const s of summaries) names.set(s.oracle_id, s.name);
  }

  return data.map((i) => ({
    listId: i.want_list_id,
    oracleId: i.oracle_id,
    name: i.card_printing?.name ?? names.get(i.oracle_id) ?? "Carta desconocida",
    setCode: i.card_printing?.set_code ?? null,
    quantity: i.quantity,
    printingId: i.printing_id,
    minCondition: i.min_condition,
    foil: i.foil,
    language: i.language,
  }));
}
