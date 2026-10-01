"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
