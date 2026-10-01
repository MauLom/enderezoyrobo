"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateSelfKind } from "@/lib/account/kind";
import { validateDisplayName } from "@/lib/account/validation";
import { createClient } from "@/supabase/server";
import { requireProfile } from "@/supabase/session";

export type ProfileState = { displayName: string; error?: string; saved?: boolean };

export async function updateProfile(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const profile = await requireProfile();
  const raw = String(formData.get("displayName") ?? "");
  const name = validateDisplayName(raw);
  if (!name.ok) return { displayName: raw, error: name.error };

  const supabase = await createClient();
  const { error } = await supabase.from("profile").update({ display_name: name.value }).eq("id", profile.id);
  if (error) return { displayName: name.value, error: "No pudimos guardar los cambios. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return { displayName: name.value, saved: true };
}

export type KindState = { error?: string };

/** Cambia entre jugador y vendedor. Volverse tienda solo pasa al registrar una (#6); RLS lo impide aquí. */
export async function updateKind(_prev: KindState, formData: FormData): Promise<KindState> {
  const profile = await requireProfile();
  if (profile.kind === "store") return { error: "Una tienda no puede cambiar su tipo de cuenta." };
  const kind = validateSelfKind(formData.get("kind"));
  if (!kind.ok) return { error: kind.error };

  const supabase = await createClient();
  const { error } = await supabase.from("profile").update({ kind: kind.value }).eq("id", profile.id);
  if (error) return { error: "No pudimos cambiar el tipo de cuenta. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return {};
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
