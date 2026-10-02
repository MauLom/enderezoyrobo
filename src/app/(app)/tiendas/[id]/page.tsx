import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/app/_components/icon";
import { PageHeader } from "@/app/_components/page-header";
import { SellerBadges } from "@/app/_components/seller-badges";
import { ui } from "@/app/ui";
import { whatsappLink } from "@/lib/contact/whatsapp";
import { getPublicStore } from "@/supabase/stores";
import { StoreInventory } from "./store-inventory";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({ params }: PageProps<"/tiendas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const store = UUID.test(id) ? await getPublicStore(id) : null;
  return { title: store ? `${store.name} · Mazo` : "Tienda no encontrada · Mazo" };
}

/** Página pública de una tienda (#7): se ve sin sesión. El id es el de su perfil. */
export default async function TiendaPage({ params }: PageProps<"/tiendas/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const store = await getPublicStore(id);
  if (!store) notFound();

  const link = store.whatsapp ? whatsappLink(store.whatsapp, `Hola, ${store.name}. Te escribo desde Mazo.`) : null;
  const cardCount = store.listings.length;

  return (
    <>
      <PageHeader eyebrow="TIENDA" title={store.name} description={store.address ?? undefined}>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="publish-button">
            <Icon name="message" size={18} /> Escribir por WhatsApp
          </a>
        )}
      </PageHeader>
      <div className={ui.page}>
        <section className={`${ui.card} flex flex-col gap-3`}>
          <SellerBadges isStore verified={store.verified} inventoryUpdatedAt={store.inventoryUpdatedAt} />
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
            <dt className="text-muted">Dirección</dt>
            <dd>{store.address || "Sin dirección registrada"}</dd>
            <dt className="text-muted">Referencia de precio</dt>
            <dd>{store.priceReferenceNote || "No la ha declarado"}</dd>
            <dt className="text-muted">WhatsApp</dt>
            <dd>{store.whatsapp ?? "No tiene WhatsApp registrado"}</dd>
          </dl>
          {!store.verified && (
            <p className={ui.muted}>
              Todavía no la verificamos. La insignia se da a mano después de revisar que la tienda exista y conteste.
            </p>
          )}
        </section>

        <section className="listing-section">
          <div className="section-heading">
            <div>
              <h2>Inventario</h2>
              <span>{cardCount === 1 ? "1 carta" : `${cardCount} cartas`} con existencias</span>
            </div>
          </div>
          {cardCount === 0 ? (
            <div className="empty-state">
              <p>Esta tienda todavía no ha cargado inventario.</p>
            </div>
          ) : (
            <StoreInventory listings={store.listings} />
          )}
        </section>
      </div>
    </>
  );
}
