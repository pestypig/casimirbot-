import fs from "node:fs/promises";
import crypto from "node:crypto";
import { EssenceEnvelope, COLLAPSE_SPACE, type TEssenceEnvelope } from "@shared/essence-schema";
import type { TInformationBoundaryMode } from "@shared/information-boundary";
import { putBlob } from "../../server/storage";
import { putEnvelope } from "../../server/services/essence/store";
import { appendToolLog } from "../../server/services/observability/tool-log-store";
import { buildInformationBoundary, sha256Hex, sha256Prefixed } from "../../server/utils/information-boundary";
import { stableJsonStringify } from "../../server/utils/stable-json";

type EssenceEmbedding = TEssenceEnvelope["embeddings"][number];

export type AgenticEmbedding = {
  space?: string;
  vector?: number[];
  dim?: number;
  dtype?: EssenceEmbedding["dtype"];
  quantization?: string;
  storage?: EssenceEmbedding["storage"];
  composer?: string;
};

export type LangGraphNodeArtifact = {
  node: string;
  kind?: string;
  content: string | Buffer | unknown;
  modality?: TEssenceEnvelope["header"]["modality"];
  contentType?: string;
  embedding?: AgenticEmbedding;
  seed?: string | number;
  params?: Record<string, unknown>;
  inputs?: unknown;
  features?: unknown;
  labelsUsedAsFeatures?: boolean;
  boundaryMode?: TInformationBoundaryMode;
  eventFeaturesIncluded?: boolean;
  started_at?: string;
  ended_at?: string;
  creator_id?: string;
  license?: string;
  data_cutoff_iso?: string;
};

export type AgenticRunTrace = {
  architecture: string;
  runId?: string;
  personaId?: string;
  sessionId?: string;
  traceId?: string;
  dataCutoffIso?: string;
  defaultLicense?: string;
  events: LangGraphNodeArtifact[];
};

export type CollapsedArtifact = {
  node: string;
  kind: string;
  essenceId: string;
  blobUri: string;
  cid?: string;
  modality: TEssenceEnvelope["header"]["modality"];
  outputHash: string;
};

export type CollapseResult = {
  runId: string;
  architecture: string;
  artifacts: CollapsedArtifact[];
  failed: number;
};

export async function loadAgenticTraceFile(filePath: string): Promise<LangGraphNodeArtifact[]> {
  const raw = await fs.readFile(filePath, "utf8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed as LangGraphNodeArtifact[];
    }
    if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).events)) {
      return (parsed as any).events as LangGraphNodeArtifact[];
    }
  } catch {
    // fall through to JSONL parsing
  }

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) {
    return [];
  }

  const events: LangGraphNodeArtifact[] = [];
  for (const line of lines) {
    try {
      const parsed = JSON.parse(line);
      if (parsed && typeof parsed === "object") {
        events.push(parsed as LangGraphNodeArtifact);
      }
    } catch {
      // ignore malformed lines
    }
  }
  return events;
}

export async function collapseLangGraphTrace(run: AgenticRunTrace): Promise<CollapseResult> {
  const runId = run.runId ?? crypto.randomUUID();
  const architecture = run.architecture || "unknown";
  const artifacts: CollapsedArtifact[] = [];
  let failed = 0;

  for (const artifact of run.events) {
    const started = Date.now();
    const nodeName = typeof artifact.node === "string" && artifact.node.trim() ? artifact.node.trim() : "node";
    const paramsHash = sha256Hex(
      stableJsonStringify({
        architecture,
        node: nodeName,
        params: artifact.params ?? {},
        seed: artifact.seed ?? null,
      }),
    );
    try {
      const normalized = normalizeContent(artifact);
      const modality = inferModality(artifact.modality, normalized.contentType);
      const outputHash = sha256Hex(normalized.buffer);
      const blob = await putBlob(normalized.buffer, { contentType: normalized.contentType });
      const creatorId = artifact.creator_id ?? run.personaId ?? "persona:unknown";
      const license = artifact.license ?? run.defaultLicense ?? "CC-BY-4.0";
      const data_cutoff_iso = artifact.data_cutoff_iso ?? run.dataCutoffIso ?? new Date().toISOString();

      const pipelineInput = artifact.inputs ?? { node: nodeName, params: artifact.params ?? {} };
      const pipelineInputHash = sha256Hex(stableJsonStringify(pipelineInput));
      const nowIso = new Date().toISOString();
      const pipelineStep = {
        name: architecture,
        impl_version: artifact.kind ?? "langgraph-node",
        lib_hash: { algo: "sha256", value: sha256Hex(`${architecture}:${nodeName}`) },
        params: { ...(artifact.params ?? {}), node: nodeName, kind: artifact.kind ?? "node_output" },
        seed: artifact.seed != null ? String(artifact.seed) : undefined,
        input_hash: { algo: "sha256", value: pipelineInputHash },
        output_hash: { algo: "sha256", value: outputHash },
        started_at: artifact.started_at ?? nowIso,
        ended_at: artifact.ended_at ?? nowIso,
      };

      const information_boundary = buildInformationBoundary({
        data_cutoff_iso,
        mode: artifact.boundaryMode ?? "observables",
        labels_used_as_features: artifact.labelsUsedAsFeatures ?? false,
        event_features_included: artifact.eventFeaturesIncluded,
        inputs: pipelineInput,
        features: artifact.features ?? {
          modality,
          node: nodeName,
          hash: sha256Prefixed(normalized.buffer),
        },
      });

      const embedding = encodeEmbedding(artifact.embedding);
      const envelope = EssenceEnvelope.parse({
        header: {
          id: crypto.randomUUID(),
          version: "essence/1.0",
          modality,
          created_at: pipelineStep.ended_at,
          source: {
            uri: blob.uri,
            cid: blob.cid,
            original_hash: { algo: "sha256", value: outputHash },
            creator_id: creatorId,
            license,
            mime: normalized.contentType,
          },
          rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
          acl: { visibility: "private", groups: [] },
        },
        features: buildFeatures(modality, normalized.previewText),
        embeddings: embedding ? [embedding] : [],
        provenance: {
          pipeline: [pipelineStep],
          merkle_root: { algo: "sha256", value: outputHash },
          previous: null,
          signatures: [],
          information_boundary,
        },
      });

      await putEnvelope(envelope);
      artifacts.push({
        node: nodeName,
        kind: artifact.kind ?? "node_output",
        essenceId: envelope.header.id,
        blobUri: blob.uri,
        cid: blob.cid,
        modality,
        outputHash,
      });
      appendToolLog({
        tool: `langgraph.${architecture}`,
        version: artifact.kind ?? "langgraph",
        paramsHash,
        durationMs: Date.now() - started,
        sessionId: run.sessionId,
        traceId: run.traceId ?? runId,
        seed: artifact.seed,
        ok: true,
        essenceId: envelope.header.id,
        text: `[${nodeName}] ${modality} -> ${envelope.header.id} (${blob.uri})`,
      });
    } catch (err) {
      failed += 1;
      appendToolLog({
        tool: `langgraph.${architecture}`,
        version: artifact.kind ?? "langgraph",
        paramsHash,
        durationMs: Date.now() - started,
        sessionId: run.sessionId,
        traceId: run.traceId ?? runId,
        seed: artifact.seed,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { runId, architecture, artifacts, failed };
}

type NormalizedContent = {
  buffer: Buffer;
  contentType: string;
  previewText?: string;
};

function normalizeContent(artifact: LangGraphNodeArtifact): NormalizedContent {
  const content = artifact.content ?? "";
  if (Buffer.isBuffer(content)) {
    return { buffer: content, contentType: artifact.contentType ?? "application/octet-stream" };
  }
  if (typeof content === "string") {
    return {
      buffer: Buffer.from(content, "utf8"),
      contentType: artifact.contentType ?? "text/plain; charset=utf-8",
      previewText: content.slice(0, 512),
    };
  }
  try {
    const json = JSON.stringify(content);
    return {
      buffer: Buffer.from(json, "utf8"),
      contentType: artifact.contentType ?? "application/json",
      previewText: json.slice(0, 512),
    };
  } catch {
    const fallback = String(content);
    return {
      buffer: Buffer.from(fallback, "utf8"),
      contentType: artifact.contentType ?? "text/plain; charset=utf-8",
      previewText: fallback.slice(0, 512),
    };
  }
}

function inferModality(
  explicit: LangGraphNodeArtifact["modality"],
  contentType: string,
): TEssenceEnvelope["header"]["modality"] {
  if (explicit) return explicit;
  const lowered = contentType.toLowerCase();
  if (lowered.startsWith("image/")) return "image";
  if (lowered.startsWith("audio/")) return "audio";
  if (lowered.startsWith("video/")) return "video";
  if (lowered.includes("code")) return "code";
  return "text";
}

function buildFeatures(
  modality: TEssenceEnvelope["header"]["modality"],
  previewText?: string,
): TEssenceEnvelope["features"] {
  if (modality === "text" || modality === "code") {
    const summary = previewText?.trim();
    if (summary) {
      return { text: { summary: summary.slice(0, 280) } };
    }
  }
  return {};
}

function encodeEmbedding(input?: AgenticEmbedding): EssenceEmbedding | null {
  if (!input) return null;
  const storage = input.storage ?? deriveInlineStorage(input.vector);
  const dim = input.dim ?? input.vector?.length ?? inferDimFromStorage(storage);
  if (!storage || !dim || dim <= 0) {
    return null;
  }
  return {
    space: input.space ?? COLLAPSE_SPACE,
    dim,
    dtype: input.dtype ?? "f32",
    quantization: input.quantization,
    storage,
    composer: input.composer ?? "langgraph-wrapper",
  };
}

function deriveInlineStorage(vector?: number[]): EssenceEmbedding["storage"] | undefined {
  if (!vector || vector.length === 0) {
    return undefined;
  }
  return { inline_base64: float32ToBase64(vector) };
}

function inferDimFromStorage(storage?: EssenceEmbedding["storage"]): number | undefined {
  if (!storage?.inline_base64) return undefined;
  const bytes = Buffer.from(storage.inline_base64, "base64");
  if (bytes.byteLength === 0) return undefined;
  return Math.floor(bytes.byteLength / 4);
}

function float32ToBase64(vector: number[]): string {
  const array = new Float32Array(vector);
  return Buffer.from(array.buffer).toString("base64");
}
