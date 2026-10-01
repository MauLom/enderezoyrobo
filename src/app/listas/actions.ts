"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCondition } from "@/lib/cards/condition";
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
