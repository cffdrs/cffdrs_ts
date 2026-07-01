/** ST-X-3 Eqs. 26-36, 62-65 — Rate of Spread per fuel type. */
import ros from "../src/fbp/ros";
import { getFuel } from "../src/fbp/fuelTypes";

describe("ros — rate of spread", () => {
  const exp = Math.exp;
  const pow = Math.pow;

  it("Generic Eq. 26 — C-1 at ISI=10, BUI=72 (BUI0=72 so BE=1)", () => {
    const f = getFuel("C1");
    const expectedRSI = f.a * pow(1 - exp(-f.b * 10), f.c);
    expect(ros("C1", 10, f.bui0, 100, 1)).toBeCloseTo(expectedRSI, 6);
  });

  it("Generic Eq. 26 — C-2 hand vector at ISI=8, BUI=64", () => {
    const f = getFuel("C2");
    const rsi = f.a * pow(1 - exp(-f.b * 8), f.c);
    expect(ros("C2", 8, 64, 100, 2)).toBeCloseTo(rsi, 6);
  });

  it("M-1 Eq. 27 — PC-weighted C-2/D-1 ROS", () => {
    const pc = 60;
    const rosC2 = ros("C2", 8, 60, 100, 2);
    const rosD1 = ros("D1", 8, 60, 100, 2);
    expect(ros("M1", 8, 60, 100, 2, pc)).toBeCloseTo(
      (pc / 100) * rosC2 + ((100 - pc) / 100) * rosD1, 6);
  });

  it("M-2 Eq. 28 — green deciduous component damped by 0.2", () => {
    const pc = 60;
    const rosC2 = ros("C2", 8, 60, 100, 2);
    const rosD1 = ros("D1", 8, 60, 100, 2);
    expect(ros("M2", 8, 60, 100, 2, pc)).toBeCloseTo(
      (pc / 100) * rosC2 + 0.2 * ((100 - pc) / 100) * rosD1, 6);
  });

  it("M-3 Eqs. 29-31 — coefficients derived from PDF", () => {
    const pdf = 30;
    const a = 170 * exp(-35.0 / pdf);
    const b = 0.082 * exp(-36.0 / pdf);
    const c = 1.698 - 0.00303 * pdf;
    const rsi = a * pow(1 - exp(-b * 8), c);
    // BUI0=50 for M-3 → BE != 1 at BUI=60
    // Test the RSI piece only by checking at BUI=BUI0
    expect(ros("M3", 8, 50, 100, 2, undefined, pdf)).toBeCloseTo(rsi, 6);
  });

  it("M-4 Eq. 32 (errata: -33.5), 33, 34", () => {
    const pdf = 30;
    const a = 140 * exp(-33.5 / pdf);
    const b = 0.0404;
    const c = 3.02 * exp(-0.00714 * pdf);
    const rsi = a * pow(1 - exp(-b * 8), c);
    expect(ros("M4", 8, 50, 100, 2, undefined, pdf)).toBeCloseTo(rsi, 6);
  });

  // Curing factor: GLC-X-10 (Wotton, Alexander & Taylor 2009) smooth function,
  // CF = CC<58.8 ? 0.005*(exp(0.061*CC)-1) : 0.176 + 0.02*(CC-58.8).
  it("O-1 Eq. 36 — CF below 58.8% curing is the exponential branch (nonzero)", () => {
    const f = getFuel("O1a");
    const cur = 40; // < 58.8 → exponential branch
    const cf = 0.005 * (exp(0.061 * cur) - 1);
    const rsi = f.a * pow(1 - exp(-f.b * 8), f.c) * cf;
    expect(ros("O1a", 8, 1, 100, 0.3, undefined, undefined, cur)).toBeCloseTo(rsi, 6);
  });

  it("O-1 Eq. 36 — CF at/above 58.8% curing is the linear branch; BUI0=1, q=1 → BE=1", () => {
    const f = getFuel("O1a");
    const cur = 100; // >= 58.8 → linear branch
    const cf = 0.176 + 0.02 * (cur - 58.8);
    const rsi = f.a * pow(1 - exp(-f.b * 5), f.c) * cf;
    expect(ros("O1a", 5, 1, 100, 0.3, undefined, undefined, cur)).toBeCloseTo(rsi, 6);
  });

  it("Generic C-3..C-5, C-7, D-1, S-1..S-3 — all hit Eq. 26 form", () => {
    for (const code of ["C3","C4","C5","C7","D1","S1","S2","S3"]) {
      const f = getFuel(code);
      const expected = f.a * pow(1 - exp(-f.b * 7), f.c);
      // Use BUI=BUI0 so BE=1 and RSI==ROS
      expect(ros(code, 7, f.bui0, 100, 2)).toBeCloseTo(expected, 6);
    }
  });

  it("BUI effect kicks in when BUI != BUI0", () => {
    const f = getFuel("C2");
    const atRef = ros("C2", 8, f.bui0, 100, 2);
    const atHigh = ros("C2", 8, 120, 100, 2);
    expect(atHigh).toBeGreaterThan(atRef);
  });
});
