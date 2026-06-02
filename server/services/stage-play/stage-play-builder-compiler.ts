import type { HelixLiveSourceDescriptor } from "@shared/helix-live-source-descriptor";
import type { HelixLiveSourceProducer } from "@shared/helix-live-source-producer";
import {
  buildStagePlayBuilderCatalogV1,
  buildStagePlaySourceQueryV1,
  normalizeStagePlayGraphDraftV1,
  validateStagePlayGraphDraftV1,
  type StagePlayBuilderCatalogV1,
  type StagePlayGraphDraftValidationV1,
  type StagePlaySourceHandleV1,
  type StagePlaySourceQueryV1,
} from "@shared/contracts/stage-play-builder.v1";
import { listLiveSourceProducers } from "../situation-room/live-source-chunk-buffer";
import { listLiveSourceDescriptors } from "../situation-room/live-source-descriptor-builder";

export type BuildStagePlayCompilerContextInput = {
  threadId: string;
  environmentId?: string | null;
  sourceId?: string | null;
  generatedAt?: string;
};

const unique = <T>(values: T[]): T[] => Array.from(new Set(values));

export function listStagePlaySourceHandles(
  input: BuildStagePlayCompilerContextInput,
): StagePlaySourceHandleV1[] {
  const descriptors = listLiveSourceDescriptors({
    threadId: input.threadId,
    sourceId: input.sourceId ?? null,
    environmentId: input.environmentId ?? null,
    limit: 80,
  });
  const descriptorSourceIds = new Set(descriptors.map((descriptor) => descriptor.source_id));
  const producers = listLiveSourceProducers({
    threadId: input.threadId,
  }).filter((producer: HelixLiveSourceProducer) =>
    (!input.sourceId || producer.source_id === input.sourceId) &&
    (descriptorSourceIds.size === 0 || descriptorSourceIds.has(producer.source_id))
  );
  const producerBySource = new Map(producers.map((producer: HelixLiveSourceProducer) => [producer.source_id, producer]));
  const handles = new Map<string, StagePlaySourceHandleV1>();
  for (const descriptor of descriptors) {
    const producer = producerBySource.get(descriptor.source_id) ?? null;
    handles.set(descriptor.source_id, descriptorToHandle(descriptor, producer));
  }
  for (const producer of producers) {
    if (handles.has(producer.source_id)) continue;
    handles.set(producer.source_id, producerToHandle(producer));
  }
  return Array.from(handles.values())
    .sort((a, b) => a.sourceClass.localeCompare(b.sourceClass) || a.sourceId.localeCompare(b.sourceId));
}

export function buildStagePlayBuilderCatalog(input: BuildStagePlayCompilerContextInput): StagePlayBuilderCatalogV1 {
  const handles = listStagePlaySourceHandles(input);
  return buildStagePlayBuilderCatalogV1({
    generatedAt: input.generatedAt,
    sourceClasses: handles.map((handle) => handle.sourceClass),
  });
}

export function buildStagePlaySourceQuery(input: BuildStagePlayCompilerContextInput): StagePlaySourceQueryV1 {
  return buildStagePlaySourceQueryV1({
    threadId: input.threadId,
    environmentId: input.environmentId ?? null,
    sourceHandles: listStagePlaySourceHandles(input),
    generatedAt: input.generatedAt,
  });
}

export function validateStagePlayBuilderDraft(input: BuildStagePlayCompilerContextInput & {
  draft: unknown;
}): StagePlayGraphDraftValidationV1 {
  const normalized = normalizeStagePlayGraphDraftV1(input.draft);
  return validateStagePlayGraphDraftV1({
    draft: normalized.draft,
    initialIssues: normalized.issues,
    sourceHandles: listStagePlaySourceHandles(input),
    generatedAt: input.generatedAt,
  });
}

export function sourceIdsFromStagePlayDraft(input: {
  draft: unknown;
  threadId: string;
  environmentId?: string | null;
}): string[] {
  const normalized = normalizeStagePlayGraphDraftV1(input.draft);
  const validation = validateStagePlayGraphDraftV1({
    draft: normalized.draft,
    initialIssues: normalized.issues,
    sourceHandles: listStagePlaySourceHandles(input),
  });
  return validation.ok ? validation.resolvedSourceIds : [];
}

function descriptorToHandle(
  descriptor: HelixLiveSourceDescriptor,
  producer: HelixLiveSourceProducer | null,
): StagePlaySourceHandleV1 {
  return {
    sourceId: descriptor.source_id,
    sourceClass: descriptor.modality,
    status: descriptor.current_state,
    label: descriptor.user_label ?? null,
    descriptorId: descriptor.descriptor_id,
    producerId: producer?.producer_id ?? null,
    surface: descriptor.serving_context.surface,
    origin: descriptor.serving_context.source_origin,
    cadenceMs: descriptor.cadence_ms ?? producer?.cadence_ms ?? null,
    latestEvidenceRefs: unique([
      descriptor.descriptor_id,
      producer?.producer_id ?? null,
      ...descriptor.latest_observation_refs,
      producer?.latest_chunk_id ?? null,
    ].filter(Boolean) as string[]),
  };
}

function producerToHandle(producer: HelixLiveSourceProducer): StagePlaySourceHandleV1 {
  return {
    sourceId: producer.source_id,
    sourceClass: producer.modality,
    status: producer.status,
    label: null,
    descriptorId: null,
    producerId: producer.producer_id,
    surface: null,
    origin: null,
    cadenceMs: producer.cadence_ms ?? null,
    latestEvidenceRefs: unique([
      producer.producer_id,
      producer.latest_chunk_id ?? null,
    ].filter(Boolean) as string[]),
  };
}
