import { describe, expect, it } from "vitest";
import {
  buildHelixAskHardBackendEntrypointRouteMetadata,
  requiresHelixAskBackendEntrypoint,
  resolveHelixAskBackendEntrypointFamily,
} from "../helix/ask-console/HelixAskBackendEntrypointPolicy";

describe("Helix Ask backend entrypoint scientific image policy", () => {
  it("routes /postulate through the backend runtime review gate instead of client projection", () => {
    const prompt =
      "/postulate Review this postulate candidate for Postulate Board submission. Grade it in this chat before any board submission.";
    const resolution = resolveHelixAskBackendEntrypointFamily(prompt);

    expect(requiresHelixAskBackendEntrypoint(prompt)).toBe(true);
    expect(resolution).toMatchObject({
      family: "postulate",
      sourceTarget: "postulate_board",
      targetKind: "postulate_runtime_review",
      requiredToolFamily: "postulate",
      selectedCapability: null,
      explicitCue: "/postulate",
      requestedOutputs: expect.arrayContaining([
        "postulate_runtime_review",
        "postulate_submission_gate",
        "postulate_submit_receipt",
        "revision_recovery_plan",
        "typed_failure",
      ]),
    });
  });

  it("marks /postulate hard backend metadata as a no-shortcut postulate review contract", () => {
    const metadata = buildHelixAskHardBackendEntrypointRouteMetadata({
      question: "/postulate Review this postulate candidate.",
      turnId: "turn:postulate",
      threadId: "thread:postulate",
    });

    expect(metadata?.sourceTarget).toBe("postulate_board");
    expect(metadata?.source_target_intent).toMatchObject({
      target_source: "postulate_board",
      target_kind: "postulate_runtime_review",
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
      requested_outputs: expect.arrayContaining([
        "postulate_runtime_review",
        "postulate_submission_gate",
        "revision_recovery_plan",
      ]),
    });
    expect(metadata?.mandatory_next_tool).toBeUndefined();
  });

  it("routes natural scientific document image prompts through the compound backend path", () => {
    const prompt = "Here is a scientific document image. Extract the equations and compare them to the theory badge graph.";

    expect(requiresHelixAskBackendEntrypoint(prompt)).toBe(true);
    expect(resolveHelixAskBackendEntrypointFamily(prompt)).toMatchObject({
      family: "scientific_image",
      sourceTarget: "scientific_image_evidence",
      targetKind: "scientific_image_evidence_sidecar",
      requiredToolFamily: "visual_analysis",
      selectedCapability: "visual_analysis.inspect_image_region",
      explicitCue: "scientific_image_evidence_sidecar",
      requestedOutputs: expect.arrayContaining([
        "image_lens_crop_observation",
        "scientific_evidence_sidecar",
        "theory_reflection",
        "calculator_payload_filter",
        "typed_failure",
      ]),
    });
  });

  it("keeps scientific image extraction-only prompts out of theory and calculator routing", () => {
    const prompt = "Here is a scientific document image. Extract the equations and LaTeX candidates.";
    const resolution = resolveHelixAskBackendEntrypointFamily(prompt);

    expect(requiresHelixAskBackendEntrypoint(prompt)).toBe(true);
    expect(resolution).toMatchObject({
      family: "scientific_image",
      selectedCapability: "visual_analysis.inspect_image_region",
      requestedOutputs: expect.arrayContaining([
        "image_lens_crop_observation",
        "scientific_evidence_packet",
        "scientific_evidence_sidecar",
        "typed_failure",
      ]),
    });
    expect(resolution?.requestedOutputs).not.toContain("theory_reflection");
    expect(resolution?.requestedOutputs).not.toContain("calculator_payload_filter");
  });

  it("routes promoted equation evidence graph follow-ups through the backend scientific sidecar path", () => {
    const prompt =
      "Reflect the promoted equation evidence to the Theory Badge Graph with diagnostic-only boundaries and report calculator payload admissibility.";
    const resolution = resolveHelixAskBackendEntrypointFamily(prompt);

    expect(requiresHelixAskBackendEntrypoint(prompt)).toBe(true);
    expect(resolution).toMatchObject({
      family: "scientific_image",
      sourceTarget: "scientific_image_evidence",
      targetKind: "scientific_image_evidence_sidecar",
      requiredToolFamily: "visual_analysis",
      selectedCapability: "visual_analysis.inspect_image_region",
      explicitCue: "scientific_image_evidence_sidecar",
      requestedOutputs: expect.arrayContaining([
        "scientific_evidence_packet",
        "scientific_evidence_sidecar",
        "theory_reflection",
        "calculator_payload_filter",
        "typed_failure",
      ]),
    });
  });

  it("routes Postulate Board evidence-ref revisions through the scientific sidecar path", () => {
    const prompt =
      "Revise this Postulate Board draft so its evidence refs cite the actual promoted page-grounded equation row, page number, crop ref, Image Lens source/hash, and evidence depth. Keep it candidate / diagnostic-only. Do not promote a badge or calculator payload.";
    const resolution = resolveHelixAskBackendEntrypointFamily(prompt);

    expect(requiresHelixAskBackendEntrypoint(prompt)).toBe(true);
    expect(resolution).toMatchObject({
      family: "scientific_image",
      sourceTarget: "scientific_image_evidence",
      targetKind: "scientific_image_evidence_sidecar",
      requestedOutputs: expect.arrayContaining([
        "scientific_evidence_packet",
        "scientific_evidence_sidecar",
        "calculator_payload_filter",
        "typed_failure",
      ]),
    });
  });

  it("routes scientific Image Lens continuity audits through the backend sidecar path", () => {
    const prompt =
      "Run a scientific Image Lens evidence continuity audit. Use the latest scientific Image Lens sidecar, not chat memory or a fresh scholarly lookup. Report only: evidence depth, sidecar id, Image Lens source id, source image hash, page number, crop ref, promoted equation LaTeX, active promoted row blockers, and historical non-promoted row blockers.";
    const resolution = resolveHelixAskBackendEntrypointFamily(prompt);

    expect(requiresHelixAskBackendEntrypoint(prompt)).toBe(true);
    expect(resolution).toMatchObject({
      family: "scientific_image",
      sourceTarget: "scientific_image_evidence",
      targetKind: "scientific_image_evidence_sidecar",
      requestedOutputs: expect.arrayContaining([
        "scientific_evidence_sidecar",
        "scientific_image_evidence_continuity_audit",
        "latest_scientific_image_sidecar_ref",
        "typed_failure",
      ]),
    });
  });

  it("routes postulate evidence-ref prompts that ask for latest sidecar refs through backend Ask", () => {
    const prompt =
      "Before rating this postulate, hydrate it from the latest scientific Image Lens sidecar, promoted page-grounded equation refs, graph reflection refs, crop ref, source/hash, and evidence depth.";
    const resolution = resolveHelixAskBackendEntrypointFamily(prompt);

    expect(requiresHelixAskBackendEntrypoint(prompt)).toBe(true);
    expect(resolution).toMatchObject({
      family: "scientific_image",
      sourceTarget: "scientific_image_evidence",
      targetKind: "scientific_image_evidence_sidecar",
      requestedOutputs: expect.arrayContaining([
        "scientific_evidence_sidecar",
        "latest_scientific_image_sidecar_ref",
      ]),
    });
  });

  it("marks the scientific sidecar as the missing evidence for backend route metadata", () => {
    const prompt = "Here is a scientific document image. Extract the equations and compare them to the theory badge graph.";
    const metadata = buildHelixAskHardBackendEntrypointRouteMetadata({
      question: prompt,
      turnId: "turn:scientific-image",
      threadId: "thread:scientific-image",
    });

    expect(metadata?.source_target_intent).toMatchObject({
      target_source: "scientific_image_evidence",
      target_kind: "scientific_image_evidence_sidecar",
      requested_outputs: expect.arrayContaining([
        "image_lens_crop_observation",
        "scientific_evidence_sidecar",
        "theory_reflection",
        "calculator_payload_filter",
      ]),
      must_enter_backend_ask: true,
      allow_client_shortcut: false,
      allow_no_tool_direct: false,
    });
    expect(metadata?.mandatory_next_tool).toMatchObject({
      tool_name: "visual_analysis.inspect_image_region",
      required_tool_family: "visual_analysis",
      terminal_forbidden: true,
      missing_required_evidence: "scientific_evidence_sidecar",
      canonical_goal: "scientific_image",
    });
  });

  it("does not turn ordinary image description into the scientific image workflow", () => {
    const prompt = "Describe this attached image in plain language.";

    expect(resolveHelixAskBackendEntrypointFamily(prompt)).toBeNull();
  });
});
