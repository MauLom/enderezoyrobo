"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import { REJECTION_REASON_MAX, type StoreStatus } from "@/lib/account/store";
import { type ReviewState, reviewStore } from "./actions";

/** Pendiente o rechazada: verificar o rechazar. Verificada: quitar la verificación o rechazar. */
export function ReviewButtons({ storeId, status }: { storeId: string; status: StoreStatus }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(reviewStore.bind(null, storeId), {});

  return (
    <div className="flex flex-col gap-2">
      <form action={action} className="flex flex-wrap gap-2">
        {status === "verified" ? (
          <button type="submit" name="decision" value="unverify" disabled={pending} className={ui.buttonSecondary}>
            Quitar verificación
          </button>
        ) : (
          <button type="submit" name="decision" value="verify" disabled={pending} className={ui.button}>
            Verificar
          </button>
        )}
      </form>
      <details>
        <summary className={`${ui.link} cursor-pointer text-xs`}>{status === "rejected" ? "Cambiar el motivo" : "Rechazar"}</summary>
        <form action={action} className="mt-2 flex flex-col gap-2">
          <label htmlFor={`reason-${storeId}`} className={ui.label}>
            Motivo (lo ve la tienda)
          </label>
          <textarea
            id={`reason-${storeId}`}
            name="reason"
            required
            rows={3}
            maxLength={REJECTION_REASON_MAX}
            placeholder="No encontramos la tienda en la dirección indicada."
            className={ui.input}
          />
          <button type="submit" name="decision" value="reject" disabled={pending} className={`${ui.buttonDanger} self-start`}>
            Rechazar tienda
          </button>
        </form>
      </details>
      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
    </div>
  );
}
