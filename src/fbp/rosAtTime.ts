/**
 * Rate of spread at time t (ROSt) — the instantaneous head-fire spread rate at
 * an elapsed time since ignition, as the fire accelerates from rest toward its
 * equilibrium rate.
 *
 * Mirrors R cffdrs_r's `rate_of_spread_at_time` (R/rate_of_spread_at_time.r):
 *   - Eq. 72 (FCFDG 1992): the acceleration coefficient alpha (see accAlpha).
 *   - Eq. 70 (FCFDG 1992): ROSt = ROSeq * (1 - e^(-alpha * HR)).
 *
 * At HR = 0 the fire is at rest (ROSt = 0); as HR -> infinity ROSt -> ROSeq.
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3.
 *   (Eqs. 70, 72.)
 *
 * @param fueltype Fuel type code (canonical: C1..C7, D1, M1..M4, S1..S3, O1a, O1b).
 * @param roseq Equilibrium (steady-state) rate of spread (m/min).
 * @param hr    Time since ignition (hours).
 * @param cfb   Crown fraction burned (0..1) — drives alpha for closed fuels.
 * @returns Rate of spread at time t (m/min).
 */
import accAlpha from "./accAlpha";

export function rosAtTime(
  fueltype: string,
  roseq: number,
  hr: number,
  cfb: number
): number {
  const alpha = accAlpha(fueltype, cfb); // Eq. 72
  // Eq. 70 — rate of spread at elapsed time.
  return roseq * (1 - Math.exp(-alpha * hr));
}

export default rosAtTime;
