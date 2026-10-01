import "server-only";
import { createClient } from "./server";

/**
 * WhatsApp de las personas con las que el usuario tiene una oferta aceptada,
 * por id de perfil. Requiere sesión; sin ella, llamar con un mapa vacío.
 */
export async function getDealContacts(): Promise<Map<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("whatsapp_de_mis_tratos");
  if (error) throw error;
  return new Map(data.map((c) => [c.profile_id, c.whatsapp]));
}
