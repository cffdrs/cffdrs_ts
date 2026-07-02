/**
 * Back fire rate of spread (BROS) — the spread rate at the rear of the fire,
 * where wind and slope oppose spread.
 *
 * Mirrors R cffdrs_r's `back_rate_of_spread` (R/back_rate_of_spread.r) exactly:
 * a back-fire wind function attenuates the ISI, and that reduced ISI is fed to
 * the ordinary rate-of-spread equation.
 *   - Eq. 45/46 (FCFDG 1992): f(F) from the FFMC (identical to the ISI form).
 *   - Eq. 75: back-fire wind function  BfW = e^(-0.05039 * WSV).
 *   - Eq. 76: back-fire ISI            BISI = 0.208 * BfW * f(F).
 *   - Eq. 77: BROS = rate_of_spread(FUELTYPE, BISI, BUI, ...).
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3.
 *   (Eqs. 45, 46, 75, 76, 77.)
 *
 * @param fueltype Fuel type code (canonical: C1..C7, D1, M1..M4, S1..S3, O1a, O1b).
 * @param ffmc Fine Fuel Moisture Code.
 * @param bui  Buildup Index.
 * @param wsv  Net effective wind speed (km/h).
 * @param fmc  Foliar moisture content (%).
 * @param sfc  Surface fuel consumption (kg/m^2).
 * @param pc   Percent conifer (M1/M2).
 * @param pdf  Percent dead balsam fir (M3/M4).
 * @param cc   Degree of curing (%) (O1a/O1b).
 * @param cbh  Crown base height (m).
 * @returns Back fire rate of spread (m/min).
 */
import ros from "./ros";

const FFMC_COEFFICIENT = 147.2772277227723; // R's exact constant (250 * 59.5 / 101).

export function bros(
  fueltype: string,
  ffmc: number,
  bui: number,
  wsv: number,
  fmc: number,
  sfc: number,
  pc?: number,
  pdf?: number,
  cc?: number,
  cbh?: number
): number {
  // Eq. 46 — FFMC moisture function.
  const m = (FFMC_COEFFICIENT * (101 - ffmc)) / (59.5 + ffmc);
  // Eq. 45 — f(F).
  const fF = 91.9 * Math.exp(-0.1386 * m) * (1.0 + Math.pow(m, 5.31) / 4.93e7);
  // Eq. 75 — back-fire wind function.
  const bfW = Math.exp(-0.05039 * wsv);
  // Eq. 76 — back-fire ISI.
  const bisi = 0.208 * bfW * fF;
  // Eq. 77 — back fire rate of spread.
  return ros(fueltype, bisi, bui, fmc, sfc, pc, pdf, cc, cbh);
}

export default bros;
