/**
 * Length-to-breadth ratio at time t (LBt) — the fire's elongation at an elapsed
 * time since ignition, growing from a circle (LB = 1) toward its equilibrium
 * length-to-breadth ratio as the fire accelerates.
 *
 * Mirrors R cffdrs_r's `length_to_breadth_at_time` (R/length_to_breadth_at_time.r):
 *   - Eq. 72 (FCFDG 1992): the acceleration coefficient alpha (see accAlpha).
 *   - Eq. 81 (Wotton et al. 2009): LBt = (LB - 1) * (1 - e^(-alpha*HR)) + 1.
 *
 * At HR = 0 the fire is circular (LBt = 1); as HR -> infinity LBt -> LB.
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3. (Eq. 72.)
 * Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009. Information Report
 *   GLC-X-10. (Eq. 81.)
 *
 * @param fueltype Fuel type code (canonical: C1..C7, D1, M1..M4, S1..S3, O1a, O1b).
 * @param lb  Equilibrium length-to-breadth ratio (dimensionless).
 * @param hr  Time since ignition (hours).
 * @param cfb Crown fraction burned (0..1) — drives alpha for closed fuels.
 * @returns Length-to-breadth ratio at time t (dimensionless).
 */
import accAlpha from "./accAlpha";

export function lbAtTime(
  fueltype: string,
  lb: number,
  hr: number,
  cfb: number
): number {
  const alpha = accAlpha(fueltype, cfb); // Eq. 72
  // Eq. 81 — length-to-breadth ratio at elapsed time.
  return (lb - 1) * (1 - Math.exp(-alpha * hr)) + 1;
}

export default lbAtTime;
