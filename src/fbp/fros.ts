/**
 * Flank fire rate of spread (FROS) — the spread rate perpendicular to the head/
 * back axis of the elliptical fire.
 *
 * Mirrors R cffdrs_r's `flank_rate_of_spread` (R/flank_rate_of_spread.r):
 *   - Eq. 89 (FCFDG 1992):  FROS = (ROS + BROS) / (2 * LB).
 *
 * The flank rate is the mean of the head and back rates divided by the
 * length-to-breadth ratio — the geometry of the ellipse relates the minor axis
 * (flank) to the major axis (head+back) through LB.
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3. (Eq. 89.)
 *
 * @param ros  Head fire rate of spread (m/min).
 * @param bros Back fire rate of spread (m/min).
 * @param lb   Length-to-breadth ratio (dimensionless).
 * @returns Flank fire rate of spread (m/min).
 */
export function fros(ros: number, bros: number, lb: number): number {
  // Eq. 89 — R computes (ROS + BROS) / LB / 2.
  return (ros + bros) / lb / 2;
}

export default fros;
