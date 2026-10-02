import { describe, expect, it } from "vitest";
import { storeStatus, validateRejectionReason, validateStore } from "./store";

const valid = { name: "  La Guarida   TCG ", address: "Calzada del Valle 200, San Pedro", whatsapp: "81 1234 5678", priceReferenceNote: " SCG −10 % " };

describe("validateStore", () => {
  it("limpia espacios y normaliza el WhatsApp", () => {
    expect(validateStore(valid)).toEqual({
      ok: true,
      value: { name: "La Guarida TCG", address: "Calzada del Valle 200, San Pedro", whatsapp: "+528112345678", priceReferenceNote: "SCG −10 %" },
    });
  });

  it("la referencia de precio es opcional", () => {
    const result = validateStore({ ...valid, priceReferenceNote: "  " });
    expect(result.ok && result.value.priceReferenceNote).toBeNull();
  });

  it("pide nombre, dirección y WhatsApp", () => {
    expect(validateStore({ ...valid, name: "X" })).toMatchObject({ ok: false, error: expect.stringMatching(/nombre/) });
    expect(validateStore({ ...valid, address: "" })).toMatchObject({ ok: false, error: expect.stringMatching(/dirección/) });
    expect(validateStore({ ...valid, whatsapp: "" })).toMatchObject({ ok: false, error: expect.stringMatching(/WhatsApp/) });
    expect(validateStore({ ...valid, whatsapp: "123" }).ok).toBe(false);
  });

  it("respeta los largos máximos", () => {
    expect(validateStore({ ...valid, name: "a".repeat(61) }).ok).toBe(false);
    expect(validateStore({ ...valid, address: "a".repeat(161) }).ok).toBe(false);
    expect(validateStore({ ...valid, priceReferenceNote: "a".repeat(61) }).ok).toBe(false);
  });
});

describe("validateRejectionReason", () => {
  it("pide un motivo corto pero no vacío", () => {
    expect(validateRejectionReason("  No encontramos la tienda  ")).toEqual({ ok: true, value: "No encontramos la tienda" });
    expect(validateRejectionReason(" ").ok).toBe(false);
    expect(validateRejectionReason("a".repeat(501)).ok).toBe(false);
  });
});

describe("storeStatus", () => {
  it("verificada gana sobre rechazada; sin nada es pendiente", () => {
    expect(storeStatus({ verifiedAt: "2026-10-02", rejectedAt: null })).toBe("verified");
    expect(storeStatus({ verifiedAt: null, rejectedAt: "2026-10-02" })).toBe("rejected");
    expect(storeStatus({ verifiedAt: null, rejectedAt: null })).toBe("pending");
  });
});
