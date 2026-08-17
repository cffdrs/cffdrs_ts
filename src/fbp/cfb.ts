/**
 * Crown Fraction Burned. Fraction of the canopy that ignites (0 to 1) given
 * head fire rate of spread, surface fuel consumption, and crown base height.
 * Non-zero only for crowning fuel types (cbh > 0) and only when ROS exceeds
 * the critical surface fire rate of spread (RSO).
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eqs. 56-58.)
 *
 * @param {string} fueltype - Fuel type code (used to look up cbh).
 * @param {number} fmc      - Foliar Moisture Content (%) (from `fmc()`).
 * @param {number} sfc      - Surface Fuel Consumption (kg/m^2) (from `sfc()`).
 * @param {number} ros      - Head fire rate of spread (m/min) (from `ros()`).
 * @param {number} [cbh]    - Override of fuel's default crown base height (m).
 * @returns {number} Crown fraction burned, 0 to 1.
 */
import { getFuel } from "./fuelTypes";

export function cfb(
  fueltype: string,
  fmc: number,
  sfc: number,
  ros: number,
  cbh?: number
): number {
  const f = getFuel(fueltype);
  const cbhEff = cbh === undefined ? f.cbh : cbh;
  if (cbhEff <= 0 || sfc <= 0) return 0;
  // Eq. 56
  const csi = 0.001 * Math.pow(cbhEff, 1.5) * Math.pow(460 + 25.9 * fmc, 1.5);
  // Eq. 57
  const rso = csi / (300 * sfc);
  // Eq. 58
  if (ros <= rso) return 0;
  return 1 - Math.exp(-0.23 * (ros - rso));
}

export default cfb;
