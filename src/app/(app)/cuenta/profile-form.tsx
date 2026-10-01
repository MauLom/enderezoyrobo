"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
import { DISPLAY_NAME_MAX } from "@/lib/account/validation";
import { type ProfileState, updateProfile } from "./actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, { displayName });

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="displayName" className={ui.label}>
        Nombre visible
      </label>
      <input
        id="displayName"
        name="displayName"
        required
        maxLength={DISPLAY_NAME_MAX}
        defaultValue={state.displayName}
        className={ui.input}
      />
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
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
