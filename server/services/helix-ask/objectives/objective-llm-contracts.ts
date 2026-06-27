import crypto from "node:crypto";
import {
  inferHelixAskAnswerPlanSectionKindFromShape,
  normalizeHelixAskAnswerFormatSectionKind,
  normalizeHelixAskTurnContractText,
  type HelixAskAnswerPlanFamily,
} from "../obligations";
import {
  normalizeHelixAskTurnContractFamily,
  normalizeHelixAskTurnContractGroundingMode,
  type HelixAskTurnContractGroundingMode,
} from "../contracts/turn-contract-normalizers";
import {
  buildHelixAskObjectiveUnknownBlock,
  sanitizeHelixAskObjectiveUnknownBlock,
} from "./objective-assembly";
import type {
  HelixAskObjectiveLoopState,
  HelixAskObjectiveMiniAnswer,
  HelixAskObjectiveUnknownBlock,
} from "./objective-loop-debug";

export type HelixAskObjectivePromptRewriteMode = "off" | "shadow" | "on";

export type HelixAskObjectivePromptRewriteStage =
  | "retrieve_proposal"
  | "mini_synth"
  | "mini_critic"
  | "assembly"
  | "assembly_rescue";

export type HelixAskObjectivePromptRewriteResult = {
  effectivePrompt: string;
  rewrittenPrompt: string | null;
  applied: boolean;
  effectiveHash: string;
  effectiveTokenEstimate: number;
  rewrittenHash: string | null;
  rewrittenTokenEstimate: number | null;
};

export type HelixAskObjectivePlannerVerbosity = "brief" | "normal" | "extended";

export type HelixAskObjectivePlannerPassObjective = {
  label: string;
  required_slots?: string[];
  query_hints?: string[];
};

export type HelixAskObjectivePlannerPassSection = {
  id?: string;
  title?: string;
  required?: boolean;
  must_answer?: string[];
  required_slots?: string[];
  preferred_evidence?: string[];
  kind?: string;
};

export type HelixAskObjectivePlannerPass = {
  goal: string;
  objectives: HelixAskObjectivePlannerPassObjective[];
  grounding_mode: HelixAskTurnContractGroundingMode;
  output_family: HelixAskAnswerPlanFamily;
  sections?: HelixAskObjectivePlannerPassSection[];
  verbosity?: HelixAskObjectivePlannerVerbosity | null;
  required_slots?: string[];
  query_hints?: string[];
  clarify_question?: string;
  risk_flags?: string[];
};

export type HelixAskObjectiveMiniSynthStatus = "covered" | "partial" | "blocked";

export type HelixAskObjectiveMiniSynthObjective = {
  objective_id: string;
  status: HelixAskObjectiveMiniSynthStatus;
  matched_slots: string[];
  missing_slots: string[];
  summary?: string;
  evidence_refs: string[];
  unknown_block?: HelixAskObjectiveUnknownBlock;
};

export type HelixAskObjectiveMiniSynth = {
  objectives: HelixAskObjectiveMiniSynthObjective[];
};

export type HelixAskObjectiveMiniCritiqueStatus = "covered" | "partial" | "blocked";

export type HelixAskObjectiveMiniCritiqueObjective = {
  objective_id: string;
  status: HelixAskObjectiveMiniCritiqueStatus;
  missing_slots: string[];
  reason?: string;
};

export type HelixAskObjectiveMiniCritique = {
  objectives: HelixAskObjectiveMiniCritiqueObjective[];
};

const estimateHelixAskPromptTokens = (value: string): number =>
  Math.max(1, Math.ceil(String(value ?? "").length / 4));

const hashHelixAskPromptText = (value: string): string =>
  crypto.createHash("sha1").update(String(value ?? "")).digest("hex").slice(0, 16);

const normalizeObjectiveSlotId = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const extractJsonObject = (text: string): string | null => {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
};

const slugifyHelixAskAnswerPlanSectionId = (value: string, fallback: string): string => {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[`"']/g, "")
    .replace(/[^\w]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
};

const buildHelixAskObjectivePromptRewriteLines = (
  stage: HelixAskObjectivePromptRewriteStage,
): string[] => {
  switch (stage) {
    case "retrieve_proposal":
      return [
        "Action: Generate 1-4 retrieval queries that directly close missing slots.",
        "Inputs: objective id/label, required slots, missing slots, query hints.",
        "Constraints: prioritize missing slots first; keep queries short and concrete; avoid adding objectives.",
        "Output: strict JSON per schema in the base prompt.",
      ];
    case "mini_synth":
      return [
        "Action: Synthesize objective coverage from provided checkpoints only.",
        "Inputs: objective checkpoints with matched/missing slots and evidence refs.",
        "Constraints: include each objective exactly once; preserve unresolved slots; do not invent evidence.",
        "Output: strict JSON per schema in the base prompt.",
      ];
    case "mini_critic":
      return [
        "Action: Critique objective coverage and assign covered|partial|blocked.",
        "Inputs: current objective checkpoints with matched/missing slots and evidence refs.",
        "Constraints: covered requires empty missing_slots; reasons must be short and slot-specific.",
        "Output: strict JSON per schema in the base prompt.",
      ];
    case "assembly":
      return [
        "Action: Assemble a concise final answer from objective checkpoints.",
        "Inputs: objective checkpoints, current draft, and response language.",
        "Constraints: never mark unresolved objectives as complete; preserve uncertainty and citations.",
        "Output: plain final answer only, no JSON/debug metadata.",
      ];
    case "assembly_rescue":
      return [
        "Action: Repair or rescue assembly while preserving objective integrity.",
        "Inputs: objective checkpoints, current draft, and response language.",
        "Constraints: remove blocked/UNKNOWN scaffolds when objectives are covered; otherwise fail closed.",
        "Output: plain final answer only, no JSON/debug metadata.",
      ];
    default:
      return [];
  }
};

const collectHelixAskJsonParseCandidates = (raw: string): string[] => {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return [];
  const candidates = new Set<string>();
  const push = (value: string | null | undefined): void => {
    if (typeof value !== "string") return;
    const normalized = value.trim();
    if (!normalized) return;
    candidates.add(normalized);
  };
  push(trimmed);
  push(extractJsonObject(trimmed));
  const fencedMatches = trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi);
  for (const match of fencedMatches) {
    const block = String(match?.[1] ?? "").trim();
    if (!block) continue;
    push(block);
    push(extractJsonObject(block));
  }
  return Array.from(candidates);
};

const normalizeHelixAskObjectiveSlotArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((slot) => normalizeObjectiveSlotId(String(slot ?? "")))
      .filter((slot): slot is string => Boolean(slot))
      .slice(0, 8);
  }
  if (typeof value === "string") {
    return value
      .split(/[,\n|]/g)
      .map((slot) => normalizeObjectiveSlotId(String(slot ?? "")))
      .filter((slot): slot is string => Boolean(slot))
      .slice(0, 8);
  }
  return [];
};

export const buildHelixAskObjectivePlannerPrompt = (args: {
  question: string;
  requiresRepoEvidence: boolean;
  intentDomain: string;
  outputFamily: HelixAskAnswerPlanFamily;
  maxObjectives: number;
  maxRequiredSlots: number;
  maxQueryHints: number;
}): string => {
  return [
    "You are Helix Ask objective planner.",
    "Return strict JSON only. No markdown. No commentary.",
    "Do not emit file paths, code symbols, citations, or final-answer prose.",
    "Do not use placeholder section titles or objective labels such as Plan for X or Notes: See X.",
    `Use one of these output_family values: definition_overview, mechanism_process, equation_formalism, comparison_tradeoff, troubleshooting_diagnosis, implementation_code_path, roadmap_planning, recommendation_decision, general_overview.`,
    "Use grounding_mode repo when repo grounding is required, hybrid when both repo and open-world planning are useful, open when repo grounding is not required.",
    `Limit objectives to ${args.maxObjectives}.`,
    `Limit required_slots to ${args.maxRequiredSlots}.`,
    `Limit query_hints to ${args.maxQueryHints}.`,
    "Choose a prompt-fitting visible answer format. Sections should describe what the final answer must cover, not final answer prose.",
    "Schema:",
    '{',
    '  "goal": "string",',
    '  "objectives": [{"label":"string","required_slots":["string"],"query_hints":["string"]}],',
    '  "grounding_mode": "repo|open|hybrid",',
    '  "output_family": "definition_overview|mechanism_process|equation_formalism|comparison_tradeoff|troubleshooting_diagnosis|implementation_code_path|roadmap_planning|recommendation_decision|general_overview",',
    '  "sections": [{"id":"string","title":"string","required":true,"must_answer":["string"],"required_slots":["string"],"preferred_evidence":["doc|code|test|runtime"],"kind":"answer|definition|mechanism|comparison|repo|diagnosis|roadmap|gaps|sources"}],',
    '  "verbosity": "brief|normal|extended",',
    '  "required_slots": ["string"],',
    '  "query_hints": ["string"],',
    '  "clarify_question": "string",',
    '  "risk_flags": ["string"]',
    '}',
    `Repo grounding required: ${args.requiresRepoEvidence ? "yes" : "no"}.`,
    `Intent domain: ${args.intentDomain}.`,
    `Current family prior: ${args.outputFamily}.`,
    "",
    `Question: ${args.question}`,
  ].join("\n");
};

export const parseHelixAskObjectivePlannerPass = (args: {
  raw: string;
  maxObjectives: number;
  maxRequiredSlots: number;
  maxQueryHints: number;
}): HelixAskObjectivePlannerPass | null => {
  const trimmed = String(args.raw ?? "").trim();
  if (!trimmed) return null;
  const jsonCandidate = extractJsonObject(trimmed) ?? trimmed;
  try {
    const parsed = JSON.parse(jsonCandidate) as Record<string, unknown>;
    const goal = normalizeHelixAskTurnContractText(String(parsed.goal ?? ""), 180);
    const outputFamily = normalizeHelixAskTurnContractFamily(String(parsed.output_family ?? ""));
    const groundingMode = normalizeHelixAskTurnContractGroundingMode(
      String(parsed.grounding_mode ?? ""),
    );
    const verbosityRaw = String(parsed.verbosity ?? "")
      .trim()
      .toLowerCase();
    const plannerVerbosity =
      verbosityRaw === "brief" || verbosityRaw === "normal" || verbosityRaw === "extended"
        ? (verbosityRaw as HelixAskObjectivePlannerVerbosity)
        : null;
    const objectiveRaw = Array.isArray(parsed.objectives) ? parsed.objectives : [];
    const objectives: HelixAskObjectivePlannerPassObjective[] = [];
    for (const entry of objectiveRaw) {
      if (objectives.length >= args.maxObjectives) break;
      if (typeof entry === "string") {
        const label = normalizeHelixAskTurnContractText(entry, 180);
        if (label) {
          objectives.push({ label });
        }
        continue;
      }
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const label = normalizeHelixAskTurnContractText(String(record.label ?? ""), 180);
      if (!label) continue;
      const requiredSlots = Array.isArray(record.required_slots)
        ? record.required_slots
            .map((slot) => normalizeObjectiveSlotId(String(slot ?? "")))
            .filter((slot): slot is string => Boolean(slot))
            .slice(0, 4)
        : [];
      const queryHints = Array.isArray(record.query_hints)
        ? record.query_hints
            .map((hint) => normalizeHelixAskTurnContractText(String(hint ?? ""), 120))
            .filter((hint): hint is string => Boolean(hint))
            .slice(0, 5)
        : [];
      objectives.push({
        label,
        required_slots: requiredSlots,
        query_hints: queryHints,
      });
    }
    if (!goal || !outputFamily || !groundingMode || objectives.length === 0) {
      return null;
    }
    const sectionRaw = Array.isArray(parsed.sections) ? parsed.sections : [];
    const sections: HelixAskObjectivePlannerPassSection[] = [];
    for (const [index, entry] of sectionRaw.entries()) {
      if (sections.length >= 8) break;
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const title = normalizeHelixAskTurnContractText(String(record.title ?? ""), 72);
      if (!title) continue;
      const id = slugifyHelixAskAnswerPlanSectionId(String(record.id ?? title), `section_${index + 1}`);
      const requiredSlots = Array.isArray(record.required_slots)
        ? record.required_slots
            .map((slot) => normalizeObjectiveSlotId(String(slot ?? "")))
            .filter(Boolean)
            .slice(0, 6)
        : [];
      const mustAnswer = Array.isArray(record.must_answer)
        ? record.must_answer
            .map((item) => normalizeHelixAskTurnContractText(String(item ?? ""), 160))
            .filter(Boolean)
            .slice(0, 4)
        : [];
      sections.push({
        id,
        title,
        required: record.required !== false,
        must_answer: mustAnswer,
        required_slots: requiredSlots,
        preferred_evidence: Array.isArray(record.preferred_evidence)
          ? record.preferred_evidence.map((item) => String(item ?? ""))
          : [],
        kind: normalizeHelixAskAnswerFormatSectionKind(
          String(record.kind ?? ""),
          inferHelixAskAnswerPlanSectionKindFromShape({
            family: outputFamily,
            id,
            title,
            requiredSlots,
          }),
        ),
      });
    }
    return {
      goal,
      objectives,
      grounding_mode: groundingMode,
      output_family: outputFamily,
      sections,
      verbosity: plannerVerbosity,
      required_slots: Array.isArray(parsed.required_slots)
        ? parsed.required_slots
            .map((slot) => normalizeObjectiveSlotId(String(slot ?? "")))
            .filter(Boolean)
            .slice(0, args.maxRequiredSlots)
        : [],
      query_hints: Array.isArray(parsed.query_hints)
        ? parsed.query_hints
            .map((hint) => normalizeHelixAskTurnContractText(String(hint ?? ""), 120))
            .filter(Boolean)
            .slice(0, args.maxQueryHints)
        : [],
      clarify_question: normalizeHelixAskTurnContractText(
        String(parsed.clarify_question ?? ""),
        180,
      ),
      risk_flags: Array.isArray(parsed.risk_flags)
        ? parsed.risk_flags
            .map((flag) => normalizeObjectiveSlotId(String(flag ?? "")))
            .filter(Boolean)
            .slice(0, 8)
        : [],
    };
  } catch {
    return null;
  }
};

export const resolveHelixAskObjectivePromptRewriteMode = (): HelixAskObjectivePromptRewriteMode => {
  const raw = String(process.env.HELIX_ASK_OBJECTIVE_PROMPT_REWRITE_V1 ?? "on")
    .trim()
    .toLowerCase();
  if (raw === "off" || raw === "shadow" || raw === "on") return raw;
  return "on";
};

export const rewriteHelixAskObjectivePromptV1 = (args: {
  stage: HelixAskObjectivePromptRewriteStage;
  basePrompt: string;
  mode: HelixAskObjectivePromptRewriteMode;
  responseLanguage?: string | null;
}): HelixAskObjectivePromptRewriteResult => {
  const basePrompt = String(args.basePrompt ?? "").trim();
  const baseHash = hashHelixAskPromptText(basePrompt);
  const baseTokens = estimateHelixAskPromptTokens(basePrompt);
  if (!basePrompt || args.mode === "off") {
    return {
      effectivePrompt: basePrompt,
      rewrittenPrompt: null,
      applied: false,
      effectiveHash: baseHash,
      effectiveTokenEstimate: baseTokens,
      rewrittenHash: null,
      rewrittenTokenEstimate: null,
    };
  }
  const stageLines = buildHelixAskObjectivePromptRewriteLines(args.stage);
  const rewrittenPrompt = [
    `Helix Ask technical rewrite mode (v1). stage=${args.stage}`,
    ...stageLines,
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "Do not output anything outside the required output contract.",
    "",
    "Authoritative base prompt contract:",
    basePrompt,
  ].join("\n");
  const rewrittenHash = hashHelixAskPromptText(rewrittenPrompt);
  const rewrittenTokens = estimateHelixAskPromptTokens(rewrittenPrompt);
  const useRewritten = args.mode === "on";
  return {
    effectivePrompt: useRewritten ? rewrittenPrompt : basePrompt,
    rewrittenPrompt,
    applied: useRewritten,
    effectiveHash: useRewritten ? rewrittenHash : baseHash,
    effectiveTokenEstimate: useRewritten ? rewrittenTokens : baseTokens,
    rewrittenHash,
    rewrittenTokenEstimate: rewrittenTokens,
  };
};

export const buildHelixAskObjectiveMiniSynthPrompt = (args: {
  question: string;
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  responseLanguage?: string | null;
}): string => {
  const objectiveBlocks = args.miniAnswers
    .map((entry, index) => {
      const matched = entry.matched_slots.join(", ") || "none";
      const missing = entry.missing_slots.join(", ") || "none";
      const evidence = entry.evidence_refs.slice(0, 6).join(", ") || "none";
      return [
        `${index + 1}. objective_id=${entry.objective_id}`,
        `label=${entry.objective_label}`,
        `baseline_status=${entry.status}`,
        `matched_slots=${matched}`,
        `missing_slots=${missing}`,
        `evidence_refs=${evidence}`,
        `summary=${entry.summary}`,
      ].join("\n");
    })
    .join("\n\n");
  return [
    "You are Helix Ask objective mini-synthesizer.",
    "Return strict JSON only. No markdown. No commentary.",
    "Schema:",
    '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","matched_slots":["slot-id"],"missing_slots":["slot-id"],"summary":"string","evidence_refs":["path"],"unknown_block":{"unknown":"string","why":"string","what_i_checked":["string"],"next_retrieval":"string"}}] }',
    "Rules:",
    "- Include each objective_id exactly once.",
    "- Use only objective-local evidence refs already provided unless absolutely needed.",
    "- If status=covered, missing_slots must be empty.",
    "- If status=partial|blocked, include meaningful missing_slots.",
    "- Keep summary concise.",
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "",
    `Question: ${args.question}`,
    "",
    "Objective checkpoints:",
    objectiveBlocks,
  ].join("\n");
};

export const buildHelixAskObjectiveRetrieveProposalPrompt = (args: {
  question: string;
  objectiveId: string;
  objectiveLabel: string;
  requiredSlots: string[];
  missingSlots: string[];
  queryHints: string[];
  responseLanguage?: string | null;
}): string => {
  const required = args.requiredSlots.length > 0 ? args.requiredSlots.join(", ") : "none";
  const missing = args.missingSlots.length > 0 ? args.missingSlots.join(", ") : "none";
  const hints = args.queryHints.length > 0 ? args.queryHints.slice(0, 8).join(" | ") : "none";
  return [
    "You are Helix Ask objective retrieval planner.",
    "Return strict JSON only. No markdown. No commentary.",
    "Schema:",
    '{ "objective_id":"string","queries":["string"],"rationale":"string" }',
    "Rules:",
    "- Output 1-4 high-signal retrieval queries for this objective.",
    "- Queries must target missing slots first.",
    "- Keep queries concrete and short.",
    "- Do not add new objectives.",
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "",
    `Question: ${args.question}`,
    `objective_id=${args.objectiveId}`,
    `objective_label=${args.objectiveLabel}`,
    `required_slots=${required}`,
    `missing_slots=${missing}`,
    `query_hints=${hints}`,
  ].join("\n");
};

export const parseHelixAskObjectiveRetrieveProposal = (
  raw: string,
): { objective_id?: string; queries: string[]; rationale?: string } | null => {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  for (const jsonCandidate of collectHelixAskJsonParseCandidates(trimmed)) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(jsonCandidate) as unknown;
    } catch {
      continue;
    }
    const record =
      parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    const nestedRecord =
      record?.data && typeof record.data === "object"
        ? (record.data as Record<string, unknown>)
        : null;
    const actionLike = Array.isArray(record?.actions)
      ? record.actions
      : Array.isArray(nestedRecord?.actions)
        ? nestedRecord.actions
        : [];
    const queryValues = [
      ...(Array.isArray(record?.queries) ? record.queries : []),
      ...(Array.isArray(nestedRecord?.queries) ? nestedRecord.queries : []),
      ...(Array.isArray(record?.next_retrieval) ? record.next_retrieval : []),
      ...(Array.isArray(nestedRecord?.next_retrieval) ? nestedRecord.next_retrieval : []),
    ];
    for (const action of actionLike) {
      if (!action || typeof action !== "object") continue;
      const actionRecord = action as Record<string, unknown>;
      if (typeof actionRecord.query === "string") {
        queryValues.push(actionRecord.query);
      } else if (typeof actionRecord.q === "string") {
        queryValues.push(actionRecord.q);
      }
    }
    if (typeof record?.query === "string") {
      queryValues.push(record.query);
    }
    if (typeof nestedRecord?.query === "string") {
      queryValues.push(nestedRecord.query);
    }
    const queries = Array.from(
      new Set(
        queryValues
          .map((value) => (typeof value === "string" ? value.trim() : ""))
          .filter(Boolean),
      ),
    ).slice(0, 6);
    if (queries.length === 0) continue;
    const objectiveIdRaw =
      String(record?.objective_id ?? nestedRecord?.objective_id ?? "").trim() || undefined;
    const rationale = normalizeHelixAskTurnContractText(
      String(record?.rationale ?? nestedRecord?.rationale ?? ""),
      220,
    ) || undefined;
    return {
      objective_id: objectiveIdRaw,
      queries,
      rationale,
    };
  }
  return null;
};

export const parseHelixAskObjectiveMiniSynth = (
  raw: string,
  options?: {
    objectiveHints?: Array<{
      objective_id: string;
      objective_label?: string;
      required_slots?: string[];
    }>;
  },
): HelixAskObjectiveMiniSynth | null => {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  for (const jsonCandidate of collectHelixAskJsonParseCandidates(trimmed)) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(jsonCandidate) as unknown;
    } catch {
      continue;
    }
    const parsedRecord =
      parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    const nestedRecord =
      parsedRecord?.data && typeof parsedRecord.data === "object"
        ? (parsedRecord.data as Record<string, unknown>)
        : null;
    const objectiveRaw = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsedRecord?.objectives)
        ? parsedRecord.objectives
        : Array.isArray(nestedRecord?.objectives)
          ? nestedRecord.objectives
          : parsedRecord?.objective_id
            ? [parsedRecord]
            : nestedRecord?.objective_id
              ? [nestedRecord]
              : [];
    const objectives: HelixAskObjectiveMiniSynthObjective[] = [];
    for (const entry of objectiveRaw) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const objectiveId = String(record.objective_id ?? "").trim();
      if (!objectiveId) continue;
      const statusRaw = String(record.status ?? "").trim().toLowerCase();
      const normalizedStatus =
        statusRaw === "covered" || statusRaw === "complete"
          ? "covered"
          : statusRaw === "blocked"
            ? "blocked"
            : statusRaw === "partial"
              ? "partial"
              : null;
      if (!normalizedStatus) continue;
      const matchedSlots = normalizeHelixAskObjectiveSlotArray(record.matched_slots);
      const missingSlots = normalizeHelixAskObjectiveSlotArray(record.missing_slots);
      const evidenceRefs = Array.isArray(record.evidence_refs)
        ? Array.from(
            new Set(
              record.evidence_refs
                .map((evidenceRef) => String(evidenceRef ?? "").trim())
                .filter(Boolean),
            ),
          ).slice(0, 8)
        : [];
      const unknownBlockRaw =
        record.unknown_block && typeof record.unknown_block === "object"
          ? (record.unknown_block as Partial<HelixAskObjectiveUnknownBlock>)
          : undefined;
      objectives.push({
        objective_id: objectiveId,
        status: normalizedStatus,
        matched_slots: matchedSlots,
        missing_slots: normalizedStatus === "covered" ? [] : missingSlots,
        summary: normalizeHelixAskTurnContractText(String(record.summary ?? ""), 260) || undefined,
        evidence_refs: evidenceRefs,
        unknown_block: unknownBlockRaw
          ? sanitizeHelixAskObjectiveUnknownBlock({
              objectiveLabel: objectiveId,
              missingSlots,
              evidenceRefs,
              block: unknownBlockRaw,
            })
          : undefined,
      });
    }
    if (objectives.length > 0) {
      return { objectives };
    }
  }
  const objectiveHints = (options?.objectiveHints ?? []).filter(
    (entry) => typeof entry?.objective_id === "string" && entry.objective_id.trim().length > 0,
  );
  if (objectiveHints.length !== 1) return null;
  const statusMatch = /\b(covered|complete|partial|blocked)\b/i.exec(trimmed);
  if (!statusMatch) return null;
  const normalizedStatus: HelixAskObjectiveMiniSynthStatus =
    statusMatch[1].toLowerCase() === "complete"
      ? "covered"
      : (statusMatch[1].toLowerCase() as HelixAskObjectiveMiniSynthStatus);
  const objectiveHint = objectiveHints[0];
  const requiredSlots = Array.from(
    new Set(
      (objectiveHint.required_slots ?? [])
        .map((slot) => normalizeObjectiveSlotId(String(slot ?? "")))
        .filter(Boolean),
    ),
  );
  const missingLine = /\bmissing\s+slots?\s*:\s*([^\n\r]+)/i.exec(trimmed)?.[1] ?? "";
  const missingHead = missingLine.split(/[.!?]/, 1)[0] ?? "";
  const missingSlots =
    normalizedStatus === "covered" || /\bnone\b/i.test(missingHead)
      ? []
      : Array.from(
          new Set(
            missingHead
              .split(/(?:,|;|\/|\band\b)/i)
              .map((slot) => normalizeObjectiveSlotId(String(slot ?? "")))
              .filter(Boolean)
              .filter((slot) => requiredSlots.length === 0 || requiredSlots.includes(slot)),
          ),
        );
  const matchedSlots =
    normalizedStatus === "covered"
      ? requiredSlots
      : requiredSlots.filter((slot) => !missingSlots.includes(slot));
  const evidenceRefs = Array.from(
    new Set(
      (trimmed.match(/[A-Za-z0-9_./-]+\.(?:md|ts|tsx|js|json|ya?ml|txt)\b/g) ?? [])
        .map((pathText) => pathText.trim())
        .filter(Boolean),
    ),
  ).slice(0, 8);
  return {
    objectives: [
      {
        objective_id: objectiveHint.objective_id,
        status: normalizedStatus,
        matched_slots: matchedSlots,
        missing_slots: missingSlots,
        summary: normalizeHelixAskTurnContractText(trimmed, 260) || undefined,
        evidence_refs: evidenceRefs,
      },
    ],
  };
};

export const applyHelixAskObjectiveMiniSynth = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  synth: HelixAskObjectiveMiniSynth;
  objectiveStates: HelixAskObjectiveLoopState[];
}): HelixAskObjectiveMiniAnswer[] => {
  const synthById = new Map(
    args.synth.objectives.map((entry) => [entry.objective_id, entry] as const),
  );
  const stateById = new Map(
    args.objectiveStates.map((entry) => [entry.objective_id, entry] as const),
  );
  return args.miniAnswers.map((entry) => {
    const synth = synthById.get(entry.objective_id);
    if (!synth) return entry;
    const state = stateById.get(entry.objective_id);
    const requiredSlots =
      state?.required_slots.length
        ? state.required_slots
        : Array.from(new Set([...entry.matched_slots, ...entry.missing_slots]));
    const matchedSlots = Array.from(
      new Set(synth.matched_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const missingSlotsFromSynth = Array.from(
      new Set(synth.missing_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const missingSlots =
      synth.status === "covered"
        ? []
        : missingSlotsFromSynth.length > 0
          ? missingSlotsFromSynth
          : requiredSlots.filter((slot) => !matchedSlots.includes(slot));
    const evidenceRefs = Array.from(
      new Set([...(synth.evidence_refs ?? []), ...entry.evidence_refs].filter(Boolean)),
    ).slice(0, 8);
    const unknownBlock =
      synth.status === "covered"
        ? undefined
        : sanitizeHelixAskObjectiveUnknownBlock({
            objectiveLabel: entry.objective_label,
            missingSlots,
            evidenceRefs,
            block: synth.unknown_block ?? entry.unknown_block,
          });
    return {
      ...entry,
      status: synth.status,
      matched_slots:
        synth.status === "covered"
          ? Array.from(new Set([...requiredSlots, ...matchedSlots]))
          : matchedSlots,
      missing_slots: missingSlots,
      evidence_refs: evidenceRefs,
      summary: synth.summary && synth.summary.trim().length > 0 ? synth.summary : entry.summary,
      unknown_block: unknownBlock,
    };
  });
};

export const buildHelixAskObjectiveMiniCritiquePrompt = (args: {
  question: string;
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  responseLanguage?: string | null;
}): string => {
  const objectiveBlocks = args.miniAnswers
    .map((entry, index) => {
      const matched = entry.matched_slots.join(", ") || "none";
      const missing = entry.missing_slots.join(", ") || "none";
      const evidence = entry.evidence_refs.slice(0, 6).join(", ") || "none";
      return [
        `${index + 1}. objective_id=${entry.objective_id}`,
        `label=${entry.objective_label}`,
        `current_status=${entry.status}`,
        `matched_slots=${matched}`,
        `missing_slots=${missing}`,
        `evidence_refs=${evidence}`,
        `summary=${entry.summary}`,
      ].join("\n");
    })
    .join("\n\n");
  return [
    "You are Helix Ask objective mini-critic.",
    "Return strict JSON only. No markdown. No commentary.",
    "Schema:",
    '{ "objectives": [{"objective_id":"string","status":"covered|partial|blocked","missing_slots":["slot-id"],"reason":"string"}] }',
    "Rules:",
    "- Include each objective_id exactly once.",
    "- Status must be one of covered|partial|blocked.",
    "- missing_slots must use only slot ids from that objective context when possible.",
    "- If status=covered, missing_slots must be empty.",
    "- Keep reason brief.",
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "",
    `Question: ${args.question}`,
    "",
    "Objective checkpoints:",
    objectiveBlocks,
  ].join("\n");
};

export const parseHelixAskObjectiveMiniCritique = (
  raw: string,
): HelixAskObjectiveMiniCritique | null => {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;
  for (const jsonCandidate of collectHelixAskJsonParseCandidates(trimmed)) {
    let parsed: unknown = null;
    try {
      parsed = JSON.parse(jsonCandidate) as unknown;
    } catch {
      continue;
    }
    const parsedRecord =
      parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
    const nestedRecord =
      parsedRecord?.data && typeof parsedRecord.data === "object"
        ? (parsedRecord.data as Record<string, unknown>)
        : null;
    const objectiveRaw = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsedRecord?.objectives)
        ? parsedRecord.objectives
        : Array.isArray(nestedRecord?.objectives)
          ? nestedRecord.objectives
          : parsedRecord?.objective_id
            ? [parsedRecord]
            : nestedRecord?.objective_id
              ? [nestedRecord]
              : [];
    const objectives: HelixAskObjectiveMiniCritiqueObjective[] = [];
    for (const entry of objectiveRaw) {
      if (!entry || typeof entry !== "object") continue;
      const record = entry as Record<string, unknown>;
      const objectiveId = String(record.objective_id ?? "").trim();
      if (!objectiveId) continue;
      const statusRaw = String(record.status ?? "").trim().toLowerCase();
      const normalizedStatus =
        statusRaw === "covered" || statusRaw === "complete"
          ? "covered"
          : statusRaw === "blocked"
            ? "blocked"
            : statusRaw === "partial"
              ? "partial"
              : null;
      if (!normalizedStatus) continue;
      const missingSlots = normalizeHelixAskObjectiveSlotArray(record.missing_slots);
      objectives.push({
        objective_id: objectiveId,
        status: normalizedStatus,
        missing_slots: normalizedStatus === "covered" ? [] : missingSlots,
        reason: normalizeHelixAskTurnContractText(String(record.reason ?? ""), 180) || undefined,
      });
    }
    if (objectives.length > 0) {
      return { objectives };
    }
  }
  return null;
};

export const applyHelixAskObjectiveMiniCritique = (args: {
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  critique: HelixAskObjectiveMiniCritique;
  objectiveStates: HelixAskObjectiveLoopState[];
}): HelixAskObjectiveMiniAnswer[] => {
  const critiqueById = new Map(
    args.critique.objectives.map((entry) => [entry.objective_id, entry] as const),
  );
  const stateById = new Map(
    args.objectiveStates.map((entry) => [entry.objective_id, entry] as const),
  );
  return args.miniAnswers.map((entry) => {
    const critique = critiqueById.get(entry.objective_id);
    if (!critique) return entry;
    const state = stateById.get(entry.objective_id);
    const requiredSlots =
      state?.required_slots.length
        ? state.required_slots
        : Array.from(new Set([...entry.matched_slots, ...entry.missing_slots]));
    const filteredMissing = Array.from(
      new Set(critique.missing_slots.filter((slot) => requiredSlots.includes(slot))),
    );
    const status = critique.status;
    const missingSlots =
      status === "covered"
        ? []
        : filteredMissing.length > 0
          ? filteredMissing
          : status === "partial"
            ? entry.missing_slots
            : filteredMissing;
    const matchedSlots = requiredSlots.filter((slot) => !missingSlots.includes(slot));
    const reasonSentence = critique.reason ? ` LLM critic: ${critique.reason}.` : "";
    const unknownBlock =
      status === "covered"
        ? undefined
        : buildHelixAskObjectiveUnknownBlock({
            objectiveLabel: entry.objective_label,
            missingSlots,
            evidenceRefs: entry.evidence_refs,
          });
    return {
      ...entry,
      status,
      matched_slots: matchedSlots,
      missing_slots: missingSlots,
      summary: `${entry.summary}${reasonSentence}`.trim(),
      unknown_block: unknownBlock,
    };
  });
};

export const buildHelixAskObjectiveAssemblyPrompt = (args: {
  question: string;
  currentAnswer: string;
  miniAnswers: HelixAskObjectiveMiniAnswer[];
  responseLanguage?: string | null;
}): string => {
  const hasUnresolvedObjectives = args.miniAnswers.some((entry) => entry.status !== "covered");
  const objectiveLines = args.miniAnswers
    .map((entry, index) => {
      const evidence = entry.evidence_refs.slice(0, 4).join(", ") || "none";
      const missing = entry.missing_slots.join(", ") || "none";
      return `${index + 1}. ${entry.objective_label}\nstatus=${entry.status}\nmissing=${missing}\nevidence=${evidence}\nsummary=${entry.summary}`;
    })
    .join("\n\n");
  return [
    "You are Helix Ask objective assembler.",
    "Return a concise final answer only, no JSON and no debug metadata.",
    "Answer the user's question directly; do not describe the draft/question quality.",
    "Preserve existing citations and uncertainty statements.",
    ...(hasUnresolvedObjectives
      ? [
          "If any objective remains partial or blocked, fail closed: emit an assembly-blocked reason plus objective-local UNKNOWN blocks only.",
          "For every objective with status=partial or status=blocked, emit an explicit UNKNOWN block with: UNKNOWN, Why, What I checked, Next retrieval.",
          'Forbidden in UNKNOWN output: "start with one concrete claim", "core meaning of the concept in its domain context", and "Sources: open-world best-effort".',
        ]
      : [
          "All objectives are covered.",
          "Do not emit fail-closed or UNKNOWN scaffolds.",
          'Forbidden tokens/headers: "UNKNOWN", "Assembly blocked:", "Open gaps / UNKNOWNs:", "Why:", "What I checked:", "Next retrieval:".',
          "If the current draft contains blocked/unknown scaffolds, rewrite it into a direct covered answer using objective summaries and evidence.",
        ]),
    "Never present unresolved objectives as complete.",
    "Use objective checkpoints internally; do not expose planner/checkpoint labels or status fields in the final answer.",
    'Forbidden meta framing: "This appears to be", "current draft", "does not provide a clear answer", "lacks concrete information".',
    "Use the same language as the current answer unless responseLanguage explicitly requests a different language.",
    `responseLanguage=${args.responseLanguage ?? "auto"}`,
    "",
    `Question: ${args.question}`,
    "",
    "Objective checkpoints:",
    objectiveLines,
    "",
    "Current answer draft:",
    args.currentAnswer,
  ].join("\n");
};
