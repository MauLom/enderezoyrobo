import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/supabase/proxy";

// Rutas que requieren sesión. Es una revisión optimista: cada página vuelve a
// verificar con requireProfile, y RLS protege los datos.
const PROTECTED = ["/cuenta"];

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  const path = request.nextUrl.pathname;

  if (!userId && PROTECTED.some((p) => path === p || path.startsWith(`${p}/`))) {
    return NextResponse.redirect(new URL("/entrar", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv)$).*)"],
};
