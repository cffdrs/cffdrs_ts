/**
 * Slope Factor. Multiplier applied to surface fire rate of spread on level
 * terrain to account for the influence of ground slope.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eq. 39.)
 *
 * Per R cffdrs_r (SFcalc / FBPcalc), the slope factor saturates at GS >= 70%:
 *   SF = GS >= 70 ? 10 : exp(3.533 * (GS/100)^1.2)
 * Note exp(3.533 * 0.70^1.2) ~= 8.96, so the GS>=70 clamp to 10 is a small jump
 * that bounds the multiplier on very steep terrain (matches R exactly).
 *
 * @param {number} ps - Percent ground slope.
 * @returns {number} Slope factor (dimensionless multiplier; 1.0 on flat ground).
 */
export function sf(ps: number): number {
  // Eq. 39, with R's GS>=70 saturation.
  return ps >= 70 ? 10 : Math.exp(3.533 * Math.pow(ps / 100, 1.2));
}

export default sf;
