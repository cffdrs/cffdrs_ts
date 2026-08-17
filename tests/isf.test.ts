/** ST-X-3 Eqs. 41-43 — ISI inversion for slope. */
import isf from "../src/fbp/isf";
import ros from "../src/fbp/ros";
import { getFuel } from "../src/fbp/fuelTypes";

describe("isf — slope-equivalent ISI (inverse of Eq. 26)", () => {
  it("Round-trip: ISF(ros(ISI=8)) ≈ 8 for C-2 (generic Eq. 41)", () => {
    const isiIn = 8;
    const f = getFuel("C2");
    // Pure RSI with no BUI effect:
    const rsiAtIsi = f.a * Math.pow(1 - Math.exp(-f.b * isiIn), f.c);
    const recovered = isf("C2", rsiAtIsi);
    expect(recovered).toBeCloseTo(isiIn, 6);
  });
  it("Returns 0 when rsf is at or above the asymptote", () => {
    const f = getFuel("C2");
    expect(isf("C2", f.a)).toBe(0);          // exactly at asymptote
    expect(isf("C2", f.a + 5)).toBe(0);      // past asymptote
  });
  it("Round-trip on D-1, S-3 (other generic fuels)", () => {
    for (const code of ["D1", "S3"]) {
      const f = getFuel(code);
      const isiIn = 5;
      const rsiAtIsi = f.a * Math.pow(1 - Math.exp(-f.b * isiIn), f.c);
      expect(isf(code, rsiAtIsi)).toBeCloseTo(isiIn, 6);
    }
  });
  it("Grass O-1 Eq. 43: uses curing factor", () => {
    const f = getFuel("O1a");
    const cur = 90;
    const cf = 0.02 * cur - 1.0;
    const isiIn = 5;
    const rsiAtIsi = cf * f.a * Math.pow(1 - Math.exp(-f.b * isiIn), f.c);
    expect(isf("O1a", rsiAtIsi, undefined, cur)).toBeCloseTo(isiIn, 6);
  });
});
