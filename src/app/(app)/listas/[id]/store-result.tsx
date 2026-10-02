import Link from "next/link";
import { SellerBadges } from "@/app/_components/seller-badges";
import { ui } from "@/app/ui";
import { orderMessage, whatsappLink } from "@/lib/contact/whatsapp";
import type { MatchResult } from "@/lib/matching/match";
import { formatMxn } from "@/lib/pricing/mxn";
import type { InventoryRow } from "@/supabase/inventory";
import type { SellerInfo } from "./matching";

type Props = {
  result: MatchResult;
  seller: SellerInfo;
  inventoryById: Map<string, InventoryRow>;
};

/** Lo que un vendedor cubre de la lista, con enlace para pedirlo por WhatsApp. */
export function StoreResult({ result, seller, inventoryById }: Props) {
  const lines = result.allocations.map((a) => {
    const row = inventoryById.get(a.inventoryItemId)!;
    return { allocation: a, row };
  });
  const detail = (row: InventoryRow) =>
    [`${row.setCode.toUpperCase()} ${row.collectorNumber}`, row.condition, row.foil ? "foil" : null, row.language !== "en" ? row.language.toUpperCase() : null]
      .filter(Boolean)
      .join(", ");

  const message = orderMessage(
    seller.sellerName,
    lines.map(({ allocation, row }) => ({
      quantity: allocation.quantity,
      name: row.cardName,
      detail: detail(row),
      unitPriceMxn: formatMxn(allocation.unitPriceMxnCents),
    })),
    formatMxn(result.totalMxnCents),
  );
  const link = seller.whatsapp ? whatsappLink(seller.whatsapp, message) : null;

  return (
    <article className={`${ui.card} flex flex-col gap-4`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className={ui.h3}>
            {seller.isStore ? (
              <Link href={`/tiendas/${seller.sellerId}`} className="transition hover:text-accent-soft">
                {seller.sellerName}
              </Link>
            ) : (
              seller.sellerName
            )}
          </h3>
          <div className="mt-2">
            <SellerBadges isStore={seller.isStore} verified={seller.verified} inventoryUpdatedAt={seller.inventoryUpdatedAt} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-accent-soft">{formatMxn(result.totalMxnCents)}</p>
          <p className={ui.muted}>
            {result.coveredQuantity} de {result.requestedQuantity} cartas ({Math.round(result.coverage * 100)} %)
          </p>
        </div>
      </header>

      <details>
        <summary className="cursor-pointer text-xs font-bold text-accent-soft">Ver cartas</summary>
        <ul className="mt-2 flex flex-col gap-1.5 text-xs">
          {lines.map(({ allocation, row }) => (
            <li key={allocation.inventoryItemId} className="flex justify-between gap-2">
              <span>
                {allocation.quantity}× {row.cardName} <span className="text-muted">({detail(row)})</span>
              </span>
              <span className="whitespace-nowrap font-bold">{formatMxn(allocation.unitPriceMxnCents)} c/u</span>
            </li>
          ))}
        </ul>
      </details>

      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className={`${ui.button} self-start`}>
          Pedir por WhatsApp
        </a>
      ) : (
        <p className={ui.muted}>
          {seller.isStore
            ? "Esta tienda no tiene WhatsApp registrado."
            : "El WhatsApp de un vendedor particular se comparte cuando acepta una oferta contigo."}
        </p>
      )}
    </article>
  );
}
