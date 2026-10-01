"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import { ACCOUNT_KINDS, type SelfKind } from "@/lib/account/kind";
import { type KindState, updateKind } from "./actions";

/** Botón para pasar de jugador a vendedor y de regreso. */
export function KindForm({ kind }: { kind: SelfKind }) {
  const [state, action, pending] = useActionState<KindState, FormData>(updateKind, {});
  const next: SelfKind = kind === "player" ? "seller" : "player";

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="kind" value={next} />
      <button type="submit" disabled={pending} className={`${next === "seller" ? ui.button : ui.buttonSecondary} self-start`}>
        {pending ? "Cambiando…" : next === "seller" ? "Quiero vender mi colección" : `Volver a ${ACCOUNT_KINDS.player.label.toLowerCase()}`}
      </button>
      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
