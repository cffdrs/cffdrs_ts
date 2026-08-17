/** ST-X-3 Eqs. 26-36, 62-65 — Rate of Spread per fuel type. */
import ros from "../src/fbp/ros";
import be from "../src/fbp/be";
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

  // Mixedwood ROS mirrors R cffdrs_r: component RATES are blended at the RSI
  // (NoBUI) level, then the M-fuel buildup effect is applied ONCE. The NoBUI
  // components are obtained by calling ros() with bui = -1 (be = 1).
  it("M-1 Eq. 27 — PC-weighted C-2/D-1 RSI, M-fuel BE applied once", () => {
    const pc = 60, bui = 60;
    const rsiC2 = ros("C2", 8, -1, 100, 2);
    const rsiD1 = ros("D1", 8, -1, 100, 2);
    const expected = ((pc / 100) * rsiC2 + ((100 - pc) / 100) * rsiD1) * be("M1", bui);
    expect(ros("M1", 8, bui, 100, 2, pc)).toBeCloseTo(expected, 6);
  });

  it("M-2 Eq. 28 — green deciduous component damped by 0.2", () => {
    const pc = 60, bui = 60;
    const rsiC2 = ros("C2", 8, -1, 100, 2);
    const rsiD1 = ros("D1", 8, -1, 100, 2);
    const expected =
      ((pc / 100) * rsiC2 + 0.2 * ((100 - pc) / 100) * rsiD1) * be("M2", bui);
    expect(ros("M2", 8, bui, 100, 2, pc)).toBeCloseTo(expected, 6);
  });

  it("M-3 Eq. 29 — table-constant dead-fir RSI blended with NoBUI D-1", () => {
    const pdf = 30, bui = 60;
    const rsiM3 = 120 * pow(1 - exp(-0.0572 * 8), 1.4); // FBP fuel-table coeffs
    const rsiD1 = ros("D1", 8, -1, 100, 2);
    const expected =
      ((pdf / 100) * rsiM3 + (1 - pdf / 100) * rsiD1) * be("M3", bui);
    expect(ros("M3", 8, bui, 100, 2, undefined, pdf)).toBeCloseTo(expected, 6);
  });

  it("M-4 Eq. 33 — table-constant RSI, D-1 component damped by 0.2", () => {
    const pdf = 30, bui = 60;
    const rsiM4 = 100 * pow(1 - exp(-0.0404 * 8), 1.48); // FBP fuel-table coeffs
    const rsiD1 = ros("D1", 8, -1, 100, 2);
    const expected =
      ((pdf / 100) * rsiM4 + 0.2 * (1 - pdf / 100) * rsiD1) * be("M4", bui);
    expect(ros("M4", 8, bui, 100, 2, undefined, pdf)).toBeCloseTo(expected, 6);
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
