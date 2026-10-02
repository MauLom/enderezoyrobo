import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/app/_components/page-header";
import { ui } from "@/app/ui";
import { STORE_STATUS_LABEL, type StoreStatus } from "@/lib/account/store";
import { whatsappLink } from "@/lib/contact/whatsapp";
import { daysAgoLabel } from "@/lib/pricing/mxn";
import { requireProfile } from "@/supabase/session";
import { getStoresForReview, type StoreForReview } from "@/supabase/stores";
import { ReviewButtons } from "./review-buttons";

export const metadata: Metadata = { title: "Tiendas · Mazo" };

const STATUS_BADGE: Record<StoreStatus, string> = {
  pending: ui.badgeWarn,
  verified: ui.badgeAccent,
  rejected: ui.badge,
};

const SECTIONS: { status: StoreStatus; title: string; description: string; empty: string }[] = [
  { status: "pending", title: "Por revisar", description: "Tiendas registradas que esperan verificación", empty: "No hay tiendas por revisar." },
  { status: "rejected", title: "Rechazadas", description: "Vuelven a revisión cuando corrigen sus datos", empty: "No hay tiendas rechazadas." },
  { status: "verified", title: "Verificadas", description: "Tienen la insignia en el marketplace y en las listas", empty: "Todavía no hay tiendas verificadas." },
];

/** Revisión de tiendas: solo owners y moderadores (tabla staff). Para los demás, la página no existe. */
export default async function TiendasPage() {
  const profile = await requireProfile();
  if (!profile.staffRole) notFound();
  const stores = await getStoresForReview();
  const pending = stores.filter((s) => s.status === "pending").length;

  return (
    <>
      <PageHeader
        eyebrow={profile.staffRole === "owner" ? "ADMINISTRACIÓN · OWNER" : "ADMINISTRACIÓN · MODERADOR"}
        title="Tiendas"
        description={
          pending > 0
            ? `${pending === 1 ? "1 tienda espera" : `${pending} tiendas esperan`} revisión. Revisa que la tienda exista, que el WhatsApp conteste y quién la atiende.`
            : "Revisa que la tienda exista, que el WhatsApp conteste y quién la atiende antes de verificarla."
        }
      />
      <div className={ui.page}>
        {SECTIONS.map((section) => {
          const list = stores.filter((s) => s.status === section.status);
          return (
            <section key={section.status} className="flex flex-col gap-3">
              <div className="section-heading">
                <div>
                  <h2>
                    {section.title} {list.length > 0 && <span className="text-muted">· {list.length}</span>}
                  </h2>
                  <span>{section.description}</span>
                </div>
              </div>
              {list.length === 0 ? (
                <div className="empty-state">
                  <p>{section.empty}</p>
                </div>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {list.map((store) => (
                    <StoreCard key={store.id} store={store} />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

function StoreCard({ store }: { store: StoreForReview }) {
  const link = store.whatsapp ? whatsappLink(store.whatsapp, `Hola, te escribo de Mazo por el registro de ${store.name}.`) : null;

  return (
    <article className={`${ui.card} flex flex-col gap-3`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={ui.h3}>{store.name}</p>
          <p className={ui.muted}>Registrada {daysAgoLabel(store.createdAt)}</p>
        </div>
        <span className={STATUS_BADGE[store.status]}>{STORE_STATUS_LABEL[store.status]}</span>
      </header>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
        <dt className="text-muted">Dirección</dt>
        <dd>{store.address || "—"}</dd>
        <dt className="text-muted">WhatsApp</dt>
        <dd>
          {link ? (
            <a href={link} target="_blank" rel="noopener noreferrer" className={ui.link}>
              {store.whatsapp}
            </a>
          ) : (
            "—"
          )}
        </dd>
        <dt className="text-muted">Referencia</dt>
        <dd>{store.priceReferenceNote || "—"}</dd>
        <dt className="text-muted">Responsable</dt>
        <dd className="break-all">
          {store.ownerName} · {store.ownerEmail}
        </dd>
        <dt className="text-muted">Inventario</dt>
        <dd>{store.inventoryCount === 1 ? "1 carta" : `${store.inventoryCount} cartas`}</dd>
      </dl>
      {store.rejectionReason && (
        <div className={ui.boxError}>
          <p className="font-bold text-danger">Motivo del rechazo</p>
          <p className="mt-1">{store.rejectionReason}</p>
        </div>
      )}
      <ReviewButtons storeId={store.id} status={store.status} />
    </article>
  );
}
