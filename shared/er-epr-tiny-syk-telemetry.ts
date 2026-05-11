import type { ErEprRawSolverObservables } from "./er-epr-raw-observables";
import type { TinySykRawTelemetry, TinySykPlan } from "./er-epr-tiny-syk";

export function assertTinySykRawTelemetry(raw: TinySykRawTelemetry): TinySykRawTelemetry {
  if (raw.schemaVersion !== "er-epr-tiny-syk-raw-telemetry.v1") {
    throw new Error("Invalid tiny SYK telemetry schema version");
  }
  if (raw.protocol.teleportationFidelityRaw === undefined) {
    throw new Error("Tiny SYK telemetry requires teleportationFidelityRaw");
  }
  if (raw.state.entanglementEntropy_nats === undefined) {
    throw new Error("Tiny SYK telemetry requires entanglementEntropy_nats or an explicit failure path");
  }
  if (raw.protocol.causalOrderingPass === undefined) {
    throw new Error("Tiny SYK telemetry requires causalOrderingPass");
  }
  if (!raw.diagnostics.operatorSizeCurve?.length) {
    throw new Error("Tiny SYK telemetry requires operatorSizeCurve or a diagnostic caveat");
  }
  return raw;
}

export function summarizeTinySykTelemetry(raw: TinySykRawTelemetry) {
  return {
    backend: raw.backend,
    hamiltonianHash: raw.model.hamiltonianHash,
    teleportationFidelityRaw: raw.protocol.teleportationFidelityRaw,
    entanglementEntropy_nats: raw.state.entanglementEntropy_nats,
    causalOrderingPass: raw.protocol.causalOrderingPass,
    operatorSizePointCount: raw.diagnostics.operatorSizeCurve?.length ?? 0,
  };
}

export function tinySykAdapterCompatibility(raw: ErEprRawSolverObservables, plan: TinySykPlan): boolean {
  return raw.backend === "two_sided_syk_tiny_exact_diag" &&
    raw.model.seed === plan.model.seed &&
    raw.model.hamiltonianHash !== undefined &&
    raw.provenance.reproducibilityStatus === "solver_simulated";
}
