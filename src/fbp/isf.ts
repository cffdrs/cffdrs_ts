/**
 * Initial Spread Index on slope. Inverts the rate-of-spread equation to
 * compute the equivalent ISI that would produce the slope-only rate of
 * spread (RSF) on level ground. Used by the wind / slope vector synthesis
 * to derive the net effective wind speed (WSE).
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eqs. 41, 42, 43.)
 *
 * @param {string} fueltype - Fuel type code.
 * @param {number} rsf  - Surface rate of spread with slope, zero wind.
 * @param {number} [pc]  - Percent conifer (M-1 / M-2 — Eq. 42 form).
 * @param {number} [cur] - Degree of curing in % (O-1a / O-1b — Eq. 43 form).
 * @returns {number} ISI on slope (ISF).
 */
import { getFuel } from "./fuelTypes";

export function isf(
  fueltype: string,
  rsf: number,
  pc?: number,
  cur?: number
): number {
  const ft = fueltype.trim();

  // ---- M-1 / M-2 use Eq. 42 form with C-2 coefficients weighted by PC ----
  if (ft === "M1" || ft === "M2") {
    const pcEff = pc === undefined ? 50 : pc;
    const c2 = getFuel("C2");
    // Eq. 42 (interpreting "100 - RSF" notation per the inverted Eq. 27/28)
    const inner = 1 - Math.pow(rsf / (pcEff * 0.01 * c2.a), 1 / c2.c);
    if (inner <= 0) return 0;
    return Math.log(inner) / -c2.b;
  }

  // ---- O-1a / O-1b use Eq. 43 with curing factor ----
  if (ft === "O1a" || ft === "O1b") {
    const f = getFuel(ft);
    const curEff = cur === undefined ? 100 : cur;
    // Curing factor. Wotton, Alexander & Taylor (2009), GLC-X-10 — a smooth
    // function of curing that supersedes the ST-X-3 (1992) Eq. 35 step at 50%.
    const cf =
      curEff < 58.8
        ? 0.005 * (Math.exp(0.061 * curEff) - 1)
        : 0.176 + 0.02 * (curEff - 58.8);
    if (cf <= 0) return 0;
    const inner = 1 - Math.pow(rsf / (cf * f.a), 1 / f.c);
    if (inner <= 0) return 0;
    // Eq. 43
    return Math.log(inner) / -f.b;
  }

  // ---- Generic case (C-1..C-5, C-7, D-1, S-1..S-3) — Eq. 41 ----
  const f = getFuel(ft);
  const inner = 1 - Math.pow(rsf / f.a, 1 / f.c);
  if (inner <= 0) return 0;
  return Math.log(inner) / -f.b;
}

export default isf;
