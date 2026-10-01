import { describe, expect, it } from "vitest";
import { daysAgoLabel, formatForeign, formatMxn, parseMxnCents, toMxnCents } from "./mxn";

describe("toMxnCents", () => {
  it("convierte y redondea al centavo", () => {
    expect(toMxnCents("1.95", "18.4521")).toBe(3598);
    expect(toMxnCents(0, 18)).toBe(0);
  });
});

describe("formatMxn", () => {
  it("usa formato mexicano y omite .00", () => {
    expect(formatMxn(4500)).toBe("$45");
    expect(formatMxn(123450)).toBe("$1,234.50");
  });
});

describe("formatForeign", () => {
  it("marca la moneda", () => {
    expect(formatForeign("1.9", "USD")).toBe("US$1.90");
    expect(formatForeign(0.94, "EUR")).toBe("€0.94");
  });
});

describe("daysAgoLabel", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  it("describe días transcurridos", () => {
    expect(daysAgoLabel("2026-09-28T08:00:00Z", now)).toBe("hoy");
    expect(daysAgoLabel("2026-09-27T08:00:00Z", now)).toBe("ayer");
    expect(daysAgoLabel("2026-09-18T12:00:00Z", now)).toBe("hace 10 días");
  });
});

describe("parseMxnCents", () => {
  it("acepta pesos con signo, comas y decimales", () => {
    expect(parseMxnCents("45")).toBe(4500);
    expect(parseMxnCents("$1,234.50")).toBe(123450);
    expect(parseMxnCents("1234.5 MXN")).toBe(123450);
  });

  it("rechaza lo que no es un monto", () => {
    expect(parseMxnCents("")).toBeNull();
    expect(parseMxnCents("abc")).toBeNull();
    expect(parseMxnCents("-5")).toBeNull();
    expect(parseMxnCents("1.234")).toBeNull();
  });
});
