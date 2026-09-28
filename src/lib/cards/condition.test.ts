import { describe, expect, it } from "vitest";
import { meetsMinimum, parseCondition } from "./condition";

describe("condition", () => {
  it("reconoce abreviaturas y nombres en inglés y español", () => {
    expect(parseCondition("Near Mint")).toBe("NM");
    expect(parseCondition(" lp ")).toBe("LP");
    expect(parseCondition("Moderately_Played")).toBe("MP");
    expect(parseCondition("Muy jugada")).toBe("HP");
    expect(parseCondition("regular")).toBeNull();
  });

  it("acepta condición igual o mejor que la mínima", () => {
    expect(meetsMinimum("NM", "LP")).toBe(true);
    expect(meetsMinimum("LP", "LP")).toBe(true);
    expect(meetsMinimum("MP", "LP")).toBe(false);
  });
});
