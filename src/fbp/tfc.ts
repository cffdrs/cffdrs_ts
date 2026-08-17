/**
 * Total Fuel Consumption. Sum of surface fuel consumed and crown fuel
 * consumed per unit area (kg/m^2). The product `300 * TFC * ROS` is the
 * Head Fire Intensity (see `fi.ts`).
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eq. 67.)
 *
 * @param {number} sfc - Surface Fuel Consumption (kg/m^2) (from `sfc()`).
 * @param {number} cfc - Crown Fuel Consumption (kg/m^2) (from `cfc()`).
 * @returns {number} Total fuel consumption in kg/m^2.
 */
export function tfc(sfc: number, cfc: number): number {
  // Eq. 67
  return sfc + cfc;
}

export default tfc;
