/**
 * Fire Intensity. Frontal fire intensity in kilowatts per metre of fire
 * front (kW/m). Byram's intensity formulation with the FBP convention
 * I = 300 * FC * ROS, where 300 is the kJ/kg heat-of-combustion constant
 * used throughout ST-X-3.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eqs. 68, 69.)
 *
 * When called with the head ROS and the total fuel consumption, the output
 * is Head Fire Intensity (HFI).
 *
 * @param {number} fc  - Fuel consumption (kg/m^2). Pass `tfc` for HFI, `sfc`
 *                       for surface-fire-only intensity, or `cfc` for crown.
 * @param {number} ros - Rate of spread (m/min) corresponding to the same
 *                       direction (head, flank, back) as the desired intensity.
 * @returns {number} Fire intensity in kW/m.
 */
export function fi(fc: number, ros: number): number {
  // Eq. 69
  return 300 * fc * ros;
}

export default fi;
