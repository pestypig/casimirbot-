import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  compileTruthFunction,
  type TruthFunctionCompilerOptions,
  type TruthFunctionExecutionPlan,
} from "@shared/contributions/truth-function-compiler";
import type {
  TruthFunction,
  TruthInputKind,
} from "@shared/contributions/contributions.schema";
import type {
  IdeologyVerifierPack,
  Risk,
  Tier,
} from "@shared/ideology/ideology-verifiers.schema";
import { loadIdeologyVerifierPack } from "@shared/ideology/ideology-verifiers";
import type {
  TrainingTraceCertificate,
  TrainingTraceConstraint,
  TrainingTraceDelta,
  TrainingTraceMetrics,
} from "@shared/schema";
import { recordTrainingTrace } from "../observability/training-trace-store";
import { recordContributionTraceLink } from "./trace-links";
import { recordTruthFunctionVerification } from "./truth-functions";
import { buildEvidenceRegistryIndex } from "./evidence-registry";
import type {
  ContributionDraft,
  ContributionVerificationResult,
  ContributionVerificationStep,
  ContributionTruthFunctionResult,
} from "./drafts";

export type ContributionVerificationStepResult = {
  ok: boolean;
  message?: string;
};

export type ContributionVerificationContext = {
  draft: ContributionDraft;
  truthFunction: TruthFunction;
  plan: TruthFunctionExecutionPlan;
};

export type ContributionVerificationHandlers = {
  runTest?: (
    input: { ref: string } & ContributionVerificationContext,
  ) => Promise<ContributionVerificationStepResult> | ContributionVerificationStepResult;
  runQuery?: (
    input: { ref: string } & ContributionVerificationContext,
  ) => Promise<ContributionVerificationStepResult> | ContributionVerificationStepResult;
  runRule?: (
    input: { ref: string } & ContributionVerificationContext,
  ) => Promise<ContributionVerificationStepResult> | ContributionVerificationStepResult;
};

export type ContributionVerificationOptions = TruthFunctionCompilerOptions & {
  pack?: IdeologyVerifierPack;
  certificate?: TrainingTraceCertificate | null;
  traceId?: string;
  tenantId?: string;
  handlers?: ContributionVerificationHandlers;
};

const TIER_ORDER: Tier[] = ["L0", "L1", "L2", "L3"];
const RISK_ORDER: Risk[] = ["low", "medium", "high", "systemic"];
const REQUIRED_TIER: Tier = "L2";
const REQUIRED_RISK: Risk = "high";

const resolveExistingPath = (primary: string, fallback?: string) => {
  if (fs.existsSync(primary)) return primary;
  if (fallback && fs.existsSync(fallback)) return fallback;
  return primary;
};

let cachedPack:
  | { path: string; mtimeMs: number; pack: IdeologyVerifierPack }
  | null = null;
const loadVerifierPackCached = (): IdeologyVerifierPack => {
  const packPath = resolveExistingPath(
    path.resolve(process.cwd(), "configs", "ideology-verifiers.json"),
    path.resolve(process.cwd(), "ideology-verifiers.json"),
  );
  const stats = fs.statSync(packPath);
  if (cachedPack && cachedPack.path === packPath && cachedPack.mtimeMs === stats.mtimeMs) {
    return cachedPack.pack;
  }
  const pack = loadIdeologyVerifierPack(packPath);
  cachedPack = { path: packPath, mtimeMs: stats.mtimeMs, pack };
  return pack;
};

const rankOf = <T extends string>(value: T, order: T[]): number => {
  const index = order.indexOf(value);
  return index < 0 ? 0 : index;
};

const pickHighest = <T extends string>(
  current: T | null,
  candidate: T,
  order: T[],
): T => {
  if (!current) return candidate;
  return rankOf(candidate, order) > rankOf(current, order) ? candidate : current;
};

const mergeKnownInputRefs = (
  base?: Partial<Record<TruthInputKind, Set<string>>>,
  addition?: Partial<Record<TruthInputKind, Set<string>>>,
): Partial<Record<TruthInputKind, Set<string>>> | undefined => {
  if (!base && !addition) return undefined;
  const merged: Partial<Record<TruthInputKind, Set<string>>> = {};
  const kinds = new Set<TruthInputKind>();
  if (base) {
    Object.keys(base).forEach((key) => kinds.add(key as TruthInputKind));
  }
  if (addition) {
    Object.keys(addition).forEach((key) => kinds.add(key as TruthInputKind));
  }
  for (const kind of kinds) {
    const set = new Set<string>();
    base?.[kind]?.forEach((ref) => set.add(ref));
    addition?.[kind]?.forEach((ref) => set.add(ref));
    merged[kind] = set;
  }
  return merged;
};

const isPlaceholderRef = (ref: string): boolean => {
  const trimmed = ref.trim().toLowerCase();
  return (
    trimmed.length === 0 ||
    trimmed === "pending" ||
    trimmed.startsWith("pending:") ||
    trimmed === "todo"
  );
};

const resolveErrorMessage = (error: unknown): string => {
  if (!error) return "unknown_error";
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "unknown_error";
};

const selectRunner = (
  kind: ContributionVerificationStep["kind"],
  handlers?: ContributionVerificationHandlers,
) => {
  if (kind === "test") return handlers?.runTest;
  if (kind === "query") return handlers?.runQuery;
  return handlers?.runRule;
};

const runStep = async (input: {
  draft: ContributionDraft;
  truthFunction: TruthFunction;
  plan: TruthFunctionExecutionPlan;
  step: TruthFunctionExecutionPlan["steps"][number];
  handlers?: ContributionVerificationHandlers;
}): Promise<ContributionVerificationStep> => {
  const { draft, truthFunction, plan, step, handlers } = input;
  if (isPlaceholderRef(step.ref)) {
    return {
      truthFunctionId: plan.truthFunctionId,
      kind: step.kind,
      ref: step.ref,
      ok: false,
      message: "placeholder-ref",
    };
  }
  const runner = selectRunner(step.kind, handlers);
  if (!runner) {
    return {
      truthFunctionId: plan.truthFunctionId,
      kind: step.kind,
      ref: step.ref,
      ok: false,
      message: `missing-runner:${step.kind}`,
    };
  }
  try {
    const result = await runner({ ref: step.ref, draft, truthFunction, plan });
    return {
      truthFunctionId: plan.truthFunctionId,
      kind: step.kind,
      ref: step.ref,
      ok: Boolean(result.ok),
      message: result.message,
    };
  } catch (error) {
    return {
      truthFunctionId: plan.truthFunctionId,
      kind: step.kind,
      ref: step.ref,
      ok: false,
      message: resolveErrorMessage(error),
    };
  }
};

const buildFirstFail = (input: {
  truthFunctions: ContributionTruthFunctionResult[];
  steps: ContributionVerificationStep[];
  certificateRequired: boolean;
  certificateOk: boolean;
  certificate?: TrainingTraceCertificate;
}): TrainingTraceConstraint | undefined => {
  const compileFailure = input.truthFunctions.find(
    (result) => !result.ok && result.errors && result.errors.length > 0,
  );
  if (compileFailure && compileFailure.errors) {
    return {
      id: `compile:${compileFailure.truthFunctionId}`,
      status: "fail",
      note: compileFailure.errors[0]?.message,
    };
  }
  const stepFailure = input.steps.find((step) => !step.ok);
  if (stepFailure) {
    return {
      id: `step:${stepFailure.truthFunctionId}:${stepFailure.kind}:${stepFailure.ref}`,
      status: "fail",
      note: stepFailure.message,
    };
  }
  if (input.certificateRequired && !input.certificateOk) {
    const integrityFail = input.certificate?.integrityOk === false;
    return {
      id: integrityFail ? "certificate.integrity" : "certificate.missing",
      status: "fail",
      note: integrityFail ? "certificate integrity failed" : "certificate missing",
    };
  }
  return undefined;
};

const buildMetrics = (input: {
  truthFunctionsTotal: number;
  truthFunctionsOk: number;
  stepsTotal: number;
  stepsOk: number;
  ok: boolean;
  mintable: boolean;
  certificateRequired: boolean;
  certificateOk: boolean;
}): TrainingTraceMetrics => ({
  "contribution.truth_functions.total": input.truthFunctionsTotal,
  "contribution.truth_functions.ok": input.truthFunctionsOk,
  "contribution.steps.total": input.stepsTotal,
  "contribution.steps.ok": input.stepsOk,
  "contribution.verification.ok": input.ok,
  "contribution.mintable": input.mintable,
  "contribution.certificate.required": input.certificateRequired,
  "contribution.certificate.ok": input.certificateOk,
});

const buildDeltas = (input: {
  truthFunctionsTotal: number;
  truthFunctionsOk: number;
  stepsTotal: number;
  stepsOk: number;
}): TrainingTraceDelta[] => {
  const deltas: TrainingTraceDelta[] = [];
  const pushDelta = (key: string, value: number) => {
    deltas.push({
      key,
      from: null,
      to: value,
      change: "added",
    });
  };
  pushDelta("contribution.truth_functions.total", input.truthFunctionsTotal);
  pushDelta("contribution.truth_functions.ok", input.truthFunctionsOk);
  pushDelta("contribution.steps.total", input.stepsTotal);
  pushDelta("contribution.steps.ok", input.stepsOk);
  return deltas;
};

const resolveCertificateOk = (
  certificate?: TrainingTraceCertificate | null,
): boolean => {
  const hash =
    typeof certificate?.certificateHash === "string"
      ? certificate.certificateHash.trim()
      : "";
  return hash.length > 0 && certificate?.integrityOk === true;
};

const requiresCertificate = (input: {
  highestTier: Tier | null;
  highestRisk: Risk | null;
  hasCertifiedStage: boolean;
}): boolean => {
  if (input.hasCertifiedStage) return true;
  if (
    input.highestTier &&
    rankOf(input.highestTier, TIER_ORDER) >= rankOf(REQUIRED_TIER, TIER_ORDER)
  ) {
    return true;
  }
  if (
    input.highestRisk &&
    rankOf(input.highestRisk, RISK_ORDER) >= rankOf(REQUIRED_RISK, RISK_ORDER)
  ) {
    return true;
  }
  return false;
};

export async function verifyContributionDraft(
  draft: ContributionDraft,
  options: ContributionVerificationOptions = {},
): Promise<ContributionVerificationResult> {
  const pack = options.pack ?? loadVerifierPackCached();
  const evidenceIndex = buildEvidenceRegistryIndex();
  const knownInputRefs = mergeKnownInputRefs(
    options.knownInputRefs,
    evidenceIndex.admissibleRefsByKind,
  );
  const evidenceByRef = options.evidenceByRef ?? evidenceIndex.admissibleByRef;
  const compileOptions: TruthFunctionCompilerOptions = {
    allowUnknownRefs: options.allowUnknownRefs ?? false,
    knownInputRefs,
    knownPredicateRefs: options.knownPredicateRefs,
    stageTierCaps: options.stageTierCaps,
    evidenceByRef,
  };

  const truthFunctions: ContributionTruthFunctionResult[] = [];
  const steps: ContributionVerificationStep[] = [];
  const errors: string[] = [];
  const plans: Array<{
    truthFunction: TruthFunction;
    plan: TruthFunctionExecutionPlan;
  }> = [];

  let highestTier: Tier | null = null;
  let highestRisk: Risk | null = null;
  for (const draftItem of draft.truthFunctions) {
    const compiled = compileTruthFunction(draftItem.truthFunction, pack, compileOptions);
    if (!compiled.ok) {
      truthFunctions.push({
        truthFunctionId: draftItem.truthFunction.id,
        ok: false,
        errors: compiled.errors,
      });
      errors.push(...compiled.errors.map((err) => err.message));
      continue;
    }
    highestTier = pickHighest(highestTier, compiled.plan.tier, TIER_ORDER);
    highestRisk = pickHighest(highestRisk, compiled.plan.risk, RISK_ORDER);
    truthFunctions.push({
      truthFunctionId: draftItem.truthFunction.id,
      ok: true,
      tier: compiled.plan.tier,
      risk: compiled.plan.risk,
    });
    plans.push({ truthFunction: draftItem.truthFunction, plan: compiled.plan });
  }

  for (const entry of plans) {
    for (const step of entry.plan.steps) {
      const result = await runStep({
        draft,
        truthFunction: entry.truthFunction,
        plan: entry.plan,
        step,
        handlers: options.handlers,
      });
      steps.push(result);
      if (!result.ok) {
        const message = result.message?.trim()
          ? result.message
          : `step failed: ${step.kind}:${step.ref}`;
        errors.push(message);
      }
    }
  }

  const ok =
    truthFunctions.every((result) => result.ok) &&
    steps.every((result) => result.ok);
  const hasCertifiedStage = draft.truthFunctions.some(
    (item) => item.truthFunction.stage === "certified",
  );
  const certificateRequired = requiresCertificate({
    highestTier,
    highestRisk,
    hasCertifiedStage,
  });
  const certificate = options.certificate ?? undefined;
  const certificateOk = resolveCertificateOk(certificate);
  const mintable = ok && (!certificateRequired || certificateOk);
  if (certificateRequired && !certificateOk) {
    errors.push(
      certificate?.integrityOk === false
        ? "certificate integrity failed"
        : "certificate missing",
    );
  }

  const traceId =
    options.traceId?.trim() || `contrib:${draft.id}:${crypto.randomUUID()}`;
  const truthFunctionsOk = truthFunctions.filter((result) => result.ok).length;
  const stepsOk = steps.filter((step) => step.ok).length;
  const metrics = buildMetrics({
    truthFunctionsTotal: truthFunctions.length,
    truthFunctionsOk,
    stepsTotal: steps.length,
    stepsOk,
    ok,
    mintable,
    certificateRequired,
    certificateOk,
  });
  const deltas = buildDeltas({
    truthFunctionsTotal: truthFunctions.length,
    truthFunctionsOk,
    stepsTotal: steps.length,
    stepsOk,
  });
  const firstFail = buildFirstFail({
    truthFunctions,
    steps,
    certificateRequired,
    certificateOk,
    certificate: certificate ?? undefined,
  });
  const notes: string[] = [];
  if (certificateRequired && !certificateOk) {
    notes.push(
      certificate?.integrityOk === false
        ? "certificate_integrity_failed"
        : "certificate_missing",
    );
  }
  recordTrainingTrace({
    id: traceId,
    traceId,
    tenantId: options.tenantId,
    pass: mintable,
    source: { system: "casimirbot", component: "contributions" },
    signal: { kind: "contribution-verification" },
    deltas,
    metrics,
    firstFail,
    certificate: certificate ?? undefined,
    notes: notes.length > 0 ? notes : undefined,
  });

  recordContributionTraceLink({
    traceId,
    kind: "verification",
    tenantId: options.tenantId,
    contributionId: draft.id,
    truthFunctionIds: draft.truthFunctions.map(
      (entry) => entry.truthFunction.id,
    ),
  });

  for (const result of truthFunctions) {
    recordTruthFunctionVerification({
      truthFunctionId: result.truthFunctionId,
      ok: result.ok,
      tier: result.tier,
      risk: result.risk,
      traceId,
    });
  }

  return {
    ok,
    mintable,
    traceId,
    certificateRequired,
    certificateOk,
    certificate: certificate ?? undefined,
    steps,
    truthFunctions,
    errors: errors.length > 0 ? errors : undefined,
  };
}
