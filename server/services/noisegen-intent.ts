import { createHash } from "node:crypto";
import { stableJsonStringify } from "../utils/stable-json";
import type { NoisegenIntentContract } from "./noisegen-store";

type IntentRequestLike = {
  sampleInfluence?: number;
  styleInfluence?: number;
  weirdness?: number;
  tempo?: {
    bpm?: number;
    timeSig?: string;
    offsetMs?: number;
    barsInLoop?: number;
    quantized?: boolean;
  };
  key?: string;
  renderPlan?: RenderPlanLike;
};

type RenderPlanLike = {
  global?: {
    bpm?: number;
    key?: string;
    sections?: Array<{ name?: string; startBar?: number; bars?: number }>;
    locks?: {
      groove?: boolean;
      harmony?: boolean;
      drums?: boolean;
      bass?: boolean;
      music?: boolean;
      textures?: boolean;
      fx?: boolean;
    };
  };
  windows?: Array<{
    material?: {
      grooveTemplateIds?: string[];
      midiMotifIds?: string[];
    };
    texture?: {
      sampleInfluence?: number;
      styleInfluence?: number;
      weirdness?: number;
      fx?: {
        reverbSend?: number;
        chorus?: number;
      };
    };
  }>;
};

export type IntentEnforcementState = {
  checks: number;
  violations: string[];
};

export type IntentMeta = {
  contractVersion?: number;
  contractHash?: string;
  intentSimilarity: number;
  violations: string[];
};

const DEFAULT_SAMPLE = 0.7;
const DEFAULT_STYLE = 0.3;
const DEFAULT_WEIRD = 0.2;

const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
};

const normalizeIds = (list?: string[]) =>
  Array.isArray(list)
    ? list.map((entry) => entry.trim()).filter(Boolean)
    : [];

const registerCheck = (
  state: IntentEnforcementState,
  ok: boolean,
  message: string,
) => {
  state.checks += 1;
  if (!ok) {
    state.violations.push(message);
  }
};

export const createIntentEnforcementState = (): IntentEnforcementState => ({
  checks: 0,
  violations: [],
});

export const hashIntentContract = (
  contract?: NoisegenIntentContract | null,
): string | null => {
  if (!contract) return null;
  const payload = stableJsonStringify(contract);
  return createHash("sha256").update(payload).digest("hex");
};

export const finalizeIntentMeta = (
  state: IntentEnforcementState,
  contract?: NoisegenIntentContract | null,
): IntentMeta => {
  const contractHash = hashIntentContract(contract);
  const intentSimilarity =
    state.checks > 0
      ? clampNumber(
          (state.checks - state.violations.length) / state.checks,
          0,
          1,
        )
      : 1;
  return {
    contractVersion: contract?.version,
    contractHash: contractHash ?? undefined,
    intentSimilarity,
    violations: state.violations,
  };
};

export function enforceIntentContractOnRequest<T extends IntentRequestLike>(
  request: T,
  contract: NoisegenIntentContract | null | undefined,
  state: IntentEnforcementState,
): T {
  if (!contract) return request;
  const nextRequest: IntentRequestLike = { ...request };
  let tempo = request.tempo ? { ...request.tempo } : undefined;

  const ensureTempo = () => {
    if (!tempo) {
      tempo = { bpm: 120, timeSig: "4/4", offsetMs: 0 };
      return;
    }
    if (!Number.isFinite(tempo.bpm)) tempo.bpm = 120;
    if (!tempo.timeSig) tempo.timeSig = "4/4";
    if (!Number.isFinite(tempo.offsetMs)) tempo.offsetMs = 0;
  };

  const invariants = contract.invariants;
  if (typeof invariants?.tempoBpm === "number") {
    const previous = tempo?.bpm;
    registerCheck(
      state,
      typeof previous === "number" && previous === invariants.tempoBpm,
      `tempoBpm adjusted to ${invariants.tempoBpm}`,
    );
    ensureTempo();
    tempo!.bpm = invariants.tempoBpm;
  }
  if (typeof invariants?.timeSig === "string") {
    const previous = tempo?.timeSig;
    registerCheck(
      state,
      typeof previous === "string" && previous === invariants.timeSig,
      `timeSig adjusted to ${invariants.timeSig}`,
    );
    ensureTempo();
    tempo!.timeSig = invariants.timeSig;
  }
  if (tempo) {
    nextRequest.tempo = tempo;
  }
  if (
    typeof invariants?.key === "string" &&
    Object.prototype.hasOwnProperty.call(request, "key")
  ) {
    const previous = request.key;
    registerCheck(
      state,
      typeof previous === "string" && previous === invariants.key,
      `key adjusted to ${invariants.key}`,
    );
    nextRequest.key = invariants.key;
  }

  const ranges = contract.ranges;
  if (ranges?.sampleInfluence) {
    const original =
      typeof request.sampleInfluence === "number"
        ? request.sampleInfluence
        : DEFAULT_SAMPLE;
    const clamped = clampNumber(
      original,
      ranges.sampleInfluence.min,
      ranges.sampleInfluence.max,
    );
    registerCheck(
      state,
      clamped === original,
      `sampleInfluence clamped to [${ranges.sampleInfluence.min}, ${ranges.sampleInfluence.max}]`,
    );
    nextRequest.sampleInfluence = clamped;
  }
  if (ranges?.styleInfluence) {
    const original =
      typeof request.styleInfluence === "number"
        ? request.styleInfluence
        : DEFAULT_STYLE;
    const clamped = clampNumber(
      original,
      ranges.styleInfluence.min,
      ranges.styleInfluence.max,
    );
    registerCheck(
      state,
      clamped === original,
      `styleInfluence clamped to [${ranges.styleInfluence.min}, ${ranges.styleInfluence.max}]`,
    );
    nextRequest.styleInfluence = clamped;
  }
  if (ranges?.weirdness) {
    const original =
      typeof request.weirdness === "number" ? request.weirdness : DEFAULT_WEIRD;
    const clamped = clampNumber(
      original,
      ranges.weirdness.min,
      ranges.weirdness.max,
    );
    registerCheck(
      state,
      clamped === original,
      `weirdness clamped to [${ranges.weirdness.min}, ${ranges.weirdness.max}]`,
    );
    nextRequest.weirdness = clamped;
  }

  return nextRequest as T;
}

export function enforceIntentContractOnRenderPlan<T extends RenderPlanLike>(
  renderPlan: T,
  contract: NoisegenIntentContract | null | undefined,
  state: IntentEnforcementState,
): T {
  if (!contract) return renderPlan;

  const nextPlan: RenderPlanLike = {
    ...renderPlan,
    global: renderPlan.global ? { ...renderPlan.global } : undefined,
    windows: Array.isArray(renderPlan.windows)
      ? renderPlan.windows.map((window) => {
          const nextWindow = { ...window };
          if (window.material) {
            nextWindow.material = { ...window.material };
          }
          if (window.texture) {
            const nextTexture = { ...window.texture };
            if (window.texture.fx) {
              nextTexture.fx = { ...window.texture.fx };
            }
            nextWindow.texture = nextTexture;
          }
          return nextWindow;
        })
      : renderPlan.windows,
  };

  const invariants = contract.invariants;
  if (typeof invariants?.tempoBpm === "number") {
    const previous = nextPlan.global?.bpm;
    registerCheck(
      state,
      typeof previous === "number" && previous === invariants.tempoBpm,
      `plan bpm adjusted to ${invariants.tempoBpm}`,
    );
    nextPlan.global = { ...(nextPlan.global ?? {}), bpm: invariants.tempoBpm };
  }
  if (typeof invariants?.key === "string") {
    const previous = nextPlan.global?.key;
    registerCheck(
      state,
      typeof previous === "string" && previous === invariants.key,
      `plan key adjusted to ${invariants.key}`,
    );
    nextPlan.global = { ...(nextPlan.global ?? {}), key: invariants.key };
  }

  const stemLocks = normalizeIds(invariants?.stemLocks);
  if (stemLocks.length) {
    const lockMap: Record<string, keyof NonNullable<RenderPlanLike["global"]>["locks"]> =
      {
        groove: "groove",
        harmony: "harmony",
        drums: "drums",
        bass: "bass",
        music: "music",
        textures: "textures",
        fx: "fx",
      };
    const currentLocks = { ...(nextPlan.global?.locks ?? {}) };
    let changed = false;
    for (const token of stemLocks) {
      const key = lockMap[token.toLowerCase()];
      if (!key) continue;
      if (!currentLocks[key]) {
        currentLocks[key] = true;
        changed = true;
      }
    }
    registerCheck(
      state,
      !changed,
      `stem locks enforced (${stemLocks.join(", ")})`,
    );
    if (changed) {
      nextPlan.global = { ...(nextPlan.global ?? {}), locks: currentLocks };
    }
  }

  const allowedGrooves = new Set(normalizeIds(invariants?.grooveTemplateIds));
  if (allowedGrooves.size && Array.isArray(nextPlan.windows)) {
    let filtered = 0;
    nextPlan.windows.forEach((window) => {
      const ids = window.material?.grooveTemplateIds;
      if (!Array.isArray(ids) || !ids.length) return;
      const kept = ids.filter((id) => allowedGrooves.has(id.trim()));
      if (kept.length !== ids.length) {
        window.material = { ...(window.material ?? {}), grooveTemplateIds: kept };
        filtered += ids.length - kept.length;
      }
    });
    registerCheck(
      state,
      filtered === 0,
      `grooveTemplateIds filtered (${filtered})`,
    );
  }

  const allowedMotifs = new Set(normalizeIds(invariants?.motifIds));
  if (allowedMotifs.size && Array.isArray(nextPlan.windows)) {
    let filtered = 0;
    nextPlan.windows.forEach((window) => {
      const ids = window.material?.midiMotifIds;
      if (!Array.isArray(ids) || !ids.length) return;
      const kept = ids.filter((id) => allowedMotifs.has(id.trim()));
      if (kept.length !== ids.length) {
        window.material = { ...(window.material ?? {}), midiMotifIds: kept };
        filtered += ids.length - kept.length;
      }
    });
    registerCheck(
      state,
      filtered === 0,
      `midiMotifIds filtered (${filtered})`,
    );
  }

  const ranges = contract.ranges;
  if (ranges && Array.isArray(nextPlan.windows)) {
    const rangeHits = {
      sampleInfluence: 0,
      styleInfluence: 0,
      weirdness: 0,
      reverbSend: 0,
      chorus: 0,
    };
    nextPlan.windows.forEach((window) => {
      const texture = window.texture;
      if (texture && ranges.sampleInfluence && typeof texture.sampleInfluence === "number") {
        const clamped = clampNumber(
          texture.sampleInfluence,
          ranges.sampleInfluence.min,
          ranges.sampleInfluence.max,
        );
        if (clamped !== texture.sampleInfluence) {
          texture.sampleInfluence = clamped;
          rangeHits.sampleInfluence += 1;
        }
      }
      if (texture && ranges.styleInfluence && typeof texture.styleInfluence === "number") {
        const clamped = clampNumber(
          texture.styleInfluence,
          ranges.styleInfluence.min,
          ranges.styleInfluence.max,
        );
        if (clamped !== texture.styleInfluence) {
          texture.styleInfluence = clamped;
          rangeHits.styleInfluence += 1;
        }
      }
      if (texture && ranges.weirdness && typeof texture.weirdness === "number") {
        const clamped = clampNumber(
          texture.weirdness,
          ranges.weirdness.min,
          ranges.weirdness.max,
        );
        if (clamped !== texture.weirdness) {
          texture.weirdness = clamped;
          rangeHits.weirdness += 1;
        }
      }
      if (texture?.fx && ranges.reverbSend && typeof texture.fx.reverbSend === "number") {
        const clamped = clampNumber(
          texture.fx.reverbSend,
          ranges.reverbSend.min,
          ranges.reverbSend.max,
        );
        if (clamped !== texture.fx.reverbSend) {
          texture.fx.reverbSend = clamped;
          rangeHits.reverbSend += 1;
        }
      }
      if (texture?.fx && ranges.chorus && typeof texture.fx.chorus === "number") {
        const clamped = clampNumber(
          texture.fx.chorus,
          ranges.chorus.min,
          ranges.chorus.max,
        );
        if (clamped !== texture.fx.chorus) {
          texture.fx.chorus = clamped;
          rangeHits.chorus += 1;
        }
      }
    });

    if (ranges.sampleInfluence) {
      registerCheck(
        state,
        rangeHits.sampleInfluence === 0,
        `sampleInfluence clamped in ${rangeHits.sampleInfluence} window(s)`,
      );
    }
    if (ranges.styleInfluence) {
      registerCheck(
        state,
        rangeHits.styleInfluence === 0,
        `styleInfluence clamped in ${rangeHits.styleInfluence} window(s)`,
      );
    }
    if (ranges.weirdness) {
      registerCheck(
        state,
        rangeHits.weirdness === 0,
        `weirdness clamped in ${rangeHits.weirdness} window(s)`,
      );
    }
    if (ranges.reverbSend) {
      registerCheck(
        state,
        rangeHits.reverbSend === 0,
        `reverbSend clamped in ${rangeHits.reverbSend} window(s)`,
      );
    }
    if (ranges.chorus) {
      registerCheck(
        state,
        rangeHits.chorus === 0,
        `chorus clamped in ${rangeHits.chorus} window(s)`,
      );
    }
  }

  const allowedMoves = normalizeIds(ranges?.arrangementMoves);
  if (allowedMoves.length && nextPlan.global?.sections?.length) {
    const allowedMap = new Map(
      allowedMoves.map((move) => [move.toLowerCase(), move]),
    );
    let adjusted = 0;
    nextPlan.global.sections = nextPlan.global.sections.map((section) => {
      const name = section?.name?.trim() ?? "";
      if (!name) return section;
      const resolved = allowedMap.get(name.toLowerCase());
      if (resolved) return section;
      adjusted += 1;
      return { ...section, name: allowedMoves[0] };
    });
    registerCheck(
      state,
      adjusted === 0,
      `arrangement moves adjusted (${adjusted})`,
    );
  }

  return nextPlan as T;
}
