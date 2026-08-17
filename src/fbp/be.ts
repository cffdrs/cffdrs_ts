/**
 * Buildup Effect on Rate of Spread. Multiplier applied to RSI to account for
 * the influence of available fuel (as represented by BUI).
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eq. 54.)
 *
 * @param {string} fueltype - Fuel type code (used to look up q and BUI0).
 * @param {number} bui      - Buildup Index.
 * @returns {number} BUI effect (dimensionless; 1.0 when BUI = BUI0).
 */
import { getFuel } from "./fuelTypes";

export function be(fueltype: string, bui: number): number {
  const f = getFuel(fueltype);
  // Eq. 54. At BUI <= 0 (or BUI0 <= 0) the buildup effect is neutral (1.0):
  // with no buildup there is no modification to RSI.
  if (bui <= 0 || f.bui0 <= 0) return 1;
  return Math.exp(50 * Math.log(f.q) * (1 / bui - 1 / f.bui0));
}

export default be;
