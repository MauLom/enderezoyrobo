import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/supabase/proxy";

// Rutas que requieren sesión. Es una revisión optimista: cada página vuelve a
// verificar con requireProfile, y RLS protege los datos. /listas/[id] no está:
// las listas públicas se ven sin sesión.
const PROTECTED_PREFIXES = ["/cuenta", "/tiendas"];
const PROTECTED_EXACT = ["/listas", "/listas/nueva", "/dashboard"];

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const path = request.nextUrl.pathname;

  const isProtected =
    PROTECTED_EXACT.includes(path) || PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
  if (!userId && isProtected) {
    const login = new URL("/entrar", request.url);
    login.searchParams.set("siguiente", path);
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv)$).*)"],
};
