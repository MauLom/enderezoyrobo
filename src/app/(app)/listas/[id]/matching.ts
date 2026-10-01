import { sellerWhatsapp } from "@/lib/contact/seller-contact";
import { bestCombinations, type InventoryItem, matchByStore, matchesWant, type MatchResult, type WantItem } from "@/lib/matching/match";
import type { InventoryRow } from "@/supabase/inventory";
import type { WantListDetail } from "@/supabase/want-lists";

export type SellerInfo = Pick<InventoryRow, "sellerId" | "sellerName" | "isStore" | "verified" | "whatsapp" | "inventoryUpdatedAt">;

export type ListMatching = {
  byStore: MatchResult[];
  best: MatchResult | null;
  sellers: Map<string, SellerInfo>;
  inventoryById: Map<string, InventoryRow>;
  /** Cuántos vendedores tienen al menos una copia que cumple cada item. */
  sellersPerItem: Map<string, number>;
};

/** `dealContacts`: WhatsApp de quienes tienen una oferta aceptada con quien mira (ver getDealContacts). */
export function computeMatching(list: WantListDetail, dealContacts: ReadonlyMap<string, string>): ListMatching {
  const want: WantItem[] = list.items.map((i) => ({
    id: i.id,
    oracleId: i.oracleId,
    printingId: i.printingId,
    quantity: i.quantity,
    minCondition: i.minCondition,
    foil: i.foil,
    language: i.language,
  }));
  const inventory: InventoryItem[] = list.inventory.map((r) => ({
    id: r.id,
    storeId: r.sellerId,
    oracleId: r.oracleId,
    printingId: r.printingId,
    condition: r.condition,
    language: r.language,
    foil: r.foil,
    quantity: r.quantity,
    priceMxnCents: r.priceMxnCents,
  }));

  const sellers = new Map<string, SellerInfo>();
  for (const r of list.inventory) {
    if (sellers.has(r.sellerId)) continue;
    const whatsapp = sellerWhatsapp({ id: r.sellerId, isStore: r.isStore, storeWhatsapp: r.whatsapp }, dealContacts);
    sellers.set(r.sellerId, { ...r, whatsapp });
  }

  const sellersPerItem = new Map<string, number>();
  for (const w of want) {
    const matching = new Set(inventory.filter((item) => matchesWant(w, item)).map((item) => item.storeId));
    sellersPerItem.set(w.id, matching.size);
  }

  const byStore = matchByStore(want, inventory);
  const best = byStore.length > 0 ? bestCombinations(want, inventory)[0] ?? null : null;

  return {
    byStore,
    best,
    sellers,
    inventoryById: new Map(list.inventory.map((r) => [r.id, r])),
    sellersPerItem,
  };
}
