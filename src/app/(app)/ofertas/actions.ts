"use server";

import { revalidatePath } from "next/cache";
import { canChangeStatus, offerActor, type OfferStatus, parseRating } from "@/lib/offers/offers";
import { createClient } from "@/supabase/server";
import { requireProfile } from "@/supabase/session";

export type OfferActionState = { error?: string };

const STATUSES: OfferStatus[] = ["accepted", "rejected", "withdrawn"];

/** Partes de la oferta, o null si no existe o el usuario no la ve (RLS). */
async function loadOffer(offerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("offer")
    .select("id, status, seller_id, want_list(owner_id)")
    .eq("id", offerId)
    .maybeSingle();
  if (error || !data?.want_list) return null;
  return { status: data.status, sellerId: data.seller_id, ownerId: data.want_list.owner_id };
}

/**
 * El dueño de la lista acepta o rechaza; el vendedor retira; solo mientras
 * está pendiente. canChangeStatus da el mensaje; el trigger offer_guard lo
 * impone en la base.
 */
export async function changeOfferStatus(
  offerId: string,
  _prev: OfferActionState,
  formData: FormData,
): Promise<OfferActionState> {
  const profile = await requireProfile();
  const to = String(formData.get("status")) as OfferStatus;
  if (!STATUSES.includes(to)) return { error: "Acción no válida." };

  const offer = await loadOffer(offerId);
  const actor = offer && offerActor(offer, profile.id);
  if (!offer || !actor) return { error: "No encontramos esta oferta." };
  if (!canChangeStatus(offer.status, to, actor)) return { error: "Esta oferta ya no está pendiente." };

  const supabase = await createClient();
  const { error } = await supabase.from("offer").update({ status: to }).eq("id", offerId);
  if (error) return { error: "No pudimos actualizar la oferta. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return {};
}

/** Califica a la otra parte de una oferta aceptada, una vez por oferta. */
export async function rateOffer(offerId: string, _prev: OfferActionState, formData: FormData): Promise<OfferActionState> {
  const profile = await requireProfile();
  const rating = parseRating(String(formData.get("score") ?? ""), String(formData.get("comment") ?? ""));
  if (!rating.ok) return { error: rating.error };

  const offer = await loadOffer(offerId);
  const actor = offer && offerActor(offer, profile.id);
  if (!offer || !actor) return { error: "No encontramos esta oferta." };
  if (offer.status !== "accepted") return { error: "Solo se califica una oferta aceptada." };

  const supabase = await createClient();
  const { error } = await supabase.from("rating").insert({
    from_id: profile.id,
    to_id: actor === "owner" ? offer.sellerId : offer.ownerId,
    offer_id: offerId,
    score: rating.value.score,
    comment: rating.value.comment,
  });
  if (error) {
    if (error.code === "23505") return { error: "Ya calificaste esta oferta." };
    return { error: "No pudimos guardar la calificación. Intenta de nuevo." };
  }

  revalidatePath("/ofertas");
  return {};
}
