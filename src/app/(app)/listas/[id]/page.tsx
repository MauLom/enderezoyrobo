import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Icon } from "@/app/_components/icon";
import { PageHeader } from "@/app/_components/page-header";
import { ui } from "@/app/ui";
import { CONDITIONS } from "@/lib/cards/condition";
import { formatForeign, formatMxn, toMxnCents } from "@/lib/pricing/mxn";
import { getDealContacts } from "@/supabase/contacts";
import { getCurrentProfile } from "@/supabase/session";
import { getWantListDetail, type WantListItemView } from "@/supabase/want-lists";
import { deleteItem, deleteList, renameList, setListPublic, updateItem } from "../actions";
import { CopyLink } from "./copy-link";
import { computeMatching } from "./matching";
import { StoreResult } from "./store-result";

export async function generateMetadata({ params }: PageProps<"/listas/[id]">): Promise<Metadata> {
  const { id } = await params;
  const list = await getWantListDetail(id);
  return { title: list ? `${list.name} · Mazo` : "Lista no encontrada · Mazo" };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function ListaPage({ params }: PageProps<"/listas/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const [list, profile] = await Promise.all([getWantListDetail(id), getCurrentProfile()]);
  if (!list) notFound();

  const isOwner = profile?.id === list.ownerId;
  // Sin sesión (lista pública) solo se ven los WhatsApp de las tiendas.
  const matching = computeMatching(list, profile ? await getDealContacts() : new Map());
  const cardCount = list.items.reduce((sum, i) => sum + i.quantity, 0);
  const best = matching.best;

  const referencePrice = (item: WantListItemView) => {
    if (!item.referenceUsd) return "—";
    return list.usdRate ? formatMxn(toMxnCents(item.referenceUsd, list.usdRate)) : formatForeign(item.referenceUsd, "USD");
  };

  return (
    <>
      <PageHeader
        eyebrow={isOwner ? "MI WANT LIST" : `WANT LIST DE ${list.ownerName.toUpperCase()}`}
        title={list.name}
        description={
          <>
            {cardCount === 1 ? "1 carta" : `${cardCount} cartas`} · {list.isPublic ? "pública" : "privada"}
            {isOwner && list.isPublic && " · cualquiera con el enlace puede verla"}
          </>
        }
      >
        {isOwner && (
          <>
            {list.isPublic && <CopyLink />}
            <form action={setListPublic.bind(null, list.id, !list.isPublic)}>
              <button type="submit" className={ui.buttonSecondary}>
                {list.isPublic ? "Hacer privada" : "Hacer pública"}
              </button>
            </form>
          </>
        )}
      </PageHeader>

      <div className={ui.page}>
        <section className="flex flex-col gap-4">
          <div className="section-heading">
            <div>
              <h2>Dónde conseguirlas</h2>
              <span>Con la condición, foil e idioma que pide cada carta</span>
            </div>
          </div>
          {matching.byStore.length === 0 ? (
            <div className="empty-state">
              <p>Ninguna tienda tiene todavía cartas de esta lista que cumplan lo que pides.</p>
            </div>
          ) : (
            <>
              {best && best.storeIds.length > 1 && (
                <div className="rounded-xl border border-accent-border bg-[linear-gradient(145deg,#17141c,#20182b)] p-5">
                  <p className={ui.label}>Mejor combinación</p>
                  <p className="mt-2 text-sm">
                    {best.storeIds.map((s) => matching.sellers.get(s)?.sellerName).join(" + ")}:{" "}
                    <strong className="text-accent-soft">
                      {best.coveredQuantity} de {best.requestedQuantity} cartas por {formatMxn(best.totalMxnCents)}
                    </strong>
                  </p>
                  {best.missing.length > 0 && (
                    <p className={`${ui.muted} mt-1`}>Nadie tiene las {best.requestedQuantity - best.coveredQuantity} restantes.</p>
                  )}
                </div>
              )}
              <div className="grid gap-3 lg:grid-cols-2">
                {matching.byStore.map((result) => (
                  <StoreResult
                    key={result.storeIds[0]}
                    result={result}
                    seller={matching.sellers.get(result.storeIds[0])!}
                    inventoryById={matching.inventoryById}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <div className="section-heading">
            <div>
              <h2>Cartas</h2>
              <span>
                Referencia: lo más bajo en TCGplayer entre las impresiones que aceptas
                {list.usdRate ? ", en pesos" : " (en dólares: aún no hay tipo de cambio)"}
              </span>
            </div>
          </div>
          <ul className="flex flex-col rounded-xl border border-line bg-paper">
            {list.items.map((item) => {
              const sellers = matching.sellersPerItem.get(item.id) ?? 0;
              return (
                <li key={item.id} className="flex items-center gap-3 border-t border-line-soft px-4 py-3 first:border-t-0">
                  {item.imageUri ? (
                    // eslint-disable-next-line @next/next/no-img-element -- imágenes de Scryfall sin optimizador
                    <img src={item.imageUri} alt="" width={40} height={56} className={ui.cardThumb} loading="lazy" />
                  ) : (
                    <div className={`h-14 w-10 ${ui.thumbPlaceholder}`} />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold">
                      <span className="text-muted">{item.quantity}×</span> {item.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {item.setCode ? `Solo ${item.setCode.toUpperCase()}` : "Cualquier impresión"} · {item.minCondition} o mejor
                      {item.foil === "yes" ? " · foil" : item.foil === "no" ? " · no foil" : ""}
                      {item.language ? ` · ${item.language.toUpperCase()}` : ""}
                    </p>
                    <p className={`mt-0.5 text-[11px] font-semibold ${sellers === 0 ? "text-danger" : "text-accent-soft"}`}>
                      {sellers === 0 ? "Nadie la tiene" : `La tienen ${sellers} ${sellers === 1 ? "vendedor" : "vendedores"}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-extrabold text-accent">{referencePrice(item)}</p>
                    <p className="text-[10px] text-muted">referencia</p>
                  </div>
                  {isOwner && (
                    <details className="relative">
                      <summary
                        className="grid size-8 cursor-pointer list-none place-items-center rounded-full border border-line text-muted transition hover:border-accent hover:text-ink"
                        aria-label={`Editar ${item.name}`}
                      >
                        <Icon name="edit" size={14} />
                      </summary>
                      <div className="absolute right-0 z-10 mt-2 flex w-60 flex-col gap-3 rounded-xl border border-line bg-cream p-4 shadow-[0_16px_42px_rgba(0,0,0,.45)]">
                        <form action={updateItem.bind(null, list.id, item.id)} className="flex flex-col gap-2 text-xs">
                          <label className="flex items-center justify-between gap-2">
                            Cantidad
                            <input name="quantity" type="number" min={1} max={999} defaultValue={item.quantity} className={`${ui.select} w-20`} />
                          </label>
                          <label className="flex items-center justify-between gap-2">
                            Condición mínima
                            <select name="minCondition" defaultValue={item.minCondition} className={ui.select}>
                              {CONDITIONS.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label className="flex items-center justify-between gap-2">
                            Foil
                            <select name="foil" defaultValue={item.foil} className={ui.select}>
                              <option value="any">Indistinto</option>
                              <option value="yes">Sí</option>
                              <option value="no">No</option>
                            </select>
                          </label>
                          <button type="submit" className={`${ui.button} ${ui.buttonSmall}`}>
                            Guardar
                          </button>
                        </form>
                        <form action={deleteItem.bind(null, list.id, item.id)}>
                          <button type="submit" className={`${ui.buttonDanger} w-full`}>
                            Quitar de la lista
                          </button>
                        </form>
                      </div>
                    </details>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {isOwner && (
          <section className={`${ui.card} flex flex-col gap-4`}>
            <h2 className={ui.h3}>Ajustes de la lista</h2>
            <form action={renameList.bind(null, list.id)} className="flex flex-wrap items-center gap-2">
              <label htmlFor="rename" className="sr-only">
                Nombre
              </label>
              <input id="rename" name="name" defaultValue={list.name} maxLength={80} className={`${ui.input} max-w-xs`} />
              <button type="submit" className={ui.buttonSecondary}>
                Renombrar
              </button>
            </form>
            <details>
              <summary className="cursor-pointer text-xs font-bold text-danger">Borrar lista</summary>
              <form action={deleteList.bind(null, list.id)} className="mt-3 flex flex-wrap items-center gap-3">
                <p className={ui.muted}>Se borra la lista y sus ofertas. No se puede deshacer.</p>
                <button type="submit" className={ui.buttonDanger}>
                  <Icon name="trash" size={14} /> Sí, borrar
                </button>
              </form>
            </details>
          </section>
        )}
      </div>
    </>
  );
}
