/**
 * Surface Fuel Consumption. Mass of surface fuel consumed per unit area
 * (kg/m^2) at the fire front. Branches by fuel type.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Eqs. 9-25.)
 *
 * @param {string} fueltype - Fuel type code.
 * @param {number} ffmc - Fine Fuel Moisture Code.
 * @param {number} bui - Buildup Index.
 * @param {number} [pc] - Percent conifer (M-1 / M-2 only; default 50).
 * @param {number} [gfl] - Grass fuel load kg/m^2 (O-1a / O-1b only; default 0.35).
 * @returns {number} Surface fuel consumption in kg/m^2.
 */
export function sfc(
  fueltype: string,
  ffmc: number,
  bui: number,
  pc?: number,
  gfl?: number
): number {
  const ft = fueltype.trim();
  const exp = Math.exp;

  let v: number;
  switch (ft) {
    case "C1": {
      // Eq. 9 — two-sided form about FFMC = 84.
      v =
        ffmc > 84
          ? 0.75 + 0.75 * Math.pow(1 - exp(-0.23 * (ffmc - 84)), 0.5)
          : 0.75 - 0.75 * Math.pow(1 - exp(-0.23 * (84 - ffmc)), 0.5);
      break;
    }
    case "C2":
    case "M3":
    case "M4":
      // Eq. 10
      v = 5.0 * Math.pow(1 - exp(-0.0115 * bui), 1.0);
      break;
    case "C3":
    case "C4":
      // Eq. 11
      v = 5.0 * Math.pow(1 - exp(-0.0164 * bui), 2.24);
      break;
    case "C5":
    case "C6":
      // Eq. 12
      v = 5.0 * Math.pow(1 - exp(-0.0149 * bui), 2.48);
      break;
    case "C7": {
      // Eq. 13 (FFC, clipped at zero)
      const ffc = Math.max(0, 2 * (1 - exp(-0.104 * (ffmc - 70))));
      // Eq. 14 (WFC)
      const wfc = 1.5 * (1 - exp(-0.0201 * bui));
      // Eq. 15
      v = ffc + wfc;
      break;
    }
    case "D1":
      // Eq. 16
      v = 1.5 * (1 - exp(-0.0183 * bui));
      break;
    case "M1":
    case "M2": {
      // Eq. 17 — weighted average of C-2 and D-1 surface fuel consumption
      const pcEff = pc === undefined ? 50 : pc;
      const ph = 100 - pcEff;
      const sfcC2 = sfc("C2", ffmc, bui);
      const sfcD1 = sfc("D1", ffmc, bui);
      v = (pcEff / 100) * sfcC2 + (ph / 100) * sfcD1;
      break;
    }
    case "O1a":
    case "O1b":
      // Eq. 18 — surface fuel consumption equals user-supplied grass fuel load
      v = gfl === undefined ? 0.35 : gfl;
      break;
    case "S1": {
      // Eqs. 19, 20, 25
      const ffc = 4.0 * (1 - exp(-0.025 * bui));
      const wfc = 4.0 * (1 - exp(-0.034 * bui));
      v = ffc + wfc;
      break;
    }
    case "S2": {
      // Eqs. 21, 22, 25
      const ffc = 10.0 * (1 - exp(-0.013 * bui));
      const wfc = 6.0 * (1 - exp(-0.060 * bui));
      v = ffc + wfc;
      break;
    }
    case "S3": {
      // Eqs. 23, 24, 25
      const ffc = 12.0 * (1 - exp(-0.0166 * bui));
      const wfc = 20.0 * (1 - exp(-0.0210 * bui));
      v = ffc + wfc;
      break;
    }
    default:
      throw new Error(`sfc: unknown fuel type '${fueltype}'`);
  }

  // Numerical floor: SFC is never reported as <= 0 (matches reference impl).
  return v <= 0 ? 0.000001 : v;
}

export default sfc;
