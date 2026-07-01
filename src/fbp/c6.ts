/**
 * C-6 conifer plantation crown-fire decomposition. The C-6 fuel type is the
 * only FBP fuel whose head fire rate of spread is a blend of a *surface* spread
 * rate and a *crown* spread rate, transitioning via crown fraction burned. This
 * module mirrors R cffdrs_r's decomposition (C6calc.r + CFBcalc.r) so each
 * intermediate quantity is independently testable against the R gold vectors.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eqs. 62-65 for the C-6 surface/crown
 * spread blend; Eqs. 56-58 for the crown-fire transition; Eq. 61 for FME.)
 *
 * One concept per function, matching R's named functions exactly, including
 * R's `RSC > RSS` guards in both crown_fraction_burned_c6 and rate_of_spread_c6.
 */
import be from "./be";

/** Average foliar moisture effect for C-6 (ST-X-3 narrative reference value). */
const FME_AVG = 0.778;

/**
 * Eq. 62 — C-6 intermediate surface rate of spread (no BUI effect yet).
 * @param {number} isi - Initial Spread Index (slope-corrected if applicable).
 * @returns {number} Intermediate surface ROS (m/min).
 */
export function intermediateSurfaceRateOfSpreadC6(isi: number): number {
  return 30 * Math.pow(1 - Math.exp(-0.08 * isi), 3.0);
}

/**
 * Eq. 63 — C-6 surface rate of spread (RSI modified by the BUI effect).
 * @param {number} rsi - Intermediate surface ROS from {@link intermediateSurfaceRateOfSpreadC6}.
 * @param {number} bui - Buildup Index.
 * @returns {number} Surface ROS (m/min).
 */
export function surfaceRateOfSpreadC6(rsi: number, bui: number): number {
  return rsi * be("C6", bui);
}

/**
 * Eq. 64 — C-6 crown rate of spread. Uses the foliar moisture effect (Eq. 61)
 * normalized by the C-6 average FME.
 * @param {number} isi - Initial Spread Index.
 * @param {number} fmc - Foliar Moisture Content (%).
 * @returns {number} Crown ROS (m/min).
 */
export function crownRateOfSpreadC6(isi: number, fmc: number): number {
  // Eq. 61 foliar moisture effect.
  const fme = (Math.pow(1.5 - 0.00275 * fmc, 4.0) / (460 + 25.9 * fmc)) * 1000;
  return 60 * (1 - Math.exp(-0.0497 * isi)) * (fme / FME_AVG);
}

/**
 * Eq. 56 — critical surface fire intensity for initiation of crowning (kW/m).
 * @param {number} fmc - Foliar Moisture Content (%).
 * @param {number} cbh - Crown base height (m).
 * @returns {number} Critical surface intensity (kW/m).
 */
export function criticalSurfaceIntensity(fmc: number, cbh: number): number {
  return 0.001 * Math.pow(cbh, 1.5) * Math.pow(460 + 25.9 * fmc, 1.5);
}

/**
 * Eq. 57 — critical surface fire rate of spread (RSO, m/min).
 * @param {number} csi - Critical surface intensity from {@link criticalSurfaceIntensity}.
 * @param {number} sfc - Surface Fuel Consumption (kg/m^2).
 * @returns {number} Critical surface ROS (m/min).
 */
export function surfaceFireRateOfSpread(csi: number, sfc: number): number {
  return csi / (300 * sfc);
}

/**
 * Eq. 58 — crown fraction burned given an arbitrary spread rate and the
 * critical surface ROS.
 * @param {number} ros - Spread rate (m/min).
 * @param {number} rso - Critical surface ROS (m/min).
 * @returns {number} Crown fraction burned (0-1).
 */
export function crownFractionBurned(ros: number, rso: number): number {
  return ros > rso ? 1 - Math.exp(-0.23 * (ros - rso)) : 0;
}

/**
 * C-6 crown fraction burned (CFBcalc.r). Crowning only occurs when the crown
 * spread rate exceeds the surface spread rate AND the surface rate exceeds the
 * critical surface rate. NOTE: per R, the CFB is computed from RSS (the surface
 * rate), NOT from the final blended ROS.
 * @param {number} rsc - Crown ROS from {@link crownRateOfSpreadC6}.
 * @param {number} rss - Surface ROS from {@link surfaceRateOfSpreadC6}.
 * @param {number} rso - Critical surface ROS from {@link surfaceFireRateOfSpread}.
 * @returns {number} Crown fraction burned (0-1).
 */
export function crownFractionBurnedC6(
  rsc: number,
  rss: number,
  rso: number
): number {
  return rsc > rss && rss > rso ? crownFractionBurned(rss, rso) : 0;
}

/**
 * Eq. 65 — final C-6 rate of spread, blending surface and crown rates by CFB.
 * Per R, the blend only applies when the crown rate exceeds the surface rate;
 * otherwise the spread is purely surface.
 * @param {number} rsc - Crown ROS.
 * @param {number} rss - Surface ROS.
 * @param {number} cfb - Crown fraction burned from {@link crownFractionBurnedC6}.
 * @returns {number} Head fire ROS (m/min).
 */
export function rateOfSpreadC6(rsc: number, rss: number, cfb: number): number {
  return rsc > rss ? rss + cfb * (rsc - rss) : rss;
}
