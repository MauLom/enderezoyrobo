import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Utilidades de consulta que no dependen de Next: reciben el cliente, así que
 * sirven igual desde las páginas que desde las pruebas de integración.
 */

export type Client = SupabaseClient<Database>;

// PostgREST devuelve como máximo 1000 filas por consulta (max_rows).
const PAGE = 1000;

/** Trae todas las páginas de una consulta ordenada. */
export async function fetchAll<T>(page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>) {
  const rows: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await page(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) return rows;
  }
}
