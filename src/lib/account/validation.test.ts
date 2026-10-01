import { describe, expect, it } from "vitest";
import { safeNextPath, validateDisplayName, validateEmail, validateOtp } from "./validation";

describe("validateEmail", () => {
  it("normaliza espacios y mayúsculas", () => {
    expect(validateEmail("  Jugador@Correo.MX ")).toEqual({ ok: true, value: "jugador@correo.mx" });
  });

  it("rechaza correos incompletos", () => {
    expect(validateEmail("jugador@correo").ok).toBe(false);
    expect(validateEmail("").ok).toBe(false);
  });
});

describe("validateOtp", () => {
  it("acepta 6 dígitos aunque vengan con espacios o guion", () => {
    expect(validateOtp("123 456")).toEqual({ ok: true, value: "123456" });
    expect(validateOtp("123-456")).toEqual({ ok: true, value: "123456" });
  });

  it("rechaza códigos de otro largo o con letras", () => {
    expect(validateOtp("12345").ok).toBe(false);
    expect(validateOtp("12345a").ok).toBe(false);
  });
});

describe("validateDisplayName", () => {
  it("recorta y colapsa espacios", () => {
    expect(validateDisplayName("  Tienda   del   Centro ")).toEqual({ ok: true, value: "Tienda del Centro" });
  });

  it("rechaza nombres muy cortos o muy largos", () => {
    expect(validateDisplayName("a").ok).toBe(false);
    expect(validateDisplayName("x".repeat(41)).ok).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("acepta rutas internas", () => {
    expect(safeNextPath("/listas/nueva")).toBe("/listas/nueva");
    expect(safeNextPath("/listas?x=1")).toBe("/listas?x=1");
  });

  it("rechaza rutas externas o vacías", () => {
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath(null)).toBe("/dashboard");
    expect(safeNextPath("", "/listas")).toBe("/listas");
  });
});
