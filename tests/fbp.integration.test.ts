/** End-to-end FBP orchestrator coverage across every fuel type — confirms
 *  outputs are populated and physically plausible. ST-X-3 references for
 *  each block are in the primitive files. */
import fbp from "../src/fbp/fbp";

const baseInput = {
  ffmc: 90,
  bui: 70,
  ws: 15,
  waz: 270,    // wind from the west
  ps: 0,
  saz: 0,
  lat: 55,
  lon: -105,
  elev: 300,
  jd: 200,
};

const ALL_FUELS = ["C1","C2","C3","C4","C5","C6","C7","D1","S1","S2","S3","O1a","O1b","M1","M2","M3","M4"];

describe("fbp() — orchestrator coverage", () => {
  it.each(ALL_FUELS)("%s produces a complete output bundle with finite values", (code) => {
    const extras: any = {};
    if (code === "M1" || code === "M2") extras.pc = 60;
    if (code === "M3" || code === "M4") extras.pdf = 40;
    if (code === "O1a" || code === "O1b") { extras.cur = 90; extras.gfl = 0.35; }
    const out = fbp({ fueltype: code, ...baseInput, ...extras });
    for (const [k, v] of Object.entries(out)) {
      if (k === "ft") continue;
      expect(Number.isFinite(v as number)).toBe(true);
    }
    expect(typeof out.ft).toBe("string");
  });

  it("C-2 head ROS > back ROS > 0", () => {
    const out = fbp({ fueltype: "C2", ...baseInput });
    expect(out.ros).toBeGreaterThan(out.bros);
    expect(out.bros).toBeGreaterThan(0);
  });

  it("HFI = 300 * TFC * ROS (Eq. 69)", () => {
    const out = fbp({ fueltype: "C2", ...baseInput });
    expect(out.hfi).toBeCloseTo(300 * out.tfc * out.ros, 6);
  });

  it("LB ≥ 1.0 for all fuel types", () => {
    for (const code of ALL_FUELS) {
      const extras: any = {};
      if (code === "M1" || code === "M2") extras.pc = 60;
      if (code === "M3" || code === "M4") extras.pdf = 40;
      if (code === "O1a" || code === "O1b") { extras.cur = 90; extras.gfl = 0.35; }
      const out = fbp({ fueltype: code, ...baseInput, ...extras });
      expect(out.lb).toBeGreaterThanOrEqual(1.0);
    }
  });

  it("Slope increases head ROS for upslope-aligned wind", () => {
    const flat = fbp({ fueltype: "C2", ...baseInput, ps: 0 });
    const steep = fbp({ fueltype: "C2", ...baseInput, ps: 30, saz: 270 }); // upslope = wind dir
    expect(steep.ros).toBeGreaterThan(flat.ros);
  });

  it("ft classification matches CFB bands", () => {
    const out = fbp({ fueltype: "C2", ...baseInput });
    if (out.cfb < 0.1) expect(out.ft).toBe("S");
    else if (out.cfb < 0.9) expect(out.ft).toBe("I");
    else expect(out.ft).toBe("C");
  });

  it("Grass at low curing (30%) → small positive ROS (GLC-X-10 smooth curing)", () => {
    // Under the updated curing function, curing below 58.8% no longer hard-zeros
    // ROS — it tapers smoothly. So a 30%-cured grass fire still spreads slowly.
    const out = fbp({ fueltype: "O1a", ...baseInput, cur: 30, gfl: 0.35 });
    expect(out.ros).toBeGreaterThan(0);
    expect(out.hfi).toBeGreaterThan(0);
  });

  it("fmc override bypasses Eqs. 1-8", () => {
    const out = fbp({ fueltype: "C2", ...baseInput, fmc: 97 });
    expect(out.fmc).toBe(97);
  });
});
