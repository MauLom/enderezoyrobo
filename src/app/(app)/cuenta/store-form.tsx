"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import { STORE_ADDRESS_MAX, STORE_NAME_MAX, STORE_PRICE_NOTE_MAX, type StoreInput } from "@/lib/account/store";
import { saveStore, type StoreState } from "./actions";

/** Registrar la tienda (sin `store`) o editar sus datos. */
export function StoreForm({ store }: { store: StoreInput | null }) {
  const [state, action, pending] = useActionState<StoreState, FormData>(saveStore, {
    values: store ?? { name: "", address: "", whatsapp: "", priceReferenceNote: null },
  });
  const registering = store === null;

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="store-name" className={ui.label}>
        Nombre de la tienda
      </label>
      <input
        id="store-name"
        name="name"
        required
        maxLength={STORE_NAME_MAX}
        placeholder="La Guarida TCG"
        defaultValue={state.values.name}
        className={ui.input}
      />

      <label htmlFor="store-address" className={ui.label}>
        Dirección
      </label>
      <input
        id="store-address"
        name="address"
        required
        maxLength={STORE_ADDRESS_MAX}
        autoComplete="street-address"
        placeholder="Calzada del Valle 200, Del Valle, San Pedro Garza García"
        defaultValue={state.values.address}
        className={ui.input}
      />

      <label htmlFor="store-whatsapp" className={ui.label}>
        WhatsApp de la tienda
      </label>
      <input
        id="store-whatsapp"
        name="whatsapp"
        type="tel"
        inputMode="tel"
        required
        placeholder="81 1234 5678"
        defaultValue={state.values.whatsapp}
        className={ui.input}
      />
      <p className={ui.muted}>
        Es público: aparece junto a tu inventario para que los jugadores te escriban. Es distinto de tu WhatsApp
        personal de arriba.
      </p>

      <label htmlFor="store-price-note" className={ui.label}>
        Referencia de precio <span className="font-normal normal-case tracking-normal">(opcional)</span>
      </label>
      <input
        id="store-price-note"
        name="priceReferenceNote"
        maxLength={STORE_PRICE_NOTE_MAX}
        placeholder="SCG −10 %"
        defaultValue={state.values.priceReferenceNote ?? ""}
        className={ui.input}
      />
      <p className={ui.muted}>Con qué lista cotizas, para que los jugadores comparen.</p>

      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p className={ui.success} role="status">
          {registering ? "Tienda registrada." : "Guardado."}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${ui.button} self-start`}>
        {pending ? "Guardando…" : registering ? "Registrar mi tienda" : "Guardar tienda"}
      </button>
    </form>
  );
}
