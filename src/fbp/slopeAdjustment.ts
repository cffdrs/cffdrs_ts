/**
 * Slope adjustment — net effective wind speed (WSV) and resultant spread
 * direction azimuth (RAZ) from the vector synthesis of wind and slope.
 *
 * Mirrors R cffdrs_r's `slope_adjustment` (R/Slopecalc.r) exactly, including:
 *   - NoBUI = -1 for the zero-wind surface ROS (RSZ) so the buildup effect is
 *     neutral (be() returns 1 when BUI <= 0) — the slope-equivalent ISI must be
 *     derived with buildup OFF, otherwise BUI contaminates WSE on every run.
 *   - the 0.01 floor on `1 - (RSF/a)^(1/c0)` for basic and M-component fuels,
 *     applied as `log(0.01)/(-b)` (Eqs. 41a/41b, Wotton 2009).
 *   - M1/M2 ISF blend of C2 & D1 component ISFs weighted by PC (Eq. 42a);
 *     M3 blends an M3-coefficient ISF with D1 by PDF (Eq. 42b); M4 blends an
 *     M4-coefficient ISF with D1 by PDF (Eq. 42c). M3/M4 compute RSZ with
 *     PDF = 100 for the mixedwood component, per R.
 *   - the 3-branch WSE correction (Eqs. 44a-44e, Wotton 2009 / GLC-X-10): the
 *     linear-domain inverse, the high-wind (>40 km/h equiv) corrected branch,
 *     and the 112.45 cap when ISF saturates f(W)'s ceiling.
 *
 * Forestry Canada Fire Danger Group. 1992. Information Report ST-X-3.
 *   (Eqs. 39, 40, 45-51.)
 * Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009. Information Report
 *   GLC-X-10. (Eqs. 41a/41b, 42a-42c, 43a/43b, 44a-44e.)
 *
 * Angle convention: WAZ/SAZ inputs are in DEGREES (this library's convention);
 * RAZ is returned in DEGREES. R works internally in radians — the parity test
 * converts. WSV is in km/h.
 */
import ros from "./ros";

// R cffdrs_r per-fuel coefficients for the ISF inversion (Slopecalc.r `a/b/c0`).
// These match the FBP fuel table; reproduced locally because the M-component
// blending references C2/D1 coefficients directly.
const A: Record<string, number> = {
  C1: 90, C2: 110, C3: 110, C4: 110, C5: 30, C6: 30, C7: 45,
  D1: 30, M3: 120, M4: 100, S1: 75, S2: 40, S3: 55, O1a: 190, O1b: 250,
};
const B: Record<string, number> = {
  C1: 0.0649, C2: 0.0282, C3: 0.0444, C4: 0.0293, C5: 0.0697, C6: 0.08,
  C7: 0.0305, D1: 0.0232, M3: 0.0572, M4: 0.0404, S1: 0.0297, S2: 0.0438,
  S3: 0.0829, O1a: 0.031, O1b: 0.035,
};
const C0: Record<string, number> = {
  C1: 4.5, C2: 1.5, C3: 3.0, C4: 1.5, C5: 4.0, C6: 3.0, C7: 2.0,
  D1: 1.6, M3: 1.4, M4: 1.48, S1: 1.3, S2: 1.7, S3: 3.2, O1a: 1.4, O1b: 1.7,
};

const FFMC_COEFFICIENT = 147.2772277227723; // R's exact constant (250 * 59.5 / 101)

// ISI with zero wind on level ground — initial_spread_index(FFMC, 0).
// Eqs. 45, 46 with f(W) = 1.
function initialSpreadIndexZeroWind(ffmc: number): number {
  const m = (FFMC_COEFFICIENT * (101 - ffmc)) / (59.5 + ffmc);
  const fF = 91.9 * Math.exp(-0.1386 * m) * (1 + Math.pow(m, 5.31) / 4.93e7);
  return 0.208 * fF;
}

// Eqs. 41a/41b basic-fuel ISF with the 0.01 floor, using R's a/b/c0 vectors.
function basicIsf(rsf: number, fuel: string): number {
  const inner = 1 - Math.pow(rsf / A[fuel], 1 / C0[fuel]);
  return inner >= 0.01
    ? Math.log(inner) / -B[fuel]
    : Math.log(0.01) / -B[fuel];
}

export interface SlopeAdjustment {
  /** Net effective wind speed (km/h). */
  wsv: number;
  /** Resultant spread direction azimuth (DEGREES from N, clockwise). */
  raz: number;
}

/**
 * @param fueltype Fuel type code (this library's canonical form: C1..C7, D1,
 *   M1..M4, S1..S3, O1a, O1b).
 * @param ffmc Fine Fuel Moisture Code.
 * @param bui  Buildup Index (NOTE: ignored for RSZ — R forces NoBUI = -1).
 * @param ws   Wind speed (km/h).
 * @param waz  Wind azimuth (degrees from N, clockwise).
 * @param gs   Ground slope (%).
 * @param saz  Slope azimuth (degrees from N, clockwise).
 * @param fmc  Foliar moisture content (%).
 * @param sfc  Surface fuel consumption (kg/m^2).
 * @param pc   Percent conifer (M1/M2).
 * @param pdf  Percent dead balsam fir (M3/M4).
 * @param cc   Degree of curing (%) (O1a/O1b).
 * @param cbh  Crown base height (m).
 */
export function slopeAdjustment(
  fueltype: string,
  ffmc: number,
  bui: number,
  ws: number,
  waz: number,
  gs: number,
  saz: number,
  fmc: number,
  sfc: number,
  pc?: number,
  pdf?: number,
  cc?: number,
  cbh?: number
): SlopeAdjustment {
  void bui; // R explicitly overrides BUI with NoBUI = -1 (buildup effect OFF).
  const ft = fueltype.trim();
  const NoBUI = -1;
  const DEG = Math.PI / 180;

  // Eq. 39 — Spread Factor (slope), saturating at GS >= 70%.
  const sf = gs >= 70 ? 10 : Math.exp(3.533 * Math.pow(gs / 100, 1.2));

  // Zero-wind, level-ground ISI.
  const isz = initialSpreadIndexZeroWind(ffmc);

  let isfVal: number;

  if (ft === "M1" || ft === "M2") {
    // Component RSZ at PC for C2 and D1, each scaled by SF (Eq. 40), then
    // inverted with C2 / D1 coefficients and blended by PC (Eq. 42a).
    const rszC2 = ros("C2", isz, NoBUI, fmc, sfc, pc, pdf, cc, cbh);
    const rsfC2 = rszC2 * sf;
    const rszD1 = ros("D1", isz, NoBUI, fmc, sfc, pc, pdf, cc, cbh);
    const rsfD1 = rszD1 * sf;
    const isfC2 = basicIsf(rsfC2, "C2");
    const isfD1 = basicIsf(rsfD1, "D1");
    const pcEff = pc === undefined ? 50 : pc;
    isfVal = (pcEff / 100) * isfC2 + (1 - pcEff / 100) * isfD1;
  } else if (ft === "M3") {
    // R's Slopecalc computes the M3 component RSZ with PDF=100, which in R's
    // rate_of_spread reduces to the pure M3 RSI using the TABLE coefficients
    // (a=120, b=0.0572, c0=1.4) — NOT the PDF-formula coefficients (Eqs.
    // 29-31) that ros() applies. The D1 blend term zeroes out at PDF=100. We
    // therefore compute the component RSI directly from the table constants
    // and the D1 RSZ separately, then blend the inverted ISFs by PDF (Eq. 42b).
    const rsiM3 = A.M3 * Math.pow(1 - Math.exp(-B.M3 * isz), C0.M3);
    const rsfM3 = rsiM3 * sf;
    const rszD1 = ros("D1", isz, NoBUI, fmc, sfc, pc, 100, cc, cbh);
    const rsfD1 = rszD1 * sf;
    const isfM3 = basicIsf(rsfM3, "M3");
    const isfD1 = basicIsf(rsfD1, "D1");
    const pdfEff = pdf === undefined ? 35 : pdf;
    isfVal = (pdfEff / 100) * isfM3 + (1 - pdfEff / 100) * isfD1;
  } else if (ft === "M4") {
    // M4 component RSZ at PDF=100 likewise reduces to the pure M4 RSI on the
    // table coefficients (a=100, b=0.0404, c0=1.48). Blend ISFs by PDF (Eq. 42c).
    const rsiM4 = A.M4 * Math.pow(1 - Math.exp(-B.M4 * isz), C0.M4);
    const rsfM4 = rsiM4 * sf;
    const rszD1 = ros("D1", isz, NoBUI, fmc, sfc, pc, 100, cc, cbh);
    const rsfD1 = rszD1 * sf;
    const isfM4 = basicIsf(rsfM4, "M4");
    const isfD1 = basicIsf(rsfD1, "D1");
    const pdfEff = pdf === undefined ? 35 : pdf;
    isfVal = (pdfEff / 100) * isfM4 + (1 - pdfEff / 100) * isfD1;
  } else if (ft === "O1a" || ft === "O1b") {
    // Grass: CF-scaled inversion with the 0.01 floor (Eqs. 43a/43b). NOTE we
    // do NOT reuse isf.ts here: isf.ts returns 0 when the inner term is <= 0,
    // whereas R floors at log(0.01)/(-b) and never returns 0 — that floor is
    // load-bearing for the WSE back-calculation on near-saturating grass rows.
    const rsz = ros(ft, isz, NoBUI, fmc, sfc, pc, pdf, cc, cbh);
    const rsf = rsz * sf;
    const ccEff = cc === undefined ? 100 : cc;
    // Eqs. 35a/35b (Wotton 2009) - curing factor pivoting at 58.8%.
    const cf =
      ccEff < 58.8
        ? 0.005 * (Math.exp(0.061 * ccEff) - 1)
        : 0.176 + 0.02 * (ccEff - 58.8);
    const inner = 1 - Math.pow(rsf / (cf * A[ft]), 1 / C0[ft]);
    isfVal = inner >= 0.01
      ? Math.log(inner) / -B[ft]
      : Math.log(0.01) / -B[ft];
  } else {
    // Basic fuels (C1..C7, D1, S1..S3): Eqs. 41a/41b with 0.01 floor.
    const rsz = ros(ft, isz, NoBUI, fmc, sfc, pc, pdf, cc, cbh);
    const rsf = rsz * sf;
    isfVal = basicIsf(rsf, ft);
  }

  // f(F) for the WSE back-calculation (Eqs. 45, 46).
  const m = (FFMC_COEFFICIENT * (101 - ffmc)) / (59.5 + ffmc);
  const fF = 91.9 * Math.exp(-0.1386 * m) * (1 + Math.pow(m, 5.31) / 4.93e7);

  // Eqs. 44a/44d — linear-domain slope-equivalent wind speed.
  let wse = (1 / 0.05039) * Math.log(isfVal / (0.208 * fF));
  // Eqs. 44b/44e — high-wind corrected branch (f(W) Eq. 53a regime).
  if (wse > 40 && isfVal < 0.999 * 2.496 * fF) {
    wse = 28 - (1 / 0.0818) * Math.log(1 - isfVal / (2.496 * fF));
  }
  // Eq. 44c — saturation cap.
  if (wse > 40 && isfVal >= 0.999 * 2.496 * fF) {
    wse = 112.45;
  }

  // Eqs. 47-51 — vector synthesis (R works in radians; convert our degrees).
  const wazR = waz * DEG;
  const sazR = saz * DEG;
  const wsx = ws * Math.sin(wazR) + wse * Math.sin(sazR);
  const wsy = ws * Math.cos(wazR) + wse * Math.cos(sazR);
  const wsv = Math.sqrt(wsx * wsx + wsy * wsy);
  let razR = wsv > 0 ? Math.acos(wsy / wsv) : 0;
  if (wsx < 0) razR = 2 * Math.PI - razR;
  const raz = razR / DEG;

  return { wsv, raz };
}

export default slopeAdjustment;
