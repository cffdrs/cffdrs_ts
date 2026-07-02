/**
 * Crown fuel consumption (CFC) — the mass of crown fuel consumed per unit area,
 * with the mixedwood correction that scales the raw crown load by the conifer
 * (M1/M2) or dead-fir (M3/M4) fraction.
 *
 * Mirrors R cffdrs_r's `crown_fuel_consumption` (R/total_fuel_consumption.r):
 *   - Eq. 66a (Wotton 2009): CFC = CFL * CFB.
 *   - Eq. 66b: M1/M2 scale by PC/100 (only the conifer fraction crowns).
 *   - Eq. 66c: M3/M4 scale by PDF/100 (only the dead-fir fraction crowns).
 *
 * The bare `cfc()` primitive computes only CFL * CFB; the mixedwood weighting is
 * an fbp-level concern (it needs the stand composition), which is why it lives
 * here rather than in cfc.ts.
 *
 * @param fueltype Fuel type code (canonical: C1..C7, D1, M1..M4, S1..S3, O1a, O1b).
 * @param cfl Crown fuel load (kg/m^2).
 * @param cfb Crown fraction burned (0..1).
 * @param pc  Percent conifer (M1/M2); defaults to R's 50.
 * @param pdf Percent dead balsam fir (M3/M4); defaults to R's 35.
 * @returns Crown fuel consumption (kg/m^2).
 */
export function crownFuelConsumption(
  fueltype: string,
  cfl: number,
  cfb: number,
  pc?: number,
  pdf?: number
): number {
  const ft = fueltype.trim();
  const cfc = cfl * cfb; // Eq. 66a
  if (ft === "M1" || ft === "M2") return ((pc === undefined ? 50 : pc) / 100) * cfc; // Eq. 66b
  if (ft === "M3" || ft === "M4") return ((pdf === undefined ? 35 : pdf) / 100) * cfc; // Eq. 66c
  return cfc;
}

export default crownFuelConsumption;
