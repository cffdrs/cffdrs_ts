/**
 * Head-fire spread distance at time t (DISTt) — the distance the head of the
 * fire has travelled since ignition, accounting for the acceleration phase.
 *
 * Mirrors R cffdrs_r's `distance_at_time` (R/distance_at_time.r):
 *   - Eq. 72 (FCFDG 1992): the acceleration coefficient alpha (see accAlpha).
 *   - Eq. 71 (FCFDG 1992): DISTt = ROSeq * (HR + e^(-alpha*HR)/alpha - 1/alpha).
 *
 * This is the analytic integral of the rate-of-spread-at-time curve (Eq. 70)
 * over the elapsed interval: distance lags ROSeq*HR by the area the fire never
 * covered while accelerating.
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3.
 *   (Eqs. 71, 72.)
 *
 * @param fueltype Fuel type code (canonical: C1..C7, D1, M1..M4, S1..S3, O1a, O1b).
 * @param roseq Equilibrium (steady-state) rate of spread (m/min).
 * @param hr    Elapsed time since ignition (minutes).
 * @param cfb   Crown fraction burned (0..1) — drives alpha for closed fuels.
 * @returns Head-fire spread distance at time t (m).
 */
import accAlpha from "./accAlpha";

export function distanceAtTime(
  fueltype: string,
  roseq: number,
  hr: number,
  cfb: number
): number {
  const alpha = accAlpha(fueltype, cfb); // Eq. 72
  // Eq. 71 — accumulated head-fire distance at elapsed time.
  return roseq * (hr + Math.exp(-alpha * hr) / alpha - 1 / alpha);
}

export default distanceAtTime;
