import Link from "next/link";
import { getCurrentProfile } from "@/supabase/session";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="border-b border-foreground/10">
      <nav className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">
          Mazo
        </Link>
        {profile ? (
          <Link href="/cuenta" className="text-sm">
            {profile.displayName}
          </Link>
        ) : (
          <Link href="/entrar" className="text-sm font-medium">
            Entrar
          </Link>
        )}
      </nav>
    </header>
  );
}
