# cffdrs-ts-fbp

## What this is

An experimental fork of CFS's [cffdrs_ts](https://github.com/cffdrs/cffdrs_ts) library that adds the missing **Fire Behaviour Prediction (FBP)** subsystem. The upstream library currently implements the FWI half of CFFDRS only (FFMC, DMC, DC, ISI, BUI, FWI). FBP — which produces head fire intensity (HFI), rate of spread (ROS), crown fraction burned (CFB), and fire type (FT) from FWI inputs plus fuel/topography/weather — is not in the library.

This repository starts from upstream `main` (commit `b9afdab` at clone time) with the upstream `origin` remote removed so the work stays local while we prove it out.

## Why

An IntelliFire integration uncovered that a complete CFFDRS implementation in one library would let consumers drop ad-hoc Fire Behaviour code paths. If FBP lands cleanly inside `cffdrs_ts`, every consumer of the library gets a single coherent, actively-maintained implementation covering the whole system.

## End-state goal

Submit FBP back to upstream `cffdrs/cffdrs_ts` as a contribution, so the wider CFFDRS community (CIFFC, CWFIS, agencies running cffdrs_ts) benefits.

## Source of the math

**Forestry Canada Fire Danger Group. 1992.** *Development and structure of the Canadian Forest Fire Behavior Prediction System.* Information Report ST-X-3, Petawawa National Forestry Institute. — primary equation source.

**Wotton, B.M., Alexander, M.E., Taylor, S.W. 2009.** *Updates and revisions to the 1992 Canadian forest fire behavior prediction system.* Information Report GLC-X-10. — coefficient and threshold revisions.

This is a clean-room implementation written directly from those published equations.

## Status

Primary FBP components (ST-X-3 §7) are implemented for all 17 fuel types — `fmc`, `sf`, `sfc`, `be`, `ros`, `cfb`, `cfc`, `tfc`, `fi`, `ft`, `isf`, plus the `fbp()` orchestrator and the fuel-type reference table.

Secondary components (ST-X-3 §8 — acceleration to equilibrium, elliptical fire growth) are also implemented: `lb` (length-to-breadth), `bros` (back ROS), `fros` (flank ROS), `rosAtTime`, `distanceAtTime`, `lbAtTime`, `rosAtTheta`, plus the `accAlpha`, `crownBaseHeight`, and `crownFuelConsumption` helpers. `fbp()` emits the full Secondary/All field set.

Every primitive is validated against the canonical R `cffdrs` gold vectors (per-primitive CSVs plus the end-to-end `fbp_04`/`fbp_06` snapshots) at a relative tolerance of 5e-4. `tsc --noEmit` clean. `src/fwi/` is unmodified from upstream.

## Conventions

Match the existing FWI source style exactly:

- One equation per file; file name matches the exported function name.
- Named export plus default export of the same function.
- All primitives take positional numeric arguments, return a single number.
- JSDoc on every function citing ST-X-3 and the 2009 updates by equation number.
- Inline `// Eq. N` comments tying each block of code to a numbered equation in the source documents.
- No tests upstream; this repo adds a `tests/` directory ahead of any implementation work (red-first TDD per equation).
- License: **GPLv3** (`package.json` SPDX identifier `GPL-3.0-or-later`). Anything contributed back must be compatible.

The one deliberate convention break: the master `fbp()` function takes a typed input/output struct instead of 16 positional arguments. The primitives it composes stay positional.
