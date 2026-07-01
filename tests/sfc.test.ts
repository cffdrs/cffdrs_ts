/** ST-X-3 Eqs. 9-25 — Surface Fuel Consumption per fuel type. */
import sfc from "../src/fbp/sfc";

const exp = Math.exp;

describe("sfc — surface fuel consumption", () => {
  it("C-1 Eq. 9 — two-sided form about FFMC = 84", () => {
    const hi = 90; // FFMC > 84 → increasing branch
    expect(sfc("C1", hi, 50)).toBeCloseTo(
      0.75 + 0.75 * Math.pow(1 - exp(-0.23 * (hi - 84)), 0.5),
      9
    );
    const lo = 50; // FFMC < 84 → decreasing branch (small positive, not zero)
    expect(sfc("C1", lo, 50)).toBeCloseTo(
      0.75 - 0.75 * Math.pow(1 - exp(-0.23 * (84 - lo)), 0.5),
      9
    );
  });
  it("SFC is floored at 1e-6, never reported as <= 0", () => {
    // C-2 at BUI=0 → raw 0 → floored to the numerical minimum (matches R).
    expect(sfc("C2", 90, 0)).toBe(0.000001);
  });
  it("C-2 Eq. 10 — SFC = 5.0 * (1 - exp(-0.0115 * BUI))", () => {
    expect(sfc("C2", 90, 75)).toBeCloseTo(5.0 * (1 - exp(-0.0115 * 75)), 9);
  });
  it("C-3/C-4 Eq. 11 — exponent 2.24", () => {
    expect(sfc("C3", 90, 80)).toBeCloseTo(5.0 * Math.pow(1 - exp(-0.0164 * 80), 2.24), 9);
    expect(sfc("C4", 90, 80)).toBe(sfc("C3", 90, 80));
  });
  it("C-5/C-6 Eq. 12 — exponent 2.48", () => {
    expect(sfc("C5", 90, 80)).toBeCloseTo(5.0 * Math.pow(1 - exp(-0.0149 * 80), 2.48), 9);
    expect(sfc("C6", 90, 80)).toBe(sfc("C5", 90, 80));
  });
  it("C-7 Eqs. 13-15 — FFC + WFC", () => {
    const ffmc = 90, bui = 60;
    const ffc = Math.max(0, 2 * (1 - exp(-0.104 * (ffmc - 70))));
    const wfc = 1.5 * (1 - exp(-0.0201 * bui));
    expect(sfc("C7", ffmc, bui)).toBeCloseTo(ffc + wfc, 9);
  });
  it("D-1 Eq. 16", () => {
    expect(sfc("D1", 90, 70)).toBeCloseTo(1.5 * (1 - exp(-0.0183 * 70)), 9);
  });
  it("M-1/M-2 Eq. 17 — PC-weighted C-2/D-1", () => {
    const pc = 75;
    const c2 = sfc("C2", 90, 60);
    const d1 = sfc("D1", 90, 60);
    expect(sfc("M1", 90, 60, pc)).toBeCloseTo((pc / 100) * c2 + ((100 - pc) / 100) * d1, 9);
    expect(sfc("M2", 90, 60, pc)).toBe(sfc("M1", 90, 60, pc));
  });
  it("O-1 Eq. 18 — SFC = GFL (with default)", () => {
    expect(sfc("O1a", 90, 30, undefined, 0.5)).toBe(0.5);
    expect(sfc("O1b", 90, 30)).toBe(0.35);
  });
  it("S-1 Eqs. 19, 20, 25", () => {
    const bui = 60;
    const ffc = 4.0 * (1 - exp(-0.025 * bui));
    const wfc = 4.0 * (1 - exp(-0.034 * bui));
    expect(sfc("S1", 90, bui)).toBeCloseTo(ffc + wfc, 9);
  });
  it("S-2 Eqs. 21, 22, 25", () => {
    const bui = 60;
    expect(sfc("S2", 90, bui)).toBeCloseTo(
      10.0 * (1 - exp(-0.013 * bui)) + 6.0 * (1 - exp(-0.060 * bui)), 9);
  });
  it("S-3 Eqs. 23, 24, 25", () => {
    const bui = 60;
    expect(sfc("S3", 90, bui)).toBeCloseTo(
      12.0 * (1 - exp(-0.0166 * bui)) + 20.0 * (1 - exp(-0.0210 * bui)), 9);
  });
  it("M-3, M-4 fall through to the C-2 form (Eq. 10)", () => {
    expect(sfc("M3", 90, 70)).toBe(sfc("C2", 90, 70));
    expect(sfc("M4", 90, 70)).toBe(sfc("C2", 90, 70));
  });
  it("throws on unknown fuel", () => {
    expect(() => sfc("Z9", 90, 50)).toThrow();
  });
});
