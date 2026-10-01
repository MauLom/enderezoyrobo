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

export type InboxOffer = {
  id: string;
  status: OfferStatus;
  totalMxnCents: number;
  message: string | null;
  createdAt: string;
  respondedAt: string | null;
  listId: string;
  listName: string;
  ownerId: string;
  ownerName: string;
  sellerId: string;
  /** Nombre de la tienda si el vendedor es tienda; si no, su nombre visible. */
  sellerName: string;
  sellerIsStore: boolean;
  /** WhatsApp público de la tienda vendedora; el de un particular sale de getDealContacts. */
  storeWhatsapp: string | null;
  items: { name: string; quantity: number }[];
  /** Calificación que el usuario ya dio por esta oferta. */
  myRating: number | null;
};

/** Ofertas recibidas (sobre listas del usuario) y enviadas (como vendedor), la más reciente primero. RLS limita a las suyas. */
export async function getOfferInbox(userId: string): Promise<{ received: InboxOffer[]; sent: InboxOffer[] }> {
  const supabase = await createClient();
  const [offers, ratings] = await Promise.all([
    supabase
      .from("offer")
      .select(
        "id, status, total_mxn_cents, message, created_at, responded_at, seller_id, want_list(id, name, owner_id, profile(display_name)), profile(display_name, kind, store(name, whatsapp)), offer_item(quantity, want_list_item(oracle_id, card_printing(name)))",
      )
      .order("created_at", { ascending: false }),
    supabase.from("rating").select("offer_id, score").eq("from_id", userId),
  ]);
  if (offers.error) throw offers.error;
  if (ratings.error) throw ratings.error;

  // Los items sin impresión exacta solo traen el oracle id: el nombre sale del resumen.
  const missing = [
    ...new Set(
      offers.data.flatMap((o) => o.offer_item.filter((i) => !i.want_list_item?.card_printing).map((i) => i.want_list_item!.oracle_id)),
    ),
  ];
  const names = new Map<string, string>();
  if (missing.length) {
    const { data, error } = await supabase.rpc("resumen_cartas", { oracle_ids: missing });
    if (error) throw error;
    for (const s of data) names.set(s.oracle_id, s.name);
  }
  const myRatings = new Map(ratings.data.map((r) => [r.offer_id, r.score]));

  const all = offers.data.map((o): InboxOffer => {
    const store = o.profile?.kind === "store" ? (o.profile.store ?? null) : null;
    return {
      id: o.id,
      status: o.status,
      totalMxnCents: o.total_mxn_cents,
      message: o.message,
      createdAt: o.created_at,
      respondedAt: o.responded_at,
      listId: o.want_list?.id ?? "",
      listName: o.want_list?.name ?? "",
      ownerId: o.want_list?.owner_id ?? "",
      ownerName: o.want_list?.profile?.display_name ?? "",
      sellerId: o.seller_id,
      sellerName: store?.name ?? o.profile?.display_name ?? "Vendedor",
      sellerIsStore: store !== null,
      storeWhatsapp: store?.whatsapp ?? null,
      items: o.offer_item.map((i) => ({
        name: i.want_list_item?.card_printing?.name ?? names.get(i.want_list_item?.oracle_id ?? "") ?? "Carta desconocida",
        quantity: i.quantity,
      })),
      myRating: myRatings.get(o.id) ?? null,
    };
  });
  return { received: all.filter((o) => o.ownerId === userId), sent: all.filter((o) => o.sellerId === userId) };
}

/** Ofertas pendientes sobre las listas del usuario, para el menú. */
export async function countPendingReceived(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("offer")
    .select("id, want_list!inner(owner_id)", { count: "exact", head: true })
    .eq("status", "pending")
    .eq("want_list.owner_id", userId);
  if (error) throw error;
  return count ?? 0;
}
