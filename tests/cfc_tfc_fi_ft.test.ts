/** ST-X-3 Eqs. 66, 67, 69; fire-type thresholds (Section 7.5 + errata). */
import cfc from "../src/fbp/cfc";
import tfc from "../src/fbp/tfc";
import fi from "../src/fbp/fi";
import ft from "../src/fbp/ft";

describe("cfc — Eq. 66", () => {
  it("CFC = CFL * CFB", () => {
    expect(cfc(0.8, 0.5)).toBeCloseTo(0.40, 9);
    expect(cfc(1.2, 0.0)).toBe(0);
    expect(cfc(0.8, 1.0)).toBeCloseTo(0.80, 9);
  });
});

describe("tfc — Eq. 67", () => {
  it("TFC = SFC + CFC", () => {
    expect(tfc(2.5, 0.4)).toBeCloseTo(2.9, 9);
  });
});

describe("fi — Eq. 69", () => {
  it("FI = 300 * FC * ROS", () => {
    expect(fi(3.0, 15)).toBe(13500);
  });
});

describe("ft — fire type from CFB", () => {
  it("CFB < 0.1 → 'S'", () => {
    expect(ft(0)).toBe("S");
    expect(ft(0.09)).toBe("S");
  });
  it("0.1 ≤ CFB < 0.9 → 'I'", () => {
    expect(ft(0.1)).toBe("I");
    expect(ft(0.5)).toBe("I");
    expect(ft(0.89)).toBe("I");
  });
  it("CFB ≥ 0.9 → 'C' (errata corrected)", () => {
    expect(ft(0.9)).toBe("C");
    expect(ft(1.0)).toBe("C");
  });
});
