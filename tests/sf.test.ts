/** ST-X-3 Eq. 39 — Slope Factor SF = exp(3.533 * (GS/100)^1.2). */
import sf from "../src/fbp/sf";

describe("sf — slope factor (Eq. 39)", () => {
  it("returns 1.0 on flat ground", () => {
    expect(sf(0)).toBeCloseTo(1.0, 6);
  });
  it("hand-derived: SF(30) = exp(3.533 * 0.3^1.2)", () => {
    const expected = Math.exp(3.533 * Math.pow(0.30, 1.2));
    expect(sf(30)).toBeCloseTo(expected, 9);
    // 0.3^1.2 ≈ 0.23588, * 3.533 ≈ 0.83337, exp ≈ 2.30040
    expect(sf(30)).toBeCloseTo(2.30040, 4);
  });
  it("hand-derived: SF(60) = exp(3.533 * 0.6^1.2)", () => {
    const expected = Math.exp(3.533 * Math.pow(0.60, 1.2));
    expect(sf(60)).toBeCloseTo(expected, 9);
    // 0.6^1.2 ≈ 0.54040, * 3.533 ≈ 1.90924, exp ≈ 6.77965
    expect(sf(60)).toBeCloseTo(6.77965, 4);
  });
  // R cffdrs_r slope factor: SF = GS>=70 ? 10 : exp(3.533*(GS/100)^1.2).
  // No 60% cap; the curve runs continuously up to GS=70, where it saturates
  // at 10 (exp(3.533*0.70^1.2) ~= 8.96, so the clamp is a small upward jump).
  it("matches R across GS = 0,30,60,65,70,90 (GS>=70 saturates at 10)", () => {
    const rSf = (gs: number) =>
      gs >= 70 ? 10 : Math.exp(3.533 * Math.pow(gs / 100, 1.2));
    for (const gs of [0, 30, 60, 65, 70, 90]) {
      expect(sf(gs)).toBeCloseTo(rSf(gs), 9);
    }
    // Explicit saturation checks.
    expect(sf(70)).toBe(10);
    expect(sf(90)).toBe(10);
    // Below 70 there is NO 60-cap: SF(65) > SF(60).
    expect(sf(65)).toBeGreaterThan(sf(60));
  });
});
