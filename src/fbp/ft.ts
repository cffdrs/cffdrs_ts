/**
 * Fire Type Classification. Maps crown fraction burned to a discrete fire
 * type code following the thresholds used operationally with the FBP system:
 *   'S' - Surface fire           (cfb <  0.1)
 *   'I' - Intermittent crown     (0.1 <= cfb < 0.9)
 *   'C' - Continuous crown       (cfb >= 0.9)
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Section 7.5 fire description; the
 * upper bound was corrected from > 0.9 to >= 0.9 per the official ST-X-3
 * errata, page 39.)
 *
 * @param {number} cfb - Crown Fraction Burned, 0 to 1 (from `cfb()`).
 * @returns {'S' | 'I' | 'C'} Fire type code.
 */
export function ft(cfb: number): "S" | "I" | "C" {
  if (cfb < 0.1) return "S";
  if (cfb < 0.9) return "I";
  return "C";
}

export default ft;
