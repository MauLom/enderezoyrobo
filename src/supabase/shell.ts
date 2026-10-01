import "server-only";
import { createClient } from "./server";

export type ShellCounts = { lists: number; verifiedStores: number };

/** Conteos del menú lateral: listas del usuario (si hay sesión) y tiendas verificadas. */
export async function getShellCounts(profileId: string | null): Promise<ShellCounts> {
  const supabase = await createClient();
  const [lists, stores] = await Promise.all([
    profileId
      ? supabase.from("want_list").select("id", { count: "exact", head: true }).eq("owner_id", profileId)
      : Promise.resolve({ count: 0, error: null }),
    supabase.from("store").select("id", { count: "exact", head: true }).not("verified_at", "is", null),
  ]);
  if (lists.error) throw lists.error;
  if (stores.error) throw stores.error;
  return { lists: lists.count ?? 0, verifiedStores: stores.count ?? 0 };
}
