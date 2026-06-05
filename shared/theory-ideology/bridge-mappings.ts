import type { TheoryIdeologyBridgeRelationV1 } from "../theory-ideology-bridge";

export type TheoryIdeologyBridgeMapping = {
  theoryHints: string[];
  ideologyNodeIds: string[];
  relation: TheoryIdeologyBridgeRelationV1;
  proceduralEffect: string;
};

export const BRIDGE_MAPPINGS: readonly TheoryIdeologyBridgeMapping[] = [
  {
    theoryHints: ["observation", "measurement", "source", "provenance", "falsifiability"],
    ideologyNodeIds: [
      "direct-observation-before-claim",
      "provenance-protocol",
      "falsifiability-and-truth-convergence",
    ],
    relation: "requires_evidence",
    proceduralEffect:
      "Ask for observation refs and keep claims testable before increasing confidence.",
  },
  {
    theoryHints: ["entropy", "drift", "irreversibility", "impermanence"],
    ideologyNodeIds: [
      "impermanence-entropy-and-revision",
      "skillful-action-under-uncertainty",
    ],
    relation: "constrains",
    proceduralEffect:
      "Require revision triggers and uncertainty-aware next steps.",
  },
  {
    theoryHints: ["conservation", "stress_energy_conservation", "boundary"],
    ideologyNodeIds: [
      "fairness-due-process-and-justification",
      "integrity-protocols",
    ],
    relation: "analogy_only",
    proceduralEffect:
      "Use conservation/boundary language as a constraint metaphor for preserving agency, reasons, and review, not as moral proof.",
  },
  {
    theoryHints: ["symmetry", "invariance", "unit", "dimension"],
    ideologyNodeIds: [
      "fairness-due-process-and-justification",
      "right-speech-and-accurate-formulation",
    ],
    relation: "analogy_only",
    proceduralEffect:
      "Use equal-condition reasoning to support consistency and calibrated wording.",
  },
  {
    theoryHints: ["feedback", "loop", "self_organization", "self-organization"],
    ideologyNodeIds: [
      "feedback-loop-hygiene",
      "non-harm-and-compassionate-constraint",
      "worldview-integrity",
    ],
    relation: "constrains",
    proceduralEffect:
      "Prevent self-confirming evidence loops and route high-impact uncertainty toward review or repair.",
  },
  {
    theoryHints: ["jurisdiction", "boundary_conditions", "boundary condition"],
    ideologyNodeIds: [
      "fairness-due-process-and-justification",
      "lawful-interface-protocol",
      "two-key-approval",
    ],
    relation: "requires_evidence",
    proceduralEffect:
      "Require jurisdiction, consent, and contestability before action readiness.",
  },
] as const;
