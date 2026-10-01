"use client";

import { useActionState } from "react";
import { ui } from "@/app/ui";
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
    <section className="flex flex-col gap-3 rounded-xl border border-dashed border-warn/50 bg-warn/5 p-4">
      <div>
        <h2 className="text-xs font-bold text-warn">Entrar sin correo (solo desarrollo)</h2>
        <p className={ui.muted}>No manda correo. No existe en producción.</p>
      </div>
      <form action={action} className="flex gap-2">
        {next && <input type="hidden" name="next" value={next} />}
        <input
          name="email"
          type="email"
          placeholder="cualquier correo"
          required
          className={`${ui.input} min-w-0 flex-1 py-2`}
        />
        <button type="submit" disabled={pending} className={ui.buttonSecondary}>
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
            className="rounded-full border border-line bg-cream px-2.5 py-1 text-[11px] font-semibold text-muted transition hover:border-accent hover:text-ink"
          >
            {label}
          </button>
        ))}
      </form>
      {state.error && (
        <p className={ui.error} role="alert">
          {state.error}
        </p>
      )}
    </section>
  );
}
