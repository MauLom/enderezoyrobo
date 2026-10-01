import type { Metadata } from "next";
import { Icon } from "@/app/_components/icon";
import { PageHeader } from "@/app/_components/page-header";
import { ui } from "@/app/ui";
import { initials } from "@/lib/marketplace/listings";
import { requireProfile } from "@/supabase/session";
import { signOut } from "./actions";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi cuenta · Mazo" };

export default async function CuentaPage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader eyebrow="MI CUENTA" title={profile.displayName} description={profile.email ?? undefined} />
      <div className={ui.narrow}>
        <section className={`${ui.card} flex flex-col gap-5`}>
          <div className="flex items-center gap-3">
            <div className="avatar">{initials(profile.displayName)}</div>
            <div>
              <p className={ui.h3}>Perfil</p>
              <p className={ui.muted}>Así te ven las tiendas y otros jugadores.</p>
            </div>
          </div>
          <ProfileForm displayName={profile.displayName} />
        </section>
        <form action={signOut}>
          <button type="submit" className={ui.buttonSecondary}>
            <Icon name="logout" size={14} /> Salir
          </button>
        </form>
      </div>
    </>
  );
}
