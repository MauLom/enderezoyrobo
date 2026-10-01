import { describe, expect, it } from "vitest";
import { orderMessage, whatsappLink, whatsappNumber } from "./whatsapp";

describe("whatsappNumber", () => {
  it("normaliza números de México", () => {
    expect(whatsappNumber("81 1234 5678")).toBe("528112345678");
    expect(whatsappNumber("+52 1 81 1234 5678")).toBe("528112345678");
    expect(whatsappNumber("+528100000001")).toBe("528100000001");
  });

  it("rechaza lo que no es teléfono", () => {
    expect(whatsappNumber("12345")).toBeNull();
    expect(whatsappNumber("")).toBeNull();
  });
});

describe("whatsappLink", () => {
  it("arma el enlace de wa.me con el mensaje codificado", () => {
    expect(whatsappLink("8112345678", "Hola, ¿tienen Sol Ring?")).toBe(
      "https://wa.me/528112345678?text=Hola%2C%20%C2%BFtienen%20Sol%20Ring%3F",
    );
    expect(whatsappLink("abc", "hola")).toBeNull();
  });
});

describe("orderMessage", () => {
  it("lista las cartas con detalle, precio y total", () => {
    expect(
      orderMessage(
        "Tienda El Dragón",
        [
          { quantity: 1, name: "Sol Ring", detail: "C21, NM", unitPriceMxn: "$45" },
          { quantity: 2, name: "Counterspell" },
        ],
        "$105",
      ),
    ).toBe(
      "Hola, Tienda El Dragón. Vi en Mazo que tienen estas cartas:\n\n• 1x Sol Ring (C21, NM) – $45 c/u\n• 2x Counterspell\n\nTotal: $105\n\n¿Siguen disponibles?",
    );
  });
});
