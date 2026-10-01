import Link from "next/link";
import { getCurrentProfile } from "@/supabase/session";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-b border-foreground/10">
      <nav className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Mazo
        </Link>
        {profile ? (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/listas">Mis listas</Link>
            <Link href="/cuenta" className="opacity-70">
              {profile.displayName}
            </Link>
          </div>
        ) : (
          <Link href="/entrar" className="text-sm font-medium">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
