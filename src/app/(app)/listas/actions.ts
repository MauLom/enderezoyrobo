"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCondition } from "@/lib/cards/condition";
import { parseOfferForm } from "@/lib/offers/offers";
import { createClient } from "@/supabase/server";
import { requireProfile } from "@/supabase/session";
import { createWantList, resolveDecklist } from "@/supabase/want-lists";

const MAX_LIST_TEXT = 20_000;

export type PreviewItem = {
  key: string;
  name: string;
  quantity: number;
  setLabel: string;
  imageUri: string | null;
  exact: boolean;
  foil: boolean;
};

export type Issue = { lineNumber: number; raw: string; message: string };

export type NewListState = {
  name: string;
  text: string;
  preview?: { items: PreviewItem[]; warnings: Issue[]; problems: Issue[] };
  error?: string;
};

/** Paso 1 (`intent=review`): interpreta el texto y muestra la vista previa. Paso 2 (`intent=save`): guarda. */
export async function newListAction(_prev: NewListState, formData: FormData): Promise<NewListState> {
  const profile = await requireProfile();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80) || "Mi want list";
  const text = String(formData.get("text") ?? "");
  if (!text.trim()) return { name, text, error: "Pega tu lista: una carta por línea." };
  if (text.length > MAX_LIST_TEXT) return { name, text, error: "La lista es demasiado larga." };

  // En los dos pasos se vuelve a resolver en el servidor: no se confía en la vista previa del navegador.
  const resolved = await resolveDecklist(text);
  const problems = [
    ...resolved.parseErrors,
    ...resolved.unresolved,
  ].sort((a, b) => a.lineNumber - b.lineNumber);

  if (formData.get("intent") === "save") {
    if (resolved.items.length === 0) return { name, text, error: "No reconocimos ninguna carta de la lista." };
    const id = await createWantList(profile.id, name, resolved);
    redirect(`/listas/${id}`);
  }

  return {
    name,
    text,
    preview: {
      items: resolved.items.map((item) => ({
        key: `${item.oracleId}|${item.printing?.id ?? ""}|${item.foil}`,
        name: item.name,
        quantity: item.quantity,
        setLabel: item.printing
          ? `${item.printing.setCode.toUpperCase()} ${item.printing.collectorNumber}`
          : "Cualquier impresión",
        imageUri: item.display.imageUri,
        exact: item.printing !== null,
        foil: item.foil === "yes",
      })),
      warnings: resolved.warnings,
      problems,
    },
  };
}

async function touchList(listId: string) {
  const supabase = await createClient();
  await supabase.from("want_list").update({ updated_at: new Date().toISOString() }).eq("id", listId);
  revalidatePath(`/listas/${listId}`);
}

export async function setListPublic(listId: string, isPublic: boolean) {
  await requireProfile();
  const supabase = await createClient();
  // RLS solo deja cambiar listas propias.
  const { error } = await supabase
    .from("want_list")
    .update({ is_public: isPublic, updated_at: new Date().toISOString() })
    .eq("id", listId);
  if (error) throw error;
  revalidatePath(`/listas/${listId}`);
}

export async function renameList(listId: string, formData: FormData) {
  await requireProfile();
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  if (!name) return;
  const supabase = await createClient();
  const { error } = await supabase.from("want_list").update({ name }).eq("id", listId);
  if (error) throw error;
  await touchList(listId);
}

export async function deleteList(listId: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("want_list").delete().eq("id", listId);
  if (error) throw error;
  revalidatePath("/listas");
  redirect("/listas");
}

export async function updateItem(listId: string, itemId: string, formData: FormData) {
  await requireProfile();
  const changes: { min_condition?: "NM" | "LP" | "MP" | "HP" | "DMG"; quantity?: number; foil?: "yes" | "no" | "any" } = {};

  const condition = parseCondition(String(formData.get("minCondition") ?? ""));
  if (condition) changes.min_condition = condition;
  const quantity = Number(formData.get("quantity"));
  if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 999) changes.quantity = quantity;
  const foil = formData.get("foil");
  if (foil === "yes" || foil === "no" || foil === "any") changes.foil = foil;
  if (Object.keys(changes).length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.from("want_list_item").update(changes).eq("id", itemId).eq("want_list_id", listId);
  if (error) throw error;
  await touchList(listId);
}

export async function deleteItem(listId: string, itemId: string) {
  await requireProfile();
  const supabase = await createClient();
  const { error } = await supabase.from("want_list_item").delete().eq("id", itemId).eq("want_list_id", listId);
  if (error) throw error;
  await touchList(listId);
}

export type OfferState = { error?: string };

/**
 * Oferta por el lote de una lista pública ajena. Las cantidades llegan como
 * `q:<id del item>`. RLS y crear_oferta impiden ofertar sobre una lista propia
 * o privada; aquí solo se traducen los errores.
 */
export async function makeOffer(listId: string, _prev: OfferState, formData: FormData): Promise<OfferState> {
  const profile = await requireProfile();
  if (profile.kind === "player") return { error: "Cambia tu cuenta a vendedor para hacer ofertas." };

  const supabase = await createClient();
  const { data: wantItems, error: itemsError } = await supabase
    .from("want_list_item")
    .select("id, quantity")
    .eq("want_list_id", listId);
  if (itemsError) return { error: "No pudimos cargar la lista. Intenta de nuevo." };

  const quantities: Record<string, string> = {};
  for (const [key, value] of formData) {
    if (key.startsWith("q:")) quantities[key.slice(2)] = String(value);
  }
  const offer = parseOfferForm(
    { total: String(formData.get("total") ?? ""), message: String(formData.get("message") ?? ""), quantities },
    wantItems,
  );
  if (!offer.ok) return { error: offer.error };

  const { error } = await supabase.rpc("crear_oferta", {
    lista: listId,
    total: offer.value.totalMxnCents,
    mensaje: offer.value.message ?? "",
    items: offer.value.items.map((i) => ({ want_list_item_id: i.wantListItemId, quantity: i.quantity })),
  });
  if (error) {
    if (error.code === "23505") return { error: "Ya tienes una oferta pendiente en esta lista." };
    if (error.code === "42501") return { error: "No puedes ofertar sobre esta lista." };
    return { error: "No pudimos enviar la oferta. Intenta de nuevo." };
  }

  revalidatePath(`/listas/${listId}`);
  return {};
}
