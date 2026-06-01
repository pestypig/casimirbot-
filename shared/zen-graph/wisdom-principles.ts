import type { FruitionProceduralOperatorV1, FruitionProceduralRoleV1 } from "../fruition-procedure-expression";

export type ZenWisdomPrinciple = {
  id: string;
  label: string;
  glyph: string;
  summary: string;
  proceduralRole: FruitionProceduralRoleV1;
  procedureOperator: FruitionProceduralOperatorV1;
  actionEffect: string;
  evidenceNeeds: string[];
  refusesAuthority: string[];
  tags: string[];
};

export const ZEN_WISDOM_ROOT_ID = "wisdom-first-principles";

export const ZEN_WISDOM_PRINCIPLES: readonly ZenWisdomPrinciple[] = [
  {
    id: "direct-observation-before-claim",
    label: "Direct Observation Before Claim",
    glyph: "O",
    summary: "Separate observation from interpretation before forming a view.",
    proceduralRole: "first_principle",
    procedureOperator: "supports",
    actionEffect: "Start the procedure from observed evidence before naming a claim.",
    evidenceNeeds: ["observation_refs"],
    refusesAuthority: ["claim_without_observation"],
    tags: ["first_principle", "observation", "evidence"],
  },
  {
    id: "impermanence-entropy-and-revision",
    label: "Impermanence, Entropy, and Revision",
    glyph: "R",
    summary: "Treat evidence and claims as reviewable under drift and changing context.",
    proceduralRole: "first_principle",
    procedureOperator: "requires",
    actionEffect: "Require revision triggers when context, evidence, or risk changes.",
    evidenceNeeds: ["revision_trigger"],
    refusesAuthority: ["permanent_certainty"],
    tags: ["first_principle", "revision", "entropy"],
  },
  {
    id: "interdependence-yin-yang-balance",
    label: "Interdependence and Yin-Yang Balance",
    glyph: "Y",
    summary: "Track coupled forces and reciprocal effects before choosing a side.",
    proceduralRole: "balancer",
    procedureOperator: "balances",
    actionEffect: "Balance restraint and action by making reciprocal costs visible.",
    evidenceNeeds: ["coupled_tradeoffs"],
    refusesAuthority: ["one_sided_view"],
    tags: ["first_principle", "balance", "interdependence"],
  },
  {
    id: "falsifiability-and-truth-convergence",
    label: "Falsifiability and Truth Convergence",
    glyph: "F",
    summary: "Make claims testable against shared observation and reproducible checks.",
    proceduralRole: "first_principle",
    procedureOperator: "requires",
    actionEffect: "Require a testable claim boundary before confidence increases.",
    evidenceNeeds: ["testable_claim", "replication_context"],
    refusesAuthority: ["untestable_claim"],
    tags: ["first_principle", "falsifiability", "validation"],
  },
  {
    id: "right-speech-and-accurate-formulation",
    label: "Right Speech and Accurate Formulation",
    glyph: "S",
    summary: "Calibrate wording to evidence strength, uncertainty, and boundaries.",
    proceduralRole: "constraint",
    procedureOperator: "constrains",
    actionEffect: "Constrain the action wording so it preserves uncertainty and missing checks.",
    evidenceNeeds: ["claim_boundary"],
    refusesAuthority: ["false_certainty"],
    tags: ["first_principle", "right_speech", "formulation"],
  },
  {
    id: "non-harm-and-compassionate-constraint",
    label: "Non-Harm and Compassionate Constraint",
    glyph: "H",
    summary: "Constrain capability by harm reduction, repair, consent, and dignity.",
    proceduralRole: "constraint",
    procedureOperator: "constrains",
    actionEffect: "Constrain capability until harm, consent, and repair paths are visible.",
    evidenceNeeds: ["harm_context", "repair_path"],
    refusesAuthority: ["harm_blind_action"],
    tags: ["first_principle", "non-harm", "repair"],
  },
  {
    id: "fairness-due-process-and-justification",
    label: "Fairness, Due Process, and Justification",
    glyph: "J",
    summary: "Require reasons, jurisdiction, contestability, and review for legitimate action.",
    proceduralRole: "action_gate",
    procedureOperator: "requires",
    actionEffect: "Require due process checks before a procedure becomes actionable.",
    evidenceNeeds: ["jurisdiction_context", "contestability_path"],
    refusesAuthority: ["unjustified_power"],
    tags: ["first_principle", "fairness", "due-process"],
  },
  {
    id: "skillful-action-under-uncertainty",
    label: "Skillful Action Under Uncertainty",
    glyph: "A",
    summary: "Scale action to evidence, risk, reversibility, and missing checks.",
    proceduralRole: "objective_view",
    procedureOperator: "routes_to",
    actionEffect: "Route the assembled state toward ask, review, block, or user decision.",
    evidenceNeeds: ["risk_context", "reversibility_context"],
    refusesAuthority: ["unchecked_action"],
    tags: ["first_principle", "skillful_action", "uncertainty"],
  },
] as const;

export function getZenWisdomPrinciple(id: string): ZenWisdomPrinciple | undefined {
  return ZEN_WISDOM_PRINCIPLES.find((principle) => principle.id === id);
}
