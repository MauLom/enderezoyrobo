"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import type { OfferActor } from "@/lib/offers/offers";
import { changeOfferStatus, type OfferActionState } from "./actions";

/** Aceptar o rechazar (dueño de la lista) o retirar (vendedor) una oferta pendiente. */
export function StatusButtons({ offerId, actor }: { offerId: string; actor: OfferActor }) {
  const [state, action, pending] = useActionState<OfferActionState, FormData>(changeOfferStatus.bind(null, offerId), {});

  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {actor === "owner" ? (
          <>
            <button type="submit" name="status" value="accepted" disabled={pending} className={ui.button}>
              Aceptar
            </button>
            <button type="submit" name="status" value="rejected" disabled={pending} className={ui.buttonSecondary}>
              Rechazar
            </button>
          </>
        ) : (
          <button type="submit" name="status" value="withdrawn" disabled={pending} className={ui.buttonDanger}>
            Retirar oferta
          </button>
        )}
      </div>
      {actor === "owner" && <p className={ui.muted}>Al aceptar, cada uno verá el WhatsApp del otro para cerrar el trato.</p>}
      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
