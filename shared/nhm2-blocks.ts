import { z } from "zod";
import type { Nhm2SolveState } from "./nhm2-solve-state";

export const NHM2_BLOCK_IDS = [
  "nhm2.authority-status",
  "nhm2.geometry-timing",
  "nhm2.proof-guardrails",
  "nhm2.calculator-snapshot",
  "nhm2.render-status",
] as const;

export type Nhm2BlockId = typeof NHM2_BLOCK_IDS[number];
export type Nhm2BlockStatus = "good" | "warn" | "bad";
export type Nhm2BlockAuthorityTier = "authoritative" | "hybrid" | "diagnostic" | "proxy";

export type Nhm2CalculatorSnapshot = {
  decisionClass?: string | null;
  congruentSolvePass?: boolean | null;
  marginRatioRaw?: number | null;
  marginRatioRawComputed?: number | null;
  outPath?: string | null;
  lastRunAt?: number | null;
  observerCondition?: string | null;
  observerFrame?: string | null;
  injectCurvatureSignals?: boolean | null;
};

export type Nhm2ClaimBlock = {
  blockId: Nhm2BlockId;
  claimIds: string[];
  title: string;
  summary: string;
  authorityTier: Nhm2BlockAuthorityTier;
  status: Nhm2BlockStatus;
  provenance: Array<{
    label: string;
    kind: "source" | "api" | "panel" | "artifact";
    ref?: string | null;
    detail?: string | null;
  }>;
  integrity: {
    version: string;
    certificateHash: string | null;
    integrityOk: boolean | null;
    generatedAt: number;
  };
  data: Record<string, unknown>;
  render?: {
    panelId?: string;
    panelTitle?: string;
    href?: string;
    endpoint?: string;
  };
};

const nhm2BlockIdSchema = z.enum(NHM2_BLOCK_IDS);
const nhm2BlockAuthorityTierSchema = z.enum([
  "authoritative",
  "hybrid",
  "diagnostic",
  "proxy",
]);
const nhm2BlockStatusSchema = z.enum(["good", "warn", "bad"]);

export const nhm2ClaimBlockSchema = z.object({
  blockId: nhm2BlockIdSchema,
  claimIds: z.array(z.string()),
  title: z.string(),
  summary: z.string(),
  authorityTier: nhm2BlockAuthorityTierSchema,
  status: nhm2BlockStatusSchema,
  provenance: z.array(
    z.object({
      label: z.string(),
      kind: z.enum(["source", "api", "panel", "artifact"]),
      ref: z.string().nullable().optional(),
      detail: z.string().nullable().optional(),
    }),
  ),
  integrity: z.object({
    version: z.string(),
    certificateHash: z.string().nullable(),
    integrityOk: z.boolean().nullable(),
    generatedAt: z.number().int().nonnegative(),
  }),
  data: z.record(z.string(), z.unknown()),
  render: z
    .object({
      panelId: z.string().optional(),
      panelTitle: z.string().optional(),
      href: z.string().optional(),
      endpoint: z.string().optional(),
    })
    .optional(),
});

export const nhm2BlockResolveRequestSchema = z.object({
  blockIds: z.array(nhm2BlockIdSchema).min(1).max(NHM2_BLOCK_IDS.length).optional(),
});

export const nhm2BlockResponseSchema = z.object({
  kind: z.literal("nhm2-block"),
  block: nhm2ClaimBlockSchema,
});

export const nhm2BlockBatchResponseSchema = z.object({
  kind: z.literal("nhm2-block-batch"),
  blocks: z.array(nhm2ClaimBlockSchema),
});

export type Nhm2BlockResolveRequest = z.infer<typeof nhm2BlockResolveRequestSchema>;

const BLOCK_VERSION = "nhm2-blocks.v1";
const DEFAULT_API_BASE_PATH = "/api/helix/blocks";

const joinText = (parts: Array<string | null | undefined>) =>
  parts.filter((value): value is string => Boolean(value && value.trim().length > 0)).join(" ");

const blockHref = (basePath: string, blockId: Nhm2BlockId) =>
  `${basePath.replace(/\/$/, "")}/${encodeURIComponent(blockId)}`;

const overallToStatus = (tone: Nhm2SolveState["overall"]["tone"]): Nhm2BlockStatus => tone;

const deriveAuthorityTier = (
  state: Nhm2SolveState,
  options: {
    allowAuthoritative?: boolean;
    diagnostic?: boolean;
  } = {},
): Nhm2BlockAuthorityTier => {
  if (options.diagnostic) return "diagnostic";
  if (
    state.proof.strictProxy ||
    state.contract.proxy ||
    state.contract.integrityOk === false ||
    state.contract.evaluationPass === false
  ) {
    return "proxy";
  }
  if (
    options.allowAuthoritative !== false &&
    state.overall.tone === "good" &&
    state.contract.certificateHash &&
    state.geometry.matchesAuthority !== false
  ) {
    return "authoritative";
  }
  return state.overall.tone === "bad" ? "proxy" : "hybrid";
};

export function resolveNhm2BlockIds(
  requested?: ReadonlyArray<string | Nhm2BlockId> | null,
): Nhm2BlockId[] {
  if (!requested?.length) return [...NHM2_BLOCK_IDS];
  const wanted = new Set(requested);
  return NHM2_BLOCK_IDS.filter((blockId) => wanted.has(blockId));
}

export function buildNhm2Blocks(options: {
  state: Nhm2SolveState;
  blockIds?: ReadonlyArray<Nhm2BlockId> | null;
  calculatorSnapshot?: Nhm2CalculatorSnapshot | null;
  generatedAt?: number;
  apiBasePath?: string;
}): Nhm2ClaimBlock[] {
  const generatedAt =
    Number.isFinite(options.generatedAt as number) ? (options.generatedAt as number) : Date.now();
  const apiBasePath = options.apiBasePath ?? DEFAULT_API_BASE_PATH;
  const state = options.state;
  const requested = resolveNhm2BlockIds(options.blockIds);
  const calculator = options.calculatorSnapshot ?? null;
  const baseIntegrity = {
    version: BLOCK_VERSION,
    certificateHash: state.contract.certificateHash,
    integrityOk: state.contract.integrityOk,
    generatedAt,
  };

  const blocks: Record<Nhm2BlockId, Nhm2ClaimBlock> = {
    "nhm2.authority-status": {
      blockId: "nhm2.authority-status",
      claimIds: [
        "nhm2.solution-category",
        "nhm2.profile-version",
        "nhm2.claim-tier",
        "nhm2.authority-label",
      ],
      title: "Authority Status",
      summary: joinText([
        `${state.overall.label}.`,
        `${state.authority.solutionCategory} / ${state.authority.profileVersion}.`,
        state.pipeline.claimTier ? `claim tier ${state.pipeline.claimTier}.` : null,
        state.pipeline.provenanceClass ? `provenance ${state.pipeline.provenanceClass}.` : null,
      ]),
      authorityTier: deriveAuthorityTier(state),
      status: overallToStatus(state.overall.tone),
      provenance: [
        { label: "NHM2 cavity contract", kind: "source", ref: "shared/needle-hull-mark2-cavity-contract.ts" },
        { label: "Promoted warp profile", kind: "source", ref: "shared/warp-promoted-profile.ts" },
        { label: "Live pipeline", kind: "api", ref: "/api/helix/pipeline" },
      ],
      integrity: baseIntegrity,
      data: {
        overall: state.overall,
        authority: state.authority,
        pipeline: {
          claimTier: state.pipeline.claimTier,
          provenanceClass: state.pipeline.provenanceClass,
          currentMode: state.pipeline.currentMode,
          warpFieldType: state.pipeline.warpFieldType,
        },
      },
      render: {
        panelId: "nhm2-solve-state",
        panelTitle: "NHM2 Solve State",
        href: blockHref(apiBasePath, "nhm2.authority-status"),
        endpoint: "GET /api/helix/blocks/:blockId",
      },
    },
    "nhm2.geometry-timing": {
      blockId: "nhm2.geometry-timing",
      claimIds: [
        "nhm2.hull-authority",
        "nhm2.hull-live",
        "nhm2.geometry-parity",
        "nhm2.tau-lc",
      ],
      title: "Geometry and Timing",
      summary: joinText([
        state.geometry.matchesAuthority == null
          ? "Live hull is unavailable."
          : state.geometry.matchesAuthority
            ? "Live hull matches NHM2 authority."
            : `Live hull drifts on ${state.geometry.mismatchAxes.join("/")}.`,
        state.pipeline.geometryFallback.applied ? "Geometry fallback applied." : null,
        state.pipeline.geometryFallback.blocked ? "Geometry fallback blocked." : null,
      ]),
      authorityTier:
        state.geometry.matchesAuthority === false || state.pipeline.geometryFallback.blocked
          ? "proxy"
          : state.geometry.matchesAuthority === true && !state.pipeline.geometryFallback.applied
            ? "authoritative"
            : "hybrid",
      status:
        state.geometry.matchesAuthority === false || state.pipeline.geometryFallback.blocked
          ? "bad"
          : state.pipeline.geometryFallback.applied || state.geometry.matchesAuthority == null
            ? "warn"
            : "good",
      provenance: [
        { label: "NHM2 cavity contract", kind: "source", ref: "shared/needle-hull-mark2-cavity-contract.ts" },
        { label: "Live pipeline", kind: "api", ref: "/api/helix/pipeline" },
      ],
      integrity: baseIntegrity,
      data: {
        geometry: state.geometry,
        timing: state.timing,
        geometryFallback: state.pipeline.geometryFallback,
      },
      render: {
        panelId: "nhm2-solve-state",
        panelTitle: "NHM2 Solve State",
        href: blockHref(apiBasePath, "nhm2.geometry-timing"),
        endpoint: "GET /api/helix/blocks/:blockId",
      },
    },
    "nhm2.proof-guardrails": {
      blockId: "nhm2.proof-guardrails",
      claimIds: [
        "nhm2.proof-stage",
        "nhm2.strict-proxy",
        "nhm2.certificate-status",
        "nhm2.guardrails",
      ],
      title: "Proof and Guardrails",
      summary: joinText([
        state.proof.strictProxy ? "Strict proxy remains present." : "Strict proxy is clear.",
        state.contract.certificateStatus ? `certificate ${state.contract.certificateStatus}.` : "certificate unavailable.",
        state.contract.integrityOk === false ? "Integrity failed." : state.contract.integrityOk ? "Integrity OK." : null,
      ]),
      authorityTier: deriveAuthorityTier(state, {
        allowAuthoritative: state.proof.stageOk,
      }),
      status:
        state.proof.strictProxy || state.contract.integrityOk === false || state.contract.evaluationPass === false
          ? "bad"
          : state.proof.stageOk && !state.contract.proxy
            ? "good"
            : "warn",
      provenance: [
        { label: "Proof pack", kind: "api", ref: "/api/helix/pipeline/proofs" },
        { label: "GR constraint contract", kind: "api", ref: "/api/helix/gr-constraint-contract" },
        { label: "GR evaluation", kind: "api", ref: "/api/helix/gr-evaluation" },
      ],
      integrity: baseIntegrity,
      data: {
        proof: state.proof,
        contract: state.contract,
        vacuum: state.vacuum,
      },
      render: {
        panelId: "nhm2-calibration-proof",
        panelTitle: "NHM2 Calibration + Proof",
        href: blockHref(apiBasePath, "nhm2.proof-guardrails"),
        endpoint: "GET /api/helix/blocks/:blockId",
      },
    },
    "nhm2.calculator-snapshot": {
      blockId: "nhm2.calculator-snapshot",
      claimIds: [
        "nhm2.calculator-decision",
        "nhm2.calculator-congruent-solve",
        "nhm2.calculator-margin",
      ],
      title: "Calculator Snapshot",
      summary: joinText([
        calculator?.decisionClass
          ? `Latest calculator decision ${calculator.decisionClass}.`
          : "No local calculator snapshot has been captured from the panel yet.",
        (calculator?.congruentSolvePass ?? state.pipeline.congruentSolvePass) === true
          ? "Congruent solve currently passes."
          : (calculator?.congruentSolvePass ?? state.pipeline.congruentSolvePass) === false
            ? "Congruent solve currently fails."
            : null,
      ]),
      authorityTier: calculator ? "hybrid" : "diagnostic",
      status:
        (calculator?.congruentSolvePass ?? state.pipeline.congruentSolvePass) === true
          ? "good"
          : calculator
            ? "warn"
            : "warn",
      provenance: [
        { label: "Warp calculator", kind: "api", ref: "/api/physics/warp/calculator" },
        { label: "Live pipeline", kind: "api", ref: "/api/helix/pipeline" },
      ],
      integrity: baseIntegrity,
      data: {
        calculator: {
          decisionClass: calculator?.decisionClass ?? null,
          congruentSolvePass: calculator?.congruentSolvePass ?? state.pipeline.congruentSolvePass,
          marginRatioRaw: calculator?.marginRatioRaw ?? null,
          marginRatioRawComputed: calculator?.marginRatioRawComputed ?? null,
          outPath: calculator?.outPath ?? null,
          lastRunAt: calculator?.lastRunAt ?? null,
          observerCondition: calculator?.observerCondition ?? null,
          observerFrame: calculator?.observerFrame ?? null,
          injectCurvatureSignals: calculator?.injectCurvatureSignals ?? null,
        },
      },
      render: {
        panelId: "needle-mk2-calculator",
        panelTitle: "Needle MK2 Calculator",
        href: blockHref(apiBasePath, "nhm2.calculator-snapshot"),
        endpoint: "GET /api/helix/blocks/:blockId",
      },
    },
    "nhm2.render-status": {
      blockId: "nhm2.render-status",
      claimIds: [
        "nhm2.render-family",
        "nhm2.render-geometry-source",
        "nhm2.render-proof-contract",
      ],
      title: "Render Status",
      summary: joinText([
        `Viewer family ${state.pipeline.warpFieldType ?? state.authority.warpFieldType}.`,
        state.pipeline.geometryFallback.blocked
          ? "Render should be treated as blocked by geometry fallback."
          : state.pipeline.geometryFallback.applied
            ? "Render remains active but is using a geometry fallback."
            : "Render path can use current hull authority inputs.",
      ]),
      authorityTier:
        state.pipeline.geometryFallback.blocked || state.proof.strictProxy
          ? "proxy"
          : state.geometry.matchesAuthority === false
            ? "hybrid"
            : "authoritative",
      status:
        state.pipeline.geometryFallback.blocked || state.proof.strictProxy
          ? "bad"
          : state.pipeline.geometryFallback.applied || state.geometry.matchesAuthority === false
            ? "warn"
            : "good",
      provenance: [
        { label: "Live pipeline", kind: "api", ref: "/api/helix/pipeline" },
        { label: "GR evolve brick", kind: "api", ref: "/api/helix/gr-evolve-brick", detail: "viewer render backing path" },
        { label: "Alcubierre Viewer", kind: "panel", ref: "alcubierre-viewer" },
      ],
      integrity: baseIntegrity,
      data: {
        warpFieldType: state.pipeline.warpFieldType ?? state.authority.warpFieldType,
        geometryMatchesAuthority: state.geometry.matchesAuthority,
        geometryFallback: state.pipeline.geometryFallback,
        chartStatus: state.proof.chartStatus,
        chartReason: state.proof.chartReason,
      },
      render: {
        panelId: "alcubierre-viewer",
        panelTitle: "Alcubierre Viewer",
        href: blockHref(apiBasePath, "nhm2.render-status"),
        endpoint: "GET /api/helix/blocks/:blockId",
      },
    },
  };

  return requested.map((blockId) => blocks[blockId]);
}
