import { normalizeHelixAskTurnContractText } from "../obligations";
import {
  buildHelixAskObjectiveUnknownBlock,
  type HelixAskObjectiveMiniAnswer,
  type HelixAskObjectiveMiniAnswerStatus,
} from "../objectives/objective-assembly";

export type HelixAskObjectiveLoopStatus =
  | "pending"
  | "retrieving"
  | "synthesizing"
  | "critiqued"
  | "repaired"
  | "complete"
  | "blocked";

export type HelixAskObjectiveLoopStateLike = {
  objective_id: string;
  objective_label: string;
  required_slots: string[];
  matched_slots: string[];
  status: HelixAskObjectiveLoopStatus;
  attempt: number;
  retrieval_confidence?: number;
};

const HELIX_ASK_OBJECTIVE_LOOP_TERMINAL: ReadonlySet<HelixAskObjectiveLoopStatus> = new Set([
  "complete",
  "blocked",
]);

const HELIX_ASK_SCOPED_RETRIEVAL_OPTIONAL_SLOTS: ReadonlySet<string> = new Set([
  "definition",
  "definitions",
  "key_terms",
  "key-terms",
  "term",
  "terms",
  "glossary",
]);

const isHelixAskObjectiveTerminalStatus = (status: HelixAskObjectiveLoopStatus): boolean =>
  HELIX_ASK_OBJECTIVE_LOOP_TERMINAL.has(status);

const normalizeSlot = (value: string): string =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-");

const objectiveRequiresScopedRetrieval = (state: HelixAskObjectiveLoopStateLike): boolean => {
  const required = state.required_slots
    .map((slot) => normalizeSlot(slot))
    .filter(Boolean);
  if (required.length === 0) return false;
  return required.some((slot) => !HELIX_ASK_SCOPED_RETRIEVAL_OPTIONAL_SLOTS.has(slot));
};

const mergeObjectiveScopedRecoveryQueries = (
  primary: string[],
  secondary: string[],
  limit: number,
): string[] => {
  const merged: string[] = [];
  const seen = new Set<string>();
  const push = (value: string): void => {
    const trimmed = String(value ?? "").trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(trimmed);
  };
  primary.forEach(push);
  secondary.forEach(push);
  return merged.slice(0, Math.max(1, Math.floor(limit)));
};

export const shouldBypassHelixAskObjectiveScopedRetrievalAgentGate = (args: {
  canAgentAct: boolean;
  objectiveAttempt: number;
  objectiveHasPriorRetrievalPass: boolean;
}): boolean => {
  if (args.canAgentAct) return false;
  if (args.objectiveAttempt > 0) return false;
  return !args.objectiveHasPriorRetrievalPass;
};

export const collectHelixAskObjectiveScopedRetrievalRecoveryTargets = <
  T extends HelixAskObjectiveLoopStateLike,
>(args: {
  states: T[];
  retrievalQueries: Array<{ objective_id: string }>;
  maxObjectives: number;
}): T[] => {
  const coveredObjectiveIds = new Set(
    args.retrievalQueries
      .map((entry) => String(entry?.objective_id ?? "").trim())
      .filter(Boolean),
  );
  return args.states
    .filter((state) => !isHelixAskObjectiveTerminalStatus(state.status))
    .filter((state) => state.required_slots.length > 0)
    .filter((state) => !coveredObjectiveIds.has(state.objective_id))
    .slice(0, Math.max(0, args.maxObjectives));
};

export const computeHelixAskObjectiveScopedRecoveryMaxAttempts = (args: {
  missingSlots: string[];
  routingSalvageEligible: boolean;
}): number => {
  const normalizedSlots = args.missingSlots
    .map((slot) => String(slot ?? "").trim().toLowerCase())
    .filter(Boolean);
  const hasMechanismGap = normalizedSlots.some((slot) =>
    slot === "mechanism" ||
    slot === "code-path" ||
    slot === "code_path" ||
    slot === "repo-mapping" ||
    slot === "implementation-touchpoints",
  );
  return args.routingSalvageEligible || hasMechanismGap ? 3 : 2;
};

export const buildHelixAskObjectiveScopedRecoveryEscalationHints = (args: {
  objectiveLabel: string;
  missingSlots: string[];
  priorEvidenceRefs: string[];
  maxHints: number;
}): string[] => {
  if (args.maxHints <= 0) return [];
  const objectiveLabel = normalizeHelixAskTurnContractText(args.objectiveLabel, 140);
  const slotHints = args.missingSlots.flatMap((slot) => {
    const normalizedSlot = String(slot ?? "").trim().toLowerCase();
    if (!normalizedSlot) return [];
    if (normalizedSlot === "mechanism") {
      return ["mechanism", "how it works", `${objectiveLabel} mechanism`];
    }
    if (normalizedSlot === "code-path" || normalizedSlot === "code_path") {
      return ["code path", "implementation path", `${objectiveLabel} code path`];
    }
    if (normalizedSlot === "repo-mapping") {
      return ["repo mapping", "where in repo", `${objectiveLabel} repo mapping`];
    }
    return [normalizedSlot, `${objectiveLabel} ${normalizedSlot}`];
  });
  const allHints = Array.from(
    new Set(
      [objectiveLabel, ...slotHints, ...args.priorEvidenceRefs.slice(0, 6), `${objectiveLabel} detailed explanation`]
        .map((entry) => normalizeHelixAskTurnContractText(entry, 140))
        .filter(Boolean),
    ),
  );
  return allHints.slice(0, args.maxHints);
};

export const expandHelixAskObjectiveScopedRecoveryTargets = <
  T extends HelixAskObjectiveLoopStateLike,
>(args: {
  targets: T[];
  repeatCount: number;
  maxPasses: number;
}): T[] => {
  const repeatCount = Math.max(1, Math.floor(args.repeatCount));
  const maxPasses = Math.max(1, Math.floor(args.maxPasses));
  const expanded: T[] = [];
  for (const target of args.targets) {
    for (let i = 0; i < repeatCount; i += 1) {
      if (expanded.length >= maxPasses) return expanded;
      expanded.push(target);
    }
  }
  return expanded;
};

export const buildHelixAskObjectiveScopedRecoveryQueryVariants = (args: {
  baseQuestion: string;
  primaryQueries: string[];
  objectiveLabel: string;
  missingSlots: string[];
  maxQueries: number;
  maxVariants: number;
}): string[][] => {
  const primary = args.primaryQueries
    .map((entry) => normalizeHelixAskTurnContractText(entry, 180))
    .filter(Boolean);
  if (primary.length === 0) return [];
  if (args.maxVariants <= 1) return [primary];

  const normalizedSlots = args.missingSlots
    .map((slot) => String(slot ?? "").trim().toLowerCase())
    .filter(Boolean);
  const slotHints = normalizedSlots.flatMap((slot) => {
    if (slot === "mechanism") {
      return [
        `${args.objectiveLabel} mechanism`,
        `how does ${args.objectiveLabel} work`,
        `${args.objectiveLabel} causal chain`,
      ];
    }
    if (slot === "code-path" || slot === "code_path") {
      return [`${args.objectiveLabel} code path`, `${args.objectiveLabel} implementation path`];
    }
    if (slot === "repo-mapping") {
      return [`${args.objectiveLabel} repo mapping`, `where in repo ${args.objectiveLabel}`];
    }
    return [`${args.objectiveLabel} ${slot}`];
  });

  const diversified = mergeObjectiveScopedRecoveryQueries(
    [args.baseQuestion],
    [args.objectiveLabel, ...slotHints],
    args.maxQueries,
  );
  const slotFocused = mergeObjectiveScopedRecoveryQueries(
    [args.objectiveLabel],
    slotHints.length > 0 ? slotHints : [args.baseQuestion],
    args.maxQueries,
  );
  const compactDiversified = mergeObjectiveScopedRecoveryQueries(
    [],
    [args.baseQuestion, args.objectiveLabel, ...slotHints.slice(0, 3)],
    Math.max(1, Math.min(Math.floor(args.maxQueries), 4)),
  );
  const signatures = new Set<string>();
  const toSignature = (queries: string[]): string =>
    queries.map((entry) => entry.trim().toLowerCase()).join("||");
  const variants: string[][] = [];

  const pushVariant = (queries: string[]): void => {
    if (queries.length === 0) return;
    const signature = toSignature(queries);
    if (signatures.has(signature)) return;
    signatures.add(signature);
    variants.push(queries);
  };

  pushVariant(primary);
  pushVariant(diversified);
  pushVariant(slotFocused);
  pushVariant(compactDiversified);
  return variants.slice(0, Math.max(1, Math.floor(args.maxVariants)));
};

export const scoreHelixAskObjectiveRecoveryVariantResult = (result: {
  files: string[];
  queryHitCount?: number;
  topScore?: number;
  scoreGap?: number;
  topicMustIncludeOk?: boolean;
}): number => {
  const fileCount = Array.isArray(result.files) ? result.files.length : 0;
  const queryHitCount = Number.isFinite(result.queryHitCount) ? Number(result.queryHitCount) : 0;
  const topScore = Number.isFinite(result.topScore) ? Number(result.topScore) : 0;
  const scoreGap = Number.isFinite(result.scoreGap) ? Number(result.scoreGap) : 0;
  const mustIncludeBoost = result.topicMustIncludeOk === false ? 0 : 1;
  return fileCount * 1000 + queryHitCount * 50 + topScore * 10 + scoreGap + mustIncludeBoost;
};

export const collectHelixAskObjectiveIdsWithoutScopedRetrievalPass = <
  T extends HelixAskObjectiveLoopStateLike,
>(args: {
  states: T[];
  retrievalQueries: Array<{ objective_id: string }>;
  unresolvedOnly?: boolean;
  maxObjectives: number;
}): string[] => {
  const coveredObjectiveIds = new Set(
    args.retrievalQueries
      .map((entry) => String(entry?.objective_id ?? "").trim())
      .filter(Boolean),
  );
  const unresolvedOnly = args.unresolvedOnly !== false;
  return args.states
    .filter((state) => !unresolvedOnly || !isHelixAskObjectiveTerminalStatus(state.status))
    .filter((state) => state.required_slots.length > 0)
    .filter((state) => objectiveRequiresScopedRetrieval(state))
    .filter((state) => !coveredObjectiveIds.has(state.objective_id))
    .map((state) => state.objective_id)
    .slice(0, Math.max(0, args.maxObjectives));
};

export const enforceHelixAskObjectiveScopedRetrievalRequirementForMiniAnswers = <
  T extends HelixAskObjectiveMiniAnswer,
  S extends HelixAskObjectiveLoopStateLike,
>(args: {
  miniAnswers: T[];
  states: S[];
  retrievalQueries: Array<{ objective_id: string }>;
  maxObjectives: number;
}): {
  miniAnswers: T[];
  missingObjectiveIds: string[];
} => {
  const missingObjectiveIds = collectHelixAskObjectiveIdsWithoutScopedRetrievalPass({
    states: args.states,
    retrievalQueries: args.retrievalQueries,
    unresolvedOnly: false,
    maxObjectives: args.maxObjectives,
  });
  if (missingObjectiveIds.length === 0) {
    return {
      miniAnswers: args.miniAnswers,
      missingObjectiveIds,
    };
  }
  const missingSet = new Set(missingObjectiveIds);
  const stateById = new Map(args.states.map((entry) => [entry.objective_id, entry] as const));
  const patched = args.miniAnswers.map((entry) => {
    if (!missingSet.has(entry.objective_id)) return entry;
    const state = stateById.get(entry.objective_id);
    const requiredSlots =
      state?.required_slots.length
        ? state.required_slots
        : Array.from(new Set([...entry.matched_slots, ...entry.missing_slots]));
    const derivedMissingSlots = requiredSlots.filter((slot) => !entry.matched_slots.includes(slot));
    const missingSlots = Array.from(
      new Set(
        [...entry.missing_slots, ...derivedMissingSlots, ...(requiredSlots.length > 0 ? [] : ["evidence"])].filter(
          Boolean,
        ),
      ),
    ).slice(0, 8);
    const status: HelixAskObjectiveMiniAnswerStatus =
      entry.status === "blocked" ? "blocked" : "partial";
    return {
      ...entry,
      status,
      missing_slots: missingSlots,
      summary: `${entry.summary} Assembly blocked until objective-scoped retrieval runs for this required objective.`.trim(),
      unknown_block: buildHelixAskObjectiveUnknownBlock({
        objectiveLabel: entry.objective_label,
        missingSlots,
        evidenceRefs: entry.evidence_refs,
        scopedRetrievalMissing: true,
      }),
    } as T;
  });
  return {
    miniAnswers: patched,
    missingObjectiveIds,
  };
};
