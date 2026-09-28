import { describe, expect, it } from "vitest";
import { parseBanxico } from "./banxico";

describe("parseBanxico", () => {
  it("toma el último dato de cada serie y convierte la fecha a ISO", () => {
    const rows = parseBanxico({
      bmx: {
        series: [
          { idSerie: "SF43718", datos: [{ fecha: "25/09/2026", dato: "18.4521" }] },
          { idSerie: "SF46410", datos: [{ fecha: "25/09/2026", dato: "21.0310" }] },
        ],
      },
    });
    expect(rows).toEqual([
      { currency: "USD", mxnPerUnit: "18.4521", asOf: "2026-09-25" },
      { currency: "EUR", mxnPerUnit: "21.0310", asOf: "2026-09-25" },
    ]);
  });

  it("omite series sin dato publicado", () => {
    const rows = parseBanxico({
      bmx: {
        series: [
          { idSerie: "SF43718", datos: [{ fecha: "25/09/2026", dato: "N/E" }] },
          { idSerie: "SF46410" },
        ],
      },
    });
    expect(rows).toEqual([]);
  });
});
