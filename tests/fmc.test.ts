/** ST-X-3 Eqs. 1-8 — Foliar Moisture Content. */
import fmc from "../src/fbp/fmc";

describe("fmc — foliar moisture content (Eqs. 1-8)", () => {
  // Hand-derive D0 for lat=55, lon=-105 (sign-converted), elev=0:
  // LATN = 46 + 23.4 * exp(-0.0360 * (150 - 105)) = 46 + 23.4 * exp(-1.62) ~ 46 + 4.6321 = 50.6321
  // D0   = 151 * (55 / 50.6321) ~ 164.0568
  // ND   = |jd - D0|
  // The date of minimum FMC (D0) is rounded to the nearest integer day before
  // the day offset (ND) is computed — matches the R cffdrs reference. Tests
  // derive their expected ND from round(D0) accordingly.
  it("ND = 0 when jd hits D0 exactly → FMC = 85", () => {
    const latn = 46 + 23.4 * Math.exp(-0.036 * (150 - 105));
    const d0 = Math.round(151 * (55 / latn));
    expect(fmc(55, -105, 0, d0)).toBeCloseTo(85, 6);
  });
  it("ND < 30 → FMC = 85 + 0.0189*ND^2 (Eq. 6)", () => {
    const latn = 46 + 23.4 * Math.exp(-0.036 * (150 - 105));
    const d0 = Math.round(151 * (55 / latn));
    const jd = d0 + 10;                        // ND = 10
    const nd = Math.abs(jd - d0);
    expect(fmc(55, -105, 0, jd)).toBeCloseTo(85 + 0.0189 * nd * nd, 6);
  });
  it("30 ≤ ND < 50 → FMC = 32.9 + 3.17*ND - 0.0288*ND^2 (Eq. 7)", () => {
    const latn = 46 + 23.4 * Math.exp(-0.036 * (150 - 105));
    const d0 = Math.round(151 * (55 / latn));
    const jd = d0 + 40;                        // ND = 40
    const nd = Math.abs(jd - d0);
    expect(fmc(55, -105, 0, jd)).toBeCloseTo(32.9 + 3.17 * nd - 0.0288 * nd * nd, 6);
  });
  it("ND ≥ 50 → FMC = 120 (Eq. 8)", () => {
    expect(fmc(55, -105, 0, 1)).toBeCloseTo(120, 6);          // ND huge
    expect(fmc(55, -105, 0, 366)).toBeGreaterThanOrEqual(85);
  });
  it("elev > 0 uses Eq. 3/4 form (elevation increases D0)", () => {
    // Same lat/lon/jd, elev=1000 → D0 shifts by 17.2 days
    const f_low  = fmc(55, -105, 0, 200);
    const f_high = fmc(55, -105, 1000, 200);
    expect(f_high).not.toBe(f_low);
  });
  it("explicit jd_min override bypasses the Eq. 1-4 derivation", () => {
    expect(fmc(0, 0, 0, 150, 150)).toBeCloseTo(85, 6); // ND=0 → Eq. 6
    // ND=50 hits Eq. 8 (the ND ≥ 50 branch)
    expect(fmc(0, 0, 0, 200, 150)).toBe(120);
    // ND=40 hits Eq. 7
    const nd40 = 40;
    expect(fmc(0, 0, 0, 190, 150)).toBeCloseTo(32.9 + 3.17 * nd40 - 0.0288 * nd40 * nd40, 6);
  });
});
