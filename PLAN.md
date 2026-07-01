# FBP Subsystem — Structure and Sources

This document describes how the FBP code in `src/fbp/` is laid out and where its math comes from. It is not a plan or a roadmap.

## 1. Conventions (matches the existing `src/fwi/`)

| Convention | Where it shows up |
|---|---|
| One equation per file, file named after the function it exports | `ffmc.ts`, `dmc.ts`, `dc.ts`, `isi.ts`, `bui.ts`, `fwi.ts` for FWI; same pattern for FBP |
| Function name == file name == default export | `export function ffmc(...) { ... } / export default ffmc;` |
| Positional numeric args, single numeric return on primitives | `ffmc(ffmc_yda, temp, rh, ws, prec): number` |
| JSDoc per function citing the published source documents by equation number | Every FBP file |
| Inline `// Eq. N` comments mapping each block to the numbered equation in the source | Every FBP file |
| `src/fbp/index.ts` barrel; `src/index.ts` re-exports `./fbp` alongside `./fwi` | top of source tree |
| TS strict, ES5 target, `outDir: ./lib`, declarations on | `tsconfig.json` |

The single deliberate convention break: `fbp()` itself takes a typed `FbpInput` / returns a typed `FbpOutput` because 15+ positional arguments is unreadable. The primitives it composes stay positional.

## 2. Source-of-math discipline

The implementation is derived only from these two published documents and cites them by equation number:

- **Forestry Canada Fire Danger Group. 1992.** *Development and structure of the Canadian Forest Fire Behavior Prediction System.* Information Report ST-X-3, Petawawa National Forestry Institute.
- **Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009.** *Updates and revisions to the 1992 Canadian forest fire behavior prediction system.* Information Report GLC-X-10.

The 1994 ST-X-3 errata is incorporated where it applies (Eq. 32 coefficient −33.5, Eq. 80 length-to-breadth form, fire-type 0.9 boundary).

No third-party implementation is referenced in source or tests.

## 3. Files in `src/fbp/`

| File | Function | Equation refs |
|---|---|---|
| `fuelTypes.ts` | `FUELS`, `getFuel(code)` | Table page 60 of ST-X-3 — 17 fuels (C1–7, D1, S1–3, O1a/b, M1–4) |
| `fmc.ts` | `fmc(lat, lon, elev, jd, jd_min?)` | Eqs. 1–8 |
| `sf.ts` | `sf(ps)` | Eq. 39 |
| `sfc.ts` | `sfc(fueltype, ffmc, bui, pc?, gfl?)` | Eqs. 9–25 |
| `be.ts` | `be(fueltype, bui)` | Eq. 54 |
| `ros.ts` | `ros(fueltype, isi, bui, fmc, sfc, pc?, pdf?, cur?, cbh?)` | Eqs. 26–36, 62–65 |
| `cfb.ts` | `cfb(fueltype, fmc, sfc, ros, cbh?)` | Eqs. 56–58 |
| `cfc.ts` | `cfc(cfl, cfb)` | Eq. 66 |
| `tfc.ts` | `tfc(sfc, cfc)` | Eq. 67 |
| `fi.ts` | `fi(fc, ros)` | Eq. 69 |
| `ft.ts` | `ft(cfb)` | Wotton/Alexander/Taylor 2009 thresholds |
| `isf.ts` | `isf(fueltype, rsf, pc?, cur?)` | Eqs. 41–43 |
| `fbp.ts` | `fbp(input: FbpInput): FbpOutput` orchestrator | Eqs. 47–51, 52, 53/53a, 74, 75, 78, 79, 80/81, 89 plus all primitives |

`src/fbp/index.ts` is a barrel exporting every primitive, the orchestrator, and the fuel table. `src/index.ts` re-exports both `./fwi` and `./fbp`.

## 4. What `fbp()` returns

`FbpOutput` fields: head ROS, back ROS, flank ROS, head/back/flank fire intensities (HFI/BFI/FFI), crown fraction burned, fire type ('S'/'I'/'C'), surface/crown/total fuel consumption, foliar moisture content, ISI on slope, net effective wind speed, spread direction azimuth, length-to-breadth ratio, head/back spread distance.

## 5. Tests

`tests/` contains one jest suite per primitive plus `fbp.integration.test.ts`. Each suite has hand-derived assertions tied directly to its equation number(s). The integration suite exercises every fuel type end-to-end and verifies the algebraic relationships among outputs (e.g. HFI = 300 × TFC × ROS, ROS > BROS, LB ≥ 1).

## 6. License

GPLv3. `package.json` SPDX identifier: `GPL-3.0-or-later`.
