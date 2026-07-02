import { Router } from "express";
import { z } from "zod";
import {
  buildHelixRecommendedActionAdmissionV1,
  type HelixRecommendedActionAdmissionEntryV1,
  type HelixRecommendedActionAdmissionV1,
} from "@shared/contracts/helix-recommended-action-admission.v1";
import {
  validateMoralGraphReflectionToolResponseV1,
  type MoralGraphReflectionToolResponseV1,
} from "@shared/contracts/moral-graph-reflection-tool.v1";
import { loadIdeologyGraphFromFile } from "@shared/moral-graph/load-ideology-graph";
import { reflectWithMoralGraphToolV1 } from "@shared/moral-graph/moral-graph-reflection-tool";
import { buildMoralGraphDebugTraceViewV1 } from "@shared/moral-graph/moral-graph-debug-trace";

export const moralGraphPrototypeRouter = Router();

const EVIDENCE_ONLY_AUTHORITY = {
  assistant_answer: false,
  raw_content_included: false,
  terminal_eligible: false,
  context_role: "tool_policy",
  ask_context_policy: "evidence_only",
  agent_executable: false,
} as const;

const requestSchema = z.object({
  situationPrompt: z.string().optional(),
  text: z.string().optional(),
  prompt: z.string().optional(),
  refs: z.array(z.string()).optional(),
  requestedPresetIds: z.array(z.string()).optional(),
  comparePresetIds: z.array(z.string()).optional(),
  options: z
    .object({
      includeObjectiveBinding: z.boolean().optional(),
      includeTrace: z.boolean().optional(),
      includeRecommendedActions: z.boolean().optional(),
      includeAdmissions: z.boolean().optional(),
    })
    .optional(),
  debug: z.boolean().optional(),
}).strict();

type RouteGuardCode =
  | "terminal_moral_verdict_blocked"
  | "action_bypass_blocked"
  | "real_person_character_label_blocked"
  | "legal_medical_financial_authority_blocked";

type RouteGuard = {
  code: RouteGuardCode;
  actionType: string;
  label: string;
  reason: string;
};

let graphPromise: ReturnType<typeof loadIdeologyGraphFromFile> | null = null;

function getIdeologyGraph() {
  graphPromise ??= loadIdeologyGraphFromFile();
  return graphPromise;
}

function firstText(payload: z.infer<typeof requestSchema>): string {
  return [payload.situationPrompt, payload.text, payload.prompt]
    .find((value) => typeof value === "string" && value.trim().length > 0)
    ?.trim() ?? "";
}

function makeRouteId(): string {
  return `moral-graph-situation-reflection:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;
}

function detectRouteGuards(text: string): RouteGuard[] {
  const normalized = text.toLowerCase();
  const guards: RouteGuard[] = [];

  if (/\b(label|diagnose|classify)\b.*\b(real person|person|character|personality)\b/.test(normalized)) {
    guards.push({
      code: "real_person_character_label_blocked",
      actionType: "label_real_person_character",
      label: "Block real-person character label",
      reason: "MoralGraph character presets are perspective bindings and cannot classify a real person's character.",
    });
  }

  if (/\b(evil|bad person|good person|morally guilty|moral verdict|final verdict)\b/.test(normalized)) {
    guards.push({
      code: "terminal_moral_verdict_blocked",
      actionType: "make_terminal_moral_verdict",
      label: "Block terminal moral verdict",
      reason: "MoralGraph can provide reflection evidence, but it cannot issue terminal moral verdicts.",
    });
  }

  if (/\b(bypass|override|without confirmation|without consent|execute anyway|run command|commit code|send message)\b/.test(normalized)) {
    guards.push({
      code: "action_bypass_blocked",
      actionType: "execute_action",
      label: "Block action bypass",
      reason: "MoralGraph recommendations cannot bypass confirmation, consent, or action admission.",
    });
  }

  if (/\b(legal|medical|financial|sue|diagnosis|diagnose|investment|bankruptcy)\b/.test(normalized)) {
    guards.push({
      code: "legal_medical_financial_authority_blocked",
      actionType: "make_legal_medical_financial_claim",
      label: "Block legal medical financial authority",
      reason: "MoralGraph reflection is evidence-only and cannot become legal, medical, or financial authority.",
    });
  }

  const unique = new Map<RouteGuardCode, RouteGuard>();
  for (const guard of guards) unique.set(guard.code, guard);
  return [...unique.values()];
}

function buildGuardAdmission(params: {
  routeId: string;
  prompt: string;
  refs: string[];
  guards: RouteGuard[];
}): HelixRecommendedActionAdmissionV1 | null {
  if (params.guards.length === 0) return null;
  const actions: HelixRecommendedActionAdmissionEntryV1[] = params.guards.map((guard) => ({
    actionId: `moral-graph.${guard.actionType}`,
    panelId: "moral-graph",
    label: guard.label,
    mutatesCalculator: false,
    solves: false,
    objectiveFit: "low",
    risk: "unknown",
    admission: "blocked",
    requiresConfirmation: true,
    agentExecutable: false,
    reason: guard.reason,
    reasonCode: "unknown_action_not_allowlisted",
    source: {
      workstation: "moral-graph",
      tool: "moral-graph-situation-reflection-prototype",
      artifact_type: "moral_graph_situation_reflection_route",
      artifact_id: params.routeId,
    },
    display_policy: "hidden",
    evidenceRefs: params.refs,
    reasonCodes: ["moral_graph_reflection", guard.code, "evidence_only_authority"],
  }));

  return buildHelixRecommendedActionAdmissionV1({
    prompt: params.prompt,
    sourceReceiptId: params.routeId,
    source: {
      workstation: "moral-graph",
      tool: "moral-graph-situation-reflection-prototype",
      artifact_type: "moral_graph_situation_reflection_route",
      artifact_id: params.routeId,
    },
    evidenceRefs: params.refs,
    reasonCodes: ["moral_graph_reflection", "route_guard", "evidence_only_authority"],
    actions,
  });
}

function includeDebug(requested: boolean | undefined): boolean {
  return requested === true && process.env.NODE_ENV !== "production";
}

function buildAgentEvidence(response: MoralGraphReflectionToolResponseV1, routeId: string) {
  return {
    content_role: "evidence_not_assistant_answer",
    routeId,
    artifactRefs: [
      response.reflection.reflectionId,
      response.objectiveBinding.objectiveState.id,
      ...response.admissions.map((admission) => admission.admissionId),
    ],
    authority: EVIDENCE_ONLY_AUTHORITY,
  };
}

moralGraphPrototypeRouter.post("/moral-graph/reflection/prototype", async (req, res) => {
  const parsed = requestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({
      error: "invalid_moral_graph_reflection_request",
      issues: parsed.error.issues,
      authority: EVIDENCE_ONLY_AUTHORITY,
    });
    return;
  }

  const text = firstText(parsed.data);
  if (!text) {
    res.status(400).json({
      error: "situation_prompt_required",
      message: "Provide situationPrompt, text, or prompt.",
      authority: EVIDENCE_ONLY_AUTHORITY,
    });
    return;
  }

  const routeId = makeRouteId();
  const refs = parsed.data.refs ?? [`${routeId}:user_text`];
  const guards = detectRouteGuards(text);

  try {
    const graph = await getIdeologyGraph();
    const toolResponse = reflectWithMoralGraphToolV1(graph, {
      reflectionId: `moral-graph-reflection:${routeId}`,
      loopDepth: 0,
      sourceKind: "user_text",
      inputKind: "user_prompt",
      text,
      refs,
      requestedPresetIds: parsed.data.requestedPresetIds,
      comparePresetIds: parsed.data.comparePresetIds,
      options: {
        includeObjectiveBinding: true,
        includeTrace: parsed.data.options?.includeTrace ?? true,
        includeRecommendedActions: parsed.data.options?.includeRecommendedActions ?? true,
        includeAdmissions: parsed.data.options?.includeAdmissions ?? true,
      },
    });
    const guardAdmission = buildGuardAdmission({ routeId, prompt: text, refs, guards });
    const admissions = guardAdmission ? [...toolResponse.admissions, guardAdmission] : toolResponse.admissions;
    const toolResponseWithAdmissions = { ...toolResponse, admissions };
    const validationIssues = validateMoralGraphReflectionToolResponseV1(toolResponseWithAdmissions);
    const response = {
      artifactId: "moral_graph_situation_reflection_route",
      schemaVersion: "moral_graph_situation_reflection_route/v1",
      routeId,
      prototype: true,
      evidenceOnly: true,
      normalizedInput: {
        inputKind: "user_prompt",
        sourceKind: "user_text",
        sourceTrust: "primary",
        refs,
      },
      provenance: toolResponse.provenance,
      reflection: toolResponse.reflection,
      objectiveBinding: toolResponse.objectiveBinding,
      ...(toolResponse.presetOverlays ? { presetOverlays: toolResponse.presetOverlays } : {}),
      recommendedActions: toolResponse.recommendedActions,
      admissions,
      routeGuards: {
        canExecuteRecommendedActions: false,
        canMutateNotesDocsOrRepo: false,
        terminalClaimsAllowed: false,
        realPersonCharacterClassificationAllowed: false,
        legalMedicalFinancialAuthorityAllowed: false,
        blocked: guards.map((guard) => ({
          code: guard.code,
          actionType: guard.actionType,
          reason: guard.reason,
        })),
      },
      agentEvidence: buildAgentEvidence(toolResponseWithAdmissions, routeId),
      authority: EVIDENCE_ONLY_AUTHORITY,
      ...(includeDebug(parsed.data.debug)
        ? {
            debugTrace: {
              routeId,
              view: buildMoralGraphDebugTraceViewV1({
                response: toolResponseWithAdmissions,
                routeId,
                routeGuards: guards.map((guard) => ({
                  code: guard.code,
                  actionType: guard.actionType,
                  reason: guard.reason,
                })),
                validationIssues,
              }),
              steps: [
                "normalize_situation_as_user_text",
                "call_moral_graph_reflection",
                "produce_ideology_context_reflection",
                "produce_moral_objective_binding",
                "produce_preset_overlays",
                "produce_recommended_action_admissions",
                "return_evidence_only_response",
              ],
              validationIssues,
              blockedGuardCodes: guards.map((guard) => guard.code),
            },
          }
        : {}),
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: "moral_graph_reflection_failed",
      message: error instanceof Error ? error.message : String(error),
      authority: EVIDENCE_ONLY_AUTHORITY,
    });
  }
});
