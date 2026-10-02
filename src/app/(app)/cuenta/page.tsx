import type { Metadata } from "next";
import { Icon } from "@/app/_components/icon";
import { PageHeader } from "@/app/_components/page-header";
import { ui } from "@/app/ui";
import { ACCOUNT_KINDS } from "@/lib/account/kind";
import { STORE_STATUS_LABEL, type StoreStatus } from "@/lib/account/store";
import { initials } from "@/lib/marketplace/listings";
import { getMyWhatsapp } from "@/supabase/contacts";
import { requireProfile } from "@/supabase/session";
import { getMyStore } from "@/supabase/stores";
import { signOut } from "./actions";
import { ContactForm } from "./contact-form";
import { KindForm } from "./kind-form";
import { ProfileForm } from "./profile-form";
import { StoreForm } from "./store-form";

export const metadata: Metadata = { title: "Mi cuenta · Mazo" };

const STATUS_BADGE: Record<StoreStatus, string> = {
  pending: ui.badgeWarn,
  verified: ui.badgeAccent,
  rejected: ui.badge,
};

const STATUS_HELP: Record<StoreStatus, string> = {
  pending: "La revisamos a mano (tienda física, WhatsApp y responsable). Mientras, tu inventario se ve sin la insignia.",
  verified: "Tu tienda tiene la insignia de verificada en el marketplace y en las listas.",
  rejected: "Corrige los datos y guarda: la tienda vuelve a revisión.",
};

export default async function CuentaPage() {
  const profile = await requireProfile();
  const [whatsapp, store] = await Promise.all([getMyWhatsapp(profile.id), getMyStore(profile.id)]);

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
        {store ? (
          <section className={`${ui.card} flex flex-col gap-4`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="avatar"><Icon name="store" size={16} /></div>
                <div>
                  <p className={ui.h3}>Mi tienda</p>
                  <p className={ui.muted}>{STATUS_HELP[store.status]}</p>
                </div>
              </div>
              <span className={`${STATUS_BADGE[store.status]} shrink-0`}>{STORE_STATUS_LABEL[store.status]}</span>
            </div>
            {store.rejectionReason && (
              <div className={ui.boxError} role="status">
                <p className="font-bold text-danger">Motivo del rechazo</p>
                <p className="mt-1">{store.rejectionReason}</p>
              </div>
            )}
            <StoreForm store={store} />
          </section>
        ) : (
          <section className={`${ui.card} flex flex-col gap-4`}>
            <div className="flex items-center gap-3">
              <div className="avatar"><Icon name="store" size={16} /></div>
              <div>
                <p className={ui.h3}>¿Tienes una tienda?</p>
                <p className={ui.muted}>
                  Regístrala con nombre, dirección y WhatsApp. La revisamos a mano antes de darle la insignia de
                  verificada. Tu cuenta pasa a ser de tienda y ya no podrás cambiarla a jugador o vendedor.
                </p>
              </div>
            </div>
            <details className="group">
              <summary className={`${ui.buttonSecondary} cursor-pointer list-none group-open:hidden`}>
                Registrar mi tienda
              </summary>
              <StoreForm store={null} />
            </details>
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
