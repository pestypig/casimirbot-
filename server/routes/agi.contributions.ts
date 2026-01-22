import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  ContributionKindSchema,
  PrivacyShareLevelSchema,
  TruthFunctionSchema,
  TruthFunctionStageSchema,
  TruthInputKindSchema,
  TruthInputSchema,
  TruthInputSourceOriginSchema,
  TruthPredicateSchema,
} from "@shared/contributions/contributions.schema";
import {
  EvidenceIndependenceSchema,
  EvidenceRetentionSchema,
  EvidenceSignatureSchema,
  EvidenceSourceSchema,
  EvidenceStatusSchema,
} from "@shared/contributions/evidence-registry.schema";
import {
  compileTruthFunction,
  type TruthFunctionCompileError,
} from "@shared/contributions/truth-function-compiler";
import {
  ContributionDisputeActionSchema,
  ContributionDisputeStatusSchema,
  ContributionReviewRoleSchema,
} from "@shared/contributions/contribution-storage.schema";
import { loadIdeologyVerifierPack } from "@shared/ideology/ideology-verifiers";
import {
  defaultWhyBelongsSummary,
  type WhyBelongs,
  whyBelongsSchema,
} from "@shared/rationale";
import { trainingTraceCertificateSchema } from "@shared/schema";
import { debateClaimExtractHandler } from "../skills/debate.claim.extract";
import { collectIdeologyNodeIdsFromTree } from "../../scripts/collect-ideology-node-ids";
import {
  createContributionDraft,
  getContributionDraft,
  listContributionDrafts,
  makeContributionDraftId,
  updateContributionDraft,
  type ContributionClaim,
  type ContributionDraft,
  type TruthFunctionDraft,
} from "../services/contributions/drafts";
import { verifyContributionDraft } from "../services/contributions/verify";
import {
  createContributionReceipt,
  addContributionReceiptReview,
  discloseContributionReceipt,
  getContributionReceipt,
  listContributionReceipts,
} from "../services/contributions/receipts";
import {
  createContributionDispute,
  getContributionDispute,
  listContributionDisputes,
  resolveContributionDispute,
} from "../services/contributions/disputes";
import {
  mintContributionReceiptToLedger,
  revokeReceiptFromLedger,
} from "../services/contributions/vcu-ledger";
import {
  checkContributionRateLimit,
  type ContributionRateLimitAction,
} from "../services/contributions/rate-limit";
import {
  buildEvidenceRegistryIndex,
  getEvidenceRecord,
  isEvidenceAdmissible,
  listEvidenceRecords,
  registerEvidenceRecord,
} from "../services/contributions/evidence-registry";
import { scanFieldsForPii } from "../services/contributions/pii";

export const contributionsRouter = Router();

const resolveContributorId = (req: any): string | null =>
  (req?.auth?.sub as string | undefined) ??
  (req?.auth?.personaId as string | undefined) ??
  null;

const resolveTenantId = (req: any): string | undefined =>
  (req?.tenantId as string | undefined) ??
  (req?.auth?.tenantId as string | undefined) ??
  (req?.auth?.tenant_id as string | undefined) ??
  (req?.auth?.customerId as string | undefined) ??
  (req?.auth?.customer_id as string | undefined) ??
  (req?.auth?.orgId as string | undefined) ??
  (req?.auth?.org_id as string | undefined);

const ClaimSchema = z
  .object({
    id: z.string().min(1).optional(),
    text: z.string().min(1),
    kind: z.enum(["prediction", "mechanism", "threshold"]).optional(),
  })
  .strict();

const ContributionIngestRequest = z
  .object({
    text: z.string().min(1),
    nodeIds: z.array(z.string().min(1)).min(1),
    contributorId: z.string().min(1).optional(),
    kind: ContributionKindSchema.optional(),
    stage: TruthFunctionStageSchema.optional(),
    inputs: z.array(TruthInputSchema).optional(),
    predicate: TruthPredicateSchema.optional(),
    tests: z.array(z.string().min(1)).optional(),
    whyBelongs: whyBelongsSchema.optional(),
    allowUnknownRefs: z.boolean().optional(),
    claims: z.array(ClaimSchema).optional(),
  })
  .strict();

const ContributionVerifyRequest = z
  .object({
    certificate: trainingTraceCertificateSchema.optional(),
    allowUnknownRefs: z.boolean().optional(),
    traceId: z.string().min(1).optional(),
  })
  .strict();

const ReceiptStatusSchema = z.enum([
  "cooldown",
  "minted",
  "revoked",
  "rejected",
]);

const ContributionReceiptRequest = z
  .object({
    kind: ContributionKindSchema.optional(),
    shareLevel: PrivacyShareLevelSchema.optional(),
    cooldownSeconds: z.coerce
      .number()
      .int()
      .min(0)
      .max(60 * 60 * 24 * 365)
      .optional(),
    cooldownHours: z.coerce
      .number()
      .int()
      .min(0)
      .max(24 * 365)
      .optional(),
    cooldownDays: z.coerce.number().int().min(0).max(365).optional(),
    vcu: z.number().nonnegative().optional(),
    capped: z.boolean().optional(),
  })
  .strict();

const ReceiptListQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
    includeAll: z.coerce.boolean().optional(),
    status: ReceiptStatusSchema.optional(),
  })
  .partial();

const ReceiptRevokeRequest = z
  .object({
    reason: z.string().min(1).optional(),
  })
  .strict();

const ReceiptReviewRequest = z
  .object({
    decision: z.enum(["approve", "reject"]),
    notes: z.string().max(2000).optional(),
    role: ContributionReviewRoleSchema.optional(),
  })
  .strict();

const DraftListQuery = z
  .object({
    limit: z.coerce.number().int().min(1).max(200).optional(),
    includeAll: z.coerce.boolean().optional(),
  })
  .partial();

const DisputeCreateRequest = z
  .object({
    reason: z.string().min(1),
    action: ContributionDisputeActionSchema.default("review"),
    evidenceRefs: z.array(z.string().min(1)).optional(),
  })
  .strict();

const DisputeResolveRequest = z
  .object({
    decision: z.enum(["accept", "reject"]),
    action: ContributionDisputeActionSchema.optional(),
    notes: z.string().max(2000).optional(),
  })
  .strict();

const DisputeListQuery = z
  .object({
    status: ContributionDisputeStatusSchema.optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .partial();

const EvidenceRegisterRequest = z
  .object({
    id: z.string().min(1).optional(),
    kind: TruthInputKindSchema,
    label: z.string().min(1),
    description: z.string().min(1).optional(),
    source: EvidenceSourceSchema,
    retention: EvidenceRetentionSchema,
    status: EvidenceStatusSchema.optional(),
    tags: z.array(z.string().min(1)).optional(),
    signature: EvidenceSignatureSchema.optional(),
  })
  .strict();

const EvidenceListQuery = z
  .object({
    kind: TruthInputKindSchema.optional(),
    origin: TruthInputSourceOriginSchema.optional(),
    independence: EvidenceIndependenceSchema.optional(),
    status: EvidenceStatusSchema.optional(),
    tag: z.string().min(1).optional(),
    includeInactive: z.coerce.boolean().optional(),
    admissibleOnly: z.coerce.boolean().optional(),
    limit: z.coerce.number().int().min(1).max(200).optional(),
  })
  .partial();

const resolveExistingPath = (primary: string, fallback?: string) => {
  if (fs.existsSync(primary)) return primary;
  if (fallback && fs.existsSync(fallback)) return fallback;
  return primary;
};

let cachedNodeIds: { path: string; mtimeMs: number; nodeIds: Set<string> } | null =
  null;
const loadIdeologyNodeIds = (): Set<string> => {
  const ideologyPath = resolveExistingPath(
    path.resolve(process.cwd(), "docs", "ethos", "ideology.json"),
    path.resolve(process.cwd(), "ideology.json"),
  );
  const stats = fs.statSync(ideologyPath);
  if (cachedNodeIds && cachedNodeIds.path === ideologyPath && cachedNodeIds.mtimeMs === stats.mtimeMs) {
    return cachedNodeIds.nodeIds;
  }
  const tree = JSON.parse(fs.readFileSync(ideologyPath, "utf8"));
  const nodeIds = collectIdeologyNodeIdsFromTree(tree);
  cachedNodeIds = { path: ideologyPath, mtimeMs: stats.mtimeMs, nodeIds };
  return nodeIds;
};

let cachedPack: { path: string; mtimeMs: number; pack: ReturnType<typeof loadIdeologyVerifierPack> } | null =
  null;
const loadVerifierPackCached = () => {
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

const truncate = (value: string, limit: number) =>
  value.length <= limit ? value : `${value.slice(0, Math.max(0, limit - 3))}...`;

const enforceNoPii = (
  fields: Array<{ field: string; value?: string | null }>,
  res: any,
): boolean => {
  const result = scanFieldsForPii(fields);
  if (result.ok) return true;
  res.status(400).json({ error: "pii_detected", findings: result.findings });
  return false;
};

const collectWhyBelongsFields = (why: WhyBelongs) => {
  const fields: Array<{ field: string; value?: string | null }> = [
    { field: "why.claim", value: why.claim },
  ];
  why.items.forEach((item, index) => {
    fields.push({ field: `why.items[${index}].message`, value: item.message });
    if (item.source?.ref) {
      fields.push({
        field: `why.items[${index}].source.ref`,
        value: item.source.ref,
      });
    }
    if (item.source?.excerpt) {
      fields.push({
        field: `why.items[${index}].source.excerpt`,
        value: item.source.excerpt,
      });
    }
    item.spans?.forEach((span, spanIndex) => {
      fields.push({
        field: `why.items[${index}].spans[${spanIndex}].target`,
        value: span.target,
      });
    });
  });
  return fields;
};

const collectClaimFields = (claims: ContributionClaim[]) =>
  claims.map((claim) => ({
    field: `claims.${claim.id}`,
    value: claim.text,
  }));

const resolveCooldownMs = (
  input: z.infer<typeof ContributionReceiptRequest>,
): number | undefined => {
  if (input.cooldownSeconds !== undefined) {
    return input.cooldownSeconds * 1000;
  }
  if (input.cooldownHours !== undefined) {
    return input.cooldownHours * 60 * 60 * 1000;
  }
  if (input.cooldownDays !== undefined) {
    return input.cooldownDays * 24 * 60 * 60 * 1000;
  }
  return undefined;
};

const enforceRateLimit = (
  action: ContributionRateLimitAction,
  actorId: string,
  res: any,
): boolean => {
  const result = checkContributionRateLimit(action, actorId);
  if (result.ok) return true;
  res.status(429).json({
    error: "rate_limited",
    action,
    limit: result.limit,
    remaining: result.remaining,
    resetMs: result.resetMs,
    windowMs: result.windowMs,
  });
  return false;
};

const redactLedgerResult = (
  ledger:
    | ReturnType<typeof mintContributionReceiptToLedger>
    | ReturnType<typeof revokeReceiptFromLedger>
    | undefined,
  receiptDisclosure: ReturnType<typeof discloseContributionReceipt> | null,
  isOwner: boolean,
) => {
  if (!ledger) return undefined;
  const { balance, receipt: _receipt, ...rest } = ledger;
  return {
    ...rest,
    receipt: receiptDisclosure ?? undefined,
    ...(isOwner ? { balance } : {}),
  };
};

const buildWhyBelongsDraft = (summary: string): WhyBelongs => ({
  claim: truncate(summary.trim(), 220),
  items: [
    {
      tag: "speculation",
      message:
        "Auto-generated from contribution ingest; verification has not run yet.",
      confidence: 0.2,
    },
  ],
  summary: { ...defaultWhyBelongsSummary, speculation: 1 },
});

const normalizeClaims = (claims: Array<z.infer<typeof ClaimSchema>>): ContributionClaim[] => {
  const results: ContributionClaim[] = [];
  const seen = new Set<string>();
  let counter = 1;
  for (const claim of claims) {
    const text = claim.text.trim();
    if (!text) continue;
    let id = claim.id?.trim() || `c${counter}`;
    while (seen.has(id)) {
      counter += 1;
      id = `c${counter}`;
    }
    seen.add(id);
    counter += 1;
    results.push({
      id,
      text,
      kind: claim.kind ?? "prediction",
    });
  }
  return results;
};

const toTruthFunctionDrafts = ({
  claims,
  nodeIds,
  draftId,
  stage,
  inputs,
  predicate,
  tests,
  why,
  allowUnknownRefs,
}: {
  claims: ContributionClaim[];
  nodeIds: string[];
  draftId: string;
  stage: z.infer<typeof TruthFunctionStageSchema>;
  inputs: z.infer<typeof TruthInputSchema>[];
  predicate: z.infer<typeof TruthPredicateSchema>;
  tests: string[];
  why: WhyBelongs;
  allowUnknownRefs: boolean;
}): TruthFunctionDraft[] => {
  const pack = loadVerifierPackCached();
  const evidenceIndex = buildEvidenceRegistryIndex();
  return claims.map((claim) => {
    const base = {
      id: `tf_${draftId}_${claim.id}`,
      claim: claim.text,
      nodeIds,
      stage,
      inputs,
      predicate,
      tests,
      risk: "low",
      status: "draft",
      why: {
        ...why,
        claim: truncate(`Draft truth function for: ${claim.text}`, 220),
      },
    } as const;
    const compilation = compileTruthFunction(base, pack, {
      allowUnknownRefs,
      knownInputRefs: evidenceIndex.admissibleRefsByKind,
      evidenceByRef: evidenceIndex.admissibleByRef,
    });
    const resolved = {
      ...base,
      risk: compilation.ok ? compilation.plan.risk : base.risk,
    };
    const truthFunction = TruthFunctionSchema.parse(resolved);
    return {
      truthFunction,
      compilation: compilation.ok
        ? { ok: true, plan: compilation.plan }
        : {
            ok: false,
            errors: (compilation.errors ?? []) as TruthFunctionCompileError[],
          },
    };
  });
};

contributionsRouter.post("/ingest", async (req, res) => {
  const parsed = ContributionIngestRequest.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }

  const resolvedContributorId = resolveContributorId(req);
  const contributorId =
    resolvedContributorId ?? parsed.data.contributorId ?? "anon";
  if (!enforceRateLimit("ingest", contributorId, res)) {
    return;
  }
  if (
    !enforceNoPii([{ field: "text", value: parsed.data.text }], res)
  ) {
    return;
  }
  const nodeIds = Array.from(new Set(parsed.data.nodeIds.map((id) => id.trim())));
  const knownNodeIds = loadIdeologyNodeIds();
  const unknownNodeIds = nodeIds.filter((nodeId) => !knownNodeIds.has(nodeId));
  if (unknownNodeIds.length > 0) {
    return res.status(400).json({
      error: "unknown_node_ids",
      nodeIds: unknownNodeIds,
    });
  }

  let claims: ContributionClaim[] = [];
  if (parsed.data.claims && parsed.data.claims.length > 0) {
    claims = normalizeClaims(parsed.data.claims);
  } else {
    try {
      const extracted = (await debateClaimExtractHandler(
        { text: parsed.data.text },
        {},
      )) as { claims?: unknown };
      const extractedClaims = Array.isArray(extracted?.claims)
        ? extracted.claims
        : [];
      claims = normalizeClaims(extractedClaims);
    } catch {
      claims = [];
    }
  }
  if (claims.length === 0) {
    claims = normalizeClaims([
      { text: parsed.data.text, kind: "prediction", id: "c1" },
    ]);
  }

  const summary = `Draft contribution from ${contributorId}: ${parsed.data.text}`;
  const why = parsed.data.whyBelongs ?? buildWhyBelongsDraft(summary);
  const normalizedWhy = whyBelongsSchema.parse(why);
  const claimFields = collectClaimFields(claims);
  const whyFields = collectWhyBelongsFields(normalizedWhy);
  if (!enforceNoPii([...claimFields, ...whyFields], res)) {
    return;
  }
  const stage = parsed.data.stage ?? "exploratory";
  const inputs =
    parsed.data.inputs ?? [{ kind: "metric", refs: ["pending"] }];
  const predicate =
    parsed.data.predicate ?? { kind: "rule", ref: "pending" };
  const tests = parsed.data.tests ?? [];
  const allowUnknownRefs = parsed.data.allowUnknownRefs ?? true;
  const draftId = makeContributionDraftId();

  const truthFunctions = toTruthFunctionDrafts({
    claims,
    nodeIds,
    draftId,
    stage,
    inputs,
    predicate,
    tests,
    why: normalizedWhy,
    allowUnknownRefs,
  });

  const nowIso = new Date().toISOString();
  const draft: ContributionDraft = {
    id: draftId,
    contributorId,
    createdAt: nowIso,
    updatedAt: nowIso,
    status: "draft",
    kind: parsed.data.kind,
    text: parsed.data.text,
    nodeIds,
    claims,
    why: normalizedWhy,
    truthFunctions,
  };
  const saved = createContributionDraft(draft, {
    tenantId: resolveTenantId(req),
  });
  return res.status(201).json({ ok: true, draft: saved });
});

contributionsRouter.get("/drafts", (req, res) => {
  const parsed = DraftListQuery.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : undefined;
  const includeAll = parsed.success ? parsed.data.includeAll : false;
  const contributorId = includeAll ? null : resolveContributorId(req);
  const drafts = listContributionDrafts({
    contributorId,
    tenantId: resolveTenantId(req) ?? null,
    limit,
  });
  res.json({ drafts, generatedAt: Date.now() });
});

contributionsRouter.get("/drafts/:id", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const draft = getContributionDraft(id);
  if (!draft) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ draft });
});

contributionsRouter.get("/evidence", (req, res) => {
  const parsed = EvidenceListQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  const records = listEvidenceRecords({
    kind: parsed.data.kind,
    origin: parsed.data.origin,
    independence: parsed.data.independence,
    status: parsed.data.status,
    tag: parsed.data.tag,
    includeInactive: parsed.data.includeInactive,
    admissibleOnly: parsed.data.admissibleOnly,
    limit: parsed.data.limit,
  });
  res.json({
    records,
    total: records.length,
    generatedAt: Date.now(),
  });
});

contributionsRouter.get("/evidence/:id", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const record = getEvidenceRecord(id);
  if (!record) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ record, admissible: isEvidenceAdmissible(record) });
});

contributionsRouter.post("/evidence", (req, res) => {
  const parsed = EvidenceRegisterRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  const evidenceFields = [
    { field: "evidence.label", value: parsed.data.label },
    { field: "evidence.description", value: parsed.data.description },
    { field: "evidence.source.collectorId", value: parsed.data.source.collectorId },
    ...parsed.data.source.lineage.map((entry, index) => ({
      field: `evidence.source.lineage[${index}]`,
      value: entry,
    })),
    ...(parsed.data.tags ?? []).map((entry, index) => ({
      field: `evidence.tags[${index}]`,
      value: entry,
    })),
  ];
  if (!enforceNoPii(evidenceFields, res)) {
    return;
  }
  try {
    const record = registerEvidenceRecord(parsed.data, {
      tenantId: resolveTenantId(req),
    });
    return res.status(201).json({
      ok: true,
      record,
      admissible: isEvidenceAdmissible(record),
    });
  } catch (error) {
    return res.status(400).json({
      error: "evidence_register_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

contributionsRouter.post("/drafts/:id/verify", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const draft = getContributionDraft(id);
  if (!draft) {
    return res.status(404).json({ error: "not_found" });
  }
  const parsed = ContributionVerifyRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  const verifyActorId =
    resolveContributorId(req) ?? draft.contributorId ?? "anon";
  if (!enforceRateLimit("verify", verifyActorId, res)) {
    return;
  }
  const verification = await verifyContributionDraft(draft, {
    certificate: parsed.data.certificate ?? undefined,
    allowUnknownRefs: parsed.data.allowUnknownRefs,
    traceId: parsed.data.traceId,
    tenantId: resolveTenantId(req),
  });
  const updated = updateContributionDraft(id, (existing) => ({
    ...existing,
    updatedAt: new Date().toISOString(),
    verification,
  }));
  if (!updated) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ ok: true, draft: updated, verification });
});

contributionsRouter.post("/drafts/:id/receipt", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const draft = getContributionDraft(id);
  if (!draft) {
    return res.status(404).json({ error: "not_found" });
  }
  if (!draft.verification) {
    return res.status(400).json({ error: "verification_required" });
  }
  const parsed = ContributionReceiptRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  const receiptActorId =
    resolveContributorId(req) ?? draft.contributorId ?? "anon";
  if (!enforceRateLimit("receipt", receiptActorId, res)) {
    return;
  }
  const receipt = createContributionReceipt({
    draft,
    verification: draft.verification,
    tenantId: resolveTenantId(req),
    cooldownMs: resolveCooldownMs(parsed.data),
    plannedVcu: parsed.data.vcu,
    capped: parsed.data.capped,
    kind: parsed.data.kind,
    shareLevel: parsed.data.shareLevel,
  });
  const ledgerResult =
    receipt.status === "minted"
      ? mintContributionReceiptToLedger(receipt.id)
      : undefined;
  const resolvedReceipt = ledgerResult?.receipt ?? receipt;
  const receiptDisclosure = discloseContributionReceipt(
    resolvedReceipt,
    draft.contributorId,
  );
  res.status(201).json({
    ok: true,
    receipt: receiptDisclosure ?? resolvedReceipt,
    ledger: redactLedgerResult(ledgerResult, receiptDisclosure, true),
  });
});

contributionsRouter.get("/receipts", (req, res) => {
  const parsed = ReceiptListQuery.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : undefined;
  const includeAll = parsed.success ? parsed.data.includeAll : false;
  const status = parsed.success ? parsed.data.status : undefined;
  const contributorId = includeAll ? null : resolveContributorId(req);
  const tenantId = resolveTenantId(req) ?? null;
  const receipts = listContributionReceipts({
    contributorId,
    tenantId,
    status,
    limit,
  });
  const viewerId = resolveContributorId(req);
  const disclosed = receipts
    .map((record) => discloseContributionReceipt(record, viewerId))
    .filter(
      (record): record is NonNullable<typeof record> => record !== null,
    );
  res.json({ receipts: disclosed, generatedAt: Date.now() });
});

contributionsRouter.get("/receipts/:id", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const receipt = getContributionReceipt(id);
  if (!receipt) {
    return res.status(404).json({ error: "not_found" });
  }
  const tenantId = resolveTenantId(req);
  if (receipt.tenantId && tenantId && receipt.tenantId !== tenantId) {
    return res.status(403).json({ error: "tenant-mismatch" });
  }
  const viewerId = resolveContributorId(req);
  const disclosure = discloseContributionReceipt(receipt, viewerId);
  if (!disclosure) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({ receipt: disclosure });
});

contributionsRouter.post("/receipts/:id/review", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const parsed = ReceiptReviewRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  if (
    !enforceNoPii(
      [{ field: "review.notes", value: parsed.data.notes }],
      res,
    )
  ) {
    return;
  }
  const receipt = getContributionReceipt(id);
  if (!receipt) {
    return res.status(404).json({ error: "not_found" });
  }
  const tenantId = resolveTenantId(req);
  if (receipt.tenantId && tenantId && receipt.tenantId !== tenantId) {
    return res.status(403).json({ error: "tenant-mismatch" });
  }
  const reviewerId = resolveContributorId(req);
  if (!reviewerId) {
    return res.status(401).json({ error: "reviewer_required" });
  }
  if (!enforceRateLimit("review", reviewerId, res)) {
    return;
  }
  if (!discloseContributionReceipt(receipt, reviewerId)) {
    return res.status(404).json({ error: "not_found" });
  }
  if (receipt.status === "revoked" || receipt.status === "rejected") {
    return res.status(409).json({ error: "receipt_not_reviewable" });
  }
  const result = addContributionReceiptReview(id, {
    reviewerId,
    decision: parsed.data.decision,
    notes: parsed.data.notes,
    role: parsed.data.role,
  });
  if (!result.ok) {
    if (result.error === "not_found") {
      return res.status(404).json({ error: "not_found" });
    }
    if (result.error === "self_review_not_allowed") {
      return res.status(403).json({ error: "self_review_not_allowed" });
    }
    if (result.error === "verification_fail") {
      return res.status(409).json({ error: "verification_fail" });
    }
    return res.status(400).json({ error: result.error });
  }
  const updatedDisclosure = discloseContributionReceipt(
    result.record,
    reviewerId,
  );
  if (!updatedDisclosure) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({
    ok: true,
    receipt: updatedDisclosure,
    reviewSummary: result.summary,
  });
});

contributionsRouter.get("/receipts/:id/disputes", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const receipt = getContributionReceipt(id);
  if (!receipt) {
    return res.status(404).json({ error: "not_found" });
  }
  const tenantId = resolveTenantId(req);
  if (receipt.tenantId && tenantId && receipt.tenantId !== tenantId) {
    return res.status(403).json({ error: "tenant-mismatch" });
  }
  const viewerId = resolveContributorId(req);
  if (!viewerId || viewerId !== receipt.contributorId) {
    return res.status(403).json({ error: "dispute_access_denied" });
  }
  const parsed = DisputeListQuery.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  const disputes = listContributionDisputes({
    receiptId: id,
    status: parsed.data.status,
    limit: parsed.data.limit,
    tenantId,
  });
  res.json({ disputes, total: disputes.length, generatedAt: Date.now() });
});

contributionsRouter.post("/receipts/:id/disputes", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const parsed = DisputeCreateRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  if (
    !enforceNoPii(
      [{ field: "dispute.reason", value: parsed.data.reason }],
      res,
    )
  ) {
    return;
  }
  const receipt = getContributionReceipt(id);
  if (!receipt) {
    return res.status(404).json({ error: "not_found" });
  }
  const tenantId = resolveTenantId(req);
  if (receipt.tenantId && tenantId && receipt.tenantId !== tenantId) {
    return res.status(403).json({ error: "tenant-mismatch" });
  }
  const contributorId = resolveContributorId(req);
  if (!contributorId || contributorId !== receipt.contributorId) {
    return res.status(403).json({ error: "dispute_not_allowed" });
  }
  if (!enforceRateLimit("dispute", contributorId, res)) {
    return;
  }
  const result = createContributionDispute({
    receiptId: id,
    contributorId,
    reason: parsed.data.reason,
    action: parsed.data.action,
    evidenceRefs: parsed.data.evidenceRefs,
    tenantId,
  });
  if (!result.ok) {
    return res.status(409).json({ error: result.error });
  }
  res.status(201).json({ ok: true, dispute: result.dispute });
});

contributionsRouter.post("/disputes/:id/resolve", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const parsed = DisputeResolveRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  if (
    !enforceNoPii(
      [{ field: "dispute.notes", value: parsed.data.notes }],
      res,
    )
  ) {
    return;
  }
  const resolverId = resolveContributorId(req);
  if (!resolverId) {
    return res.status(401).json({ error: "resolver_required" });
  }
  if (!enforceRateLimit("disputeResolve", resolverId, res)) {
    return;
  }
  const tenantId = resolveTenantId(req);
  const existing = getContributionDispute(id);
  if (!existing) {
    return res.status(404).json({ error: "not_found" });
  }
  if (existing.contributorId === resolverId) {
    return res.status(403).json({ error: "self_resolution_not_allowed" });
  }
  const result = resolveContributionDispute(id, {
    decision: parsed.data.decision,
    resolvedBy: resolverId,
    action: parsed.data.action ?? existing.action,
    notes: parsed.data.notes,
    tenantId,
  });
  if (!result.ok) {
    if (result.error === "not_found") {
      return res.status(404).json({ error: "not_found" });
    }
    if (result.error === "tenant_mismatch") {
      return res.status(403).json({ error: "tenant-mismatch" });
    }
    if (result.error === "dispute_closed") {
      return res.status(409).json({ error: "dispute_closed" });
    }
    return res.status(400).json({ error: result.error });
  }
  let receiptDisclosure;
  if (result.dispute.status === "accepted" && result.dispute.action === "revoke") {
    const revokeResult = revokeReceiptFromLedger(existing.receiptId, {
      reason: `dispute:${result.dispute.id}`,
      actorId: resolverId,
    });
    receiptDisclosure = revokeResult.receipt
      ? discloseContributionReceipt(revokeResult.receipt, resolverId)
      : undefined;
  }
  res.json({
    ok: true,
    dispute: result.dispute,
    receipt: receiptDisclosure,
  });
});

contributionsRouter.post("/receipts/:id/revoke", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const parsed = ReceiptRevokeRequest.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "bad_request",
      details: parsed.error.issues,
    });
  }
  const receipt = getContributionReceipt(id);
  if (!receipt) {
    return res.status(404).json({ error: "not_found" });
  }
  const tenantId = resolveTenantId(req);
  if (receipt.tenantId && tenantId && receipt.tenantId !== tenantId) {
    return res.status(403).json({ error: "tenant-mismatch" });
  }
  const actorId = resolveContributorId(req) ?? undefined;
  const result = revokeReceiptFromLedger(id, {
    reason: parsed.data.reason,
    actorId,
  });
  if (!result.ok || !result.receipt) {
    return res.status(404).json({ error: "not_found" });
  }
  const viewerId = resolveContributorId(req);
  const disclosure = discloseContributionReceipt(result.receipt, viewerId);
  if (!disclosure) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({
    ok: true,
    receipt: disclosure,
    ledger: redactLedgerResult(result, disclosure, viewerId === receipt.contributorId),
  });
});

contributionsRouter.post("/receipts/:id/mint", (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).json({ error: "bad_request" });
  }
  const receipt = getContributionReceipt(id);
  if (!receipt) {
    return res.status(404).json({ error: "not_found" });
  }
  const tenantId = resolveTenantId(req);
  if (receipt.tenantId && tenantId && receipt.tenantId !== tenantId) {
    return res.status(403).json({ error: "tenant-mismatch" });
  }
  const mintActorId =
    resolveContributorId(req) ?? receipt.contributorId ?? "anon";
  if (!enforceRateLimit("mint", mintActorId, res)) {
    return;
  }
  const result = mintContributionReceiptToLedger(id);
  const resolvedReceipt = result.receipt ?? receipt;
  const viewerId = resolveContributorId(req);
  const disclosure = discloseContributionReceipt(resolvedReceipt, viewerId);
  if (!disclosure) {
    return res.status(404).json({ error: "not_found" });
  }
  res.json({
    ok: result.ok,
    receipt: disclosure,
    ledger: redactLedgerResult(
      result,
      disclosure,
      viewerId === receipt.contributorId,
    ),
  });
});
