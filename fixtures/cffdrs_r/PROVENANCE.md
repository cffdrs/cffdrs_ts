# Parity fixtures — provenance

These CSV files are gold test vectors used by `tests/parity/cffdrs_r.parity.test.ts`
to validate this TypeScript FBP implementation against the canonical R
implementation.

**Source:** the [`cffdrs/cffdrs_r`](https://github.com/cffdrs/cffdrs_r) package's
own test data:
- per-primitive vectors from `tests/testthat/data/` (each row = randomized
  inputs plus the expected output produced by the R function, rounded to 4
  significant figures — `SIG_DIGS = 4` in that package's test setup), and
- `test_fbp.csv` from the package `data/` directory.

**Licence:** `cffdrs_r` is distributed under the GNU General Public License v3,
the same licence as this project, so redistribution of these vectors here is
licence-compatible. Copyright remains with the original authors (Natural
Resources Canada / Canadian Forest Service and contributors).

They are vendored (rather than downloaded on demand) so the parity suite is
self-contained and reproducible on a fresh clone.
