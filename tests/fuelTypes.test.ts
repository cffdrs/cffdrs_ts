/** ST-X-3 fuel coefficient table — every code resolves, M-fuels carry NaN a/b/c. */
import { FUELS, getFuel } from "../src/fbp/fuelTypes";

describe("fuelTypes", () => {
  const codes = ["C1","C2","C3","C4","C5","C6","C7","D1","S1","S2","S3","O1a","O1b","M1","M2","M3","M4"];

  it.each(codes)("getFuel resolves %s", (code) => {
    const f = getFuel(code);
    expect(f.code).toBe(code);
  });

  it("throws on unknown code", () => {
    expect(() => getFuel("Z9")).toThrow(/unknown fuel type/);
  });

  it("table is frozen", () => {
    expect(Object.isFrozen(FUELS)).toBe(true);
  });

  it.each(["M1","M2","M3","M4"])("%s a/b/c are NaN sentinel", (code) => {
    const f = getFuel(code);
    expect(Number.isNaN(f.a)).toBe(true);
    expect(Number.isNaN(f.b)).toBe(true);
    expect(Number.isNaN(f.c)).toBe(true);
  });

  it("ST-X-3 Table page 60 canonical values — spot-check C-2, C-7, O-1a", () => {
    const c2 = getFuel("C2");
    expect(c2.a).toBe(110); expect(c2.b).toBe(0.0282); expect(c2.c).toBe(1.5);
    expect(c2.q).toBe(0.70); expect(c2.bui0).toBe(64); expect(c2.cbh).toBe(3); expect(c2.cfl).toBe(0.80);
    const c7 = getFuel("C7");
    expect(c7.bui0).toBe(106); expect(c7.cbh).toBe(10); expect(c7.cfl).toBe(0.50);
    const o1a = getFuel("O1a");
    expect(o1a.a).toBe(190); expect(o1a.q).toBe(1.0); expect(o1a.bui0).toBe(1);
  });
});
