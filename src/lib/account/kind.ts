import type { Validated } from "./validation";

export type AccountKind = "player" | "seller" | "store";

/** Tipos que el usuario elige él mismo; `store` solo se obtiene registrando una tienda. */
export type SelfKind = Exclude<AccountKind, "store">;

export const ACCOUNT_KINDS: Record<AccountKind, { label: string; description: string }> = {
  player: {
    label: "Jugador",
    description: "Arma want lists y encuentra quién tiene tus cartas. Siempre gratis.",
  },
  seller: {
    label: "Vendedor",
    description: "Vende tu colección como particular: publica tu inventario en \"Mi inventario\".",
  },
  store: {
    label: "Tienda",
    description: "Tienda física en Monterrey con inventario por CSV e insignia de verificada.",
  },
};

export function validateSelfKind(raw: unknown): Validated<SelfKind> {
  if (raw === "player" || raw === "seller") return { ok: true, value: raw };
  return { ok: false, error: "Elige jugador o vendedor." };
}
