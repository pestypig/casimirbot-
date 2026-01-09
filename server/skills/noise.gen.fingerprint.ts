import { createHash, randomInt, randomUUID } from "node:crypto";
import { z } from "zod";
import type { ToolHandler, ToolSpecShape } from "@shared/skills";
import { EssenceEnvelope } from "@shared/essence-schema";
import { putEnvelopeWithPolicy } from "./provenance";
import { essenceHub } from "../services/essence/events";
import { putBlob } from "../storage";
import { persistEssencePacket } from "../db/essence";
import {
  buildInformationBoundaryFromHashes,
  sha256Hex,
} from "../utils/information-boundary";
import { stableJsonStringify } from "../utils/stable-json";

type EqPeak = { f: number; q: number; gain: number };

type NoiseFingerprint = {
  eq: EqPeak[];
  ir: string;
  chorus: { rate: number; depth: number };
  sat: { drive: number };
};

const IR_OPTIONS = ["plate_small.wav", "hall_small.wav", "room_short.wav"];

const FingerprintRequest = z.object({
  label: z.string().trim().max(160).optional(),
  seed: z.number().int().nonnegative().optional(),
  peaks: z.number().int().min(1).max(8).default(3),
});

const FingerprintResponse = z.object({
  essence_id: z.string(),
  essence_url: z.string(),
  fingerprint_id: z.string(),
  fingerprint: z.object({
    eq: z.array(z.object({ f: z.number(), q: z.number(), gain: z.number() })),
    ir: z.string(),
    chorus: z.object({ rate: z.number(), depth: z.number() }),
    sat: z.object({ drive: z.number() }),
  }),
  seed: z.number().int().nonnegative(),
  label: z.string().optional(),
});

type FingerprintInput = z.infer<typeof FingerprintRequest>;

export const noiseGenFingerprintSpec: ToolSpecShape = {
  name: "noise.gen.fingerprint",
  desc: "Generate a NoiseGen texture fingerprint with Essence provenance",
  inputSchema: FingerprintRequest,
  outputSchema: FingerprintResponse,
  deterministic: false,
  rateLimit: { rpm: 40 },
  safety: { risks: ["writes_files"] },
};

export const noiseGenFingerprintHandler: ToolHandler = async (rawInput, ctx) => {
  const parsed = FingerprintRequest.parse(rawInput ?? {});
  const seed = resolveSeed(parsed.seed, parsed.label);
  const now = new Date().toISOString();
  const dataCutoffIso =
    typeof ctx?.dataCutoffIso === "string" && ctx.dataCutoffIso.trim()
      ? new Date(ctx.dataCutoffIso).toISOString()
      : now;
  const creatorId = (ctx?.personaId as string) || "noise.gen.fingerprint";
  const essenceId = randomUUID();

  const fingerprint = buildFingerprint(seed, parsed.peaks);
  const fingerprintJson = stableJsonStringify(fingerprint);
  const buffer = Buffer.from(fingerprintJson, "utf8");
  const blob = await putBlob(buffer, { contentType: "application/json" });
  if (!blob.uri) {
    throw new Error("storage backend did not return a URI for fingerprint");
  }

  const outputHash = sha256Hex(buffer);
  const inputPayload = {
    label: parsed.label ?? null,
    seed,
    peaks: parsed.peaks,
  };
  const inputHash = sha256Hex(stableJsonStringify(inputPayload));
  const informationBoundary = buildInformationBoundaryFromHashes({
    data_cutoff_iso: dataCutoffIso,
    mode: "observables",
    labels_used_as_features: false,
    event_features_included: false,
    inputs_hash: `sha256:${inputHash}`,
    features_hash: `sha256:${outputHash}`,
  });
  const summary = parsed.label
    ? `Noise fingerprint: ${parsed.label}`
    : "Noise fingerprint";

  const envelope = EssenceEnvelope.parse({
    header: {
      id: essenceId,
      version: "essence/1.0",
      modality: "text",
      created_at: now,
      source: {
        uri: blob.uri,
        original_hash: { algo: "sha256", value: outputHash },
        mime: "application/json",
        creator_id: creatorId,
        license: "CC-BY-4.0",
        cid: blob.cid,
      },
      rights: {
        allow_mix: true,
        allow_remix: true,
        allow_commercial: false,
        attribution: true,
      },
      acl: { visibility: "private", groups: [] },
    },
    features: {
      text: {
        summary,
        tags: parsed.label
          ? ["noise", "fingerprint", parsed.label]
          : ["noise", "fingerprint"],
      },
    },
    embeddings: [],
    provenance: {
      pipeline: [
        {
          name: "noisegen.fingerprint",
          impl_version: "1.0.0",
          lib_hash: {
            algo: "sha256",
            value: sha256Hex(Buffer.from("noisegen.fingerprint@1")),
          },
          params: inputPayload,
          seed: String(seed),
          input_hash: { algo: "sha256", value: inputHash },
          output_hash: { algo: "sha256", value: outputHash },
          started_at: now,
          ended_at: now,
        },
      ],
      merkle_root: { algo: "sha256", value: outputHash },
      previous: null,
      signatures: [],
      information_boundary: informationBoundary,
    },
  });

  await putEnvelopeWithPolicy(envelope);
  await persistEssencePacket({
    id: `${essenceId}:fingerprint`,
    envelope_id: essenceId,
    uri: blob.uri,
    cid: blob.cid,
    content_type: blob.contentType,
    bytes: blob.bytes,
  });
  essenceHub.emit("created", { type: "created", essenceId });

  return FingerprintResponse.parse({
    essence_id: essenceId,
    essence_url: `/api/essence/${essenceId}`,
    fingerprint_id: outputHash,
    fingerprint,
    seed,
    label: parsed.label,
  });
};

function buildFingerprint(seed: number, peaks: number): NoiseFingerprint {
  const rng = mulberry32(seed);
  const eq: EqPeak[] = [];
  for (let i = 0; i < peaks; i += 1) {
    eq.push({
      f: Math.round(rngRange(rng, 80, 10_000)),
      q: round(rngRange(rng, 0.6, 3.2), 2),
      gain: round(rngRange(rng, 0.7, 1.3), 2),
    });
  }
  eq.sort((a, b) => a.f - b.f);

  const ir = IR_OPTIONS[Math.floor(rngRange(rng, 0, IR_OPTIONS.length))] ?? IR_OPTIONS[0];

  return {
    eq,
    ir,
    chorus: {
      rate: round(rngRange(rng, 0.25, 1.2), 2),
      depth: round(rngRange(rng, 0.0008, 0.006), 4),
    },
    sat: {
      drive: round(rngRange(rng, 0.12, 0.6), 2),
    },
  };
}

function resolveSeed(seed?: number, label?: string): number {
  if (Number.isFinite(seed)) {
    return Math.max(0, Math.floor(seed as number));
  }
  const base = label?.trim();
  if (base) {
    const digest = createHash("sha256").update(base).digest("hex");
    return Number.parseInt(digest.slice(0, 8), 16);
  }
  return randomInt(0, 2 ** 32);
}

function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function rngRange(rng: () => number, min: number, max: number): number {
  if (min >= max) return min;
  return min + rng() * (max - min);
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
