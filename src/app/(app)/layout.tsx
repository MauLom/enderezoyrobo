import { AppShell } from "@/app/_components/app-shell";
import { getCurrentProfile } from "@/supabase/session";
import { getShellCounts } from "@/supabase/shell";

/**
 * Barra superior y menú lateral de la plataforma. También envuelve las listas
 * públicas, que se ven sin sesión; por eso el perfil puede ser null.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await getCurrentProfile();
  const counts = await getShellCounts(profile?.id ?? null);

  return (
    <AppShell user={profile ? { displayName: profile.displayName, email: profile.email } : null} counts={counts}>
      {children}
    </AppShell>
  );
}
