import crypto from "node:crypto";
import { EssenceEnvelope } from "@shared/essence-schema";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { putEnvelope } from "../services/essence/store";
import { putBlob } from "../storage";
import { assertHullAllowed } from "../security/hull-guard";

const DEFAULT_DIFF_HTTP_RPM = Math.max(1, Number(process.env.DIFF_HTTP_RPM ?? 30));

export const lumaHttpSpec: ToolSpecShape = {
  name: "luma.http.generate",
  desc: "Diffusion via SD WebUI or ComfyUI over HTTP with provenance envelopes",
  inputSchema: {} as any,
  outputSchema: {} as any,
  deterministic: true,
  rateLimit: { rpm: DEFAULT_DIFF_HTTP_RPM },
  safety: { risks: ["network_access", "writes_files"] },
};

const engine = (process.env.DIFF_HTTP_ENGINE ?? "sdwebui").toLowerCase();

let fetchImpl: typeof fetch | null = typeof globalThis.fetch === "function" ? globalThis.fetch : null;
async function getFetch(): Promise<typeof fetch> {
  if (fetchImpl) {
    return fetchImpl;
  }
  const mod = await import("node-fetch");
  fetchImpl = (mod.default ?? mod) as unknown as typeof fetch;
  return fetchImpl;
}

const resolveBase = (): string => {
  const base = (process.env.DIFF_HTTP_URL ?? "").trim();
  if (!base) {
    throw new Error("DIFF_HTTP_URL not set");
  }
  const normalized = base.replace(/\/+$/, "");
  assertHullAllowed(normalized);
  return normalized;
};

type DiffResult = {
  imageBase64: string;
  metadata: Record<string, unknown>;
  seed?: number;
};

async function invokeSdWebUi(prompt: string, params: Record<string, unknown>): Promise<DiffResult> {
  const fetch = await getFetch();
  const response = await fetch(`${resolveBase()}/sdapi/v1/txt2img`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!response.ok) {
    throw new Error(`SD HTTP ${response.status}`);
  }
  const payload = (await response.json()) as any;
  const info = typeof payload?.info === "string" ? safeParse(payload.info) : payload?.info;
  return {
    imageBase64: (payload?.images?.[0] as string) ?? "",
    metadata: info?.metadata ?? payload?.parameters ?? {},
    seed: info?.seed ?? params.seed,
  };
}

async function invokeComfy(prompt: string, params: Record<string, unknown>): Promise<DiffResult> {
  const fetch = await getFetch();
  const response = await fetch(`${resolveBase()}/prompt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, ...params }),
  });
  if (!response.ok) {
    throw new Error(`Comfy HTTP ${response.status}`);
  }
  const payload = (await response.json()) as any;
  return {
    imageBase64: payload?.image_base64 ?? "",
    metadata: payload?.meta ?? {},
    seed: payload?.seed ?? params.seed,
  };
}

export const lumaHttpHandler: ToolHandler = async (input: any, ctx: any) => {
  const prompt = String(input?.prompt ?? ctx?.goal ?? "Luma prompt missing");
  const steps = Number(input?.steps ?? process.env.DIFF_STEPS ?? 6);
  const width = Number(input?.width ?? process.env.DIFF_WIDTH ?? 512);
  const height = Number(input?.height ?? process.env.DIFF_HEIGHT ?? 512);
  const sampler = String(input?.sampler ?? process.env.DIFF_SAMPLER ?? "LCM");
  const seed = Number.isFinite(input?.seed) ? Number(input.seed) : Number(process.env.DIFF_SEED ?? -1);
  const personaId = ctx?.personaId ?? "persona:unknown";
  const now = new Date().toISOString();

  const params = {
    prompt,
    steps,
    width,
    height,
    sampler_name: sampler,
    sampler,
    seed,
  };

  const result = engine === "comfyui" ? await invokeComfy(prompt, params) : await invokeSdWebUi(prompt, params);
  const b64 = (result.imageBase64 ?? "").replace(/^data:image\/png;base64,/, "");
  if (!b64) {
    throw new Error("Diffusion HTTP returned empty image payload");
  }
  const buffer = Buffer.from(b64, "base64");
  const blob = await putBlob(buffer, { contentType: "image/png" });
  if (!blob?.uri) {
    throw new Error("storage_put_failed");
  }
  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const libDigest = crypto.createHash("sha256").update(JSON.stringify(result.metadata ?? {})).digest("hex");

  const env = EssenceEnvelope.parse({
    header: {
      id: crypto.randomUUID(),
      version: "essence/1.0",
      modality: "image",
      created_at: now,
      source: {
        uri: blob.uri,
        cid: blob.cid,
        original_hash: { algo: "sha256", value: hash },
        creator_id: personaId,
        width,
        height,
        license: input?.license ?? "CC-BY-NC-4.0",
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "public", groups: [] },
    },
    features: {
      image: { width, height },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "diffusion-http",
          impl_version: engine,
          lib_hash: { algo: "sha256", value: libDigest },
          params: { prompt, steps, width, height, sampler, seed: result.seed ?? seed },
          seed: String(result.seed ?? seed ?? ""),
          input_hash: { algo: "sha256", value: crypto.createHash("sha256").update(prompt).digest("hex") },
          output_hash: { algo: "sha256", value: hash },
          started_at: now,
          ended_at: new Date().toISOString(),
        },
      ],
      merkle_root: { algo: "sha256", value: hash },
      previous: null,
      signatures: [],
    },
  });
  await putEnvelope(env);

  return {
    essence_id: env.header.id,
    uri: blob.uri,
    seed: result.seed ?? seed,
    steps,
    width,
    height,
    sampler,
    metadata: result.metadata,
  };
};

const safeParse = (value: string) => {
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
};
