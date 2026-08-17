/**
 * Length-to-breadth ratio (LB) — the elongation of an elliptically shaped fire,
 * driven by the net effective wind speed.
 *
 * Mirrors R cffdrs_r's `length_to_breadth` (R/length_to_breadth.r) exactly:
 *   - Grass (O1a/O1b): the Wotton (2009) errata form (Eq. 80a/80b) — for
 *     WSV >= 1 km/h, LB = 1.1 * WSV^0.464; below 1 km/h LB is pinned to 1.0.
 *   - All other fuels: the FCFDG (1992) form (Eq. 79) —
 *     LB = 1.0 + 8.729 * (1 - e^(-0.030 * WSV))^2.155.
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3. (Eq. 79.)
 * Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009. Information Report
 *   GLC-X-10. (Eq. 80a/80b — grass correction to the 1992 Eq. 80.)
 *
 * @param fueltype Fuel type code (this library's canonical form: C1..C7, D1,
 *   M1..M4, S1..S3, O1a, O1b).
 * @param wsv Net effective wind speed (km/h).
 * @returns Length-to-breadth ratio (dimensionless, >= 1).
 */
export function lb(fueltype: string, wsv: number): number {
  const ft = fueltype.trim();
  if (ft === "O1a" || ft === "O1b") {
    // Eq. 80a/80b (Wotton 2009): grass LB pinned to 1.0 below 1 km/h.
    return wsv >= 1.0 ? 1.1 * Math.pow(wsv, 0.464) : 1.0;
  }
  // Eq. 79 (FCFDG 1992): all non-grass fuels.
  return 1.0 + 8.729 * Math.pow(1 - Math.exp(-0.03 * wsv), 2.155);
}

export default lb;
