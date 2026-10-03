import "server-only";
import type { CatalogPrinting } from "@/lib/catalog/resolve";
import { fetchAll } from "./query";
import { createClient } from "./server";

/** Impresiones del catálogo cuyo nombre (o cara frontal) es uno de estos, ya normalizados (namesToLookup). */
export async function findPrintings(names: string[]): Promise<CatalogPrinting[]> {
  if (names.length === 0) return [];
  const supabase = await createClient();
  const rows = await fetchAll((from, to) => supabase.rpc("buscar_impresiones", { nombres: names }).range(from, to));
  return rows.map((r) => ({
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
}
