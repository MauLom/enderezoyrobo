import { ui } from "@/app/ui";
import { orderMessage, whatsappLink } from "@/lib/contact/whatsapp";
import type { MatchResult } from "@/lib/matching/match";
import { daysAgoLabel, daysSince, formatMxn } from "@/lib/pricing/mxn";
import type { InventoryRow } from "@/supabase/want-lists";
import type { SellerInfo } from "./matching";

const STALE_DAYS = 30;

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
  const stale = daysSince(seller.inventoryUpdatedAt) > STALE_DAYS;

  return (
    <article className={`${ui.card} flex flex-col gap-3`}>
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold">{seller.sellerName}</h3>
          <div className="mt-1 flex flex-wrap gap-2 text-xs">
            {seller.isStore ? (
              <span className={ui.badge}>{seller.verified ? "✓ Tienda verificada" : "Tienda sin verificar"}</span>
            ) : (
              <span className={ui.badge}>Vendedor</span>
            )}
            <span className={`${ui.badge} ${stale ? "border-amber-500/60" : ""}`}>
              Inventario actualizado {daysAgoLabel(seller.inventoryUpdatedAt)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold">{formatMxn(result.totalMxnCents)}</p>
          <p className={ui.muted}>
            {result.coveredQuantity} de {result.requestedQuantity} cartas ({Math.round(result.coverage * 100)} %)
          </p>
        </div>
      </header>

      <details>
        <summary className="cursor-pointer text-sm">Ver cartas</summary>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {lines.map(({ allocation, row }) => (
            <li key={allocation.inventoryItemId} className="flex justify-between gap-2">
              <span>
                {allocation.quantity}× {row.cardName} <span className="opacity-60">({detail(row)})</span>
              </span>
              <span className="whitespace-nowrap">{formatMxn(allocation.unitPriceMxnCents)} c/u</span>
            </li>
          ))}
        </ul>
      </details>

      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className={`${ui.button} self-start text-sm`}>
          Pedir por WhatsApp
        </a>
      ) : (
        <p className={ui.muted}>Este vendedor no tiene WhatsApp registrado.</p>
      )}
    </article>
  );
}
