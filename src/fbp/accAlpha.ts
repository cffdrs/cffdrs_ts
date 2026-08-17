/**
 * Acceleration coefficient (alpha) — the exponential growth-rate constant that
 * governs how quickly a fire accelerates from ignition toward its equilibrium
 * (steady-state) rate of spread.
 *
 * Mirrors R cffdrs_r's alpha branch shared by `rate_of_spread_at_time` and
 * `distance_at_time` (Eq. 72, FCFDG 1992):
 *   - Open fuels (C1, O1a, O1b, S1, S2, S3, D1): a fixed alpha = 0.115.
 *   - All other (closed-canopy) fuels: alpha depends on the crown fraction
 *     burned — alpha = 0.115 - 18.8 * CFB^2.5 * e^(-8 * CFB). Heavier crowning
 *     slows the initial acceleration (a lower alpha).
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3. (Eq. 72.)
 *
 * @param fueltype Fuel type code (canonical: C1..C7, D1, M1..M4, S1..S3, O1a, O1b).
 * @param cfb Crown fraction burned (0..1). Ignored for the open-fuel set.
 * @returns Acceleration coefficient alpha (1/min).
 */
export function accAlpha(fueltype: string, cfb: number): number {
  const ft = fueltype.trim();
  const OPEN = ft === "C1" || ft === "O1a" || ft === "O1b" ||
    ft === "S1" || ft === "S2" || ft === "S3" || ft === "D1";
  // Eq. 72 — open fuels take a fixed alpha; closed fuels scale with CFB.
  return OPEN ? 0.115 : 0.115 - 18.8 * Math.pow(cfb, 2.5) * Math.exp(-8 * cfb);
}

export default accAlpha;
