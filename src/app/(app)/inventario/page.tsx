import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/app/_components/icon";
import { PageHeader } from "@/app/_components/page-header";
import { ui } from "@/app/ui";
import { SELLER_CARD_LIMIT } from "@/lib/catalog/resolve-inventory";
import { daysAgoLabel, formatMxn, isInventoryStale } from "@/lib/pricing/mxn";
import { getMyInventory } from "@/supabase/my-inventory";
import { requireProfile } from "@/supabase/session";
import { InventoryForm } from "./inventory-form";

export const metadata: Metadata = { title: "Mi inventario · Mazo" };

/** Inventario de tiendas y vendedores (#10): subir el CSV, revisar y reemplazar. */
export default async function InventarioPage() {
  const profile = await requireProfile();

  if (profile.kind === "player") {
    return (
      <>
        <PageHeader eyebrow="MI INVENTARIO" title="Vende tus cartas" description="El inventario es para vendedores y tiendas." />
        <div className="empty-state">
          <p>Cambia tu cuenta a vendedor en Mi cuenta para cargar las cartas que vendes con un CSV.</p>
          <Link href="/cuenta" className="text-button">
            Ir a Mi cuenta <Icon name="chevron" size={14} />
          </Link>
        </div>
      </>
    );
  }

  const inventory = await getMyInventory(profile.id);
  const distinct = inventory.items.length;
  const stale = inventory.updatedAt !== null && isInventoryStale(inventory.updatedAt);

  return (
    <>
      <PageHeader
        eyebrow="MI INVENTARIO"
        title="Mi inventario"
        description={
          distinct === 0
            ? "Todavía no cargas cartas. Sube tu CSV y aparecen en el marketplace y en el matching."
            : `${inventory.copies === 1 ? "1 carta" : `${inventory.copies} cartas`} (${distinct} distintas)${profile.kind === "seller" ? ` de ${SELLER_CARD_LIMIT} de tu plan` : ""}.`
        }
      >
        {profile.kind === "store" && (
          <Link href={`/tiendas/${profile.id}`} className={ui.buttonSecondary}>
            Ver mi tienda <Icon name="chevron" size={14} />
          </Link>
        )}
      </PageHeader>
      <div className={ui.page}>
        {inventory.updatedAt && (
          <div className="flex flex-wrap items-center gap-2">
            <span className={stale ? ui.badgeWarn : ui.badge}>Inventario actualizado {daysAgoLabel(inventory.updatedAt)}</span>
            {stale && <span className={ui.muted}>Súbelo de nuevo para que los jugadores confíen en tus existencias.</span>}
          </div>
        )}

        <InventoryForm hasInventory={distinct > 0} />

        {distinct > 0 && (
          <details className={ui.card}>
            <summary className={`${ui.h3} cursor-pointer`}>Tu inventario actual ({distinct} distintas)</summary>
            <ul className="mt-3 flex flex-col text-xs">
              {inventory.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 border-t border-line-soft py-2 first:border-t-0">
                  <span className="min-w-0">
                    <span className="font-bold">
                      {item.quantity}× {item.name}
                    </span>{" "}
                    <span className="text-muted">
                      {[`${item.setCode.toUpperCase()} ${item.collectorNumber}`, item.condition, item.language !== "en" ? item.language.toUpperCase() : null, item.foil ? "foil" : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                  <b className="whitespace-nowrap">{formatMxn(item.priceMxnCents)}</b>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </>
  );
}
