import { describe, expect, it } from "vitest";
import type { InventoryItem, WantItem } from "@/lib/matching/match";
import {
  canChangeStatus,
  dealMessage,
  draftOffer,
  draftTotal,
  offerActor,
  parseOfferForm,
  parseRating,
  ratingLabel,
} from "./offers";

function want(id: string, oracleId: string, quantity: number): WantItem {
  return { id, oracleId, printingId: null, quantity, minCondition: "LP", foil: "any", language: null };
}

function stock(id: string, oracleId: string, quantity: number, priceMxnCents: number): InventoryItem {
  return { id, storeId: "yo", oracleId, printingId: `${oracleId}-p1`, condition: "NM", language: "en", foil: false, quantity, priceMxnCents };
}

describe("canChangeStatus", () => {
  it("el dueño acepta o rechaza; el vendedor retira", () => {
    expect(canChangeStatus("pending", "accepted", "owner")).toBe(true);
    expect(canChangeStatus("pending", "rejected", "owner")).toBe(true);
    expect(canChangeStatus("pending", "withdrawn", "owner")).toBe(false);
    expect(canChangeStatus("pending", "withdrawn", "seller")).toBe(true);
    expect(canChangeStatus("pending", "accepted", "seller")).toBe(false);
  });

  it("solo mientras está pendiente", () => {
    expect(canChangeStatus("accepted", "rejected", "owner")).toBe(false);
    expect(canChangeStatus("rejected", "withdrawn", "seller")).toBe(false);
  });
});

describe("draftOffer", () => {
  const wants = [want("w1", "bolt", 4), want("w2", "tutor", 1)];
  const inventory = [stock("i1", "bolt", 1, 3000), stock("i2", "bolt", 2, 2000)];

  it("propone lo que cubre el inventario, con precios de la copia más barata a la más cara", () => {
    const { lines, result } = draftOffer(wants, inventory);
    expect(lines).toEqual([
      { wantItemId: "w1", requested: 4, quantity: 3, unitPricesMxnCents: [2000, 2000, 3000] },
      { wantItemId: "w2", requested: 1, quantity: 0, unitPricesMxnCents: [] },
    ]);
    expect(result.totalMxnCents).toBe(7000);
  });

  it("recalcula el total para las cantidades elegidas", () => {
    const { lines } = draftOffer(wants, inventory);
    expect(draftTotal(lines, { w1: 2 })).toBe(4000);
    // Más copias de las que hay en inventario no suman precio.
    expect(draftTotal(lines, { w1: 4, w2: 1 })).toBe(7000);
  });
});

describe("parseOfferForm", () => {
  const items = [
    { id: "w1", quantity: 4 },
    { id: "w2", quantity: 1 },
  ];

  it("arma la oferta con las cartas elegidas", () => {
    const parsed = parseOfferForm({ total: "$1,250", message: "  Paso el sábado  ", quantities: { w1: "3", w2: "0" } }, items);
    expect(parsed).toEqual({
      ok: true,
      value: { totalMxnCents: 125000, message: "Paso el sábado", items: [{ wantListItemId: "w1", quantity: 3 }] },
    });
  });

  it("rechaza ofertas vacías, cantidades de más y totales inválidos", () => {
    expect(parseOfferForm({ total: "100", message: "", quantities: {} }, items).ok).toBe(false);
    expect(parseOfferForm({ total: "100", message: "", quantities: { w2: "2" } }, items).ok).toBe(false);
    expect(parseOfferForm({ total: "100", message: "", quantities: { w1: "1.5" } }, items).ok).toBe(false);
    expect(parseOfferForm({ total: "", message: "", quantities: { w1: "1" } }, items).ok).toBe(false);
    expect(parseOfferForm({ total: "0", message: "", quantities: { w1: "1" } }, items).ok).toBe(false);
    expect(parseOfferForm({ total: "10", message: "x".repeat(501), quantities: { w1: "1" } }, items).ok).toBe(false);
  });

  it("ignora ids que no son de la lista", () => {
    const parsed = parseOfferForm({ total: "10", message: "", quantities: { otro: "5", w2: "1" } }, items);
    expect(parsed.ok && parsed.value.items).toEqual([{ wantListItemId: "w2", quantity: 1 }]);
  });
});

describe("calificaciones", () => {
  it("valida de 1 a 5 estrellas", () => {
    expect(parseRating("5", " Todo bien ")).toEqual({ ok: true, value: { score: 5, comment: "Todo bien" } });
    expect(parseRating("0", "").ok).toBe(false);
    expect(parseRating("6", "").ok).toBe(false);
    expect(parseRating("", "").ok).toBe(false);
  });

  it("resume el promedio", () => {
    expect(ratingLabel([])).toBeNull();
    expect(ratingLabel([5, 4])).toBe("★ 4.5 (2)");
  });
});

describe("offerActor", () => {
  const offer = { sellerId: "ana", ownerId: "beto" };

  it("distingue al dueño de la lista y al vendedor", () => {
    expect(offerActor(offer, "beto")).toBe("owner");
    expect(offerActor(offer, "ana")).toBe("seller");
  });

  it("null para quien no participa", () => {
    expect(offerActor(offer, "carla")).toBeNull();
  });
});

describe("dealMessage", () => {
  it("menciona quién escribe, la lista y el total", () => {
    expect(dealMessage("Beto", "Commander de Atraxa", "$560")).toBe(
      'Hola, soy Beto de Mazo. Te escribo por la oferta aceptada de $560 por la lista "Commander de Atraxa".',
    );
  });
});
