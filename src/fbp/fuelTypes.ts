/**
 * Fuel Type Reference Table.
 *
 * Static per-fuel-type coefficients used throughout the FBP system:
 *   a, b, c    — Rate of spread equation coefficients (Eq. 26)
 *   q          — BUI effect rate-of-spread coefficient (Eq. 54)
 *   bui0       — Average BUI for the fuel type (Eq. 54)
 *   cbh        — Crown base height in metres (Eq. 56–58)
 *   cfl        — Crown fuel load kg/m² (Eq. 65)
 *
 * Sources:
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute, Forestry Canada, Ottawa. 63 p.
 * (Table 6 for ROS coefficients; Table 7 for q + bui0; Table 8 for cbh + cfl.)
 *
 * Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009. Updates and revisions to
 * the 1992 Canadian forest fire behavior prediction system. Information
 * Report GLC-X-10. Natural Resources Canada, Great Lakes Forestry Centre.
 *
 * The M-1 / M-2 (boreal mixedwood) and M-3 / M-4 (dead balsam fir mixedwood)
 * fuel types have ROS coefficients that depend on the user-supplied PC or
 * PDF parameter and are computed dynamically by ros.ts; they appear in this
 * table only for cbh / cfl / bui0 reference.
 */

export interface Fuel {
  /** Fuel type code, e.g. "C2", "O1a". */
  code: string;
  /** Rate of spread equation coefficient `a` (Eq. 26). NaN for M-fuels. */
  a: number;
  /** Rate of spread equation coefficient `b` (Eq. 26). NaN for M-fuels. */
  b: number;
  /** Rate of spread equation coefficient `c` (Eq. 26). NaN for M-fuels. */
  c: number;
  /** BUI effect proportion (Eq. 54). */
  q: number;
  /** Average BUI for the fuel type (Eq. 54). */
  bui0: number;
  /** Crown base height in metres (Eq. 56). */
  cbh: number;
  /** Crown fuel load kg/m² (Eq. 65). */
  cfl: number;
}

const NaN_M = Number.NaN;

export const FUELS: Readonly<Record<string, Fuel>> = Object.freeze({
  // Coniferous fuel types
  C1:  { code: "C1",  a:  90, b: 0.0649, c: 4.5, q: 0.90, bui0:  72, cbh:  2, cfl: 0.75 },
  C2:  { code: "C2",  a: 110, b: 0.0282, c: 1.5, q: 0.70, bui0:  64, cbh:  3, cfl: 0.80 },
  C3:  { code: "C3",  a: 110, b: 0.0444, c: 3.0, q: 0.75, bui0:  62, cbh:  8, cfl: 1.15 },
  C4:  { code: "C4",  a: 110, b: 0.0293, c: 1.5, q: 0.80, bui0:  66, cbh:  4, cfl: 1.20 },
  C5:  { code: "C5",  a:  30, b: 0.0697, c: 4.0, q: 0.80, bui0:  56, cbh: 18, cfl: 1.20 },
  C6:  { code: "C6",  a:  30, b: 0.0800, c: 3.0, q: 0.80, bui0:  62, cbh:  7, cfl: 1.80 },
  C7:  { code: "C7",  a:  45, b: 0.0305, c: 2.0, q: 0.85, bui0: 106, cbh: 10, cfl: 0.50 },

  // Deciduous fuel type
  D1:  { code: "D1",  a:  30, b: 0.0232, c: 1.6, q: 0.90, bui0:  32, cbh:  0, cfl: 0 },

  // Slash fuel types — non-crowning (cbh and cfl = 0)
  S1:  { code: "S1",  a:  75, b: 0.0297, c: 1.3, q: 0.75, bui0:  38, cbh:  0, cfl: 0 },
  S2:  { code: "S2",  a:  40, b: 0.0438, c: 1.7, q: 0.75, bui0:  63, cbh:  0, cfl: 0 },
  S3:  { code: "S3",  a:  55, b: 0.0829, c: 3.2, q: 0.75, bui0:  31, cbh:  0, cfl: 0 },

  // Open fuel types (grass) — non-crowning
  O1a: { code: "O1a", a: 190, b: 0.0310, c: 1.4, q: 1.00, bui0:   1, cbh:  0, cfl: 0 },
  O1b: { code: "O1b", a: 250, b: 0.0350, c: 1.7, q: 1.00, bui0:   1, cbh:  0, cfl: 0 },

  // Mixedwood fuel types — a/b/c computed dynamically from PC or PDF (ros.ts)
  M1:  { code: "M1",  a: NaN_M, b: NaN_M, c: NaN_M, q: 0.80, bui0: 50, cbh: 6, cfl: 0.80 },
  M2:  { code: "M2",  a: NaN_M, b: NaN_M, c: NaN_M, q: 0.80, bui0: 50, cbh: 6, cfl: 0.80 },
  M3:  { code: "M3",  a: NaN_M, b: NaN_M, c: NaN_M, q: 0.80, bui0: 50, cbh: 6, cfl: 0.80 },
  M4:  { code: "M4",  a: NaN_M, b: NaN_M, c: NaN_M, q: 0.80, bui0: 50, cbh: 6, cfl: 0.80 },
});

/**
 * Look up a fuel type record by its canonical code (e.g. "C2", "O1a").
 * Codes are case-sensitive; whitespace is trimmed.
 *
 * @throws Error if the code is not recognised.
 */
export function getFuel(code: string): Fuel {
  const key = code.trim();
  const fuel = FUELS[key];
  if (!fuel) throw new Error(`getFuel: unknown fuel type code '${code}'`);
  return fuel;
}

export default getFuel;
