import crypto from "node:crypto";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";
import type { HelixLiveProcedureEpoch } from "@shared/helix-live-procedure-epoch";
import {
  HELIX_VISUAL_SCENE_MEMORY_INDEX_SCHEMA,
  type HelixVisualSceneMemoryIndex,
} from "@shared/helix-visual-scene-memory-index";
import {
  HELIX_VISUAL_SCENE_QUERY_INTENT_SCHEMA,
  type HelixVisualSceneQueryIntent,
} from "@shared/helix-visual-scene-query-intent";
import {
  HELIX_SELECTED_VISUAL_SCENE_SET_SCHEMA,
  type HelixSelectedVisualSceneSet,
} from "@shared/helix-selected-visual-scene-set";
import {
  HELIX_VISUAL_SCENE_COMPARISON_RESULT_SCHEMA,
  type HelixVisualSceneComparisonResult,
} from "@shared/helix-visual-scene-comparison-result";

const sceneMemoryByRun = new Map<string, HelixVisualSceneMemoryIndex[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const tokenize = (value: string): string[] =>
  unique(value.toLowerCase().match(/[a-z0-9][a-z0-9._-]{2,}/g) ?? [])
    .filter((token) => !["compare", "current", "scene", "folder", "file", "last", "previous", "looking"].includes(token));

const splitObjects = (value: string | null | undefined): string[] =>
  unique(String(value ?? "").split(/[,;|]/).map((entry) => entry.trim())).slice(0, 20);

const fileNameRe = /\b[A-Za-z0-9][A-Za-z0-9 _.-]{1,80}\.(?:png|jpg|jpeg|gif|webp|wav|mp3|mp4|mov|pdf|md|txt|docx|zip|json|ts|tsx|js|py)\b/g;

const fieldValue = (evaluations: HelixLiveFieldEvaluation[], ...keys: string[]): string | null =>
  evaluations.find((entry) => keys.includes(entry.field_key))?.value ?? null;

export function recordVisualSceneMemoryIndex(input: {
  situationRunId: string;
  threadId: string;
  environmentId: string;
  epoch: number;
  observation: HelixObservationJournalEntry;
  evaluations: HelixLiveFieldEvaluation[];
  procedureEpoch: HelixLiveProcedureEpoch;
  createdAt?: string;
}): HelixVisualSceneMemoryIndex {
  const scene = fieldValue(input.evaluations, "scene", "place") ?? input.observation.text;
  const activity = fieldValue(input.evaluations, "activity") ?? "";
  const objectsValue = fieldValue(input.evaluations, "objects", "entities") ?? "";
  const titleMatch = scene.match(/\b(?:labeled|titled|called|directory|folder)\s+"([^"]+)"/i);
  const appMatch = scene.match(/\b(File Explorer|Browser|Chrome|Firefox|Docs|PDF viewer|terminal|console)\b/i);
  const textForFiles = [scene, activity, objectsValue, input.observation.text].join(" ");
  const memory: HelixVisualSceneMemoryIndex = {
    schema: HELIX_VISUAL_SCENE_MEMORY_INDEX_SCHEMA,
    scene_memory_id: `visual_scene_memory:${hashShort([input.situationRunId, input.epoch, input.observation.observation_id])}`,
    situation_run_id: input.situationRunId,
    thread_id: input.threadId,
    environment_id: input.environmentId,
    epoch: input.epoch,
    timestamp: input.procedureEpoch.created_at,
    app_or_surface: appMatch?.[1] ?? null,
    visible_title: titleMatch?.[1] ?? null,
    objects: splitObjects(objectsValue),
    file_names: unique(textForFiles.match(fileNameRe) ?? []).slice(0, 40),
    activity_summary: activity || scene,
    intent_hypotheses: unique([
      fieldValue(input.evaluations, "intent", "goal"),
      activity,
    ]).slice(0, 10),
    evidence_refs: unique([
      input.observation.observation_id,
      input.procedureEpoch.epoch_id,
      ...input.evaluations.map((entry) => entry.evaluation_id),
    ]).slice(0, 80),
    assistant_answer: false,
    raw_content_included: false,
  };
  const existing = sceneMemoryByRun.get(input.situationRunId) ?? [];
  sceneMemoryByRun.set(input.situationRunId, [
    ...existing.filter((entry) => entry.scene_memory_id !== memory.scene_memory_id),
    memory,
  ].sort((a, b) => a.epoch - b.epoch).slice(-1000));
  return memory;
}

export function listVisualSceneMemory(input: {
  threadId?: string | null;
  environmentId?: string | null;
  situationRunId?: string | null;
  limit?: number;
} = {}): HelixVisualSceneMemoryIndex[] {
  const limit = Math.max(0, Math.min(1000, Math.trunc(input.limit ?? 300)));
  return Array.from(sceneMemoryByRun.values()).flat()
    .filter((entry) => !input.threadId || entry.thread_id === input.threadId)
    .filter((entry) => !input.environmentId || entry.environment_id === input.environmentId)
    .filter((entry) => !input.situationRunId || entry.situation_run_id === input.situationRunId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .slice(-limit);
}

export function buildVisualSceneQueryIntent(input: {
  turnId: string;
  threadId: string;
  promptText: string;
}): HelixVisualSceneQueryIntent | null {
  const prompt = input.promptText.trim();
  if (!/\b(?:compare|scene where|last .*scene|previous .*scene|camera roll|soho|folder scene)\b/i.test(prompt)) return null;
  const quoted = Array.from(prompt.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
  const afterLast = prompt.match(/\blast\s+([A-Za-z0-9 _.-]{3,60}?)(?:\s+folder)?\s+scene\b/i)?.[1];
  const afterWith = prompt.match(/\bwith\s+([A-Za-z0-9 _.-]{3,60})(?:\.|$)/i)?.[1];
  const where = prompt.match(/\bwhere\s+i\s+was\s+in\s+([A-Za-z0-9 _.-]{3,60})(?:\.|$)/i)?.[1];
  const terms = unique([
    ...quoted,
    afterLast,
    afterWith,
    where,
    ...tokenize(prompt).filter((token) => /^[A-Z0-9._-]+$/.test(token) || token.length >= 4),
  ]).slice(0, 12);
  return {
    schema: HELIX_VISUAL_SCENE_QUERY_INTENT_SCHEMA,
    query_intent_id: `visual_scene_query_intent:${hashShort([input.turnId, prompt, terms])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    query_text: prompt,
    query_terms: terms,
    compare_to_current: /\bcompare\b/i.test(prompt),
    strength: terms.length > 0 ? "hard" : "soft",
    reason: "visual_scene_memory_query",
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function selectVisualScenesForQuery(input: {
  turnId: string;
  threadId: string;
  queryIntent: HelixVisualSceneQueryIntent;
  situationRunId?: string | null;
  currentEpoch?: number | null;
  limit?: number;
}): HelixSelectedVisualSceneSet {
  const memories = listVisualSceneMemory({
    threadId: input.threadId,
    situationRunId: input.situationRunId,
    limit: 500,
  });
  const currentScene = memories.filter((entry) => input.currentEpoch === null || input.currentEpoch === undefined || entry.epoch <= input.currentEpoch).at(-1) ?? null;
  const termSet = input.queryIntent.query_terms.map((term) => term.toLowerCase());
  const selected = memories
    .filter((entry) => !currentScene || entry.scene_memory_id !== currentScene.scene_memory_id)
    .map((entry) => {
      const haystack = [
        entry.visible_title,
        entry.app_or_surface,
        entry.activity_summary,
        ...entry.objects,
        ...entry.file_names,
        ...entry.intent_hypotheses,
      ].join(" ").toLowerCase();
      const matchedTerms = termSet.filter((term) => haystack.includes(term));
      return {
        scene_memory: entry,
        score: matchedTerms.length * 10 + (input.queryIntent.query_text.toLowerCase().includes("last") ? entry.epoch : 0),
        matched_terms: matchedTerms,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.scene_memory.epoch - a.scene_memory.epoch)
    .slice(0, Math.max(1, Math.min(5, input.limit ?? 3)));
  return {
    schema: HELIX_SELECTED_VISUAL_SCENE_SET_SCHEMA,
    selection_id: `selected_visual_scene_set:${hashShort([input.turnId, input.queryIntent.query_intent_id, selected.map((entry) => entry.scene_memory.scene_memory_id)])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    query_intent_id: input.queryIntent.query_intent_id,
    selected_scenes: selected,
    current_scene: currentScene,
    selection_reason: selected.length > 0 ? "matched_scene_memory_terms" : "no_scene_memory_match",
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function buildVisualSceneComparisonResult(input: {
  turnId: string;
  threadId: string;
  queryIntent: HelixVisualSceneQueryIntent;
  selectedSceneSet: HelixSelectedVisualSceneSet;
}): HelixVisualSceneComparisonResult | null {
  const current = input.selectedSceneSet.current_scene ?? null;
  const previous = input.selectedSceneSet.selected_scenes[0]?.scene_memory ?? null;
  if (!current || !previous) return null;
  const sharedTraits = unique([
    current.app_or_surface && previous.app_or_surface && current.app_or_surface === previous.app_or_surface ? current.app_or_surface : null,
    ...current.objects.filter((entry) => previous.objects.includes(entry)),
  ]).slice(0, 8);
  const differences = unique([
    current.visible_title !== previous.visible_title
      ? `visible title changed from ${previous.visible_title ?? "unknown"} to ${current.visible_title ?? "unknown"}`
      : null,
    previous.file_names.length || current.file_names.length
      ? `visible files changed from ${previous.file_names.slice(0, 5).join(", ") || "unspecified"} to ${current.file_names.slice(0, 5).join(", ") || "unspecified"}`
      : null,
    previous.activity_summary !== current.activity_summary
      ? `activity changed from ${previous.activity_summary} to ${current.activity_summary}`
      : null,
  ]);
  const summary = `Compared current epoch ${current.epoch} with prior epoch ${previous.epoch}. ${
    differences[0] ?? "No material scene difference was selected from scene memory."
  }.`;
  return {
    schema: HELIX_VISUAL_SCENE_COMPARISON_RESULT_SCHEMA,
    comparison_id: `visual_scene_comparison:${hashShort([input.turnId, current.scene_memory_id, previous.scene_memory_id])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    query_intent_id: input.queryIntent.query_intent_id,
    selected_scene_set_id: input.selectedSceneSet.selection_id,
    current_scene_ref: current.scene_memory_id,
    compared_scene_refs: [previous.scene_memory_id],
    summary,
    shared_traits: sharedTraits,
    differences,
    evidence_refs: unique([...current.evidence_refs, ...previous.evidence_refs]).slice(0, 24),
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function resetVisualSceneMemoryForTest(): void {
  sceneMemoryByRun.clear();
}
