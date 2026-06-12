import { describe, expect, it } from "vitest";
import {
  buildTheoryContextScientificMethodReflectionV1,
  isTheoryContextScientificMethodReflectionV1,
  validateTheoryContextScientificMethodReflectionV1,
  type TheoryContextScientificMethodReflectionV1,
} from "../theory-context-scientific-method-reflection.v1";

function fixture(
  overrides: Partial<Parameters<typeof buildTheoryContextScientificMethodReflectionV1>[0]> = {},
): TheoryContextScientificMethodReflectionV1 {
  return buildTheoryContextScientificMethodReflectionV1({
    generatedAt: "2026-06-12T00:00:00.000Z",
    methodId: "theory-context-scientific-method:test",
    graphId: "nhm2-theory-badge-graph",
    reflectionId: "reflection:test",
    prompt: "Reflect S-factor, spectra, uncertainty, and claim boundaries.",
    observationTarget: {
      promptCenterBadgeIds: ["physics.nuclear.reaction.astrophysical_s_factor_context"],
      targetDomainTitles: ["Stellar Reference"],
      resolutionMode: "path",
    },
    hypothesisCandidates: [
      {
        hypothesisId: "hypothesis:s_factor",
        badgeIds: ["physics.nuclear.reaction.astrophysical_s_factor_context"],
        summary: "S-factor context can organize low-energy charged-particle fusion interpretation.",
        status: "candidate",
        role: "prompt_center",
      },
    ],
    firstPrinciplesAnchors: ["physics.quantum.tunneling_fusion_entrance"],
    theoryExtensionPath: [
      "physics.quantum.tunneling_fusion_entrance",
      "physics.nuclear.reaction.astrophysical_s_factor_context",
    ],
    observableRequirements: [
      {
        requirementId: "observable:s_factor",
        badgeIds: ["physics.nuclear.reaction.astrophysical_s_factor_context"],
        requiredObservable: "Admit evaluated S(E), screening, and channel data.",
        whyNeeded: "A scalar proxy is not a measured reaction-rate table.",
        status: "proxy_only",
      },
    ],
    calculatorProxyCandidates: [
      {
        badgeId: "physics.nuclear.reaction.astrophysical_s_factor_context",
        payloadIds: ["s_factor_cross_section_proxy_payload"],
        proxyBoundary: "Calculator payload is diagnostic evidence only.",
      },
    ],
    falsificationChecks: [
      {
        checkId: "falsifier:s_factor",
        badgeIds: ["physics.nuclear.reaction.astrophysical_s_factor_context"],
        check: "Ask what observation would contradict the S-factor interpretation.",
        missingEvidence: ["calibration", "uncertainty budget"],
      },
    ],
    uncertaintyBoundaries: ["Report uncertainty as evidence resolution, not answer authority."],
    claimBoundaries: ["Proxy rows do not validate fusion yields."],
    proceduralNextSteps: [
      {
        stepId: "step:inspect",
        label: "Inspect the first-principles to observable badge path.",
        actionKind: "inspect_badge_path",
        badgeIds: ["physics.quantum.tunneling_fusion_entrance"],
        solves: false,
      },
    ],
    ...overrides,
  });
}

describe("theory context scientific method reflection v1", () => {
  it("builds a valid evidence-only scientific-method packet", () => {
    const packet = fixture();

    expect(validateTheoryContextScientificMethodReflectionV1(packet)).toEqual([]);
    expect(isTheoryContextScientificMethodReflectionV1(packet)).toBe(true);
    expect(packet.assistant_answer).toBe(false);
    expect(packet.terminal_eligible).toBe(false);
    expect(packet.context_role).toBe("tool_evidence");
    expect(packet.ask_context_policy).toBe("evidence_only");
    expect(packet.deterministic_content_role).toBe("observation_not_assistant_answer");
    expect(packet.proceduralNextSteps.every((step) => step.solves === false)).toBe(true);
  });

  it("rejects terminal authority on the packet", () => {
    const packet = {
      ...fixture(),
      terminal_eligible: true,
    };

    expect(validateTheoryContextScientificMethodReflectionV1(packet)).toContain("terminal_eligible must be false");
  });

  it("rejects invalid observable statuses", () => {
    const packet = fixture();
    const invalid = {
      ...packet,
      observableRequirements: [
        {
          ...packet.observableRequirements[0],
          status: "proven",
        },
      ],
    };

    expect(validateTheoryContextScientificMethodReflectionV1(invalid)).toContain(
      "observableRequirements[0].status is invalid",
    );
  });

  it("rejects next steps that claim to solve", () => {
    const packet = fixture();
    const invalid = {
      ...packet,
      proceduralNextSteps: [
        {
          ...packet.proceduralNextSteps[0],
          solves: true,
        },
      ],
    };

    expect(validateTheoryContextScientificMethodReflectionV1(invalid)).toContain(
      "proceduralNextSteps[0].solves must be false",
    );
  });

  it("rejects forbidden proof language", () => {
    const packet = fixture({
      claimBoundaries: ["The scientific method proves a working warp drive."],
    });

    expect(validateTheoryContextScientificMethodReflectionV1(packet).join("\n")).toMatch(/forbidden overclaiming/i);
  });
});
