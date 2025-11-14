import { createHash, randomUUID } from "node:crypto";
import type { EssenceProposal, ProposalStatus } from "@shared/proposals";
import {
  COLLAPSE_SPACE,
  EssenceEnvelope,
  type CollapseMixerFeature,
  type TEssenceEnvelope,
} from "@shared/essence-schema";
import type { TCollapseMixRecipe } from "@shared/essence-schema";
import { collapseMix } from "../mixer/collapse";
import { listEnvelopeByCreator, getEnvelope, putEnvelope } from "./store";
import { essenceHub } from "./events";
import { putBlob } from "../../storage";
import { listProposalsByStatus } from "../../db/proposals";

export type MixMode = "project-assets" | "proposal-identity";

export type CreateEssenceMixArgs = {
  mode: MixMode;
  creatorId?: string;
  limit?: number;
  label?: string;
  seed?: number;
  personaId?: string;
};

export type EssenceMixResult = {
  mixId: string;
  mode: MixMode;
  summary: string;
  space: string;
  dim: number;
  sourceIds: string[];
};

const MAX_INPUTS = 64;
const DEFAULT_DIM = 512;

export async function createEssenceMix(args: CreateEssenceMixArgs): Promise<EssenceMixResult> {
  if (args.mode === "project-assets") {
    if (!args.creatorId) {
      throw new Error("creatorId is required for project-assets mix");
    }
    return mixProjectAssets(args);
  }
  return mixProposalIdentity(args);
}

async function mixProjectAssets(args: CreateEssenceMixArgs): Promise<EssenceMixResult> {
  const creatorId = args.creatorId!;
  const assets = await listEnvelopeByCreator(creatorId, clampLimit(args.limit));
  if (assets.length === 0) {
    throw new Error(`No essence envelopes found for creator ${creatorId}`);
  }
  const grouped = groupEnvelopesByModality(assets);
  if (!hasAnyInputs(grouped)) {
    throw new Error("No mixable inputs found for creator");
  }
  const recipe: TCollapseMixRecipe = {
    kind: "collapse_mixer",
    dim: DEFAULT_DIM,
    inputs: grouped,
    knobs: {
      seed: args.seed ?? Date.now() % 1_000_000,
    },
  };
  const lookup = new Map(assets.map((env) => [env.header.id, env]));
  const sourceIds = [...grouped.text, ...grouped.image, ...grouped.audio];
  const { fused, feature } = await collapseMix({
    recipe,
    fetchEnvelope: async (id) => {
      const found = lookup.get(id) ?? (await getEnvelope(id));
      if (!found) {
        throw new Error(`Asset ${id} not found`);
      }
      return found;
    },
  });
  const summary = args.label ?? `Identity mix for ${creatorId}`;
  return persistMixResult({
    fused,
    feature,
    summary,
    creatorId,
    mode: "project-assets",
    sourceIds,
    personaId: args.personaId,
  });
}

async function mixProposalIdentity(args: CreateEssenceMixArgs): Promise<EssenceMixResult> {
  const statuses: ProposalStatus[] = ["approved", "applied"];
  const proposals = await listProposalsByStatus(statuses, clampLimit(args.limit));
  if (proposals.length === 0) {
    throw new Error("No approved proposals available for mixing");
  }
  const synthetic = buildSyntheticProposalEnvelopes(proposals);
  const recipe: TCollapseMixRecipe = {
    kind: "collapse_mixer",
    dim: DEFAULT_DIM,
    inputs: {
      text: proposals.map((proposal) => `proposal:${proposal.id}`),
      image: [],
      audio: [],
    },
    knobs: {
      seed: args.seed ?? Date.now() % 1_000_000,
    },
  };
  const sourceIds = [...recipe.inputs.text];
  const { fused, feature } = await collapseMix({
    recipe,
    fetchEnvelope: async (id) => {
      const env = synthetic.get(id);
      if (!env) {
        throw new Error(`Synthetic proposal ${id} missing`);
      }
      return env;
    },
  });
  const summary = args.label ?? `Project identity mix from ${proposals.length} proposals`;
  return persistMixResult({
    fused,
    feature,
    summary,
    creatorId: args.creatorId ?? "proposal-mix",
    mode: "proposal-identity",
    sourceIds,
    personaId: args.personaId,
  });
}

type PersistArgs = {
  fused: Float32Array;
  feature: CollapseMixerFeature;
  summary: string;
  creatorId: string;
  mode: MixMode;
  sourceIds: string[];
  personaId?: string;
};

async function persistMixResult(args: PersistArgs): Promise<EssenceMixResult> {
  const buffer = Buffer.from(args.fused.buffer, args.fused.byteOffset, args.fused.byteLength);
  const blob = await putBlob(buffer, { contentType: "application/octet-stream" });
  if (!blob?.uri) {
    throw new Error("Failed to persist mix embedding");
  }
  const now = new Date().toISOString();
  const mixId = randomUUID();
  const outputHash = createHash("sha256").update(buffer).digest("hex");
  const pipelineHash = createHash("sha256").update(args.sourceIds.join("|")).digest("hex");
  const textSummary = `${args.summary} (${args.mode})`;

  const envelope = EssenceEnvelope.parse({
    header: {
      id: mixId,
      version: "essence/1.0",
      modality: "multimodal",
      created_at: now,
      source: {
        uri: blob.uri,
        cid: blob.cid,
        creator_id: args.creatorId,
        license: "CC-BY-4.0",
        original_hash: { algo: "sha256", value: outputHash },
      },
      rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
      acl: { visibility: "private", groups: [] },
    },
    features: {
      text: {
        summary: textSummary,
        tags: [args.mode, "collapse-mix", args.creatorId].map((tag) => tag.toLowerCase()),
        source: "essence.mix",
      },
      mixer: {
        ...args.feature,
        sources: args.feature.sources,
      },
    },
    embeddings: [
      {
        space: COLLAPSE_SPACE,
        dim: args.fused.length,
        dtype: "f32",
        storage: { object_url: blob.uri, cid: blob.cid },
        composer: "collapse-mixer/1.0",
      },
    ],
    provenance: {
      pipeline: [
        {
          name: "collapse-mixer",
          impl_version: "1.0",
          lib_hash: {
            algo: "sha256",
            value: createHash("sha256").update("collapse-mixer/1.0").digest("hex"),
          },
          params: {
            mode: args.mode,
            source_ids: args.sourceIds,
            label: args.summary,
          },
          seed: args.feature.knobs?.seed ? String(args.feature.knobs.seed) : undefined,
          input_hash: { algo: "sha256", value: pipelineHash },
          output_hash: { algo: "sha256", value: outputHash },
          started_at: now,
          ended_at: now,
        },
      ],
      merkle_root: { algo: "sha256", value: outputHash },
      previous: null,
      signatures: [],
    },
  });

  await putEnvelope(envelope);
  essenceHub.emit("created", { type: "created", essenceId: mixId });

  return {
    mixId,
    mode: args.mode,
    summary: textSummary,
    space: COLLAPSE_SPACE,
    dim: args.fused.length,
    sourceIds: args.sourceIds,
  };
}

function groupEnvelopesByModality(envelopes: TEssenceEnvelope[]): {
  text: string[];
  image: string[];
  audio: string[];
} {
  const grouped = { text: [] as string[], image: [] as string[], audio: [] as string[] };
  for (const env of envelopes) {
    const id = env.header.id;
    if (env.features?.text && env.features.text.transcript) {
      grouped.text.push(id);
      continue;
    }
    if (env.header.modality === "text") {
      grouped.text.push(id);
      continue;
    }
    if (env.header.modality === "image") {
      grouped.image.push(id);
      continue;
    }
    if (env.header.modality === "audio") {
      grouped.audio.push(id);
    }
  }
  return grouped;
}

function hasAnyInputs(grouped: { text: string[]; image: string[]; audio: string[] }): boolean {
  return grouped.text.length > 0 || grouped.image.length > 0 || grouped.audio.length > 0;
}

function clampLimit(limit?: number): number {
  if (!Number.isFinite(limit)) {
    return 16;
  }
  return Math.max(1, Math.min(Math.floor(Number(limit)), MAX_INPUTS));
}

function buildSyntheticProposalEnvelopes(
  proposals: EssenceProposal[],
): Map<string, TEssenceEnvelope> {
  const map = new Map<string, TEssenceEnvelope>();
  for (const proposal of proposals) {
    const id = `proposal:${proposal.id}`;
    const baseText = [proposal.summary, proposal.explanation].filter(Boolean).join("\n\n");
    const textHash = createHash("sha256").update(baseText).digest("hex");
    map.set(
      id,
      EssenceEnvelope.parse({
        header: {
          id,
          version: "essence/1.0",
          modality: "text",
          created_at: proposal.createdAt,
          source: {
            uri: `proposal://${proposal.id}`,
            original_hash: { algo: "sha256", value: textHash },
            creator_id: proposal.ownerId ?? "proposal",
            license: "CC-BY-4.0",
          },
          rights: { allow_mix: true, allow_remix: true, allow_commercial: false, attribution: true },
          acl: { visibility: "private", groups: [] },
        },
        features: {
          text: {
            summary: proposal.summary,
            transcript: proposal.explanation,
            tags: [proposal.kind, proposal.target.type],
            source: "proposal",
          },
        },
        embeddings: [],
        provenance: {
          pipeline: [],
          merkle_root: { algo: "sha256", value: textHash },
          previous: null,
          signatures: [],
        },
      }),
    );
  }
  return map;
}
