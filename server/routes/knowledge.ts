import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { readKnowledgeConfig } from "../config/knowledge";
import { persistKnowledgeBundles } from "../services/knowledge/corpus";
import { buildKnowledgeValidator, KnowledgeValidationError } from "../services/knowledge/validation";
import { evaluateKnowledgePromotionGate } from "../services/knowledge/promotion-gate";

const DEFAULT_FILES = [
  "docs/V0.1-SIGNOFF.md",
  "docs/ESSENCE-CONSOLE_GAP-REPORT.md",
  "docs/ESSENCE-CONSOLE_PATCH-PLAN.md",
  "docs/TRACE-API.md",
  "docs/AGI-ROADMAP.md",
  "docs/SMOKE.md",
  "docs/ethos/ideology.json",
];

function resolveFiles(): string[] {
  const envSpec = process.env.BASELINE_KNOWLEDGE_FILES;
  if (envSpec && envSpec.trim()) {
    return envSpec
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }
  return DEFAULT_FILES;
}

function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, Math.max(0, max - 3))}...`;
}

const knowledgeConfig = readKnowledgeConfig();
const validateKnowledgeContext = buildKnowledgeValidator(knowledgeConfig);
const hasDatabaseUrl = (): boolean => {
  // Treat in-memory pg-mem URLs as configured for tests and local dev.
  const databaseUrl = (process.env.DATABASE_URL ?? "").trim();
  return Boolean(databaseUrl.length);
};

export const knowledgeRouter = Router();

knowledgeRouter.get("/baseline", (req, res) => {
  const cfg = knowledgeConfig;
  const maxBytes = Math.max(0, Math.min(Number(req.query.max ?? cfg.contextBytes) || cfg.contextBytes, cfg.contextBytes));
  const projectId = "project:baseline";
  const files: Array<{ id: string; name: string; path: string; mime: string; size: number; hashSlug: string; kind: "text" } & { preview?: string }> = [];
  let used = 0;
  const base = process.cwd();
  const sources = resolveFiles();

  for (const rel of sources) {
    const abs = path.resolve(base, rel);
    if (!fs.existsSync(abs)) continue;
    try {
      const stat = fs.statSync(abs);
      if (!stat.isFile()) continue;
      const text = fs.readFileSync(abs, "utf8");
      const name = path.basename(rel);
      const previewMax = Math.max(64, Math.min(4096, maxBytes - used));
      if (previewMax <= 0) break;
      const preview = clip(text.replace(/\s+/g, " ").trim(), previewMax);
      used += Buffer.byteLength(preview, "utf8");
      files.push({
        id: `${projectId}:${name}`,
        name,
        path: rel,
        mime: "text/markdown",
        size: stat.size,
        hashSlug: `${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-${Math.random().toString(36).slice(-4)}`,
        kind: "text",
        preview,
      });
      if (used >= maxBytes) break;
    } catch {
      // skip unreadable
    }
  }

  res.json({
    project: { id: projectId, name: "Core Knowledge", tags: ["baseline"], type: "system", hashSlug: "core-knowledge" },
    summary: `Auto-attached baseline knowledge (${files.length} files).`,
    files,
    approxBytes: used,
    omittedFiles: [],
  });
});

knowledgeRouter.post("/projects/sync", async (req, res) => {
  if (!knowledgeConfig.enabled) {
    return res.status(403).json({ error: "knowledge_projects_disabled" });
  }
  const payload = Array.isArray(req.body?.projects)
    ? req.body.projects
    : Array.isArray(req.body)
      ? req.body
      : [];
  let validated: ReturnType<typeof validateKnowledgeContext>;
  try {
    validated = validateKnowledgeContext(payload);
  } catch (error) {
    if (error instanceof KnowledgeValidationError) {
      return res.status(error.status).json({
        error: "knowledge_context_invalid",
        message: error.message,
        fail_reason: error.failReason,
        claim_tier: error.audit?.claim_tier,
        provenance: error.audit?.provenance,
        audit: error.audit,
      });
    }
    throw error;
  }
  if (!validated || validated.length === 0) {
    return res.json({ synced: 0, projectIds: [] });
  }
  if (!hasDatabaseUrl()) {
    console.warn("[knowledge] skipping corpus sync because DATABASE_URL is not configured");
    return res.json({ synced: 0, projectIds: [], skipped: "database_unconfigured" });
  }
  try {
    const result = await persistKnowledgeBundles(validated);
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "knowledge_sync_failed", message });
  }
});

knowledgeRouter.post("/projects/promote", (req, res) => {
  const claimTier = typeof req.body?.claimTier === "string" ? req.body.claimTier : "diagnostic";
  const casimirVerdict = req.body?.casimirVerdict === "PASS" || req.body?.casimirVerdict === "FAIL"
    ? req.body.casimirVerdict
    : undefined;
  const certificateHash = typeof req.body?.certificateHash === "string" ? req.body.certificateHash : null;
  const certificateIntegrityOk = req.body?.certificateIntegrityOk === true;
  const enforceCertifiedOnly = req.body?.enforceCertifiedOnly !== false;

  const decision = evaluateKnowledgePromotionGate({
    enforceCertifiedOnly,
    claimTier,
    casimirVerdict,
    certificateHash,
    certificateIntegrityOk,
  });

  if (!decision.ok) {
    if (enforceCertifiedOnly) {
      return res.status(409).json({
        ok: false,
        rejection: {
          code: decision.code,
          message: decision.message,
        },
      });
    }
    return res.status(202).json({
      ok: false,
      rejection: {
        code: decision.code,
        message: decision.message,
      },
      mode: "report-only",
    });
  }

  return res.json({
    ok: true,
    mode: decision.enforcement,
    promotion: {
      status: "promoted",
      claimTier: "certified",
    },
  });
});
