import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ui } from "@/app/ui";
import { CONDITIONS } from "@/lib/cards/condition";
import { formatForeign, formatMxn, toMxnCents } from "@/lib/pricing/mxn";
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
  const matching = computeMatching(list);
  const cardCount = list.items.reduce((sum, i) => sum + i.quantity, 0);
  const best = matching.best;

  const referencePrice = (item: WantListItemView) => {
    if (!item.referenceUsd) return "—";
    return list.usdRate ? formatMxn(toMxnCents(item.referenceUsd, list.usdRate)) : formatForeign(item.referenceUsd, "USD");
  };

  return (
    <main className={ui.page}>
      <header className="flex flex-col gap-3">
        {isOwner && (
          <Link href="/listas" className={`${ui.muted} ${ui.link}`}>
            ← Mis listas
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className={ui.h1}>{list.name}</h1>
          <span className={ui.badge}>{list.isPublic ? "Pública" : "Privada"}</span>
        </div>
        <p className={ui.muted}>
          {cardCount} cartas{!isOwner && ` · lista de ${list.ownerName}`}
        </p>

        {isOwner && (
          <div className="flex flex-wrap items-center gap-4">
            <form action={setListPublic.bind(null, list.id, !list.isPublic)}>
              <button type="submit" className={`${ui.buttonSecondary} text-sm`}>
                {list.isPublic ? "Hacer privada" : "Hacer pública"}
              </button>
            </form>
            {list.isPublic && <CopyLink />}
          </div>
        )}
        {isOwner && list.isPublic && (
          <p className={ui.muted}>Cualquiera con el enlace puede ver esta lista y qué tiendas la tienen.</p>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <h2 className={ui.h2}>Dónde conseguirlas</h2>
        {matching.byStore.length === 0 ? (
          <p className={ui.card}>Ninguna tienda tiene todavía cartas de esta lista que cumplan lo que pides.</p>
        ) : (
          <>
            {best && best.storeIds.length > 1 && (
              <div className={`${ui.card} border-foreground/40`}>
                <p className="text-sm font-medium">Mejor combinación</p>
                <p className="mt-1">
                  {best.storeIds.map((s) => matching.sellers.get(s)?.sellerName).join(" + ")}:{" "}
                  <strong>
                    {best.coveredQuantity} de {best.requestedQuantity} cartas por {formatMxn(best.totalMxnCents)}
                  </strong>
                </p>
                {best.missing.length > 0 && (
                  <p className={ui.muted}>Nadie tiene las {best.requestedQuantity - best.coveredQuantity} restantes.</p>
                )}
              </div>
            )}
            <div className="flex flex-col gap-3">
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
        <h2 className={ui.h2}>Cartas</h2>
        <p className={ui.muted}>
          Precio de referencia: el más bajo en TCGplayer entre las impresiones que aceptas
          {list.usdRate ? ", convertido a pesos." : " (en dólares: todavía no hay tipo de cambio cargado)."}
        </p>
        <ul className="flex flex-col divide-y divide-foreground/10">
          {list.items.map((item) => {
            const sellers = matching.sellersPerItem.get(item.id) ?? 0;
            return (
              <li key={item.id} className="flex items-center gap-3 py-2">
                {item.imageUri ? (
                  // eslint-disable-next-line @next/next/no-img-element -- imágenes de Scryfall sin optimizador
                  <img src={item.imageUri} alt="" width={48} height={67} className="rounded-sm" loading="lazy" />
                ) : (
                  <div className="h-[67px] w-12 rounded-sm bg-foreground/10" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {item.quantity}× {item.name}
                  </p>
                  <p className="text-xs opacity-70">
                    {item.setCode ? `Solo ${item.setCode.toUpperCase()}` : "Cualquier impresión"} · {item.minCondition} o mejor
                    {item.foil === "yes" ? " · foil" : item.foil === "no" ? " · no foil" : ""}
                    {item.language ? ` · ${item.language.toUpperCase()}` : ""}
                  </p>
                  <p className={`text-xs ${sellers === 0 ? "text-red-600" : "opacity-70"}`}>
                    {sellers === 0 ? "Nadie la tiene" : `La tienen ${sellers} ${sellers === 1 ? "vendedor" : "vendedores"}`}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p>{referencePrice(item)}</p>
                  <p className="text-xs opacity-60">referencia</p>
                </div>
                {isOwner && (
                  <details className="relative">
                    <summary className="cursor-pointer list-none px-2 text-lg" aria-label={`Editar ${item.name}`}>
                      ⋯
                    </summary>
                    <div className="absolute right-0 z-10 mt-1 flex w-56 flex-col gap-2 rounded-md border border-foreground/20 bg-background p-3 shadow-lg">
                      <form action={updateItem.bind(null, list.id, item.id)} className="flex flex-col gap-2 text-sm">
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
                        <button type="submit" className={`${ui.button} py-1 text-sm`}>
                          Guardar
                        </button>
                      </form>
                      <form action={deleteItem.bind(null, list.id, item.id)}>
                        <button type="submit" className="text-sm text-red-600 underline">
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
        <section className="flex flex-col gap-3 border-t border-foreground/10 pt-6">
          <form action={renameList.bind(null, list.id)} className="flex flex-wrap items-center gap-2">
            <label htmlFor="rename" className="text-sm">
              Nombre
            </label>
            <input id="rename" name="name" defaultValue={list.name} maxLength={80} className={`${ui.input} max-w-xs py-1`} />
            <button type="submit" className={`${ui.buttonSecondary} py-1 text-sm`}>
              Renombrar
            </button>
          </form>
          <details>
            <summary className="cursor-pointer text-sm text-red-600">Borrar lista</summary>
            <form action={deleteList.bind(null, list.id)} className="mt-2 flex items-center gap-3">
              <p className="text-sm">Se borra la lista y sus ofertas. No se puede deshacer.</p>
              <button type="submit" className="rounded-md bg-red-600 px-3 py-1 text-sm font-medium text-white">
                Sí, borrar
              </button>
            </form>
          </details>
        </section>
      )}
    </main>
  );
}
