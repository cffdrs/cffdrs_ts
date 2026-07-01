/**
 * Crown Fuel Consumption. Mass of crown fuel consumed per unit area (kg/m^2)
 * — the product of the crown fuel load and the crown fraction burned.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eq. 66.)
 *
 * @param {number} cfl - Crown fuel load (kg/m^2) from the fuel type record.
 * @param {number} cfb - Crown fraction burned (0 to 1) (from `cfb()`).
 * @returns {number} Crown fuel consumption in kg/m^2.
 */
export function cfc(cfl: number, cfb: number): number {
  // Eq. 66
  return cfl * cfb;
}

export default cfc;
