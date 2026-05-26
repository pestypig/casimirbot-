import { describe, expect, it } from "vitest";
import { buildTokamakPlasmaObjectBindings } from "../tokamak-plasma-object-bindings";

describe("Tokamak plasma object bindings", () => {
  it("maps tokamak observables into calculator variable bindings", () => {
    const context = buildTokamakPlasmaObjectBindings({
      objectId: "tokamak:test",
      label: "Test tokamak",
      B_T: 5.3,
      n_m3: 1e20,
      T_eV: 10000,
      p_Pa: 160217.6634,
    });

    expect(context.kind).toBe("tokamak_plasma_object");
    expect(context.variableBindings).toMatchObject({
      B_T: 5.3,
      mu0: 1.25663706212e-6,
      n_m3: 1e20,
      T_eV: 10000,
      e_charge: 1.602176634e-19,
      p_Pa: 160217.6634,
    });
    expect(context.claimBoundaryNotes.join(" ")).toMatch(/diagnostic\/proxy helpers/i);
  });
});
