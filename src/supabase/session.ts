import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createClient } from "./server";

export type Profile = {
  id: string;
  email: string | null;
  displayName: string;
  kind: "player" | "seller" | "store";
  deliveryZone: string | null;
};

/**
 * Perfil del usuario con sesión, o null. getClaims verifica el JWT, así que es
 * seguro para decidir acceso (a diferencia de getSession). Se memoiza por request.
 */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return null;

  const { data, error } = await supabase
    .from("profile")
    .select("id, display_name, kind, delivery_zone")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  // Token válido de un usuario que ya no existe (p. ej., borrado): se trata como sin sesión.
  if (!data) return null;

  return {
    id: data.id,
    email: typeof auth.claims.email === "string" ? auth.claims.email : null,
    displayName: data.display_name,
    kind: data.kind,
    deliveryZone: data.delivery_zone,
  };
});

/** Igual que getCurrentProfile, pero manda a /entrar si no hay sesión. */
export async function requireProfile(): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/entrar");
  return profile;
}
