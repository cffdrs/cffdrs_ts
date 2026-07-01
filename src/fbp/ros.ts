/**
 * Rate of Spread. Head fire rate of spread (m/min) for a fuel type at given
 * weather + topographic conditions. Branches by fuel type because each fuel
 * uses different a/b/c coefficients (from `fuelTypes.ts`), and M-fuels are
 * computed dynamically from C-2 and D-1 weighted by PC/PDF.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eqs. 26-36; Eqs. 29-34 for M-3/M-4
 * coefficients; Eqs. 62-65 for C-6; Eq. 36 for O-1 grass with cure factor.)
 *
 * The published Eq. 32 coefficient for M-4 's `a` parameter is corrected per
 * the official ST-X-3 errata (Apr 1994) from -35.5 to -33.5.
 *
 * @param {string} fueltype - Fuel type code (e.g. "C2", "M2", "O1b").
 * @param {number} isi  - Initial Spread Index (slope-corrected if applicable).
 * @param {number} bui  - Buildup Index (used internally for the BUI-effect
 *                        multiplier on C-6 and for M-fuel ROS composition).
 * @param {number} fmc  - Foliar Moisture Content (% by weight). Only used
 *                        for the C-6 conifer plantation crowning path.
 * @param {number} sfc  - Surface Fuel Consumption (kg/m^2). Only used by
 *                        C-6 for the crowning transition.
 * @param {number} [pc]  - Percent conifer composition (M-1 / M-2 only).
 * @param {number} [pdf] - Percent dead balsam fir (M-3 / M-4 only).
 * @param {number} [cur] - Degree of curing in percent (O-1a / O-1b only).
 * @param {number} [cbh] - Override of fuel's default crown base height (C-6).
 * @returns {number} Head fire rate of spread in metres per minute.
 */
import { getFuel } from "./fuelTypes";
import be from "./be";
import {
  intermediateSurfaceRateOfSpreadC6,
  surfaceRateOfSpreadC6,
  crownRateOfSpreadC6,
  criticalSurfaceIntensity,
  surfaceFireRateOfSpread,
  crownFractionBurnedC6,
  rateOfSpreadC6,
} from "./c6";

function rsi_generic(a: number, b: number, c: number, isi: number): number {
  // Eq. 26
  return a * Math.pow(1 - Math.exp(-b * isi), c);
}

export function ros(
  fueltype: string,
  isi: number,
  bui: number,
  fmc: number,
  sfc: number,
  pc?: number,
  pdf?: number,
  cur?: number,
  cbh?: number
): number {
  const ft = fueltype.trim();
  const exp = Math.exp;
  const pow = Math.pow;

  // ---- M-fuel mixedwood ROS (Eqs. 27, 28) ----
  if (ft === "M1" || ft === "M2") {
    const pcEff = pc === undefined ? 50 : pc;
    const ph = 100 - pcEff;
    const rosC2 = ros("C2", isi, bui, fmc, sfc, pc, pdf, cur, cbh);
    const rosD1 = ros("D1", isi, bui, fmc, sfc, pc, pdf, cur, cbh);
    if (ft === "M1") {
      // Eq. 27
      return (pcEff / 100) * rosC2 + (ph / 100) * rosD1;
    }
    // M-2 Eq. 28 — green deciduous component damped by factor 0.2
    return (pcEff / 100) * rosC2 + 0.2 * (ph / 100) * rosD1;
  }

  // ---- M-3 / M-4 with PDF-dependent a, b, c (Eqs. 29-34) ----
  if (ft === "M3" || ft === "M4") {
    const pdfEff = pdf === undefined ? 35 : pdf;
    let a: number, b: number, c: number;
    if (ft === "M3") {
      // Eqs. 29, 30, 31
      a = 170 * exp(-35.0 / pdfEff);
      b = 0.082 * exp(-36.0 / pdfEff);
      c = 1.698 - 0.00303 * pdfEff;
    } else {
      // Eqs. 32 (errata: -33.5), 33, 34
      a = 140 * exp(-33.5 / pdfEff);
      b = 0.0404;
      c = 3.02 * exp(-0.00714 * pdfEff);
    }
    const rsi = rsi_generic(a, b, c, isi);
    // BUI effect (Eq. 55)
    return rsi * be(ft, bui);
  }

  // ---- O-1 grass with curing factor (Eqs. 35, 36) ----
  if (ft === "O1a" || ft === "O1b") {
    const f = getFuel(ft);
    const curEff = cur === undefined ? 100 : cur;
    // Curing factor. Wotton, Alexander & Taylor (2009), GLC-X-10 — a smooth
    // function of curing that supersedes the ST-X-3 (1992) Eq. 35 step at 50%.
    const cf =
      curEff < 58.8
        ? 0.005 * (exp(0.061 * curEff) - 1)
        : 0.176 + 0.02 * (curEff - 58.8);
    // Eq. 36
    const rsi = f.a * pow(1 - exp(-f.b * isi), f.c) * cf;
    // O-1 q = 1.0 so BE = 1.0; keep call for symmetry
    return rsi * be(ft, bui);
  }

  // ---- C-6 conifer plantation (Eqs. 62-65) ----
  // Composes the c6.ts helpers (which mirror R cffdrs_r's C6calc.r/CFBcalc.r
  // exactly, including R's `RSC > RSS` guards in both CFB and the final blend).
  if (ft === "C6") {
    const rsi = intermediateSurfaceRateOfSpreadC6(isi); // Eq. 62
    const rss = surfaceRateOfSpreadC6(rsi, bui); // Eq. 63
    const rsc = crownRateOfSpreadC6(isi, fmc); // Eqs. 61, 64
    // Crown-fire transition (Eqs. 56-58).
    const cbhEff = cbh === undefined ? getFuel("C6").cbh : cbh;
    const csi = criticalSurfaceIntensity(fmc, cbhEff);
    const rso = surfaceFireRateOfSpread(csi, sfc);
    const cfb = crownFractionBurnedC6(rsc, rss, rso); // guarded; uses RSS
    return rateOfSpreadC6(rsc, rss, cfb); // Eq. 65, guarded
  }

  // ---- General case for C-1..C-5, C-7, D-1, S-1..S-3 ----
  const f = getFuel(ft);
  const rsi = rsi_generic(f.a, f.b, f.c, isi);
  return rsi * be(ft, bui);
}

export default ros;
