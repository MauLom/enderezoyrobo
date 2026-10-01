"use client";

import { useActionState, useState } from "react";
import { ui } from "@/app/ui";
import { draftTotal, MAX_OFFER_MESSAGE } from "@/lib/offers/offers";
import { formatMxn } from "@/lib/pricing/mxn";
import { makeOffer, type OfferState } from "../actions";

export type OfferLine = {
  wantItemId: string;
  name: string;
  detail: string;
  requested: number;
  /** Precio de cada copia que cubre el inventario del vendedor, de la más barata a la más cara. */
  unitPricesMxnCents: number[];
};

const pesos = (cents: number) => (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);

/**
 * Oferta por el lote: arranca con lo que cubre el inventario del vendedor, a
 * sus precios. Las cantidades se ajustan hasta lo que pide la lista y el total
 * se recalcula mientras no lo edite a mano.
 */
export function OfferForm({ listId, lines }: { listId: string; lines: OfferLine[] }) {
  const [state, action, pending] = useActionState<OfferState, FormData>(makeOffer.bind(null, listId), {});
  const [open, setOpen] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(lines.map((l) => [l.wantItemId, l.unitPricesMxnCents.length])),
  );
  const [customTotal, setCustomTotal] = useState<string | null>(null);
  const inventoryTotal = draftTotal(lines.map((l) => ({ ...l, quantity: l.unitPricesMxnCents.length })), quantities);
  const covered = lines.filter((l) => l.unitPricesMxnCents.length > 0).length;

  if (!open) {
    return (
      <div className="flex flex-col gap-2">
        <p className={ui.muted}>
          {covered > 0
            ? `Tu inventario cubre ${covered} de ${lines.length} cartas. Arma la propuesta y ajústala antes de enviarla.`
            : "Tu inventario cargado no cubre cartas de esta lista; aun así puedes ofrecer las que tengas."}
        </p>
        <button type="button" onClick={() => setOpen(true)} className={`${ui.button} self-start`}>
          Hacer oferta por el lote
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <ul className="flex flex-col rounded-lg border border-line">
        {lines.map((line) => {
          const stock = line.unitPricesMxnCents.length;
          return (
            <li key={line.wantItemId} className="flex items-center gap-3 border-t border-line-soft px-3 py-2.5 first:border-t-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold">{line.name}</p>
                <p className="text-[11px] text-muted">
                  Pide {line.requested} · {line.detail}
                  {stock > 0 ? ` · tienes ${stock} desde ${formatMxn(line.unitPricesMxnCents[0])}` : " · no la tienes cargada"}
                </p>
              </div>
              <label className="sr-only" htmlFor={`q-${line.wantItemId}`}>
                Copias de {line.name}
              </label>
              <input
                id={`q-${line.wantItemId}`}
                name={`q:${line.wantItemId}`}
                type="number"
                min={0}
                max={line.requested}
                value={quantities[line.wantItemId] ?? 0}
                onChange={(event) =>
                  setQuantities((q) => ({ ...q, [line.wantItemId]: Math.max(0, Number(event.target.value) || 0) }))
                }
                className={`${ui.input} w-16 text-center`}
              />
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2">
        <label htmlFor="offer-total" className={ui.label}>
          Total en pesos
        </label>
        <input
          id="offer-total"
          name="total"
          inputMode="decimal"
          required
          value={customTotal ?? pesos(inventoryTotal)}
          onChange={(event) => setCustomTotal(event.target.value)}
          className={`${ui.input} max-w-40`}
        />
        <p className={ui.muted}>
          A tus precios: {formatMxn(inventoryTotal)}. Puedes ofrecer otro total por el lote.
          {customTotal !== null && (
            <>
              {" "}
              <button type="button" onClick={() => setCustomTotal(null)} className={ui.link}>
                Usar {formatMxn(inventoryTotal)}
              </button>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="offer-message" className={ui.label}>
          Mensaje (opcional)
        </label>
        <textarea
          id="offer-message"
          name="message"
          rows={3}
          maxLength={MAX_OFFER_MESSAGE}
          placeholder="Dónde y cuándo puedes entregar, estado de las cartas…"
          className={ui.input}
        />
      </div>

      <p className={ui.muted}>
        El trato se cierra por WhatsApp o en tienda: la plataforma no cobra ni maneja pagos. Si aceptan tu oferta, cada uno
        verá el WhatsApp del otro.
      </p>
      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={ui.button}>
          {pending ? "Enviando…" : "Enviar oferta"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className={ui.buttonSecondary}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
