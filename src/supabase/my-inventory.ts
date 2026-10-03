import "server-only";
import type { Condition } from "@/lib/cards/condition";
import { namesToLookup } from "@/lib/catalog/resolve";
import { type InventoryResolveResult, type ResolvedInventoryItem, resolveInventory } from "@/lib/catalog/resolve-inventory";
import { parseStoreInventory } from "@/lib/import/store-inventory";
import { findPrintings } from "./catalog";
import { fetchAll } from "./query";
import { createClient } from "./server";

/** Parsea el CSV de inventario y lo resuelve contra el catálogo. Los errores del archivo y de cada línea van juntos. */
export async function resolveInventoryCsv(text: string): Promise<InventoryResolveResult> {
  const parsed = parseStoreInventory(text);
  const candidates = await findPrintings(namesToLookup(parsed.rows));
  const resolved = resolveInventory(parsed.rows, candidates);
  const byRow = (a: { rowNumber: number | null }, b: { rowNumber: number | null }) => (a.rowNumber ?? 0) - (b.rowNumber ?? 0);
  return {
    items: resolved.items,
    errors: [...parsed.errors, ...resolved.errors].sort(byRow),
    warnings: [...parsed.warnings, ...resolved.warnings].sort(byRow),
  };
}

/** Reemplaza todo el inventario del usuario en una transacción (función reemplazar_inventario). */
export async function replaceInventory(items: ResolvedInventoryItem[]): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("reemplazar_inventario", {
    items: items.map((i) => ({
      printing_id: i.printing.id,
      condition: i.condition,
      language: i.language,
      foil: i.foil,
      quantity: i.quantity,
      price_mxn_cents: i.priceMxnCents,
    })),
  });
  if (error) throw error;
  return data;
}

export type MyInventoryItem = {
  id: string;
  name: string;
  setCode: string;
  collectorNumber: string;
  condition: Condition;
  language: string;
  foil: boolean;
  quantity: number;
  priceMxnCents: number;
};

export type MyInventory = {
  items: MyInventoryItem[];
  copies: number;
  /** Fecha de la tienda o, sin tienda, la del renglón más reciente; null si no hay inventario. */
  updatedAt: string | null;
};

export async function getMyInventory(profileId: string): Promise<MyInventory> {
  const supabase = await createClient();
  const [rows, store] = await Promise.all([
    fetchAll((from, to) =>
      supabase
        .from("inventory_item")
        .select("id, condition, language, foil, quantity, price_mxn_cents, updated_at, card_printing!inner(name, set_code, collector_number)")
        .eq("seller_id", profileId)
        .order("id")
        .range(from, to),
    ),
    supabase.from("store").select("inventory_updated_at").eq("profile_id", profileId).maybeSingle(),
  ]);
  if (store.error) throw store.error;

  const items = rows
    .map((r) => ({
      id: r.id,
      name: r.card_printing.name,
      setCode: r.card_printing.set_code,
      collectorNumber: r.card_printing.collector_number,
      condition: r.condition,
      language: r.language,
      foil: r.foil,
      quantity: r.quantity,
      priceMxnCents: r.price_mxn_cents,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const latestRow = rows.reduce<string | null>((max, r) => (max === null || r.updated_at > max ? r.updated_at : max), null);
  return {
    items,
    copies: items.reduce((sum, i) => sum + i.quantity, 0),
    updatedAt: rows.length === 0 ? null : (store.data?.inventory_updated_at ?? latestRow),
  };
}
