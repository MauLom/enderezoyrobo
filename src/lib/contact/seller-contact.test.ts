import { describe, expect, it } from "vitest";
import { noContactLabel, sellerWhatsapp } from "./seller-contact";

const deals = new Map([["ana", "+528100000010"]]);

describe("sellerWhatsapp", () => {
  it("una tienda usa su WhatsApp público", () => {
    expect(sellerWhatsapp({ id: "dragon", isStore: true, storeWhatsapp: "+528100000001" }, deals)).toBe("+528100000001");
  });

  it("una tienda sin número sigue sin número aunque haya un trato", () => {
    expect(sellerWhatsapp({ id: "ana", isStore: true, storeWhatsapp: null }, deals)).toBeNull();
  });

  it("un particular con oferta aceptada muestra su número", () => {
    expect(sellerWhatsapp({ id: "ana", isStore: false, storeWhatsapp: null }, deals)).toBe("+528100000010");
  });

  it("un particular sin oferta aceptada no muestra número", () => {
    expect(sellerWhatsapp({ id: "luis", isStore: false, storeWhatsapp: null }, deals)).toBeNull();
    expect(sellerWhatsapp({ id: "ana", isStore: false, storeWhatsapp: null }, new Map())).toBeNull();
  });
});

describe("noContactLabel", () => {
  it("explica por qué no hay botón", () => {
    expect(noContactLabel(true)).toBe("Sin WhatsApp");
    expect(noContactLabel(false)).toBe("Al aceptar oferta");
  });
});
