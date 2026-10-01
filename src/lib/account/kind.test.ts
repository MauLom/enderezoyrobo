import { describe, expect, it } from "vitest";
import { validateSelfKind } from "./kind";

describe("validateSelfKind", () => {
  it("acepta jugador y vendedor", () => {
    expect(validateSelfKind("player")).toEqual({ ok: true, value: "player" });
    expect(validateSelfKind("seller")).toEqual({ ok: true, value: "seller" });
  });

  it("rechaza tienda: solo se obtiene registrando una", () => {
    expect(validateSelfKind("store").ok).toBe(false);
  });

  it("rechaza valores vacíos o desconocidos", () => {
    expect(validateSelfKind(null).ok).toBe(false);
    expect(validateSelfKind("").ok).toBe(false);
    expect(validateSelfKind("admin").ok).toBe(false);
  });
});
