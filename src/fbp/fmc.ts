/**
 * Foliar Moisture Content Calculation. Computes seasonal foliar moisture
 * content (% by weight) of crowning conifer fuels from station location and
 * day of year. Required input to the Crown Fraction Burned calculation.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eqs. 1-8.)
 *
 * @param {number} lat - Latitude in decimal degrees.
 * @param {number} lon - Longitude in decimal degrees. The sign convention used
 *                       in ST-X-3 is positive west; if a signed-west-negative
 *                       value is supplied it is converted internally.
 * @param {number} elev - Station elevation in metres above sea level. Pass 0
 *                        to use the no-elevation form (Eqs. 1, 2).
 * @param {number} jd - Day of year (1-366) of the calculation.
 * @param {number} [jd_min] - Optional override for the date of minimum FMC.
 *                            When omitted, derived from lat/lon/elev per
 *                            Eqs. 1-4.
 * @returns {number} Foliar moisture content as a percent (85 to 120).
 */
export function fmc(
  lat: number,
  lon: number,
  elev: number,
  jd: number,
  jd_min?: number
): number {
  const d0 =
    jd_min !== undefined ? jd_min : foliarMoistureContentMinimum(lat, lon, elev);

  // Eq. 5
  const nd = Math.abs(jd - d0);

  // Eqs. 6, 7, 8
  if (nd < 30) return 85 + 0.0189 * nd * nd;
  if (nd < 50) return 32.9 + 3.17 * nd - 0.0288 * nd * nd;
  return 120;
}

/**
 * Date of minimum foliar moisture content (D0) — the calendar day of year on
 * which conifer foliar moisture bottoms out, from station location (Eqs. 1-4).
 * Mirrors R cffdrs_r's `foliar_moisture_content_minimum`.
 *
 * @param {number} lat  Latitude in decimal degrees.
 * @param {number} lon  Longitude in decimal degrees (either sign convention).
 * @param {number} elev Station elevation in metres (<= 0 uses the no-elev form).
 * @returns {number} Date of minimum FMC, rounded to the nearest day.
 */
export function foliarMoistureContentMinimum(
  lat: number,
  lon: number,
  elev: number
): number {
  // ST-X-3 expresses longitude as positive west; convert the signed convention.
  const lonW = lon < 0 ? -lon : lon;
  let d0: number;
  if (elev <= 0) {
    // Eqs. 1, 2
    const latn = 46 + 23.4 * Math.exp(-0.036 * (150 - lonW));
    d0 = 151 * (lat / latn);
  } else {
    // Eqs. 3, 4
    const latn = 43 + 33.7 * Math.exp(-0.0351 * (150 - lonW));
    d0 = 142.1 * (lat / latn) + 0.0172 * elev;
  }
  // Date of minimum FMC is a calendar day — round to the nearest integer (Eq. 5).
  return Math.round(d0);
}

export default fmc;
