import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Acceso de desarrollo: solo existe en `next dev` y con SUPABASE_SECRET_KEY.
 * En el build de producción NODE_ENV es "production" y esto siempre es false.
 */
export function devLoginEnabled(): boolean {
  return process.env.NODE_ENV === "development" && Boolean(process.env.SUPABASE_SECRET_KEY);
}

/** Cliente con la llave secreta: se salta RLS. Solo para el acceso de desarrollo. */
export function createAdminClient() {
  if (!devLoginEnabled()) throw new Error("El cliente admin solo está disponible en desarrollo");
  const { url } = supabaseEnv();
  return createClient<Database>(url, process.env.SUPABASE_SECRET_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
