import type { EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { HOME_PATH } from "@/lib/account/validation";
import { createClient } from "@/supabase/server";

/**
 * Destino del enlace del correo de acceso (plantilla supabase/templates/codigo.html):
 *   /auth/confirmar?token_hash=...&type=email
 * Verifica el token, abre la sesión y manda a la página de inicio con sesión.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) return NextResponse.redirect(new URL(HOME_PATH, request.url));
  }
  return NextResponse.redirect(new URL("/entrar?error=enlace", request.url));
}
