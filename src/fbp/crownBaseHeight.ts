/**
 * Crown base height (CBH) — the height above ground of the base of the live
 * crown, resolved from an optional supplied value, the fuel-type default, or a
 * C-6 stand-structure estimate.
 *
 * Mirrors R cffdrs_r's `crown_base_height` (R/crown_base_height.r) exactly:
 *   - A supplied CBH in (0, 50] is used as-is.
 *   - Otherwise (CBH <= 0, > 50, or NaN) fall back to:
 *       - C6 with stand density SD > 0 and stand height SH > 0:
 *         CBH = -11.2 + 1.06 * SH + 0.0017 * SD  (stand-derived estimate).
 *       - all other cases: the fuel-type default CBH (fuelTypes table).
 *   - A negative result is floored to 1e-07 (a positive epsilon, so downstream
 *     division/logs stay defined).
 *
 * @param fueltype Fuel type code (canonical: C1..C7, D1, M1..M4, S1..S3, O1a, O1b).
 * @param cbh Supplied crown base height (m); <= 0, > 50, or NaN triggers fallback.
 * @param sd  Stand density (stems/ha) — used only for the C6 estimate.
 * @param sh  Stand height (m) — used only for the C6 estimate.
 * @returns Crown base height (m).
 */
import { getFuel } from "./fuelTypes";

export function crownBaseHeight(
  fueltype: string,
  cbh: number,
  sd: number,
  sh: number
): number {
  const ft = fueltype.trim();
  let result: number;
  if (cbh <= 0 || cbh > 50 || !isFinite(cbh)) {
    result =
      ft === "C6" && sd > 0 && sh > 0
        ? -11.2 + 1.06 * sh + 0.0017 * sd
        : getFuel(ft).cbh;
  } else {
    result = cbh;
  }
  // Floor negatives to a positive epsilon (R uses 1e-07).
  return result < 0 ? 1e-7 : result;
}

export default crownBaseHeight;
