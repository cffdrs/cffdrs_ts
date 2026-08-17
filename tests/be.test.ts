/** ST-X-3 Eq. 54 — BUI Effect. BE = exp(50 * ln(q) * (1/BUI - 1/BUI0)). */
import be from "../src/fbp/be";
import { getFuel } from "../src/fbp/fuelTypes";

describe("be — BUI effect on rate of spread (Eq. 54)", () => {
  it("BE = 1.0 when BUI equals BUI0 (the fuel's average)", () => {
    const c2 = getFuel("C2");
    expect(be("C2", c2.bui0)).toBeCloseTo(1.0, 9);
  });
  it("hand-derived C-2 at BUI=100: BE = exp(50*ln(0.7)*(1/100 - 1/64))", () => {
    const c2 = getFuel("C2");
    const expected = Math.exp(50 * Math.log(c2.q) * (1 / 100 - 1 / c2.bui0));
    expect(be("C2", 100)).toBeCloseTo(expected, 9);
  });
  it("returns 1 (neutral) when BUI is 0 — no buildup, no modification to RSI", () => {
    expect(be("C2", 0)).toBe(1);
  });
  it("O-1 (q=1.0) → BE always 1.0 (ln(1)=0)", () => {
    expect(be("O1a", 50)).toBeCloseTo(1, 9);
    expect(be("O1b", 200)).toBeCloseTo(1, 9);
  });
});
