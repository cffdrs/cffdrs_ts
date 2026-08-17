/**
 * Fire Behaviour Prediction - top-level orchestrator. Composes the FBP
 * primitives (fmc, sf, isf, ros, be, sfc, cfb, cfc, tfc, fi, ft, and the §8
 * secondary set) into a single call that produces the canonical fire-behaviour
 * output bundle (primary + secondary) for a station + weather snapshot.
 *
 * Forestry Canada Fire Danger Group. 1992. Development and structure of the
 * Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.
 * Petawawa National Forestry Institute. (Wind/slope vector synthesis from
 * Eqs. 40-53a; head/back ROS and elliptical fire growth from Eqs. 70-89.)
 * Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009. Information Report GLC-X-10.
 *
 * Mirrors R cffdrs_r's `fire_behaviour_prediction` output="ALL" path. The
 * secondary block (BE, SF, RSO, CSI, D0, FROS/BROS, the time-dependent HROSt/
 * FROSt/BROSt, LBt, DH/DB/DF, the theta variants TROS/TROSt, and the crown-fire
 * timing TI/FTI/BTI/TTI) is delegated to the validated §8 primitives.
 *
 * The fb sub-system FWI primitives in this library (ffmc, dmc, dc, ...) take
 * positional numeric arguments. FBP's master function has too many
 * parameters (15+) for positional to remain readable, so this is the one
 * exception - fbp() takes a typed input struct and returns a typed
 * output struct. The primitives it composes stay positional.
 */
import { ffmc as _ffmcStub } from "../fwi/ffmc"; // touch to ensure side-free import; not used here

import { getFuel } from "./fuelTypes";
import fmc, { foliarMoistureContentMinimum } from "./fmc";
import slopeAdjustment from "./slopeAdjustment";
import ros from "./ros";
import be from "./be";
import sfc from "./sfc";
import cfb from "./cfb";
import tfc from "./tfc";
import fi from "./fi";
import ft from "./ft";
import lb from "./lb";
import bros from "./bros";
import fros from "./fros";
import lbAtTime from "./lbAtTime";
import rosAtTime from "./rosAtTime";
import distanceAtTime from "./distanceAtTime";
import crownBaseHeight from "./crownBaseHeight";
import crownFuelConsumption from "./crownFuelConsumption";
import {
  criticalSurfaceIntensity,
  surfaceFireRateOfSpread,
  crownFractionBurned,
  intermediateSurfaceRateOfSpreadC6,
  surfaceRateOfSpreadC6,
  crownRateOfSpreadC6,
  crownFractionBurnedC6,
} from "./c6";

void _ffmcStub; // silence unused-import warning while documenting the FWI link

// Fuels for which R zeroes foliar moisture content and its date-of-minimum.
const NO_FMC = new Set(["D1", "S1", "S2", "S3", "O1a", "O1b"]);

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
  /** Crown fuel load override (kg/m^2); defaults to the fuel-type value. */
  cfl?: number;
  /** Stand density (stems/ha) — used only for the C6 CBH estimate. */
  sd?: number;
  /** Stand height (m) — used only for the C6 CBH estimate. */
  sh?: number;
  /** Override foliar moisture content (%) - bypasses fmc() if supplied. */
  fmc?: number;
  /** Override the date-of-minimum-FMC (D0) used by fmc(). */
  jd_min?: number;
  /** Elapsed time since ignition in minutes (default 60). */
  et?: number;
  /** Acceleration flag: 1 = point-source (accelerating), 0 = line (equilibrium). */
  accel?: number;
  /** Angle from the head-fire direction for the theta outputs (degrees). */
  theta?: number;
}

export interface FbpOutput {
  // ---- Primary ----
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
  // ---- Secondary (§8) ----
  /** Buildup effect multiplier. */
  be: number;
  /** Slope factor (spread factor). */
  sf: number;
  /** Critical surface fire rate of spread (m/min). */
  rso: number;
  /** Critical surface fire intensity (kW/m). */
  csi: number;
  /** Date of minimum foliar moisture content (day of year). */
  d0: number;
  /** Length-to-breadth ratio at elapsed time. */
  lbt: number;
  /** Flank fire spread distance over et minutes (m). */
  df: number;
  /** Head fire rate of spread at elapsed time (m/min). */
  hrost: number;
  /** Flank fire rate of spread at elapsed time (m/min). */
  frost: number;
  /** Back fire rate of spread at elapsed time (m/min). */
  brost: number;
  /** Rate of spread toward angle theta (m/min). */
  tros: number;
  /** Rate of spread toward angle theta at elapsed time (m/min). */
  trost: number;
  /** Flank crown fraction burned (0-1). */
  fcfb: number;
  /** Back crown fraction burned (0-1). */
  bcfb: number;
  /** Theta-direction crown fraction burned (0-1). */
  tcfb: number;
  /** Flank fire total fuel consumption (kg/m^2). */
  ftfc: number;
  /** Back fire total fuel consumption (kg/m^2). */
  btfc: number;
  /** Theta-direction total fuel consumption (kg/m^2). */
  ttfc: number;
  /** Theta-direction fire intensity (kW/m). */
  tfi: number;
  /** Elapsed time to crown fire initiation — head (min). */
  ti: number;
  /** Elapsed time to crown fire initiation — flank (min). */
  fti: number;
  /** Elapsed time to crown fire initiation — back (min). */
  bti: number;
  /** Elapsed time to crown fire initiation — theta (min). */
  tti: number;
}

const FFMC_COEFFICIENT = 147.2772277227723; // R's exact constant (250 * 59.5 / 101).

// ---- f(F) function from the ISI calculation procedure (Eqs. 45, 46) ----
function fF(ffmcVal: number): number {
  // Eq. 46
  const m = (FFMC_COEFFICIENT * (101 - ffmcVal)) / (59.5 + ffmcVal);
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

// ---- Elapsed time to crown fire initiation (ST-X-3 Eq. 82-esque timing) ----
// Mirrors R's *TI expressions: log(max(1 - RSO/rate, 1)) / -a, where a is the
// CFB-driven acceleration constant (always the closed-fuel form here, per R).
function crownInitTime(rso: number, rate: number, cfbForRate: number): number {
  const a = 0.115 - 18.8 * Math.pow(cfbForRate, 2.5) * Math.exp(-8 * cfbForRate);
  const inner = 1 - rso / rate > 0 ? 1 - rso / rate : 1;
  return Math.log(inner) / -a;
}

export function fbp(input: FbpInput): FbpOutput {
  const fuel = getFuel(input.fueltype);
  const isNoFmc = NO_FMC.has(input.fueltype.trim());

  // ---- 1. Foliar moisture content (Eqs. 1-8) + date-of-minimum (D0) ----
  const d0 =
    input.jd_min !== undefined
      ? input.jd_min
      : foliarMoistureContentMinimum(input.lat, input.lon, input.elev);
  const fmcEff =
    input.fmc !== undefined
      ? input.fmc
      : fmc(input.lat, input.lon, input.elev, input.jd, input.jd_min);

  // ---- 2. Surface fuel consumption (Eqs. 9-25) ----
  const sfcEff = sfc(input.fueltype, input.ffmc, input.bui, input.pc, input.gfl);

  // ---- 3. ISI with zero wind, level ground (Eqs. 45, 46, 52 with f(W)=1) ----
  const fFv = fF(input.ffmc);

  // ---- 4-6. Slope adjustment: net effective wind speed (WSV0) and resultant
  //           spread direction (RAZ0). R keeps the slope-derived values only
  //           when there is slope AND fine-fuel forcing; otherwise it falls
  //           back to the bare wind speed/azimuth (Eqs. 39-51). ----
  const cbhResolved = crownBaseHeight(
    input.fueltype,
    input.cbh === undefined ? NaN : input.cbh,
    input.sd === undefined ? 0 : input.sd,
    input.sh === undefined ? 0 : input.sh
  );
  const { wsv: wsv0, raz: raz0 } = slopeAdjustment(
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
  const slopeForced = input.ps > 0 && input.ffmc > 0;
  const wsv = slopeForced ? wsv0 : input.ws;
  let raz = slopeForced ? raz0 : input.waz;
  if (raz === 360) raz = 0;

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

  // ---- 9. Crown fraction burned + critical thresholds (Eqs. 56-58) ----
  const csiVal = criticalSurfaceIntensity(fmcEff, cbhResolved); // Eq. 56
  const rsoVal = surfaceFireRateOfSpread(csiVal, sfcEff); // Eq. 57
  // C6 derives CFB from its own crown/surface-ROS decomposition (R's
  // rate_of_spread_extended); all other fuels use the generic CFB (Eq. 58).
  const isC6 = input.fueltype.trim() === "C6";
  let cfbVal: number;
  if (fuel.cfl <= 0) {
    cfbVal = 0;
  } else if (isC6) {
    const rssC6 = surfaceRateOfSpreadC6(intermediateSurfaceRateOfSpreadC6(isi), input.bui);
    const rscC6 = crownRateOfSpreadC6(isi, fmcEff);
    cfbVal = crownFractionBurnedC6(rscC6, rssC6, rsoVal);
  } else {
    cfbVal = cfb(input.fueltype, fmcEff, sfcEff, rosHead, input.cbh);
  }

  // ---- 10. Fuel consumption rollup (Eqs. 66, 67) ----
  const cfcVal = crownFuelConsumption(input.fueltype, fuel.cfl, cfbVal, input.pc, input.pdf);
  const tfcVal = tfc(sfcEff, cfcVal);

  // ---- 11. Head fire intensity (Eq. 69) ----
  const hfi = fi(tfcVal, rosHead);

  // ---- 12. Back fire ROS (back-wind ISI fed to the fuel's ROS eq) ----
  const brosVal = bros(
    input.fueltype,
    input.ffmc,
    input.bui,
    wsv,
    fmcEff,
    sfcEff,
    input.pc,
    input.pdf,
    input.cur,
    input.cbh
  );

  // ---- 13. Length-to-breadth ratio + flank ROS (Eqs. 79-81, 89) ----
  const lbVal = lb(input.fueltype, wsv);
  const frosVal = fros(rosHead, brosVal, lbVal);

  // ---- 14. Secondary geometry / timing (§8) ----
  const accel = input.accel === 1 ? 1 : 0;
  const et = input.et === undefined ? 60 : input.et;
  const thetaR = ((input.theta === undefined ? 0 : input.theta) * Math.PI) / 180;

  const beVal = be(input.fueltype, input.bui);
  const sf = input.ps >= 70 ? 10 : Math.exp(3.533 * Math.pow(input.ps / 100, 1.2)); // Eq. 39
  const lbt = accel === 0 ? lbVal : lbAtTime(input.fueltype, lbVal, et, cfbVal); // Eq. 81

  // Eccentricity + theta ROS (R uses cos(THETA - RAZ) with THETA in radians and
  // RAZ carried as its degree value — reproduced verbatim to match R's gold).
  const ecc = Math.sqrt(1 - 1 / lbVal / lbVal);
  const tros = (rosHead * (1 - ecc)) / (1 - ecc * Math.cos(thetaR - raz));

  const rost = accel === 0 ? rosHead : rosAtTime(input.fueltype, rosHead, et, cfbVal); // Eq. 70
  const brost0 = accel === 0 ? brosVal : rosAtTime(input.fueltype, brosVal, et, cfbVal);
  const frost0 = accel === 0 ? frosVal : fros(rost, brost0, lbt);
  const eccT = Math.sqrt(1 - 1 / lbt / lbt);
  const trost =
    accel === 0 ? tros : (rost * (1 - eccT)) / (1 - eccT * Math.cos(thetaR - raz));

  // Crown fraction burned at flank / back / theta (C6 excluded per R).
  const cfbAt = (rate: number) =>
    fuel.cfl === 0 ? 0 : isC6 ? 0 : crownFractionBurned(rate, rsoVal);
  const fcfb = cfbAt(frosVal);
  const bcfb = cfbAt(brosVal);
  const tcfb = cfbAt(tros);

  // Total fuel consumption + intensity at flank / back / theta.
  const ftfc = tfc(sfcEff, crownFuelConsumption(input.fueltype, fuel.cfl, fcfb, input.pc, input.pdf));
  const btfc = tfc(sfcEff, crownFuelConsumption(input.fueltype, fuel.cfl, bcfb, input.pc, input.pdf));
  const ttfc = tfc(sfcEff, crownFuelConsumption(input.fueltype, fuel.cfl, tcfb, input.pc, input.pdf));
  const bfi = fi(btfc, brosVal);
  const ffi = fi(ftfc, frosVal);
  const tfi = fi(ttfc, tros);

  // Elapsed time to crown fire initiation (head/flank/back/theta).
  const ti = crownInitTime(rsoVal, rosHead, cfbVal);
  const fti = crownInitTime(rsoVal, frosVal, fcfb);
  const bti = crownInitTime(rsoVal, brosVal, bcfb);
  const tti = crownInitTime(rsoVal, tros, tcfb);

  // Spread distances (Eqs. 71-72 with acceleration, else linear).
  const dh = accel === 1 ? distanceAtTime(input.fueltype, rosHead, et, cfbVal) : rosHead * et;
  const db = accel === 1 ? distanceAtTime(input.fueltype, brosVal, et, cfbVal) : brosVal * et;
  const df = accel === 1 ? (dh + db) / (lbt * 2) : (dh + db) / (lbVal * 2);

  return {
    ros: rosHead,
    bros: brosVal,
    fros: frosVal,
    cfb: cfbVal,
    hfi,
    bfi,
    ffi,
    ft: ft(cfbVal),
    sfc: sfcEff,
    cfc: cfcVal,
    tfc: tfcVal,
    fmc: isNoFmc ? 0 : fmcEff,
    isi,
    wsv,
    raz,
    lb: lbVal,
    dh,
    db,
    be: beVal,
    sf,
    rso: rsoVal,
    csi: csiVal,
    d0: isNoFmc ? 0 : d0,
    lbt,
    df,
    hrost: rost,
    frost: frost0,
    brost: brost0,
    tros,
    trost,
    fcfb,
    bcfb,
    tcfb,
    ftfc,
    btfc,
    ttfc,
    tfi,
    ti,
    fti,
    bti,
    tti,
  };
}

export default fbp;
