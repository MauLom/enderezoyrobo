import "server-only";
import type { OfferStatus } from "@/lib/offers/offers";
import { createClient } from "./server";

export type MyOffer = { id: string; status: OfferStatus; totalMxnCents: number; createdAt: string };

/** Ofertas del vendedor sobre una lista, la más reciente primero. */
export async function getMyOffersOnList(listId: string, sellerId: string): Promise<MyOffer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offer")
    .select("id, status, total_mxn_cents, created_at")
    .eq("want_list_id", listId)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((o) => ({ id: o.id, status: o.status, totalMxnCents: o.total_mxn_cents, createdAt: o.created_at }));
}
