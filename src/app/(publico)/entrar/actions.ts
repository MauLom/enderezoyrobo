"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { safeNextPath, validateEmail, validateOtp } from "@/lib/account/validation";
import { createAdminClient, devLoginEnabled } from "@/supabase/admin";
import { createClient } from "@/supabase/server";

export type LoginState =
  | { step: "email"; email?: string; error?: string }
  | { step: "code"; email: string; error?: string };

/**
 * Entrar con código de un solo uso por correo, en dos pasos: `intent=send`
 * manda el código (y crea la cuenta si no existe); `intent=verify` lo verifica
 * y abre la sesión; `intent=restart` vuelve a pedir el correo.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const intent = formData.get("intent");
  const rawEmail = String(formData.get("email") ?? "");
  if (intent === "restart") return { step: "email", email: rawEmail };

  const email = validateEmail(rawEmail);
  if (!email.ok) return { step: "email", email: rawEmail, error: email.error };
  const supabase = await createClient();

  if (intent === "verify") {
    const code = validateOtp(String(formData.get("code") ?? ""));
    if (!code.ok) return { step: "code", email: email.value, error: code.error };

    const { error } = await supabase.auth.verifyOtp({ email: email.value, token: code.value, type: "email" });
    if (error) return { step: "code", email: email.value, error: "El código no es válido o ya venció." };
    redirect(safeNextPath(formData.get("next")));
  }

  const { error } = await supabase.auth.signInWithOtp({ email: email.value, options: { shouldCreateUser: true } });
  if (error) {
    return {
      step: "email",
      email: email.value,
      error:
        error.status === 429
          ? "Se alcanzó el límite de correos por ahora. Espera unos minutos y vuelve a intentar."
          : "No pudimos mandar el código. Intenta de nuevo.",
    };
  }
  return { step: "code", email: email.value };
}

export type DevLoginState = { error?: string };

/**
 * Entrar sin correo, solo en desarrollo: genera el token con la llave secreta
 * (sin mandar correo ni gastar el límite de envíos) y abre la sesión con él.
 * Crea la cuenta si no existe.
 */
export async function devLogin(_prev: DevLoginState, formData: FormData): Promise<DevLoginState> {
  if (!devLoginEnabled()) return { error: "El acceso de desarrollo no está disponible." };

  const email = validateEmail(String(formData.get("email") ?? ""));
  if (!email.ok) return { error: email.error };

  // Si la cuenta no existe, generateLink la crea y el token es de tipo "signup"
  // en vez de "magiclink"; por eso se verifica con el tipo que devuelve.
  const admin = createAdminClient();
  const link = await admin.auth.admin.generateLink({ type: "magiclink", email: email.value });
  if (link.error) return { error: `No se pudo generar el acceso: ${link.error.message}` };
  const { hashed_token: tokenHash, verification_type: type } = link.data.properties;

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType });
  if (error) return { error: `No se pudo abrir la sesión: ${error.message}` };
  redirect(safeNextPath(formData.get("next")));
}
