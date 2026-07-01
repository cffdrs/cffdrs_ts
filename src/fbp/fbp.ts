/**
 * Fire Behaviour Prediction - top-level orchestrator. Composes the FBP
 * primitives (fmc, sf, isf, ros, be, sfc, cfb, cfc, tfc, fi, ft) into a
 * single call that produces the canonical fire-behaviour output bundle
 * for a station + weather snapshot.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Wind/slope vector synthesis from
 * Eqs. 40-53a; head/back ROS and elliptical fire growth from Eqs. 70-89.)
 *
 * The fb sub-system FWI primitives in this library (ffmc, dmc, dc, ...) take
 * positional numeric arguments. FBP's master function has too many
 * parameters (15+) for positional to remain readable, so this is the one
 * exception - fbp() takes a typed input struct and returns a typed
 * output struct. The primitives it composes stay positional.
 */
import { ffmc as _ffmcStub } from "../fwi/ffmc"; // touch to ensure side-free import; not used here

import { getFuel } from "./fuelTypes";
import fmc from "./fmc";
import slopeAdjustment from "./slopeAdjustment";
import ros from "./ros";
import sfc from "./sfc";
import cfb from "./cfb";
import cfc from "./cfc";
import tfc from "./tfc";
import fi from "./fi";
import ft from "./ft";

void _ffmcStub; // silence unused-import warning while documenting the FWI link

export interface FbpInput {
  /** Fuel type code (e.g. "C2", "M1", "O1a"). */
  fueltype: string;
  /** Fine Fuel Moisture Code. */
  ffmc: number;
  /** Buildup Index. */
  bui: number;
  /** Wind speed (km/h) at 10 m, in the open. */
  ws: number;
  /** Wind azimuth (degrees from N, clockwise). */
  waz: number;
  /** Percent slope (0-60% per ST-X-3 cap). */
  ps: number;
  /** Slope azimuth - direction of upslope (degrees from N, clockwise). */
  saz: number;
  /** Station latitude (decimal degrees). */
  lat: number;
  /** Station longitude (signed decimal degrees, W negative). */
  lon: number;
  /** Station elevation (m above sea level). */
  elev: number;
  /** Day of year (1-366). */
  jd: number;
  /** Percent conifer composition (M-1 / M-2 only). */
  pc?: number;
  /** Percent dead balsam fir (M-3 / M-4 only). */
  pdf?: number;
  /** Degree of curing in percent (O-1a / O-1b only). */
  cur?: number;
  /** Grass fuel load kg/m^2 (O-1a / O-1b only). */
  gfl?: number;
  /** Override fuel's default crown base height (m). */
  cbh?: number;
  /** Override foliar moisture content (%) - bypasses fmc() if supplied. */
  fmc?: number;
  /** Override the date-of-minimum-FMC used by fmc(). */
  jd_min?: number;
  /** Elapsed time since ignition in minutes (default 60). */
  et?: number;
}

export interface FbpOutput {
  /** Head fire rate of spread (m/min). */
  ros: number;
  /** Back fire rate of spread (m/min). */
  bros: number;
  /** Flank fire rate of spread (m/min). */
  fros: number;
  /** Crown fraction burned (0-1). */
  cfb: number;
  /** Head fire intensity (kW/m). */
  hfi: number;
  /** Back fire intensity (kW/m). */
  bfi: number;
  /** Flank fire intensity (kW/m). */
  ffi: number;
  /** Fire type classification. */
  ft: "S" | "I" | "C";
  /** Surface fuel consumption (kg/m^2). */
  sfc: number;
  /** Crown fuel consumption (kg/m^2). */
  cfc: number;
  /** Total fuel consumption (kg/m^2). */
  tfc: number;
  /** Foliar moisture content (%) used in the calculation. */
  fmc: number;
  /** Initial Spread Index on slope (combined wind+slope). */
  isi: number;
  /** Net effective wind speed (km/h). */
  wsv: number;
  /** Spread direction azimuth (degrees from N, clockwise). */
  raz: number;
  /** Length-to-breadth ratio (elliptical fire model). */
  lb: number;
  /** Head fire spread distance over et minutes (m). */
  dh: number;
  /** Back fire spread distance over et minutes (m). */
  db: number;
}

// ---- f(F) function from the ISI calculation procedure (Eqs. 45, 46) ----
function fF(ffmcVal: number): number {
  // Eq. 46
  const m = (147.2 * (101 - ffmcVal)) / (59.5 + ffmcVal);
  // Eq. 45
  return 91.9 * Math.exp(-0.1386 * m) * (1 + Math.pow(m, 5.31) / 4.93e7);
}

// ---- Wind function f(W) (Eqs. 53, 53a) ----
function fW(wsv: number): number {
  // Eq. 53a kicks in beyond 40 km/h equivalent wind
  if (wsv > 40) {
    return 12 * (1 - Math.exp(-0.0818 * (wsv - 28)));
  }
  // Eq. 53
  return Math.exp(0.05039 * wsv);
}

// ---- Back-fire wind function Bf(W) (Eq. 75) ----
function bfW(wsv: number): number {
  // Eq. 75
  return Math.exp(-0.05039 * wsv);
}

// ---- Length-to-breadth ratio (Eqs. 79, 80, 81) ----
function lengthToBreadth(fueltype: string, wsv: number): number {
  if (fueltype === "O1a" || fueltype === "O1b") {
    // Errata-corrected Eq. 80 / 81
    return wsv >= 1.0 ? 1.1 * Math.pow(wsv, 0.464) : 1.0;
  }
  // Eq. 79
  return 1.0 + 8.729 * Math.pow(1 - Math.exp(-0.030 * wsv), 2.155);
}

export function fbp(input: FbpInput): FbpOutput {
  const fuel = getFuel(input.fueltype);

  // ---- 1. Foliar moisture content (Eqs. 1-8) ----
  const fmcEff =
    input.fmc !== undefined
      ? input.fmc
      : fmc(input.lat, input.lon, input.elev, input.jd, input.jd_min);

  // ---- 2. Surface fuel consumption (Eqs. 9-25) ----
  const sfcEff = sfc(input.fueltype, input.ffmc, input.bui, input.pc, input.gfl);

  // ---- 3. ISI with zero wind, level ground (Eqs. 45, 46, 52 with f(W)=1) ----
  const fFv = fF(input.ffmc);
  const isz = 0.208 * fFv * 1.0;

  // ---- 4-6. Slope adjustment: net effective wind speed (WSV) and resultant
  //           spread direction (RAZ), via the SF/RSZ/RSF/ISF/WSE vector
  //           synthesis (Eqs. 39, 40, 41-51). Delegated to slopeAdjustment(),
  //           which mirrors R cffdrs_r's slope_adjustment exactly — crucially
  //           it computes RSZ with NoBUI=-1 (buildup effect OFF) so the
  //           slope-equivalent ISI is not contaminated by BUI on sloped runs.
  const { wsv, raz } = slopeAdjustment(
    input.fueltype,
    input.ffmc,
    input.bui,
    input.ws,
    input.waz,
    input.ps,
    input.saz,
    fmcEff,
    sfcEff,
    input.pc,
    input.pdf,
    input.cur,
    input.cbh
  );

  // ---- 7. Final ISI accounting for net wind (Eqs. 52, 53/53a) ----
  const isi = 0.208 * fW(wsv) * fFv;

  // ---- 8. Head fire ROS (with crowning where applicable) ----
  const rosHead = ros(
    input.fueltype,
    isi,
    input.bui,
    fmcEff,
    sfcEff,
    input.pc,
    input.pdf,
    input.cur,
    input.cbh
  );

  // ---- 9. Crown fraction burned (Eqs. 56-58) ----
  const cfbVal = cfb(input.fueltype, fmcEff, sfcEff, rosHead, input.cbh);

  // ---- 10. Fuel consumption rollup (Eqs. 66, 67) ----
  const cfcVal = cfc(fuel.cfl, cfbVal);
  const tfcVal = tfc(sfcEff, cfcVal);

  // ---- 11. Head fire intensity (Eq. 69) ----
  const hfi = fi(tfcVal, rosHead);

  // ---- 12. Back fire — uses back-wind function and the fuel's ROS eq ----
  const bisi = 0.208 * bfW(wsv) * fFv;
  const bros = ros(
    input.fueltype,
    bisi,
    input.bui,
    fmcEff,
    sfcEff,
    input.pc,
    input.pdf,
    input.cur,
    input.cbh
  );

  // ---- 13. Length-to-breadth ratio + flank ROS (Eqs. 79-81, 89) ----
  const lb = lengthToBreadth(input.fueltype, wsv);
  const fros = (rosHead + bros) / (lb * 2);

  // ---- 14. Spread distances (Eqs. 74, 78) ----
  const et = input.et === undefined ? 60 : input.et;
  const dh = rosHead * et;
  const db = bros * et;

  // ---- 15. Back- and flank-fire intensities — same form as Eq. 69 ----
  const bfi = fi(tfcVal, bros);
  const ffi = fi(tfcVal, fros);

  return {
    ros: rosHead,
    bros,
    fros,
    cfb: cfbVal,
    hfi,
    bfi,
    ffi,
    ft: ft(cfbVal),
    sfc: sfcEff,
    cfc: cfcVal,
    tfc: tfcVal,
    fmc: fmcEff,
    isi,
    wsv,
    raz,
    lb,
    dh,
    db,
  };
}

export default fbp;
