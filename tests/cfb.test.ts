/** ST-X-3 Eqs. 56-58 — Crown Fraction Burned. */
import cfb from "../src/fbp/cfb";
import { getFuel } from "../src/fbp/fuelTypes";

describe("cfb — crown fraction burned", () => {
  it("CFB = 0 for non-crowning fuel types (cbh = 0)", () => {
    expect(cfb("D1", 100, 1, 5)).toBe(0);
    expect(cfb("S1", 100, 1, 5)).toBe(0);
    expect(cfb("O1a", 100, 0.3, 30)).toBe(0);
  });
  it("CFB = 0 when ROS does not reach RSO (no crowning threshold)", () => {
    expect(cfb("C2", 100, 1, 0.001)).toBe(0);
  });
  it("hand-derived for C-2: CFB = 1 - exp(-0.23*(ROS - RSO))", () => {
    const f = getFuel("C2");
    const fmc = 100;
    const sfc = 1.5;
    const csi = 0.001 * Math.pow(f.cbh, 1.5) * Math.pow(460 + 25.9 * fmc, 1.5);
    const rso = csi / (300 * sfc);
    const rosVal = rso + 5;
    const expected = 1 - Math.exp(-0.23 * (rosVal - rso));
    expect(cfb("C2", fmc, sfc, rosVal)).toBeCloseTo(expected, 6);
  });
  it("CFB approaches 1 for large ROS", () => {
    expect(cfb("C2", 100, 1.5, 100)).toBeGreaterThan(0.99);
  });
  it("cbh override is honoured", () => {
    const base = cfb("C2", 100, 1.5, 20);
    const lower = cfb("C2", 100, 1.5, 20, 1); // lower cbh → more crowning
    expect(lower).toBeGreaterThan(base);
  });
});
