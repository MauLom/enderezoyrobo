"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import { DELIVERY_ZONES } from "@/lib/account/validation";
import { type ContactState, updateContact } from "./actions";

/** WhatsApp privado y zona de entrega. Dejar el número vacío lo borra. */
export function ContactForm({ whatsapp, deliveryZone }: { whatsapp: string | null; deliveryZone: string | null }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(updateContact, {
    whatsapp: whatsapp ?? "",
    deliveryZone: deliveryZone ?? "",
  });

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="whatsapp" className={ui.label}>
        WhatsApp
      </label>
      <input
        id="whatsapp"
        name="whatsapp"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="81 1234 5678"
        defaultValue={state.whatsapp}
        className={ui.input}
      />
      <p className={ui.muted}>
        Es privado: no aparece en listas ni en el marketplace. Solo lo ve la persona con la que aceptes una oferta. Déjalo
        vacío para borrarlo.
      </p>

      <label htmlFor="deliveryZone" className={ui.label}>
        Zona de entrega
      </label>
      <select id="deliveryZone" name="deliveryZone" defaultValue={state.deliveryZone} className={ui.input}>
        <option value="">Sin indicar</option>
        {DELIVERY_ZONES.map((zone) => (
          <option key={zone} value={zone}>
            {zone}
          </option>
        ))}
      </select>
      <p className={ui.muted}>El municipio donde prefieres cerrar tratos. Este dato sí es público.</p>

      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p className={ui.success} role="status">
          Guardado.
        </p>
      )}
      <button type="submit" disabled={pending} className={`${ui.button} self-start`}>
        {pending ? "Guardando…" : "Guardar contacto"}
      </button>
    </form>
  );
}
