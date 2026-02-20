import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  __testOnlyEvaluateFailures,
  buildRunDiagnostics,
  createArtifactBundlePaths,
  toDiagnosticRollup,
} from "../scripts/helix-ask-versatility-record";

describe("helix ask versatility diagnostics", () => {
  it("emits per-run report and relation diagnostics", () => {
    expect(
      buildRunDiagnostics({
        family: "relation",
        expected_report_mode: false,
        debug: { report_mode: false, relation_packet_built: true, relation_dual_domain_ok: false },
      }),
    ).toEqual({
      report_mode_correct: true,
      relation_packet_built: true,
      relation_dual_domain_ok: false,
    });

    expect(
      buildRunDiagnostics({
        family: "repo_technical",
        expected_report_mode: false,
        debug: { report_mode: true },
      }),
    ).toEqual({
      report_mode_correct: false,
      relation_packet_built: null,
      relation_dual_domain_ok: null,
    });
  });


  it("emits known failure signatures for report/relation floor regressions", () => {
    const failures = __testOnlyEvaluateFailures(
      {
        family: "relation",
        prompt: "How does warp connect to mission ethos?",
        expected_report_mode: false,
      } as any,
      {
        status: 200,
        latency_ms: 42,
        payload: {
          text: "Executive summary: stub",
          report_mode: true,
          debug: {
            report_mode: true,
            relation_packet_built: false,
            relation_dual_domain_ok: false,
            relation_packet_bridge_count: 0,
            relation_packet_evidence_count: 0,
          },
        },
      } as any,
    );

    expect(failures.some((entry) => entry.startsWith("report_mode_mismatch"))).toBe(true);
    expect(failures.some((entry) => entry.startsWith("relation_packet_built"))).toBe(true);
    expect(failures.some((entry) => entry.startsWith("relation_dual_domain"))).toBe(true);
    expect(failures.some((entry) => entry.startsWith("bridge_count_low"))).toBe(true);
    expect(failures.some((entry) => entry.startsWith("evidence_count_low"))).toBe(true);
  });

  it("rolls up pass/fail/unknown counts for required diagnostics", () => {
    const rollup = toDiagnosticRollup([
      {
        diagnostics: { report_mode_correct: true, relation_packet_built: true, relation_dual_domain_ok: true },
      },
      {
        diagnostics: { report_mode_correct: false, relation_packet_built: false, relation_dual_domain_ok: false },
      },
      {
        diagnostics: { report_mode_correct: null, relation_packet_built: null, relation_dual_domain_ok: null },
      },
    ] as Array<any>);

    expect(rollup).toEqual({
      report_mode_correct: { pass: 1, fail: 1, unknown: 1 },
      relation_packet_built: { pass: 1, fail: 1, unknown: 1 },
      relation_dual_domain_ok: { pass: 1, fail: 1, unknown: 1 },
    });
  });
});

describe("helix ask versatility artifact bundle paths", () => {
  it("builds stable bundle paths for summary/recommendation/failures/checkpoint/prompts/raw, ab outputs, and trace export", () => {
    const bundle = createArtifactBundlePaths({
      outRootDir: "artifacts/experiments/step1-eval-integrity",
      runOutDir: "artifacts/experiments/step1-eval-integrity/run-123",
      rawRecordPath: "artifacts/experiments/step1-eval-integrity/run-123/raw/row.json",
      traceExportPath: "artifacts/experiments/step1-eval-integrity/training-trace-export.jsonl",
      abOutputPaths: ["artifacts/evidence-cards-ab/a.json", "artifacts/evidence-cards-ab/b.json"],
    });

    expect(bundle).toEqual({
      output_root_dir: path.resolve("artifacts/experiments/step1-eval-integrity"),
      output_run_dir: path.resolve("artifacts/experiments/step1-eval-integrity/run-123"),
      summary: path.resolve("artifacts/experiments/step1-eval-integrity/run-123/summary.json"),
      recommendation: path.resolve("artifacts/experiments/step1-eval-integrity/run-123/recommendation.json"),
      failures: path.resolve("artifacts/experiments/step1-eval-integrity/run-123/failures.json"),
      checkpoint: path.resolve("artifacts/experiments/step1-eval-integrity/run-123/checkpoint.json"),
      prompts: path.resolve("artifacts/experiments/step1-eval-integrity/run-123/prompts.jsonl"),
      raw_dir: path.resolve("artifacts/experiments/step1-eval-integrity/run-123/raw"),
      raw_record: path.resolve("artifacts/experiments/step1-eval-integrity/run-123/raw/row.json"),
      ab_outputs: [
        path.resolve("artifacts/evidence-cards-ab/a.json"),
        path.resolve("artifacts/evidence-cards-ab/b.json"),
      ],
      trace_export: path.resolve("artifacts/experiments/step1-eval-integrity/training-trace-export.jsonl"),
    });
  });
});
