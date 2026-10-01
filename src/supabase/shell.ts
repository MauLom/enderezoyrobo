import "server-only";
import { countPendingReceived } from "./offers";
import { createClient } from "./server";

export type ShellCounts = { lists: number; verifiedStores: number; pendingOffers: number };

/** Conteos del menú lateral: listas y ofertas pendientes recibidas del usuario (si hay sesión) y tiendas verificadas. */
export async function getShellCounts(profileId: string | null): Promise<ShellCounts> {
  const supabase = await createClient();
  const [lists, stores, pendingOffers] = await Promise.all([
    profileId
      ? supabase.from("want_list").select("id", { count: "exact", head: true }).eq("owner_id", profileId)
      : Promise.resolve({ count: 0, error: null }),
    supabase.from("store").select("id", { count: "exact", head: true }).not("verified_at", "is", null),
    profileId ? countPendingReceived(profileId) : 0,
  ]);
  if (lists.error) throw lists.error;
  if (stores.error) throw stores.error;
  return { lists: lists.count ?? 0, verifiedStores: stores.count ?? 0, pendingOffers };
}
