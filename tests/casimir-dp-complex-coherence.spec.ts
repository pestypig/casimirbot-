import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  CasimirDpComplexCoherenceInput,
  evaluateCasimirDpComplexCoherence,
} from "../shared/casimir-dp-complex-coherence";

const fixturePath = path.resolve(
  process.cwd(),
  "configs/research/fixtures/casimir-dp-stage3-complex-coherence.synthetic.v1.json",
);
const fixture = CasimirDpComplexCoherenceInput.parse(
  JSON.parse(readFileSync(fixturePath, "utf8")),
);

type Input = typeof fixture;
type Block = Input["blocks"][number];

function quadratures(visibility: number, phase: number, total = 200_000) {
  return [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2].map(
    (analysisPhase) => {
      const probability =
        0.5 * (1 + visibility * Math.cos(phase + analysisPhase));
      const plus = Math.round(total * probability);
      return {
        analysis_phase_rad: analysisPhase,
        plus_count: plus,
        minus_count: total - plus,
      };
    },
  );
}

function block(args: {
  id: string;
  time: number;
  visibility: number;
  phase?: number;
  orientation?: 1 | -1;
  pathSwap?: boolean;
  echoPair?: string | null;
  echo?: boolean;
  phasePredictor?: number | null;
  role?: "training" | "principal" | "held_out";
}): Block {
  const template = fixture.blocks[0];
  const echo = args.echo === true;
  return {
    ...structuredClone(template),
    block_id: args.id,
    hold_time_s: args.time,
    cluster_id: `cluster-${args.id}`,
    analysis_role: args.role ?? "principal",
    path_orientation: args.orientation ?? 1,
    path_swap: args.pathSwap ?? false,
    echo_pair_id: args.echoPair ?? null,
    echo_sequence_id: echo ? "hahn-echo" : null,
    toggling_function_ref: echo ? "synthetic://echo/hahn-v1" : null,
    toggling_function_sha256: echo ? "8".repeat(64) : null,
    phase_predictor_rad: args.phasePredictor ?? null,
    quadratures: quadratures(args.visibility, args.phase ?? 0),
  };
}

function input(blocks: Block[], conditioner = false): Input {
  return {
    ...structuredClone(fixture),
    phase_conditioner: conditioner
      ? {
        mode: "independently_measured",
        source_ref: "synthetic://independent-phase-monitor/v1",
        artifact_sha256: "7".repeat(64),
        trained_block_ids: [],
      }
      : {
        mode: "none",
        source_ref: null,
        artifact_sha256: null,
        trained_block_ids: [],
      },
    blocks,
  };
}

function decayBlocks(
  model: (time: number) => number,
  phase = 0,
): Block[] {
  return [0, 0.05, 0.12, 0.25].map((time, index) =>
    block({
      id: `decay-${index}`,
      time,
      visibility: model(time),
      phase,
      role: index === 3 ? "held_out" : "principal",
    })
  );
}

describe("Casimir-DP Stage-3 complex-coherence runtime", () => {
  it("recovers injected visibility, phase, and covariance from four quadratures", () => {
    const result = evaluateCasimirDpComplexCoherence(input([
      block({ id: "recovery", time: 0, visibility: 0.73, phase: 0.41 }),
    ]));
    expect(result.blocks[0].quadrature_coverage).toBe("pass");
    expect(result.blocks[0].visibility).toBeCloseTo(0.73, 4);
    expect(result.blocks[0].phase_rad).toBeCloseTo(0.41, 4);
    expect(result.blocks[0].covariance?.[0][0]).toBeGreaterThan(0);
    expect(result.blocks[0].phase_standard_uncertainty_rad)
      .toBeGreaterThanOrEqual(fixture.phase_calibration.standard_uncertainty_rad);
    expect(result.blocks[0].visibility_interval?.lower).toBeLessThan(0.73);
    expect(result.blocks[0].visibility_interval?.upper).toBeGreaterThan(0.73);
    expect(result.collapse_identification).toBe("blocked");
  });

  it("shows phase drift lowering raw visibility and independent conditioning restoring it", () => {
    const blocks = [0, 0.05, 0.12, 0.25].flatMap((time, timeIndex) => {
      const visibility = 0.9 * Math.exp(-2 * time);
      return [-0.7, 0.7].map((drift, driftIndex) =>
        block({
          id: `drift-${timeIndex}-${driftIndex}`,
          time,
          visibility,
          phase: 0.22 + drift,
          phasePredictor: drift,
          role: timeIndex === 3 ? "held_out" : "principal",
        })
      );
    });
    const result = evaluateCasimirDpComplexCoherence(input(blocks, true));
    expect(result.phase_conditioning.gate).toBe("pass");
    expect(result.phase_conditioning.maximum_visibility_gain).toBeGreaterThan(0.15);
    expect(result.summaries[0].phase_conditioned!.visibility)
      .toBeGreaterThan(result.summaries[0].raw!.visibility);
    expect(result.discriminator_class).toBe("conditionable_dephasing");
  });

  it("uses path swap as a phase-sign discriminator without inventing visibility loss", () => {
    const forward = decayBlocks(
      (time) => 0.92 * Math.exp(-1.5 * time),
      0.35,
    );
    const reverse = forward.map((source, index) =>
      block({
        id: `reverse-${index}`,
        time: source.hold_time_s,
        visibility: 0.92 * Math.exp(-1.5 * source.hold_time_s),
        phase: -0.35,
        orientation: -1,
        pathSwap: true,
        role: source.analysis_role,
      })
    );
    const result = evaluateCasimirDpComplexCoherence(
      input([...forward, ...reverse]),
    );
    expect(result.path_swap).toHaveLength(4);
    expect(result.path_swap.every((row) => row.gate === "pass")).toBe(true);
    expect(Math.max(...result.path_swap.map((row) => row.visibility_difference)))
      .toBeLessThan(1e-10);
    expect(result.discriminator_class).toBe("coherent_phase");
  });

  it("separates echo-recoverable quasistatic loss from unrecovered loss", () => {
    const base = decayBlocks((time) => 0.9 * Math.exp(-2 * time));
    const noEcho = block({
      id: "echo-pair-no",
      time: 0.1,
      visibility: 0.5,
      echoPair: "pair-1",
    });
    const recovered = block({
      id: "echo-pair-yes",
      time: 0.1,
      visibility: 0.84,
      echoPair: "pair-1",
      echo: true,
    });
    const recoveredResult = evaluateCasimirDpComplexCoherence(
      input([...base, noEcho, recovered]),
    );
    expect(recoveredResult.echo_recovery[0].recovery_gate).toBe("recovered");

    const irreversible = block({
      id: "echo-pair-irreversible",
      time: 0.1,
      visibility: 0.51,
      echoPair: "pair-1",
      echo: true,
    });
    const irreversibleResult = evaluateCasimirDpComplexCoherence(
      input([...base, noEcho, irreversible]),
    );
    expect(irreversibleResult.echo_recovery[0].recovery_gate)
      .toBe("not_recovered");
    expect(irreversibleResult.echo_recovery[0].interpretation)
      .toContain("not an objective-collapse label");
  });

  it("distinguishes exponential and Gaussian decay only on an identifiable time grid", () => {
    const exponential = evaluateCasimirDpComplexCoherence(
      input(decayBlocks((time) => 0.94 * Math.exp(-3 * time))),
    );
    expect(exponential.decay_shape.identifiability.gate).toBe("pass");
    expect(exponential.decay_shape.best_model).toBe("exponential");

    const gaussian = evaluateCasimirDpComplexCoherence(
      input(decayBlocks((time) => 0.94 * Math.exp(-18 * time ** 2))),
    );
    expect(gaussian.decay_shape.identifiability.gate).toBe("pass");
    expect(gaussian.decay_shape.best_model).toBe("gaussian");
    expect(gaussian.decay_shape.models.every(
      (model) => model.held_out_standardized_error != null,
    )).toBe(true);
  });

  it("fits decay models without using the registered held-out cell", () => {
    const training = [
      block({ id: "train-0", time: 0, visibility: 0.94 }),
      block({
        id: "train-1",
        time: 0.05,
        visibility: 0.94 * Math.exp(-0.15),
      }),
      block({
        id: "train-2",
        time: 0.12,
        visibility: 0.94 * Math.exp(-0.36),
      }),
    ];
    const nominal = evaluateCasimirDpComplexCoherence(input([
      ...training,
      block({
        id: "held-nominal",
        time: 0.25,
        visibility: 0.94 * Math.exp(-0.75),
        role: "held_out",
      }),
    ]));
    const adversarial = evaluateCasimirDpComplexCoherence(input([
      ...training,
      block({
        id: "held-adversarial",
        time: 0.25,
        visibility: 0.2,
        role: "held_out",
      }),
    ]));
    const nominalExponential = nominal.decay_shape.models.find(
      (model) => model.model === "exponential",
    )!;
    const adversarialExponential = adversarial.decay_shape.models.find(
      (model) => model.model === "exponential",
    )!;
    expect(adversarialExponential.amplitude)
      .toBeCloseTo(nominalExponential.amplitude, 12);
    expect(adversarialExponential.held_out_standardized_error!)
      .toBeGreaterThan(nominalExponential.held_out_standardized_error!);
    expect(adversarial.decay_shape.held_out_score_authority)
      .toContain("fitting only non-held-out");
  });

  it("fails closed on incomplete quadratures and one-time-point data", () => {
    const incomplete = block({
      id: "incomplete",
      time: 0,
      visibility: 0.8,
    });
    incomplete.quadratures = incomplete.quadratures.slice(0, 3);
    const incompleteResult = evaluateCasimirDpComplexCoherence(
      input([incomplete]),
    );
    expect(incompleteResult.blocks[0].quadrature_coverage).toBe("not_ready");
    expect(incompleteResult.decay_shape.identifiability.gate).toBe("not_ready");
    expect(incompleteResult.discriminator_class).toBe("not_identifiable");

    const oneTime = evaluateCasimirDpComplexCoherence(input([
      block({ id: "one-time", time: 0.1, visibility: 0.8 }),
    ]));
    expect(oneTime.decay_shape.identifiability.gate).toBe("not_ready");
    expect(oneTime.decay_shape.best_model).toBeNull();
  });

  it("never promotes its structurally valid synthetic fixture to measured evidence", () => {
    const result = evaluateCasimirDpComplexCoherence(fixture);
    expect(result.provenance_gate).toBe("pass");
    expect(result.evidence_class).toBe("synthetic_fixture");
    expect(result.measured_evidence_gate).toBe("not_ready");
    expect(result.covariance_gate).toBe("not_ready");
    expect(result.nuisance_correlations.gate).toBe("not_ready");
    expect(result.maximum_claim).toBe("synthetic_pipeline_validation");
    expect(result.promotion_allowed).toBe(false);
    expect(result.manifold_dynamics).toBe("blocked");
  });

  it("rejects held-out phase-correction leakage", () => {
    const heldOut = block({
      id: "leaked-held-out",
      time: 0,
      visibility: 0.8,
      phasePredictor: 0.1,
      role: "held_out",
    });
    const raw = input([heldOut], true);
    raw.phase_conditioner.trained_block_ids = [heldOut.block_id];
    const result = evaluateCasimirDpComplexCoherence(raw);
    expect(result.phase_conditioning.gate).toBe("not_ready");
    expect(result.phase_conditioning.held_out_training_leakage).toBe(true);
    expect(result.measured_evidence_gate).toBe("not_ready");
  });
});
