import "server-only";
import { countPendingReceived } from "./offers";
import { createClient } from "./server";
import type { Profile } from "./session";
import { countPendingStores } from "./stores";

export type ShellCounts = { lists: number; verifiedStores: number; pendingOffers: number; pendingStores: number };

/**
 * Conteos del menú lateral: listas y ofertas pendientes recibidas del usuario
 * (si hay sesión), tiendas verificadas y, para el staff, tiendas por revisar.
 */
export async function getShellCounts(profile: Profile | null): Promise<ShellCounts> {
  const profileId = profile?.id ?? null;
  const supabase = await createClient();
  const [lists, stores, pendingOffers, pendingStores] = await Promise.all([
    profileId
      ? supabase.from("want_list").select("id", { count: "exact", head: true }).eq("owner_id", profileId)
      : Promise.resolve({ count: 0, error: null }),
    supabase.from("store").select("id", { count: "exact", head: true }).not("verified_at", "is", null),
    profileId ? countPendingReceived(profileId) : 0,
    profile?.staffRole ? countPendingStores() : 0,
  ]);
  if (lists.error) throw lists.error;
  if (stores.error) throw stores.error;
  return { lists: lists.count ?? 0, verifiedStores: stores.count ?? 0, pendingOffers, pendingStores };
}
