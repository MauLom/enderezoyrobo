import type { Metadata } from "next";
import { Icon } from "@/app/_components/icon";
import { PageHeader } from "@/app/_components/page-header";
import { ui } from "@/app/ui";
import { ACCOUNT_KINDS } from "@/lib/account/kind";
import { initials } from "@/lib/marketplace/listings";
import { getMyWhatsapp } from "@/supabase/contacts";
import { requireProfile } from "@/supabase/session";
import { signOut } from "./actions";
import { ContactForm } from "./contact-form";
import { KindForm } from "./kind-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Mi cuenta · Mazo" };

export default async function CuentaPage() {
  const profile = await requireProfile();
  const whatsapp = await getMyWhatsapp(profile.id);

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
        <section className={`${ui.card} flex flex-col gap-5`}>
          <div className="flex items-center gap-3">
            <div className="avatar"><Icon name="message" size={16} /></div>
            <div>
              <p className={ui.h3}>Contacto</p>
              <p className={ui.muted}>
                {profile.deliveryZone ? `Entregas en ${profile.deliveryZone}.` : "Para cerrar tratos por WhatsApp."}
              </p>
            </div>
          </div>
          <ContactForm whatsapp={whatsapp} deliveryZone={profile.deliveryZone} />
        </section>
        <section className={`${ui.card} flex flex-col gap-4`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className={ui.h3}>Tipo de cuenta</p>
              <p className={ui.muted}>{ACCOUNT_KINDS[profile.kind].description}</p>
            </div>
            <span className={ui.badgeAccent}>{ACCOUNT_KINDS[profile.kind].label}</span>
          </div>
          {profile.kind === "seller" && (
            <p className={ui.muted}>
              Pronto podrás cargar las cartas que vendes en &quot;Mi inventario&quot;.
            </p>
          )}
          {profile.kind !== "store" && <KindForm kind={profile.kind} />}
        </section>
        {profile.kind !== "store" && (
          <section className={`${ui.card} flex flex-col gap-4`}>
            <div className="flex items-center gap-3">
              <div className="avatar"><Icon name="store" size={16} /></div>
              <div>
                <p className={ui.h3}>¿Tienes una tienda?</p>
                <p className={ui.muted}>
                  Regístrala con nombre, dirección y WhatsApp. La revisamos a mano antes de darle la insignia de
                  verificada.
                </p>
              </div>
            </div>
            {/* Placeholder: el formulario de registro de tienda llega con el issue #6. */}
            <button type="button" disabled aria-disabled="true" className={`${ui.buttonSecondary} self-start`}>
              Registrar mi tienda <span className={ui.badge}>Pronto</span>
            </button>
          </section>
        )}
        <form action={signOut}>
          <button type="submit" className={ui.buttonSecondary}>
            <Icon name="logout" size={14} /> Salir
          </button>
        </form>
      </div>
    </>
  );
}
