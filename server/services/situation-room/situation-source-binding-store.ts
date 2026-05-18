import crypto from "node:crypto";
import {
  HELIX_SITUATION_SOURCE_BINDING_SCHEMA,
  type HelixSituationSourceBinding,
  type HelixSituationSourceBindingModality,
  type HelixSituationSourceBindingPolicy,
  type HelixSituationSourceReplayPolicy,
} from "@shared/helix-situation-source-binding";

const bindings = new Map<string, HelixSituationSourceBinding>();

const normalize = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const bindingIdFor = (input: {
  thread_id: string;
  situation_run_id: string;
  source_id: string;
  modality: string;
}): string => `situation_source_binding:${hashShort(input)}`;

export function upsertSituationSourceBinding(input: {
  thread_id: string;
  situation_run_id: string;
  environment_id?: string | null;
  source_id: string;
  modality: HelixSituationSourceBindingModality;
  binding_policy?: HelixSituationSourceBindingPolicy;
  replay_policy?: HelixSituationSourceReplayPolicy;
  now?: string;
}): HelixSituationSourceBinding {
  const threadId = normalize(input.thread_id) ?? "helix-ask:desktop";
  const situationRunId = normalize(input.situation_run_id) ?? "unknown_situation_run";
  const sourceId = normalize(input.source_id) ?? "unknown_source";
  const now = input.now ?? new Date().toISOString();
  const bindingId = bindingIdFor({
    thread_id: threadId,
    situation_run_id: situationRunId,
    source_id: sourceId,
    modality: input.modality,
  });
  const existing = bindings.get(bindingId);
  const binding: HelixSituationSourceBinding = {
    schema: HELIX_SITUATION_SOURCE_BINDING_SCHEMA,
    binding_id: bindingId,
    thread_id: threadId,
    situation_run_id: situationRunId,
    environment_id: normalize(input.environment_id),
    source_id: sourceId,
    modality: input.modality,
    status: "bound",
    binding_policy: input.binding_policy ?? existing?.binding_policy ?? "repair_acceptance",
    replay_policy: input.replay_policy ?? existing?.replay_policy ?? "future_only",
    created_at: existing?.created_at ?? now,
    updated_at: now,
    assistant_answer: false,
    raw_content_included: false,
  };
  bindings.set(binding.binding_id, binding);
  return binding;
}

export function listSituationSourceBindings(input: {
  threadId?: string | null;
  situationRunId?: string | null;
  sourceId?: string | null;
  modality?: string | null;
  limit?: number;
} = {}): HelixSituationSourceBinding[] {
  const limit = Math.max(1, Math.min(input.limit ?? 100, 500));
  return Array.from(bindings.values())
    .filter((binding) => !input.threadId || binding.thread_id === input.threadId)
    .filter((binding) => !input.situationRunId || binding.situation_run_id === input.situationRunId)
    .filter((binding) => !input.sourceId || binding.source_id === input.sourceId)
    .filter((binding) => !input.modality || binding.modality === input.modality)
    .sort((a, b) => a.updated_at.localeCompare(b.updated_at))
    .slice(-limit);
}

export function getSituationSourceBindingForSource(input: {
  threadId?: string | null;
  sourceId: string;
  modality: string;
}): HelixSituationSourceBinding | null {
  return listSituationSourceBindings({
    threadId: input.threadId ?? null,
    sourceId: input.sourceId,
    modality: input.modality,
    limit: 1,
  }).at(-1) ?? null;
}

export function resetSituationSourceBindingsForTest(): void {
  bindings.clear();
}
