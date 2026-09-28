"use server";

import { redirect } from "next/navigation";
import { validateEmail, validateOtp } from "@/lib/account/validation";
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
    redirect("/cuenta");
  }

  const { error } = await supabase.auth.signInWithOtp({ email: email.value, options: { shouldCreateUser: true } });
  if (error) {
    return {
      step: "email",
      email: email.value,
      error:
        error.status === 429
          ? "Pediste muchos códigos seguidos. Espera un momento y vuelve a intentar."
          : "No pudimos mandar el código. Intenta de nuevo.",
    };
  }
  return { step: "code", email: email.value };
}
