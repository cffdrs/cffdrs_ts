/**
 * Rate of spread at angle theta (ROStheta) — the spread rate at any point along
 * the perimeter of the elliptically shaped fire, measured as the angle theta
 * away from the head-fire (maximum-spread) direction.
 *
 * Mirrors R cffdrs_r's `rate_of_spread_at_theta` (R/rate_of_spread_at_theta.r):
 *   - Eq. 94 (Wotton et al. 2009): the full elliptical spread expression in
 *     terms of the head (ROS), flank (FROS) and back (BROS) rates.
 *   - R's degenerate-cosine guard: where cos(theta) == 0 exactly, R nudges the
 *     angle by +0.001 rad to avoid a divide-by-zero (the sin-driven terms are
 *     unaffected). Reproduced here verbatim.
 *
 * Angle convention: R evaluates cos/sin on theta in RADIANS. This library's
 * public convention is DEGREES, so theta is converted to radians internally
 * (and the +0.001 guard is applied in radians, matching R).
 *
 * Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009. Information Report
 *   GLC-X-10. (Eq. 94.)
 *
 * @param ros   Head fire rate of spread (m/min).
 * @param fros  Flank fire rate of spread (m/min).
 * @param bros  Back fire rate of spread (m/min).
 * @param theta Angle from the head-fire direction (DEGREES).
 * @returns Rate of spread at angle theta (m/min).
 */
export function rosAtTheta(
  ros: number,
  fros: number,
  bros: number,
  theta: number
): number {
  const thetaR = (theta * Math.PI) / 180;
  const s1 = Math.sin(thetaR);
  let c1 = Math.cos(thetaR);
  // R's guard: nudge by +0.001 rad where cos is exactly 0 to avoid /0.
  if (c1 === 0) c1 = Math.cos(thetaR + 0.001);
  // Eq. 94 — rate of spread at point theta on the ellipse.
  return (
    ((ros - bros) / (2 * c1) + (ros + bros) / (2 * c1)) *
    ((fros * c1 * Math.sqrt(fros * fros * c1 * c1 + ros * bros * s1 * s1) -
      ((ros * ros - bros * bros) / 4) * s1 * s1) /
      (fros * fros * c1 * c1 + ((ros + bros) / 2) * ((ros + bros) / 2) * s1 * s1))
  );
}

export default rosAtTheta;
