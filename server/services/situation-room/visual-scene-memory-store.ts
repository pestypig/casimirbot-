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
import {
  HELIX_RELATIVE_SESSION_SEMANTIC_INTENT_SCHEMA,
  type HelixRelativeSessionSemanticIntent,
} from "@shared/helix-relative-session-semantic-intent";
import {
  HELIX_SELECTED_SESSION_SEMANTIC_BINDING_SCHEMA,
  type HelixSelectedSessionSemanticBinding,
  type HelixSessionSemanticBindingMatchBasis,
} from "@shared/helix-selected-session-semantic-binding";

const sceneMemoryByRun = new Map<string, HelixVisualSceneMemoryIndex[]>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const tokenize = (value: string): string[] =>
  unique(value.toLowerCase().match(/[a-z0-9][a-z0-9._-]{2,}/g) ?? [])
    .filter((token) => !["compare", "current", "scene", "folder", "file", "last", "previous", "looking"].includes(token));

const normalizePhrase = (value: string | null | undefined): string =>
  String(value ?? "")
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizedTerms = (value: string | null | undefined): string[] => {
  const phrase = normalizePhrase(value);
  if (!phrase) return [];
  return unique([phrase, ...tokenize(phrase)]);
};

const splitObjects = (value: string | null | undefined): string[] =>
  unique(String(value ?? "").split(/[,;|]/).map((entry) => entry.trim())).slice(0, 20);

const fileNameRe = /\b[A-Za-z0-9][A-Za-z0-9 _.-]{1,80}\.(?:png|jpg|jpeg|gif|webp|wav|mp3|mp4|mov|pdf|md|txt|docx|zip|json|ts|tsx|js|py|csv)\b/g;
const folderHintRe = /\b(?:folder|directory|view|camera\s+roll|media\s+roll)\s+(?:labeled|named|called)?\s*"([^"]+)"/gi;

const fieldValue = (evaluations: HelixLiveFieldEvaluation[], ...keys: string[]): string | null =>
  evaluations.find((entry) => keys.includes(entry.field_key))?.value ?? null;

const termsFrom = (value: string | null | undefined): string[] =>
  tokenize(String(value ?? "")).slice(0, 30);

const semanticExpansionMap: Array<{ tag: string; pattern: RegExp; terms: string[] }> = [
  { tag: "sun", pattern: /\b(?:sun|solar|solar[-\s]?observation|sdo|soho)\b/i, terms: ["sun", "solar", "solar observation", "sdo", "soho"] },
  { tag: "camera_roll", pattern: /\b(?:camera\s*roll|camera-roll|dcim|photos?|images?|media\s*roll)\b/i, terms: ["camera roll", "camera-roll", "dcim", "photos", "images", "media roll"] },
  { tag: "audio_export", pattern: /\b(?:audio\s*exports?|wav|mp3|bounce|rendered\s+audio|mixdown|stems)\b/i, terms: ["audio export", "audio exports", "wav", "mp3", "bounce", "rendered audio"] },
  { tag: "task_manager", pattern: /\b(?:task\s*manager|windows\s+task\s*manager|performance\s+tab|processes\s+tab)\b/i, terms: ["task manager", "windows task manager", "performance tab", "processes tab"] },
  { tag: "folder", pattern: /\b(?:folder|directory|file\s+explorer|explorer\s+window|windows\s+explorer)\b/i, terms: ["folder", "directory", "file explorer", "explorer window"] },
];

const semanticTermsFor = (values: Array<string | null | undefined>): string[] => {
  const text = values.map((value) => String(value ?? "")).join(" ");
  return unique(semanticExpansionMap.flatMap((entry) => entry.pattern.test(text) ? [entry.tag, ...entry.terms] : []));
};

const deicticTermRe = /\b(?:this|that|current|last|previous|same|that\s+one|the\s+export|the\s+folder)\b/gi;
const actionTermRe = /\b(?:compare|find|changed\s+since|what\s+changed|open|summari[sz]e)\b/gi;

const extractLocalLabelTerms = (prompt: string): string[] => {
  const quoted = Array.from(prompt.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
  const knownPhrases = [
    prompt.match(/\b(camera\s*roll)\b/i)?.[1],
    prompt.match(/\b(audio\s*export)\b/i)?.[1],
    prompt.match(/\b(task\s*manager)\b/i)?.[1],
    prompt.match(/\b(SUN|SOHO|SDO)\b/)?.[1],
  ];
  const namedScene = [
    prompt.match(/\bto\s+(?:the\s+)?([A-Za-z0-9 _.-]{2,60}?)(?:\s+folder)?\s+scene\b/i)?.[1],
    prompt.match(/\bfind\s+(?:the\s+)?([A-Za-z0-9 _.-]{2,60}?)\s+scene\b/i)?.[1],
    prompt.match(/\bchanged\s+since\s+(?:the\s+)?([A-Za-z0-9 _.-]{2,60}?)(?:\s+folder)?(?:\?|\.|$)/i)?.[1],
  ];
  return unique([...quoted, ...knownPhrases, ...namedScene]
    .map((term) => term?.replace(/\b(?:the|last|previous|current|this|that|scene|folder)\b/gi, " ").replace(/\s+/g, " ").trim())
    .filter((term) => term && !/^(?:last|previous|current|this|that|scene|folder|epoch|visual)$/i.test(term)));
};

export function buildRelativeSessionSemanticIntent(input: {
  turnId: string;
  threadId: string;
  promptText: string;
}): HelixRelativeSessionSemanticIntent | null {
  const prompt = input.promptText.trim();
  const localLabelTerms = extractLocalLabelTerms(prompt);
  const actionTerms = unique(Array.from(prompt.matchAll(actionTermRe)).map((match) => normalizePhrase(match[0])));
  const targetDomain =
    /\b(?:scene|folder|camera\s*roll|task\s*manager|audio\s*export|what\s+changed|changed\s+since|compare)\b/i.test(prompt)
      ? "visual_scene_memory"
      : "unknown";
  if (targetDomain !== "visual_scene_memory" || (localLabelTerms.length === 0 && !/\blast\s+folder\s+scene\b/i.test(prompt))) {
    return null;
  }
  return {
    schema: HELIX_RELATIVE_SESSION_SEMANTIC_INTENT_SCHEMA,
    semantic_intent_id: `relative_session_semantic_intent:${hashShort([input.turnId, prompt, localLabelTerms])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    raw_user_text: prompt,
    literal_terms: tokenize(prompt),
    deictic_terms: unique(Array.from(prompt.matchAll(deicticTermRe)).map((match) => normalizePhrase(match[0]))),
    local_label_terms: localLabelTerms,
    action_terms: actionTerms,
    target_domain: targetDomain,
    session_semantic_scope: "current_situation_run",
    requires_binding: true,
    reason: "scene_memory_prompt_requires_session_local_semantic_binding",
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function selectSessionSemanticBinding(input: {
  turnId: string;
  threadId: string;
  semanticIntent: HelixRelativeSessionSemanticIntent;
  situationRunId?: string | null;
  environmentId?: string | null;
  currentEpoch?: number | null;
}): HelixSelectedSessionSemanticBinding {
  const memories = listVisualSceneMemory({
    threadId: input.threadId,
    environmentId: input.environmentId,
    situationRunId: input.situationRunId,
    limit: 500,
  }).filter((entry) =>
    entry.assistant_answer === false &&
    entry.raw_content_included === false &&
    entry.evidence_refs.length > 0 &&
    (input.currentEpoch === null || input.currentEpoch === undefined || entry.epoch <= input.currentEpoch)
  );
  const currentScene = memories.at(-1) ?? null;
  const candidatePool = memories.filter((entry) => !currentScene || entry.scene_memory_id !== currentScene.scene_memory_id);
  const userPhrases = input.semanticIntent.local_label_terms.length > 0
    ? input.semanticIntent.local_label_terms
    : input.semanticIntent.literal_terms;
  const scored = candidatePool.flatMap((scene) => {
    const searchTerms = sceneSearchTerms(scene);
    const normalizedTitle = normalizedTerms(scene.visible_title);
    const haystack = ` ${searchTerms.join(" ")} `;
    return userPhrases.map((phrase) => {
      const phraseTerms = normalizedTerms(phrase);
      const directVisibleLabelMatch = phraseTerms.some((term) => normalizedTitle.includes(term));
      const priorUserPhraseReuse = phraseTerms.some((term) => scene.window_title_hints.flatMap(normalizedTerms).includes(term));
      const sceneMemoryTermMatches = phraseTerms.filter((term) => haystack.includes(` ${term} `) || haystack.includes(term)).length;
      const weakSemanticMatches = semanticTermsFor(phraseTerms).filter((term) => haystack.includes(term)).length;
      const appWindowMatch = phraseTerms.some((term) => normalizedTerms(scene.app_or_surface).includes(term));
      const recency = Math.max(0, Math.min(35, scene.epoch));
      const evidenceBonus = Math.min(10, scene.evidence_refs.length);
      const ambiguityPenalty = sceneMemoryTermMatches === 0 && !directVisibleLabelMatch && !priorUserPhraseReuse ? 20 : 0;
      const confidenceScore =
        (directVisibleLabelMatch ? 60 : 0) +
        (priorUserPhraseReuse ? 55 : 0) +
        recency +
        (sceneMemoryTermMatches * 30) +
        (appWindowMatch ? 25 : 0) +
        (weakSemanticMatches * 15) +
        evidenceBonus -
        ambiguityPenalty;
      const matchBasis: HelixSessionSemanticBindingMatchBasis =
        directVisibleLabelMatch ? "visible_label" :
        priorUserPhraseReuse ? "recent_user_phrase" :
        sceneMemoryTermMatches > 0 ? "prior_scene_memory" :
        weakSemanticMatches > 0 ? "semantic_similarity" :
        "procedure_memory";
      return {
        phrase,
        scene,
        confidenceScore,
        matchBasis,
      };
    });
  }).sort((a, b) =>
    b.confidenceScore - a.confidenceScore ||
    b.scene.epoch - a.scene.epoch ||
    b.scene.timestamp.localeCompare(a.scene.timestamp)
  );
  const selected = scored.filter((entry) => entry.confidenceScore >= 50).slice(0, 1);
  const rejected = scored
    .filter((entry) => !selected.some((selectedEntry) => selectedEntry.scene.scene_memory_id === entry.scene.scene_memory_id && selectedEntry.phrase === entry.phrase))
    .slice(0, 5);
  const ambiguity =
    selected.length === 0
      ? (candidatePool.length === 0 ? "missing_local_referent" : "insufficient_context")
      : scored[1] && scored[1].confidenceScore >= selected[0].confidenceScore - 8
        ? "multiple_plausible_bindings"
        : "none";
  return {
    schema: HELIX_SELECTED_SESSION_SEMANTIC_BINDING_SCHEMA,
    binding_id: `selected_session_semantic_binding:${hashShort([input.turnId, input.semanticIntent.semantic_intent_id, selected.map((entry) => entry.scene.scene_memory_id)])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    semantic_intent_id: input.semanticIntent.semantic_intent_id,
    selected_bindings: selected.map((entry) => ({
      user_phrase: entry.phrase,
      bound_kind: "visual_scene",
      bound_ref: entry.scene.scene_memory_id,
      confidence: Math.min(0.95, Math.max(0.1, entry.confidenceScore / 120)),
      evidence_refs: evidenceBundleForScene(entry.scene),
      match_basis: entry.matchBasis,
    })),
    rejected_bindings: rejected.map((entry) => ({
      user_phrase: entry.phrase,
      candidate_ref: entry.scene.scene_memory_id,
      reason: entry.confidenceScore < 50 ? "lower_confidence" : "ambiguous",
      confidence: Math.min(0.95, Math.max(0.1, entry.confidenceScore / 120)),
      evidence_refs: evidenceBundleForScene(entry.scene),
    })),
    ambiguity,
    missing_evidence: selected.length === 0 ? ["session_semantic_binding_missing"] : [],
    assistant_answer: false,
    raw_content_included: false,
  };
}

const inferSceneKind = (input: {
  text: string;
  appOrSurface?: string | null;
  title?: string | null;
}): HelixVisualSceneMemoryIndex["scene_kind"] => {
  const text = `${input.text} ${input.appOrSurface ?? ""} ${input.title ?? ""}`;
  if (/\b(?:task\s*manager|windows\s+task\s*manager|performance\s+tab|processes\s+tab)\b/i.test(text)) return "task_manager";
  if (/\b(?:camera\s*roll|camera-roll|dcim|photos?|images?|media\s*roll)\b/i.test(text)) return "media_roll";
  if (/\b(?:browser|chrome|firefox|edge)\b/i.test(text)) return "browser";
  if (/\b(?:pdf|docx?|document)\b/i.test(text)) return "document";
  if (/\b(?:folder|directory|file\s+explorer|explorer\s+window)\b/i.test(text)) return "folder";
  if (/\b(?:window|app|application)\b/i.test(text)) return "app_window";
  return "unknown";
};

const evidenceBundleForScene = (scene: HelixVisualSceneMemoryIndex | null | undefined): string[] =>
  unique([
    scene?.scene_memory_id,
    ...(scene?.observation_refs ?? []),
    ...(scene?.field_evaluation_refs ?? []),
    scene?.summary_ref,
    ...(scene?.probe_result_refs ?? []),
    ...(scene?.closure_refs ?? []),
  ]).slice(0, 80);

const sceneSearchTerms = (scene: HelixVisualSceneMemoryIndex): string[] =>
  unique([
    scene.visible_title ?? null,
    scene.app_or_surface ?? null,
    scene.activity_summary,
    ...scene.objects,
    ...scene.file_names,
    ...scene.intent_hypotheses,
    ...scene.app_hints,
    ...scene.window_title_hints,
    ...scene.visible_object_terms,
    ...scene.file_folder_terms,
    ...scene.activity_terms,
    ...scene.user_objective_terms,
    ...scene.normalized_title_terms,
    ...scene.normalized_path_terms,
    ...scene.semantic_tags,
  ].flatMap((value) => normalizedTerms(value))).slice(0, 200);

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
  const titleMatch = scene.match(/\b(?:labeled|titled|called|directory|folder|window|tab)\s+"([^"]+)"/i);
  const appMatch = scene.match(/\b(Windows Task Manager|Task Manager|File Explorer|Windows Explorer|Browser|Chrome|Firefox|Edge|Docs|PDF viewer|terminal|console)\b/i);
  const textForFiles = [scene, activity, objectsValue, input.observation.text].join(" ");
  const fileNames = unique(textForFiles.match(fileNameRe) ?? []).slice(0, 40);
  const folderHints = unique(Array.from(textForFiles.matchAll(folderHintRe)).map((match) => match[1])).slice(0, 20);
  const objectTerms = unique([...splitObjects(objectsValue).flatMap(termsFrom), ...termsFrom(scene)]).slice(0, 40);
  const activityTerms = termsFrom(activity || scene);
  const uncertainty = fieldValue(input.evaluations, "uncertainty", "risk") ?? "";
  const objective = fieldValue(input.evaluations, "intent", "goal") ?? "";
  const observationRefs = unique([input.observation.observation_id, ...input.procedureEpoch.observation_refs]);
  const fieldEvaluationRefs = unique([
    ...input.evaluations.map((entry) => entry.evaluation_id),
    ...input.procedureEpoch.field_evaluation_refs,
  ]);
  const title = titleMatch?.[1] ?? null;
  const appOrSurface = appMatch?.[1] ?? null;
  const sceneKind = inferSceneKind({ text: textForFiles, appOrSurface, title });
  const normalizedTitleTerms = unique([
    ...normalizedTerms(title),
    ...folderHints.flatMap(normalizedTerms),
  ]).slice(0, 40);
  const normalizedPathTerms = unique([
    ...fileNames.flatMap(normalizedTerms),
    ...folderHints.flatMap(normalizedTerms),
    ...termsFrom(fileNames.join(" ")),
  ]).slice(0, 80);
  const semanticTags = semanticTermsFor([scene, activity, objectsValue, input.observation.text, title, appOrSurface]);
  const memory: HelixVisualSceneMemoryIndex = {
    schema: HELIX_VISUAL_SCENE_MEMORY_INDEX_SCHEMA,
    scene_memory_id: `visual_scene_memory:${hashShort([input.situationRunId, input.epoch, input.observation.observation_id])}`,
    situation_run_id: input.situationRunId,
    thread_id: input.threadId,
    environment_id: input.environmentId,
    source_id: input.observation.source_id,
    epoch: input.epoch,
    timestamp: input.procedureEpoch.created_at,
    summary_ref: input.procedureEpoch.epoch_id,
    observation_refs: observationRefs,
    field_evaluation_refs: fieldEvaluationRefs,
    interpretation_hypothesis_refs: [],
    probe_result_refs: input.procedureEpoch.probe_result_refs,
    closure_refs: [input.procedureEpoch.epoch_id],
    app_or_surface: appOrSurface,
    visible_title: title,
    scene_kind: sceneKind,
    app_hints: unique([appOrSurface]).slice(0, 10),
    window_title_hints: unique([title, ...folderHints]).slice(0, 20),
    visible_object_terms: objectTerms,
    file_folder_terms: unique([...fileNames, ...folderHints, ...termsFrom(fileNames.join(" ")), ...semanticTags]).slice(0, 80),
    activity_terms: activityTerms,
    uncertainty_terms: termsFrom(uncertainty),
    user_objective_terms: termsFrom(objective),
    normalized_title_terms: normalizedTitleTerms,
    normalized_path_terms: normalizedPathTerms,
    semantic_tags: semanticTags,
    observed_at: input.observation.created_at,
    available_at: input.createdAt ?? input.procedureEpoch.created_at,
    index_version: "visual_scene_memory_index.semantic_v2",
    objects: splitObjects(objectsValue),
    file_names: fileNames,
    activity_summary: activity || scene,
    intent_hypotheses: unique([
      fieldValue(input.evaluations, "intent", "goal"),
      activity,
    ]).slice(0, 10),
    evidence_refs: unique([
      ...observationRefs,
      input.procedureEpoch.epoch_id,
      ...fieldEvaluationRefs,
      ...input.procedureEpoch.probe_result_refs,
    ]).slice(0, 80),
    assistant_answer: false,
    raw_content_included: false,
  };
  const durableCueCount = [
    memory.app_or_surface,
    memory.visible_title,
    ...memory.file_folder_terms,
    ...memory.visible_object_terms,
    ...memory.activity_terms,
    ...memory.intent_hypotheses,
  ].filter(Boolean).length;
  const admitted =
    input.observation.modality === "visual_frame" &&
    durableCueCount > 0 &&
    unique([...observationRefs, ...fieldEvaluationRefs]).length > 0 &&
    memory.assistant_answer === false &&
    memory.raw_content_included === false;
  if (!admitted) return memory;
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
  semanticBinding?: HelixSelectedSessionSemanticBinding | null;
}): HelixVisualSceneQueryIntent | null {
  const prompt = input.promptText.trim();
  if (!/\b(?:compare|find|scene where|camera roll|soho|sun|audio export|task manager|folder scene|changed since|last folder scene)\b/i.test(prompt)) return null;
  const quoted = Array.from(prompt.matchAll(/"([^"]+)"/g)).map((match) => match[1]);
  const genericSceneNameRe = /^(?:last|previous|current|this|that|visual|screen|capture|epoch|seen|scene)$/i;
  const usableSceneName = (value: string | undefined): string | undefined => {
    const cleaned = value?.replace(/\b(?:the|last|previous|current)\b/gi, " ").replace(/\s+/g, " ").trim();
    return cleaned && !genericSceneNameRe.test(cleaned) ? cleaned : undefined;
  };
  const afterLast = usableSceneName(prompt.match(/\blast\s+([A-Za-z0-9 _.-]{3,60}?)(?:\s+folder)?\s+scene\b/i)?.[1]);
  const compareNamed = usableSceneName(prompt.match(/\bcompare\b[\s\S]{0,80}\bto\s+(?:the\s+)?([A-Za-z0-9 _.-]{2,60}?)(?:\s+folder)?\s+scene\b/i)?.[1]);
  const findNamed = usableSceneName(prompt.match(/\bfind\s+(?:the\s+)?([A-Za-z0-9 _.-]{2,60}?)\s+scene\b/i)?.[1]);
  const changedSinceRaw = prompt.match(/\bchanged\s+since\s+(?:the\s+)?([A-Za-z0-9 _.-]{2,60}?)(?:\s+folder)?(?:\?|\.|$)/i)?.[1];
  const changedSince = changedSinceRaw && !/^(?:last|previous|seen|visual|scene|screen|capture|epoch)\b/i.test(changedSinceRaw.trim())
    ? changedSinceRaw
    : undefined;
  const rawAfterWith = prompt.match(/\bwith\s+([A-Za-z0-9 _.-]{3,60})(?:\.|$)/i)?.[1];
  const afterWith = rawAfterWith && !/^(?:the\s+)?next\b/i.test(rawAfterWith.trim())
    ? rawAfterWith
    : undefined;
  const where = prompt.match(/\bwhere\s+i\s+was\s+in\s+([A-Za-z0-9 _.-]{3,60})(?:\.|$)/i)?.[1];
  const namedSemanticCue =
    /\b(?:camera\s*roll|soho|sun\s+folder|audio\s+exports?|task\s*manager|last\s+folder\s+scene)\b/i.test(prompt) ||
    Boolean(compareNamed || findNamed || changedSince);
  const hasSemanticPriorCue = namedSemanticCue && (quoted.length > 0 ||
    Boolean(afterLast || afterWith || where || compareNamed || findNamed || changedSince) ||
    /\b(?:scene where|camera roll|soho|folder scene|sun folder|audio export|audio files?|task manager|last folder scene)\b/i.test(prompt));
  if (!hasSemanticPriorCue) return null;
  const lowerPrompt = prompt.toLowerCase();
  const targetSceneKind: HelixVisualSceneQueryIntent["target_scene_kind"] =
    /\bcamera\s*roll|media\s*roll|dcim\b/i.test(prompt) ? "media_roll" :
    /\btask\s*manager\b/i.test(prompt) && !/\blast\s+folder\s+scene\b/i.test(prompt) ? "task_manager" :
    /\bfolder|directory|file\s+explorer|explorer\s+window|last\s+folder\s+scene\b/i.test(prompt) ? "folder" :
    "unknown";
  const queryMode: HelixVisualSceneQueryIntent["query_mode"] =
    /\bcompare\b[\s\S]{0,80}\bcurrent\s+task\s*manager\b[\s\S]{0,80}\blast\s+folder\s+scene\b/i.test(prompt)
      ? "compare_current_app_to_prior_kind"
      : /\bchanged\s+since\b/i.test(prompt)
        ? "changed_since_prior"
        : /\bcompare\b/i.test(prompt)
          ? "compare_prior_to_current"
          : "find_prior_scene";
  const relativeTime: HelixVisualSceneQueryIntent["relative_time"] =
    /\blast\s+folder\s+scene\b/i.test(prompt) ? "last_folder_scene" :
    /\blast|previous/i.test(prompt) ? "last_matching" :
    "unspecified";
  const phraseTerms = unique([
    ...quoted,
    compareNamed,
    findNamed,
    changedSince,
    afterLast,
    afterWith,
    where,
    /\bcamera\s*roll\b/i.test(prompt) ? "camera roll" : null,
    /\baudio\s*export\b/i.test(prompt) ? "audio export" : null,
    /\btask\s*manager\b/i.test(prompt) ? "task manager" : null,
    /\bsun\b/i.test(prompt) ? "sun" : null,
  ]).map((term) => term.replace(/\b(?:the|last|current)\b/gi, " ").replace(/\s+/g, " ").trim()).filter(Boolean);
  const terms = unique([
    ...phraseTerms,
    ...tokenize(prompt).filter((token) => /^[A-Z0-9._-]+$/.test(token) || token.length >= 4),
  ]).filter((term) => !["find", "changed", "since", "compare", "current", "scene"].includes(term.toLowerCase())).slice(0, 16);
  const targetFileFolderTerms = unique([
    ...phraseTerms.filter((term) => !/\btask\s*manager\b/i.test(term)),
    ...(input.semanticBinding?.selected_bindings.map((entry) => entry.user_phrase) ?? []),
    /\bcamera\s*roll\b/i.test(prompt) ? "camera roll" : null,
    /\baudio\s*export\b/i.test(prompt) ? "audio export" : null,
    /\bsun\b/i.test(prompt) ? "sun" : null,
  ]);
  const semanticBindingRefs = input.semanticBinding?.selected_bindings.map((entry) => entry.bound_ref) ?? [];
  const boundQueryTerms = unique(input.semanticBinding?.selected_bindings.flatMap((entry) => normalizedTerms(entry.user_phrase)) ?? []);
  const bindingConfidence = input.semanticBinding?.selected_bindings[0]?.confidence ?? 0;
  return {
    schema: HELIX_VISUAL_SCENE_QUERY_INTENT_SCHEMA,
    query_intent_id: `visual_scene_query_intent:${hashShort([input.turnId, prompt, terms])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    query_text: prompt,
    query_terms: terms,
    semantic_binding_refs: semanticBindingRefs,
    literal_query_terms: terms,
    bound_query_terms: boundQueryTerms,
    binding_confidence: bindingConfidence,
    query_mode: queryMode,
    target_scene_kind: targetSceneKind,
    target_app_terms: /\btask\s*manager\b/i.test(prompt) ? ["task manager"] : [],
    target_window_terms: /\btask\s*manager\b/i.test(prompt) ? ["task manager"] : [],
    target_file_folder_terms: targetFileFolderTerms,
    target_object_terms: [],
    target_activity_terms: /\bperformance\s+tab|processes\s+tab\b/i.test(prompt)
      ? unique([lowerPrompt.includes("performance") ? "performance tab" : null, lowerPrompt.includes("processes") ? "processes tab" : null])
      : [],
    target_intent_terms: [],
    relative_time: relativeTime,
    requires_current_scene: queryMode !== "find_prior_scene",
    compare_to_current: queryMode !== "find_prior_scene",
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
  environmentId?: string | null;
  currentEpoch?: number | null;
  limit?: number;
}): HelixSelectedVisualSceneSet {
  const memories = listVisualSceneMemory({
    threadId: input.threadId,
    environmentId: input.environmentId,
    situationRunId: input.situationRunId,
    limit: 500,
  }).filter((entry) =>
    entry.assistant_answer === false &&
    entry.raw_content_included === false &&
    entry.evidence_refs.length > 0 &&
    (input.currentEpoch === null || input.currentEpoch === undefined || entry.epoch <= input.currentEpoch)
  );
  const currentScene = memories.at(-1) ?? null;
  const queryLiteralTerms = unique([
    ...input.queryIntent.query_terms,
    ...input.queryIntent.target_file_folder_terms,
    ...input.queryIntent.target_app_terms,
    ...input.queryIntent.target_window_terms,
    ...input.queryIntent.target_object_terms,
    ...input.queryIntent.target_activity_terms,
    ...input.queryIntent.target_intent_terms,
    ...(input.queryIntent.bound_query_terms ?? []),
  ].flatMap(normalizedTerms));
  const expandedQueryTerms = unique([
    ...queryLiteralTerms,
    ...semanticTermsFor(queryLiteralTerms),
    ...(input.queryIntent.relative_time === "last_folder_scene" ? ["folder", "file explorer", "directory"] : []),
  ]);
  const candidatePool = memories.filter((entry) => !currentScene || entry.scene_memory_id !== currentScene.scene_memory_id);
  const threshold = input.queryIntent.strength === "soft" ? 25 : 50;
  const scored = candidatePool
    .map((entry) => {
      const searchTerms = sceneSearchTerms(entry);
      const haystack = ` ${searchTerms.join(" ")} `;
      const exactTitleMatch = queryLiteralTerms.some((term) =>
        normalizedTerms(entry.visible_title).includes(term) ||
        entry.window_title_hints.flatMap(normalizedTerms).includes(term)
      );
      const folderFilePhraseMatch = queryLiteralTerms.some((term) =>
        entry.normalized_path_terms.includes(term) ||
        entry.file_folder_terms.flatMap(normalizedTerms).includes(term)
      );
      const appSurfaceMatch = input.queryIntent.target_app_terms.some((term) =>
        normalizedTerms(entry.app_or_surface).includes(normalizePhrase(term)) ||
        entry.app_hints.flatMap(normalizedTerms).includes(normalizePhrase(term))
      );
      const matchedTerms = unique(expandedQueryTerms.filter((term) =>
        haystack.includes(` ${term} `) || haystack.includes(term)
      ));
      const objectMatches = input.queryIntent.target_object_terms.filter((term) => haystack.includes(normalizePhrase(term))).length;
      const activityMatches = input.queryIntent.target_activity_terms.filter((term) => haystack.includes(normalizePhrase(term))).length;
      const intentMatches = input.queryIntent.target_intent_terms.filter((term) => haystack.includes(normalizePhrase(term))).length;
      const recencyBonus =
        input.queryIntent.relative_time === "last_matching" || input.queryIntent.relative_time === "last_folder_scene"
          ? Math.max(0, Math.min(20, entry.epoch))
          : 0;
      const evidenceQualityBonus = Math.min(15, entry.evidence_refs.length * 2);
      const sessionBindingBonus = input.queryIntent.semantic_binding_refs?.includes(entry.scene_memory_id) ? 70 : 0;
      const sceneKindMismatch =
        input.queryIntent.target_scene_kind &&
        input.queryIntent.target_scene_kind !== "unknown" &&
        entry.scene_kind !== input.queryIntent.target_scene_kind;
      const missingEvidencePenalty = entry.evidence_refs.length === 0 ? 100 : 0;
      const ambiguityPenalty = matchedTerms.length === 0 && input.queryIntent.relative_time !== "last_folder_scene" ? 20 : 0;
      const kindBonus =
        input.queryIntent.target_scene_kind &&
        input.queryIntent.target_scene_kind !== "unknown" &&
        entry.scene_kind === input.queryIntent.target_scene_kind
          ? 25
          : 0;
      const score =
        (exactTitleMatch ? 50 : 0) +
        (folderFilePhraseMatch ? 45 : 0) +
        (appSurfaceMatch ? 35 : 0) +
        kindBonus +
        (matchedTerms.length * 12) +
        (objectMatches * 12) +
        (activityMatches * 10) +
        (intentMatches * 8) +
        sessionBindingBonus +
        recencyBonus +
        evidenceQualityBonus -
        (sceneKindMismatch ? 35 : 0) -
        ambiguityPenalty -
        missingEvidencePenalty;
      return {
        scene_memory: entry,
        score,
        matched_terms: matchedTerms,
        rejection_reason: missingEvidencePenalty
          ? "missing_evidence_refs"
          : sceneKindMismatch
            ? "wrong_scene_kind"
            : score < threshold
              ? "insufficient_term_overlap"
              : "lower_score_than_selected_scene",
      };
    })
    .sort((a, b) =>
      b.score - a.score ||
      b.matched_terms.length - a.matched_terms.length ||
      b.scene_memory.epoch - a.scene_memory.epoch ||
      b.scene_memory.evidence_refs.length - a.scene_memory.evidence_refs.length ||
      b.scene_memory.timestamp.localeCompare(a.scene_memory.timestamp)
    );
  const eligible = scored.filter((entry) => entry.score >= threshold);
  const selectedLimited = eligible.slice(0, Math.max(1, Math.min(5, input.limit ?? 3)));
  const rejectedCandidates = scored
    .filter((entry) => !selectedLimited.some((selected) => selected.scene_memory.scene_memory_id === entry.scene_memory.scene_memory_id))
    .slice(0, 5)
    .map((entry) => ({
      scene_memory_ref: entry.scene_memory.scene_memory_id,
      reason: entry.rejection_reason as "lower_score_than_selected_scene" | "wrong_scene_kind" | "wrong_app_or_surface" | "outside_anchor_window" | "insufficient_term_overlap" | "future_or_post_anchor" | "missing_evidence_refs",
      score: entry.score,
      matched_terms: entry.matched_terms,
      evidence_refs: entry.scene_memory.evidence_refs,
    }));
  const evidenceRefs = unique([
    ...(input.queryIntent.requires_current_scene ? evidenceBundleForScene(currentScene) : []),
    ...selectedLimited.flatMap((entry) => evidenceBundleForScene(entry.scene_memory)),
  ]).slice(0, 80);
  const selectionPolicy: HelixSelectedVisualSceneSet["selection_policy"] =
    selectedLimited.length === 0 ? "no_match" :
    input.queryIntent.relative_time === "last_folder_scene" ? "last_kind_match" :
    selectedLimited[0].matched_terms.some((term) => normalizedTerms(selectedLimited[0].scene_memory.visible_title).includes(term))
      ? "exact_title_first"
      : "semantic_terms_with_recency";
  return {
    schema: HELIX_SELECTED_VISUAL_SCENE_SET_SCHEMA,
    selection_id: `selected_visual_scene_set:${hashShort([input.turnId, input.queryIntent.query_intent_id, selectedLimited.map((entry) => entry.scene_memory.scene_memory_id)])}`,
    turn_id: input.turnId,
    thread_id: input.threadId,
    query_intent_id: input.queryIntent.query_intent_id,
    selected_scenes: selectedLimited,
    current_scene: currentScene,
    current_scene_ref: currentScene?.scene_memory_id ?? null,
    candidate_pool_size: candidatePool.length,
    source_target_ref: "procedure_memory:situation_epoch",
    selection_policy: selectionPolicy,
    selection_reason: selectedLimited.length > 0 ? "matched_scene_memory_terms" : "no_scene_memory_match",
    confidence: selectedLimited.length > 0 ? Math.min(0.95, 0.45 + Math.max(1, selectedLimited[0].matched_terms.length) * 0.12) : 0.2,
    evidence_refs: evidenceRefs,
    rejected_candidates: rejectedCandidates,
    missing_evidence: [
      input.queryIntent.requires_current_scene && !currentScene ? "current_visual_scene_memory_missing" : null,
      selectedLimited.length === 0 ? "prior_scene_match_missing" : null,
    ].filter(Boolean) as string[],
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
  if (!input.queryIntent.compare_to_current) return null;
  const current = input.selectedSceneSet.current_scene ?? null;
  const previous = input.selectedSceneSet.selected_scenes[0]?.scene_memory ?? null;
  if (!current || !previous) return null;
  const priorEvidenceRefs = evidenceBundleForScene(previous);
  const currentEvidenceRefs = evidenceBundleForScene(current);
  if (priorEvidenceRefs.length === 0 || currentEvidenceRefs.length === 0) return null;
  const previousTerms = sceneSearchTerms(previous);
  const currentTerms = sceneSearchTerms(current);
  const sharedTerms = currentTerms.filter((term) => previousTerms.includes(term)).slice(0, 30);
  const addedTerms = currentTerms.filter((term) => !previousTerms.includes(term)).slice(0, 30);
  const removedTerms = previousTerms.filter((term) => !currentTerms.includes(term)).slice(0, 30);
  const sharedTraits = unique([
    current.app_or_surface && previous.app_or_surface && current.app_or_surface === previous.app_or_surface ? current.app_or_surface : null,
    ...current.objects.filter((entry) => previous.objects.includes(entry)),
    ...sharedTerms.filter((term) => ["folder", "file explorer", "task manager", "camera roll", "audio export", "sun", "solar"].includes(term)),
  ]).slice(0, 8);
  const changedObjects = unique([
    ...previous.objects.filter((entry) => !current.objects.includes(entry)).map((entry) => `removed: ${entry}`),
    ...current.objects.filter((entry) => !previous.objects.includes(entry)).map((entry) => `added: ${entry}`),
  ]).slice(0, 12);
  const unchangedObjects = current.objects.filter((entry) => previous.objects.includes(entry)).slice(0, 12);
  const changedActivity = previous.activity_summary !== current.activity_summary
    ? [`from ${previous.activity_summary} to ${current.activity_summary}`]
    : [];
  const changedAppOrWindow = unique([
    current.app_or_surface !== previous.app_or_surface
      ? `app/surface changed from ${previous.app_or_surface ?? "unknown"} to ${current.app_or_surface ?? "unknown"}`
      : null,
    current.visible_title !== previous.visible_title
      ? `visible title changed from ${previous.visible_title ?? "unknown"} to ${current.visible_title ?? "unknown"}`
      : null,
  ]);
  const changedUserFocus = unique([
    previous.file_names.length || current.file_names.length
      ? `visible files changed from ${previous.file_names.slice(0, 5).join(", ") || "unspecified"} to ${current.file_names.slice(0, 5).join(", ") || "unspecified"}`
      : null,
  ]);
  const differences = unique([
    ...changedAppOrWindow,
    ...changedUserFocus,
    ...changedActivity.map((entry) => `activity changed ${entry}`),
    ...changedObjects,
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
    changed_objects: changedObjects,
    unchanged_objects: unchangedObjects,
    changed_activity: changedActivity,
    changed_app_or_window: changedAppOrWindow,
    changed_user_focus: changedUserFocus,
    added_terms: addedTerms,
    removed_terms: removedTerms,
    shared_terms: sharedTerms,
    prior_scene_evidence_refs: priorEvidenceRefs,
    current_scene_evidence_refs: currentEvidenceRefs,
    confidence: input.selectedSceneSet.confidence,
    shared_traits: sharedTraits,
    differences,
    evidence_refs: unique([...priorEvidenceRefs, ...currentEvidenceRefs]).slice(0, 80),
    missing_evidence: input.selectedSceneSet.missing_evidence,
    next_check: "Capture another visual epoch before comparing future changes.",
    role: "validation",
    assistant_answer: false,
    raw_content_included: false,
  };
}

export function resetVisualSceneMemoryForTest(): void {
  sceneMemoryByRun.clear();
}
