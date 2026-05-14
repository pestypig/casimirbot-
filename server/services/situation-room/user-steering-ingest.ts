import crypto from "node:crypto";
import {
  HELIX_USER_STEERING_EVIDENCE_SCHEMA,
  type HelixUserSteeringEvidence,
} from "@shared/helix-user-steering-evidence";

const evidenceByThread = new Map<string, HelixUserSteeringEvidence[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const uniqueStrings = (values: unknown[]): string[] =>
  Array.from(new Set(values.map((entry) => String(entry ?? "").trim()).filter(Boolean)));

const inferEffect = (claim: string): HelixUserSteeringEvidence["effect"] => {
  const lower = claim.toLowerCase();
  if (/\b(yes|correct|that is|that's|intended|this is)\b/.test(lower)) return "confirm";
  if (/\b(no|not|wrong|false|isn't|is not)\b/.test(lower)) return "reject";
  if (/\b(call it|rename|named)\b/.test(lower)) return "rename";
  if (/\b(building|making|trying to|goal|actually)\b/.test(lower)) return "refine_goal";
  if (/\b(watch|look for|next check|missing)\b/.test(lower)) return "add_missing_evidence_target";
  if (/\b(important|priority|critical)\b/.test(lower)) return "set_priority";
  return "unknown";
};

const nextChecksForClaim = (claim: string): string[] => {
  const lower = claim.toLowerCase();
  if (/lava|light/.test(lower)) return ["bucket_empty", "lava_nearby", "light_level_increase", "containment_blocks"];
  if (/chicken|farm|egg/.test(lower)) return ["egg_pickup", "seed_use", "breeding_event", "hopper_or_chest_context"];
  if (/mine|stair|trench/.test(lower)) return ["exact_block_edits", "vertical_descent", "side_channel_geometry"];
  return ["future source evidence that confirms or contradicts the user steering"];
};

export function recordUserSteeringEvidence(input: {
  threadId: string;
  source?: HelixUserSteeringEvidence["source"];
  userClaim: string;
  targetHypothesisIds?: string[];
  evidenceRefs?: string[];
  effect?: HelixUserSteeringEvidence["effect"];
  confidenceDelta?: number | null;
  nextChecks?: string[];
  now?: string;
}): HelixUserSteeringEvidence {
  const now = input.now ?? new Date().toISOString();
  const effect = input.effect ?? inferEffect(input.userClaim);
  const steering: HelixUserSteeringEvidence = {
    schema: HELIX_USER_STEERING_EVIDENCE_SCHEMA,
    steering_id: `user_steering_evidence:${hashShort([
      input.threadId,
      input.userClaim,
      input.targetHypothesisIds ?? [],
      now,
    ])}`,
    thread_id: input.threadId,
    source: input.source ?? "helix_ask_text",
    user_claim: input.userClaim.trim(),
    normalized_claim: input.userClaim.trim(),
    target_hypothesis_ids: uniqueStrings(input.targetHypothesisIds ?? []),
    effect,
    confidence_delta: typeof input.confidenceDelta === "number"
      ? input.confidenceDelta
      : effect === "confirm"
        ? 0.18
        : effect === "reject"
          ? -0.25
          : effect === "refine_goal"
            ? 0.12
            : null,
    next_checks: uniqueStrings(input.nextChecks ?? nextChecksForClaim(input.userClaim)),
    evidence_refs: uniqueStrings(input.evidenceRefs ?? []),
    assistant_answer: false,
    raw_content_included: false,
    created_at: now,
  };
  const existing = evidenceByThread.get(steering.thread_id) ?? [];
  evidenceByThread.set(steering.thread_id, [...existing, steering].slice(-200));
  return steering;
}

export function listUserSteeringEvidence(threadId: string): HelixUserSteeringEvidence[] {
  return [...(evidenceByThread.get(threadId) ?? [])];
}

export function clearUserSteeringEvidenceForTest(): void {
  evidenceByThread.clear();
}
