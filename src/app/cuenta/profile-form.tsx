"use client";

import { useActionState } from "react";
import { DISPLAY_NAME_MAX } from "@/lib/account/validation";
import { type ProfileState, updateProfile } from "./actions";

export function ProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, { displayName });

  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="displayName" className="text-sm font-medium">
        Nombre visible
      </label>
      <input
        id="displayName"
        name="displayName"
        required
        maxLength={DISPLAY_NAME_MAX}
        defaultValue={state.displayName}
        className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2 text-base outline-none focus:border-foreground/60"
      />
      <p className="text-sm opacity-70">Así te ven las tiendas y otros jugadores.</p>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p className="text-sm text-green-700" role="status">
          Guardado.
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
