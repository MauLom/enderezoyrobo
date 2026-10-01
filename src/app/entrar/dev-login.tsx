"use client";

import { useActionState } from "react";
import { type DevLoginState, devLogin } from "./actions";

// Usuarios de scripts/seed.ts.
const SEED_USERS = [
  ["tienda.dragon@mazo.test", "Tienda El Dragón"],
  ["tienda.guarida@mazo.test", "La Guarida TCG"],
  ["tienda.barrio@mazo.test", "Cartas del Barrio"],
  ["vendedora.ana@mazo.test", "Ana (vendedora)"],
  ["jugador.beto@mazo.test", "Beto (jugador)"],
  ["jugadora.carla@mazo.test", "Carla (jugadora)"],
] as const;

/** Solo se muestra en `npm run dev` con SUPABASE_SECRET_KEY; ver src/supabase/admin.ts. */
export function DevLogin({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<DevLoginState, FormData>(devLogin, {});

  return (
    <section className="flex flex-col gap-3 rounded-md border border-dashed border-amber-500/60 p-4">
      <div>
        <h2 className="text-sm font-semibold">Entrar sin correo (solo desarrollo)</h2>
        <p className="text-xs opacity-70">No manda correo. No existe en producción.</p>
      </div>
      <form action={action} className="flex gap-2">
        {next && <input type="hidden" name="next" value={next} />}
        <input
          name="email"
          type="email"
          placeholder="cualquier correo"
          required
          className="min-w-0 flex-1 rounded-md border border-foreground/20 bg-transparent px-2 py-1 text-sm"
        />
        <button type="submit" disabled={pending} className="rounded-md border border-foreground/30 px-3 py-1 text-sm">
          Entrar
        </button>
      </form>
      <form action={action} className="flex flex-wrap gap-2">
        {next && <input type="hidden" name="next" value={next} />}
        {SEED_USERS.map(([email, label]) => (
          <button
            key={email}
            type="submit"
            name="email"
            value={email}
            disabled={pending}
            className="rounded-full border border-foreground/20 px-2 py-0.5 text-xs"
          >
            {label}
          </button>
        ))}
      </form>
      {state.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
    </section>
  );
}
