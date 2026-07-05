import { describe, expect, it } from "vitest";
import {
  buildHelixAskHardBackendEntrypointRouteMetadata,
  requiresHelixAskBackendEntrypoint,
  resolveHelixAskBackendEntrypointFamily,
} from "../helix/ask-console/HelixAskBackendEntrypointPolicy";

describe("Helix Ask backend entrypoint scientific image policy", () => {
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
