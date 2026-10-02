"use server";

import { revalidatePath } from "next/cache";
import { validateRejectionReason } from "@/lib/account/store";
import { createClient } from "@/supabase/server";
import { requireProfile } from "@/supabase/session";

export type ReviewState = { error?: string };

/**
 * Verificar, rechazar (con motivo) o quitar la verificación de una tienda.
 * Las funciones de la base revisan que quien llama sea staff.
 */
export async function reviewStore(storeId: string, _prev: ReviewState, formData: FormData): Promise<ReviewState> {
  const profile = await requireProfile();
  if (!profile.staffRole) return { error: "Solo owners y moderadores revisan tiendas." };

  const supabase = await createClient();
  const decision = formData.get("decision");
  let result;
  if (decision === "verify") {
    result = await supabase.rpc("verificar_tienda", { tienda: storeId });
  } else if (decision === "unverify") {
    result = await supabase.rpc("quitar_verificacion", { tienda: storeId });
  } else if (decision === "reject") {
    const reason = validateRejectionReason(String(formData.get("reason") ?? ""));
    if (!reason.ok) return { error: reason.error };
    result = await supabase.rpc("rechazar_tienda", { tienda: storeId, motivo: reason.value });
  } else {
    return { error: "Acción no válida." };
  }
  if (result.error) return { error: "No pudimos guardar la revisión. Intenta de nuevo." };

  revalidatePath("/", "layout");
  return {};
}
