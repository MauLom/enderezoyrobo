import "server-only";
import type { Condition } from "@/lib/cards/condition";
import { type CatalogPrinting, namesToLookup, type ResolveResult, resolveLines } from "@/lib/catalog/resolve";
import { looksLikeCollectionCsv, parseCollectionCsv } from "@/lib/import/collection-csv";
import { type LineError, parseDecklist } from "@/lib/import/decklist";
import type { FoilPreference } from "@/lib/matching/match";
import { type InventoryRow, toInventoryRow } from "./inventory";
import { type Client, fetchAll } from "./query";
import { createClient } from "./server";

// Resolver texto ----------------------------------------------------------------

export type ResolvedDecklist = ResolveResult & { parseErrors: LineError[] };

/** Texto estilo Moxfield/Arena o CSV de ManaBox/Moxfield; el formato se detecta por el encabezado. */
export async function resolveDecklist(text: string): Promise<ResolvedDecklist> {
  const { lines, errors } = looksLikeCollectionCsv(text) ? parseCollectionCsv(text) : parseDecklist(text);
  const names = namesToLookup(lines);
  if (names.length === 0) return { items: [], warnings: [], unresolved: [], parseErrors: errors };

  const supabase = await createClient();
  const rows = await fetchAll((from, to) => supabase.rpc("buscar_impresiones", { nombres: names }).range(from, to));
  const candidates: CatalogPrinting[] = rows.map((r) => ({
    id: r.id,
    oracleId: r.oracle_id,
    name: r.name,
    setCode: r.set_code,
    setName: r.set_name,
    collectorNumber: r.collector_number,
    lang: r.lang,
    imageUri: r.image_uri,
    releasedAt: r.released_at,
  }));
  return { ...resolveLines(lines, candidates), parseErrors: errors };
}

// Escritura ----------------------------------------------------------------------

export async function createWantList(ownerId: string, name: string, resolved: ResolveResult): Promise<string> {
  const supabase = await createClient();
  const { data: list, error } = await supabase
    .from("want_list")
    .insert({ owner_id: ownerId, name })
    .select("id")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("want_list_item").insert(
    resolved.items.map((item) => ({
      want_list_id: list.id,
      oracle_id: item.oracleId,
      printing_id: item.printing?.id ?? null,
      quantity: item.quantity,
      foil: item.foil,
    })),
  );
  if (itemsError) {
    // Sin transacciones desde PostgREST: si fallan los items, no dejar la lista vacía.
    await supabase.from("want_list").delete().eq("id", list.id);
    throw itemsError;
  }
  return list.id;
}

// Lectura ------------------------------------------------------------------------

export type WantListSummary = {
  id: string;
  name: string;
  isPublic: boolean;
  cardCount: number;
  updatedAt: string;
};

export async function getMyWantLists(ownerId: string): Promise<WantListSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("want_list")
    .select("id, name, is_public, updated_at, want_list_item(quantity)")
    .eq("owner_id", ownerId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map((l) => ({
    id: l.id,
    name: l.name,
    isPublic: l.is_public,
    updatedAt: l.updated_at,
    cardCount: l.want_list_item.reduce((sum, i) => sum + i.quantity, 0),
  }));
}

export type WantListItemView = {
  id: string;
  oracleId: string;
  printingId: string | null;
  name: string;
  imageUri: string | null;
  setCode: string | null;
  quantity: number;
  minCondition: Condition;
  foil: FoilPreference;
  language: string | null;
  /** Precio de referencia más bajo (TCGplayer, no foil) entre las impresiones aceptadas. */
  referenceUsd: string | null;
};


export type WantListDetail = {
  id: string;
  name: string;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
  items: WantListItemView[];
  inventory: InventoryRow[];
  /** MXN por dólar, o null si no hay tipo de cambio cargado. */
  usdRate: string | null;
};

/** Lista con sus cartas y el inventario que les sirve; null si no existe o no es visible (RLS). */
export async function getWantListDetail(id: string): Promise<WantListDetail | null> {
  const supabase = await createClient();
  const { data: list, error } = await supabase
    .from("want_list")
    .select(
      "id, name, is_public, owner_id, profile(display_name), want_list_item(id, oracle_id, printing_id, quantity, min_condition, foil, language, card_printing(name, image_uri, set_code, price_reference(source, finish, amount)))",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!list) return null;

  const oracleIds = [...new Set(list.want_list_item.map((i) => i.oracle_id))];
  const [summaries, inventory, rate] = await Promise.all([
    oracleIds.length ? summarize(supabase, oracleIds) : new Map<string, CardSummary>(),
    oracleIds.length ? loadInventory(supabase, oracleIds) : [],
    supabase.from("exchange_rate").select("mxn_per_unit").eq("currency", "USD").maybeSingle(),
  ]);

  const items: WantListItemView[] = list.want_list_item.map((i) => {
    const summary = summaries.get(i.oracle_id);
    const exact = i.card_printing;
    const exactUsd = exact?.price_reference.find((p) => p.source === "tcgplayer" && p.finish === "nonfoil")?.amount;
    return {
      id: i.id,
      oracleId: i.oracle_id,
      printingId: i.printing_id,
      name: exact?.name ?? summary?.name ?? "Carta desconocida",
      imageUri: exact?.image_uri ?? summary?.imageUri ?? null,
      setCode: exact?.set_code ?? null,
      quantity: i.quantity,
      minCondition: i.min_condition,
      foil: i.foil,
      language: i.language,
      referenceUsd: exact ? (exactUsd?.toString() ?? null) : (summary?.usdMin ?? null),
    };
  });
  items.sort((a, b) => a.name.localeCompare(b.name));

  return {
    id: list.id,
    name: list.name,
    isPublic: list.is_public,
    ownerId: list.owner_id,
    ownerName: list.profile?.display_name ?? "",
    items,
    inventory,
    usdRate: rate.data?.mxn_per_unit?.toString() ?? null,
  };
}

type CardSummary = { name: string; imageUri: string | null; usdMin: string | null };

async function summarize(supabase: Client, oracleIds: string[]) {
  const rows = await fetchAll((from, to) => supabase.rpc("resumen_cartas", { oracle_ids: oracleIds }).range(from, to));
  return new Map<string, CardSummary>(
    rows.map((r) => [r.oracle_id, { name: r.name, imageUri: r.image_uri, usdMin: r.usd_min?.toString() ?? null }]),
  );
}

async function loadInventory(supabase: Client, oracleIds: string[]): Promise<InventoryRow[]> {
  const rows = await fetchAll((from, to) => supabase.rpc("inventario_para", { oracle_ids: oracleIds }).range(from, to));
  return rows.map(toInventoryRow);
}
