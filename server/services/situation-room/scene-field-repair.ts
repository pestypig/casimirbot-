import crypto from "node:crypto";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";

export type AppWindowAppId =
  | "windows_task_manager"
  | "file_explorer"
  | "browser"
  | "calculator"
  | "unknown_app";

export type EvidenceRef = {
  id?: string;
  kind:
    | "ocr_text"
    | "visual_region"
    | "window_title"
    | "ui_layout"
    | "detector"
    | "prior_frame"
    | "model_reasoning";
  text?: string;
  bbox?: [number, number, number, number];
  field?: string;
  score?: number;
  source_frame_id?: string;
  timestamp_ms?: number;
};

export type AppWindowClassification = {
  app_id: AppWindowAppId;
  app_name: string | null;
  window_title?: string | null;
  active_tab_or_pane?: string | null;
  confidence: number;
  evidence_refs: EvidenceRef[];
  caveats?: string[];
};

export type ContradictionRef = {
  id: string;
  contradiction_type:
    | "cross_app_object"
    | "app_activity_mismatch"
    | "summary_field_mismatch"
    | "low_evidence_hallucination"
    | "impossible_ui_element";
  severity: "low" | "medium" | "high";
  trusted_field: string;
  contradicted_field: string;
  trusted_claim: string;
  contradicted_claim: string;
  reason: string;
  evidence_refs: EvidenceRef[];
};

export type SceneFields = {
  scene_summary?: string;
  activity?: string;
  objects?: string[];
  visible_text?: string[];
  screen_type?: string;
  memory_tags?: string[];
  voice_callout_candidates?: VoiceCalloutCandidate[];
  app_window?: AppWindowClassification;
  caveats?: string[];
  activity_confidence?: number;
  objects_confidence?: number;
  scene_summary_confidence?: number;
  [key: string]: unknown;
};

export type FieldConfidenceChange = {
  field: keyof SceneFields;
  old_confidence: number | null;
  new_confidence: number;
  reason: string;
  contradiction_refs?: string[];
};

export type FieldRepairArtifact = {
  assistant_answer: false;
  source_frame_id: string;
  repaired_fields: Partial<SceneFields>;
  original_fields: Partial<SceneFields>;
  app_window: AppWindowClassification;
  contradiction_refs: ContradictionRef[];
  evidence_refs: EvidenceRef[];
  confidence_changes: FieldConfidenceChange[];
  repair_method:
    | "field_rerun"
    | "deterministic_replacement"
    | "downgrade_only"
    | "no_repair_needed";
  verified_fields: string[];
  caveated_fields: string[];
};

export type VoiceCalloutCandidate = {
  text: string;
  uses_verified_fields_only: true;
  confidence: number;
  caveats?: string[];
};

export type RepairInput = {
  frameId: string;
  initialFields: SceneFields;
  ocrEvidence?: EvidenceRef[];
  visualEvidence?: EvidenceRef[];
  previousScene?: { app_window?: AppWindowClassification } | null;
};

export type RepairOutput = {
  repairedFields: SceneFields;
  repairArtifact: FieldRepairArtifact;
};

type VocabularySpec = {
  appName: string;
  activity: string;
  activityCaveat?: string;
  canonicalObjects: string[];
  objectPatterns: RegExp[];
  activityMismatch: RegExp[];
};

const repairArtifactsByFrame = new Map<string, FieldRepairArtifact[]>();

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const unique = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const normalize = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .replace(/url\s+bar/g, "address bar")
    .replace(/\bweb page\b/g, "webpage")
    .replace(/[^a-z0-9+._:/-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const textOfFields = (fields: SceneFields, includeDownstream = false): string =>
  [
    fields.scene_summary,
    fields.activity,
    ...(fields.visible_text ?? []),
    fields.screen_type,
    includeDownstream ? fields.objects?.join(" ") : null,
  ].filter(Boolean).join(" ");

const evidenceText = (evidence: EvidenceRef[]): string =>
  evidence.map((entry) => entry.text ?? "").filter(Boolean).join(" ");

const evidenceForTerm = (
  term: string,
  input: {
    evidence: EvidenceRef[];
    fallbackText: string;
    field?: string;
    sourceFrameId?: string;
    score?: number;
  },
): EvidenceRef | null => {
  const normalizedTerm = normalize(term);
  const explicit = input.evidence.find((entry) => normalize(entry.text).includes(normalizedTerm));
  if (explicit) return { ...explicit, field: explicit.field ?? input.field, score: explicit.score ?? input.score ?? 0.72 };
  if (!normalize(input.fallbackText).includes(normalizedTerm)) return null;
  return {
    kind: "ocr_text",
    text: term,
    field: input.field,
    score: input.score ?? 0.72,
    source_frame_id: input.sourceFrameId,
  };
};

const scoreEvidenceTerms = (
  terms: Array<{ term: string; weight: number; field?: string }>,
  text: string,
  evidence: EvidenceRef[],
  sourceFrameId?: string,
): { score: number; refs: EvidenceRef[] } => {
  const refs: EvidenceRef[] = [];
  let score = 0;
  for (const entry of terms) {
    const ref = evidenceForTerm(entry.term, {
      evidence,
      fallbackText: text,
      field: entry.field,
      sourceFrameId,
      score: Math.min(0.96, 0.62 + entry.weight / 8),
    });
    if (!ref) continue;
    refs.push(ref);
    score += entry.weight;
  }
  return { score, refs };
};

const VOCABULARY: Record<AppWindowAppId, VocabularySpec> = {
  windows_task_manager: {
    appName: "Windows Task Manager",
    activity: "viewing Windows Task Manager resource or user information",
    activityCaveat: "The exact active tab is unclear.",
    canonicalObjects: [
      "Windows Task Manager",
      "Processes tab",
      "Performance tab",
      "App history tab",
      "Startup apps tab",
      "Users tab",
      "Details tab",
      "Services tab",
      "CPU metrics",
      "Memory metrics",
      "Disk metrics",
      "Network metrics",
      "GPU metrics",
      "user row",
      "process row",
      "resource columns",
      "usage graph",
      "percentage column",
      "status column",
    ],
    objectPatterns: [
      /\bwindows\s+task\s+manager\b/i,
      /\btask\s+manager\b/i,
      /\bperformance\s+tab\b/i,
      /\busers\s+tab\b/i,
      /\bcpu\s+(?:metrics|panel)\b/i,
      /\bmemory\s+(?:metrics|panel)\b/i,
      /\bdisk\s+(?:metrics|panel)\b/i,
      /\bnetwork\s+metrics\b/i,
      /\bgpu\s+(?:metrics|panels?)\b/i,
      /\bresource\s+columns?\b/i,
    ],
    activityMismatch: [/\bbrows(?:ing|e)\b/i, /\bweb\s?page\b/i, /\bbrowser\s+tab\b/i, /\bspreadsheet\b/i],
  },
  file_explorer: {
    appName: "File Explorer",
    activity: "browsing files or folders in File Explorer",
    canonicalObjects: [
      "File Explorer",
      "navigation pane",
      "address bar",
      "breadcrumb path",
      "folder list",
      "file list",
      "file row",
      "folder row",
      "details pane",
      "preview pane",
      "search box",
      "details columns",
      "Name column",
      "Date modified column",
      "Type column",
      "Size column",
      "This PC",
      "Downloads folder",
      "Documents folder",
      "Desktop folder",
      "drive entry",
    ],
    objectPatterns: [
      /\bfile\s+explorer\b/i,
      /\bnavigation\s+pane\b/i,
      /\bbreadcrumb\s+path\b/i,
      /\bfolder\s+list\b/i,
      /\bfile\s+list\b/i,
      /\bdetails\s+columns?\b/i,
      /\bthis\s+pc\b/i,
    ],
    activityMismatch: [/\bweb\s?page\b/i, /\bbrowser\s+tab\b/i, /\bwebsite\b/i],
  },
  browser: {
    appName: "web browser",
    activity: "viewing a web page",
    canonicalObjects: [
      "web browser",
      "browser tab",
      "address bar",
      "URL bar",
      "webpage",
      "page heading",
      "link",
      "button",
      "search field",
      "bookmark bar",
      "toolbar",
      "back button",
      "forward button",
      "reload button",
      "extension icon",
      "scrollbar",
      "cookie banner",
    ],
    objectPatterns: [
      /\bweb\s+browser\b/i,
      /\bbrowser\s+tab\b/i,
      /\baddress\s+bar\b/i,
      /\burl\s+bar\b/i,
      /\bweb\s?page\b/i,
      /\blink\b/i,
      /\bbookmark\s+bar\b/i,
      /\breload\s+button\b/i,
    ],
    activityMismatch: [/\bfiles?\s+in\s+a\s+folder\b/i, /\bfolder\s+view\b/i, /\bfile\s+explorer\b/i, /\bspreadsheet\b/i],
  },
  calculator: {
    appName: "Windows Calculator",
    activity: "using or viewing Windows Calculator",
    canonicalObjects: [
      "Windows Calculator",
      "calculator display",
      "numeric keypad",
      "operator buttons",
      "equals button",
      "clear button",
      "memory buttons",
      "history panel",
      "Standard mode",
      "Scientific mode",
      "calculation result",
      "decimal button",
      "backspace button",
    ],
    objectPatterns: [
      /\bwindows\s+calculator\b/i,
      /\bcalculator\s+display\b/i,
      /\bnumeric\s+keypad\b/i,
      /\boperator\s+buttons?\b/i,
      /\bequals\s+button\b/i,
      /\bstandard\s+mode\b/i,
      /\bscientific\s+mode\b/i,
    ],
    activityMismatch: [/\bspreadsheet\b/i, /\bformula\s+bar\b/i, /\bweb\s?page\b/i, /\bbrowser\s+tab\b/i, /\bfolder\b/i],
  },
  unknown_app: {
    appName: "unknown app",
    activity: "inspecting an application window",
    canonicalObjects: [
      "application window",
      "toolbar",
      "menu",
      "panel",
      "text field",
      "button",
      "list",
      "table",
      "row",
      "column",
      "dialog",
      "status area",
      "unknown app content",
    ],
    objectPatterns: [
      /\bapplication\s+window\b/i,
      /\btoolbar\b/i,
      /\bpanel\b/i,
      /\bbutton\b/i,
      /\bstatus\s+area\b/i,
      /\bunknown\s+app\s+content\b/i,
    ],
    activityMismatch: [],
  },
};

const APP_TERMS: Record<AppWindowAppId, Array<{ term: string; weight: number; field?: string }>> = {
  windows_task_manager: [
    { term: "Windows Task Manager", weight: 5, field: "window_title" },
    { term: "Task Manager", weight: 4, field: "window_title" },
    { term: "Processes", weight: 1.4, field: "active_tab_or_pane" },
    { term: "Performance", weight: 1.8, field: "active_tab_or_pane" },
    { term: "Users", weight: 1.8, field: "active_tab_or_pane" },
    { term: "CPU", weight: 1.1, field: "objects" },
    { term: "Memory", weight: 1.1, field: "objects" },
    { term: "Disk", weight: 1.1, field: "objects" },
    { term: "Network", weight: 1.1, field: "objects" },
    { term: "GPU", weight: 1.1, field: "objects" },
  ],
  file_explorer: [
    { term: "File Explorer", weight: 5, field: "window_title" },
    { term: "Windows Explorer", weight: 4, field: "window_title" },
    { term: "This PC", weight: 2, field: "active_tab_or_pane" },
    { term: "Downloads", weight: 1.5, field: "active_tab_or_pane" },
    { term: "Name", weight: 0.9, field: "objects" },
    { term: "Date modified", weight: 1.3, field: "objects" },
    { term: "Type", weight: 0.9, field: "objects" },
    { term: "Size", weight: 0.9, field: "objects" },
  ],
  browser: [
    { term: "https://", weight: 4, field: "window_title" },
    { term: "http://", weight: 3.5, field: "window_title" },
    { term: "Chrome", weight: 3, field: "window_title" },
    { term: "Firefox", weight: 3, field: "window_title" },
    { term: "Edge", weight: 3, field: "window_title" },
    { term: "Back", weight: 1, field: "objects" },
    { term: "Reload", weight: 1.4, field: "objects" },
    { term: "Bookmarks", weight: 1.2, field: "objects" },
    { term: "Search", weight: 0.8, field: "objects" },
    { term: "Sign in", weight: 0.8, field: "objects" },
  ],
  calculator: [
    { term: "Windows Calculator", weight: 5, field: "window_title" },
    { term: "Calculator", weight: 3.5, field: "window_title" },
    { term: "Standard", weight: 2, field: "active_tab_or_pane" },
    { term: "Scientific", weight: 2, field: "active_tab_or_pane" },
    { term: "MC", weight: 1.1, field: "objects" },
    { term: "MR", weight: 1.1, field: "objects" },
    { term: "M+", weight: 1.1, field: "objects" },
    { term: "=", weight: 1.5, field: "objects" },
  ],
  unknown_app: [],
};

const appSpecificTerms: Array<{ appId: AppWindowAppId; term: string; pattern: RegExp }> = Object.entries(VOCABULARY)
  .filter(([appId]) => appId !== "unknown_app")
  .flatMap(([appId, spec]) => spec.canonicalObjects.map((term) => ({
    appId: appId as AppWindowAppId,
    term,
    pattern: new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s+")}\\b`, "i"),
  })));

const spreadsheetPatterns = [
  /\bspreadsheet\s+cells?\b/i,
  /\bformula\s+bar\b/i,
  /\bworksheet\b/i,
];

export function classifyAppWindow(input: RepairInput): AppWindowClassification {
  const evidence = [...(input.ocrEvidence ?? []), ...(input.visualEvidence ?? [])];
  const text = `${textOfFields(input.initialFields, false)} ${evidenceText(evidence)}`;
  const scored = (Object.keys(APP_TERMS) as AppWindowAppId[])
    .filter((appId) => appId !== "unknown_app")
    .map((appId) => {
      const termScore = scoreEvidenceTerms(APP_TERMS[appId], text, evidence, input.frameId);
      const previousBonus = input.previousScene?.app_window?.app_id === appId && (input.previousScene.app_window.confidence ?? 0) > 0.7 ? 1.2 : 0;
      return {
        appId,
        score: termScore.score + previousBonus,
        refs: termScore.refs,
      };
    })
    .sort((a, b) => b.score - a.score);
  const best = scored[0] ?? { appId: "unknown_app" as const, score: 0, refs: [] };
  const runnerUp = scored[1]?.score ?? 0;
  const strongEnough = best.score >= 3.2 && best.score >= runnerUp + 1;
  const appId: AppWindowAppId = strongEnough ? best.appId : "unknown_app";
  const confidence = appId === "unknown_app"
    ? clamp(best.score > 0 ? 0.28 + Math.min(best.score, 2.5) / 12 : 0.24)
    : clamp(0.48 + best.score / 16);
  const normalizedText = normalize(text);
  const paneTerms = {
    windows_task_manager: ["Processes", "Performance", "Users", "Details", "Services", "Startup apps"],
    file_explorer: ["This PC", "Downloads", "Documents", "Desktop"],
    browser: ["webpage"],
    calculator: ["Standard", "Scientific"],
    unknown_app: [],
  } satisfies Record<AppWindowAppId, string[]>;
  const panes = paneTerms[appId].filter((term) => normalizedText.includes(normalize(term)));
  const activeTabOrPane = panes.length > 1 ? panes.join(" or ") : panes[0] ?? null;
  const caveats = panes.length > 1
    ? [`The exact active tab is ambiguous between ${panes.join(" and ")}.`]
    : [];
  const appName = appId === "unknown_app" ? null : VOCABULARY[appId].appName;
  const titleRef = best.refs.find((entry) => entry.field === "window_title") ?? best.refs[0] ?? null;
  return {
    app_id: appId,
    app_name: appName,
    window_title: appName && titleRef ? appName : null,
    active_tab_or_pane: activeTabOrPane,
    confidence,
    evidence_refs: appId === "unknown_app" ? best.refs.slice(0, 3) : best.refs.slice(0, 12),
    ...(caveats.length ? { caveats } : {}),
  };
}

const objectContradictions = (fields: SceneFields, appWindow: AppWindowClassification, evidence: EvidenceRef[], frameId: string): ContradictionRef[] => {
  const objects = fields.objects ?? [];
  const objectText = objects.join(", ");
  const fieldText = `${textOfFields(fields, false)} ${evidenceText(evidence)}`;
  const refs = appWindow.evidence_refs.length > 0 ? appWindow.evidence_refs : evidence.slice(0, 3);
  const contradictions: ContradictionRef[] = [];
  const add = (type: ContradictionRef["contradiction_type"], claim: string, reason: string, field = "objects", severity: ContradictionRef["severity"] = "high") => {
    contradictions.push({
      id: `contradiction_${field}_${hashShort([frameId, appWindow.app_id, claim, type], 12)}`,
      contradiction_type: type,
      severity,
      trusted_field: "app_window.app_id",
      contradicted_field: field,
      trusted_claim: appWindow.app_name ?? "unknown app",
      contradicted_claim: claim,
      reason,
      evidence_refs: refs,
    });
  };
  if (objects.length === 0) return contradictions;
  for (const object of objects) {
    const normalizedObject = normalize(object);
    const matched = appSpecificTerms.find((entry) => entry.pattern.test(object) || normalize(entry.term) === normalizedObject);
    const supportedByClassifiedApp =
      appWindow.app_id !== "unknown_app" &&
      VOCABULARY[appWindow.app_id].objectPatterns.some((pattern) => pattern.test(object));
    const unsupportedByEvidence = !normalize(fieldText).includes(normalizedObject);
    if (matched && appWindow.app_id !== "unknown_app" && matched.appId !== appWindow.app_id && !supportedByClassifiedApp) {
      add(
        "cross_app_object",
        object,
        `${matched.term} is ${VOCABULARY[matched.appId].appName} vocabulary and contradicts high-confidence ${appWindow.app_name} classification.`,
      );
    } else if (appWindow.app_id === "unknown_app" && matched && unsupportedByEvidence) {
      add(
        "low_evidence_hallucination",
        object,
        `${matched.term} is app-specific vocabulary without independent visual evidence in an unknown app scene.`,
        "objects",
        "medium",
      );
    }
    if (appWindow.app_id === "calculator" && spreadsheetPatterns.some((pattern) => pattern.test(object))) {
      add("impossible_ui_element", object, "Spreadsheet-specific objects are incompatible with Windows Calculator evidence.");
    }
  }
  if (appWindow.app_id !== "unknown_app" && appWindow.confidence >= 0.65) {
    const appSpec = VOCABULARY[appWindow.app_id];
    const hasAppVocabulary = objects.some((object) => appSpec.objectPatterns.some((pattern) => pattern.test(object)));
    const hasForeignVocabulary = contradictions.some((entry) => entry.contradicted_field === "objects");
    if (!hasAppVocabulary && hasForeignVocabulary) {
      add(
        "summary_field_mismatch",
        objectText,
        "The scene summary and app/window classifier identify a different application than the objects field.",
        "objects",
        "high",
      );
    }
  }
  return contradictions;
};

const activityContradictions = (fields: SceneFields, appWindow: AppWindowClassification, evidence: EvidenceRef[], frameId: string): ContradictionRef[] => {
  const activity = fields.activity ?? "";
  if (!activity.trim() || appWindow.app_id === "unknown_app") return [];
  if (!VOCABULARY[appWindow.app_id].activityMismatch.some((pattern) => pattern.test(activity))) return [];
  return [{
    id: `contradiction_activity_${hashShort([frameId, appWindow.app_id, activity], 12)}`,
    contradiction_type: "app_activity_mismatch",
    severity: appWindow.confidence >= 0.65 ? "high" : "medium",
    trusted_field: "app_window.app_id",
    contradicted_field: "activity",
    trusted_claim: appWindow.app_name ?? appWindow.app_id,
    contradicted_claim: activity,
    reason: `The activity claims another app/use pattern without matching ${appWindow.app_name ?? appWindow.app_id} evidence.`,
    evidence_refs: appWindow.evidence_refs.length > 0 ? appWindow.evidence_refs : evidence.slice(0, 3),
  }];
};

export function detectFieldContradictions(input: {
  fields: SceneFields;
  appWindow: AppWindowClassification;
  evidence: EvidenceRef[];
  frameId: string;
}): ContradictionRef[] {
  return [
    ...objectContradictions(input.fields, input.appWindow, input.evidence, input.frameId),
    ...activityContradictions(input.fields, input.appWindow, input.evidence, input.frameId),
  ];
}

const confidenceCapFor = (appWindow: AppWindowClassification): number =>
  appWindow.app_id === "unknown_app"
    ? 0.5
    : appWindow.confidence >= 0.75
      ? 0.2
      : appWindow.confidence >= 0.55
        ? 0.35
        : 0.5;

const objectsForApp = (appWindow: AppWindowClassification, evidence: EvidenceRef[], fields: SceneFields): string[] => {
  const text = normalize(`${textOfFields(fields, false)} ${evidenceText(evidence)}`);
  if (appWindow.app_id === "windows_task_manager") {
    return unique([
      "Windows Task Manager",
      text.includes("processes") ? "Processes tab" : null,
      text.includes("performance") ? "Performance tab" : null,
      text.includes("users") ? "Users tab" : null,
      text.includes("details") ? "Details tab" : null,
      text.includes("services") ? "Services tab" : null,
      text.includes("cpu") ? "CPU metrics" : null,
      text.includes("memory") ? "Memory metrics" : null,
      text.includes("disk") ? "Disk metrics" : null,
      text.includes("network") || text.includes("ethernet") ? "Network metrics" : null,
      text.includes("gpu") ? "GPU metrics" : null,
      text.includes("users") ? "user row" : null,
      text.includes("processes") ? "process row" : null,
      /cpu|memory|disk|network|ethernet|gpu|percent|resource/.test(text) ? "resource columns" : null,
      /graph|performance/.test(text) ? "usage graph" : null,
    ]);
  }
  if (appWindow.app_id === "file_explorer") {
    return unique([
      "File Explorer",
      "navigation pane",
      text.includes("address") ? "address bar" : "breadcrumb path",
      /folder|downloads|documents|desktop|this pc/.test(text) ? "folder list" : null,
      /file|name|date modified|type|size/.test(text) ? "file list" : null,
      /name|date modified|type|size/.test(text) ? "details columns" : null,
      text.includes("name") ? "Name column" : null,
      text.includes("date modified") ? "Date modified column" : null,
      text.includes("type") ? "Type column" : null,
      text.includes("size") ? "Size column" : null,
      text.includes("this pc") ? "This PC" : null,
      text.includes("downloads") ? "Downloads folder" : null,
      text.includes("documents") ? "Documents folder" : null,
      text.includes("desktop") ? "Desktop folder" : null,
    ]);
  }
  if (appWindow.app_id === "browser") {
    return unique([
      "web browser",
      "browser tab",
      "address bar",
      "webpage",
      /heading|title/.test(text) ? "page heading" : null,
      /\blink\b/.test(text) ? "link" : null,
      /\bbutton\b/.test(text) ? "button" : null,
      /\bsearch\b/.test(text) ? "search field" : null,
      /bookmark/.test(text) ? "bookmark bar" : null,
      "toolbar",
      /back/.test(text) ? "back button" : null,
      /forward/.test(text) ? "forward button" : null,
      /reload/.test(text) ? "reload button" : null,
    ]);
  }
  if (appWindow.app_id === "calculator") {
    return unique([
      "Windows Calculator",
      "calculator display",
      "numeric keypad",
      "operator buttons",
      "equals button",
      /clear|mc|mr|m\+/.test(text) ? "clear button" : null,
      /mc|mr|m\+|m-/.test(text) ? "memory buttons" : null,
      text.includes("standard") ? "Standard mode" : null,
      text.includes("scientific") ? "Scientific mode" : null,
      /\b0\b|\b1\b|\b2\b|\b3\b|\b4\b|\b5\b|\b6\b|\b7\b|\b8\b|\b9\b/.test(text) ? "calculation result" : null,
      /\./.test(text) ? "decimal button" : null,
      /backspace/.test(text) ? "backspace button" : null,
    ]);
  }
  return unique([
    "application window",
    /toolbar/.test(text) ? "toolbar" : null,
    /menu/.test(text) ? "menu" : null,
    /panel/.test(text) ? "panel" : null,
    /text|field|input/.test(text) ? "text field" : null,
    /button/.test(text) ? "button" : null,
    /list/.test(text) ? "list" : null,
    /table/.test(text) ? "table" : null,
    /row/.test(text) ? "row" : null,
    /column/.test(text) ? "column" : null,
    /dialog/.test(text) ? "dialog" : null,
    /status/.test(text) ? "status area" : null,
    "unknown app content",
  ]).slice(0, 8);
};

const repairedSceneSummary = (appWindow: AppWindowClassification): string | null => {
  if (appWindow.app_id === "unknown_app") return null;
  if (appWindow.app_id === "windows_task_manager") {
    return "Windows Task Manager is open, with visible resource or user-related information.";
  }
  if (appWindow.app_id === "file_explorer") return "File Explorer is open to a folder or file view.";
  if (appWindow.app_id === "browser") return "A web browser is open to a webpage.";
  if (appWindow.app_id === "calculator") return "Windows Calculator is open.";
  return null;
};

const buildConfidenceChanges = (input: {
  fields: SceneFields;
  appWindow: AppWindowClassification;
  contradictions: ContradictionRef[];
  repairedObjects: boolean;
  repairedActivity: boolean;
  objectsConfidence: number;
  activityConfidence: number;
}): FieldConfidenceChange[] => {
  const changes: FieldConfidenceChange[] = [];
  const objectContradictions = input.contradictions.filter((entry) => entry.contradicted_field === "objects");
  const activityContradictions = input.contradictions.filter((entry) => entry.contradicted_field === "activity");
  if (objectContradictions.length) {
    const downgraded = confidenceCapFor(input.appWindow);
    changes.push({
      field: "objects",
      old_confidence: typeof input.fields.objects_confidence === "number" ? input.fields.objects_confidence : null,
      new_confidence: input.repairedObjects ? input.objectsConfidence : downgraded,
      reason: input.repairedObjects
        ? `Original objects contradicted app identity; replacement uses ${input.appWindow.app_name ?? "generic"} vocabulary supported by visible evidence.`
        : "Objects were downgraded because the field lacks independent evidence.",
      contradiction_refs: objectContradictions.map((entry) => entry.id),
    });
  }
  if (activityContradictions.length) {
    changes.push({
      field: "activity",
      old_confidence: typeof input.fields.activity_confidence === "number" ? input.fields.activity_confidence : null,
      new_confidence: input.activityConfidence,
      reason: input.repairedActivity
        ? "Activity repaired to app-consistent wording while preserving caveats where identity is ambiguous."
        : "Activity confidence lowered because it conflicts with app/window identity.",
      contradiction_refs: activityContradictions.map((entry) => entry.id),
    });
  }
  return changes;
};

export function repairSceneFields(input: RepairInput): RepairOutput {
  const evidence = [...(input.ocrEvidence ?? []), ...(input.visualEvidence ?? [])];
  const appWindow = classifyAppWindow(input);
  const contradictions = detectFieldContradictions({
    fields: input.initialFields,
    appWindow,
    evidence,
    frameId: input.frameId,
  });
  const objectContradicted = contradictions.some((entry) => entry.contradicted_field === "objects");
  const activityContradicted = contradictions.some((entry) => entry.contradicted_field === "activity");
  const appKnown = appWindow.app_id !== "unknown_app";
  const caveats = unique([
    ...(input.initialFields.caveats ?? []),
    ...(appWindow.caveats ?? []),
    activityContradicted && VOCABULARY[appWindow.app_id].activityCaveat ? VOCABULARY[appWindow.app_id].activityCaveat : null,
    appWindow.app_id === "unknown_app" && objectContradicted ? "The app identity is unclear; specific app objects were replaced with generic UI terms only." : null,
  ]);
  const shouldRepairObjects = objectContradicted || (appKnown && (input.initialFields.objects ?? []).length === 0);
  const shouldRepairActivity = activityContradicted;
  const objects = shouldRepairObjects
    ? objectsForApp(appWindow, evidence, input.initialFields)
    : input.initialFields.objects ?? [];
  const activity = shouldRepairActivity
    ? VOCABULARY[appWindow.app_id].activity
    : input.initialFields.activity ?? VOCABULARY[appWindow.app_id].activity;
  const objectsConfidence = shouldRepairObjects
    ? appWindow.app_id === "unknown_app"
      ? 0.48
      : caveats.length > 0
        ? 0.68
        : 0.78
    : input.initialFields.objects_confidence ?? 0.7;
  const activityConfidence = shouldRepairActivity
    ? appWindow.app_id === "unknown_app"
      ? 0.45
      : caveats.length > 0
        ? 0.68
        : 0.74
    : input.initialFields.activity_confidence ?? 0.62;
  const repairedFields: SceneFields = {
    ...input.initialFields,
    app_window: appWindow,
    ...(repairedSceneSummary(appWindow) && objectContradicted ? { scene_summary: repairedSceneSummary(appWindow) as string } : {}),
    activity,
    objects,
    objects_confidence: objectsConfidence,
    activity_confidence: activityConfidence,
    memory_tags: buildSceneMemoryTags({
      appWindow,
      objects,
      activity,
      verifiedFields: appKnown || appWindow.app_id === "unknown_app" ? ["objects", "activity"] : [],
    }),
    caveats,
  };
  const evidenceRefs = uniqueEvidenceRefs([
    ...appWindow.evidence_refs,
    ...evidence,
  ]);
  const confidenceChanges = buildConfidenceChanges({
    fields: input.initialFields,
    appWindow,
    contradictions,
    repairedObjects: shouldRepairObjects,
    repairedActivity: shouldRepairActivity,
    objectsConfidence,
    activityConfidence,
  });
  const verifiedFields = unique([
    appWindow.confidence >= 0.55 ? "app_window" : null,
    shouldRepairObjects || !objectContradicted ? "objects" : null,
    shouldRepairActivity || !activityContradicted ? "activity" : null,
  ]);
  const caveatedFields = unique([
    ...(caveats.length ? ["activity"] : []),
    appWindow.caveats?.length ? "active_tab_or_pane" : null,
    appWindow.app_id === "unknown_app" ? "app_window" : null,
  ]);
  const artifact: FieldRepairArtifact = {
    assistant_answer: false,
    source_frame_id: input.frameId,
    repaired_fields: {
      app_window: appWindow,
      scene_summary: repairedFields.scene_summary,
      activity,
      objects,
      objects_confidence: objectsConfidence,
      activity_confidence: activityConfidence,
      caveats,
      memory_tags: repairedFields.memory_tags,
    },
    original_fields: {
      scene_summary: input.initialFields.scene_summary,
      activity: input.initialFields.activity,
      objects: input.initialFields.objects,
      objects_confidence: input.initialFields.objects_confidence,
      activity_confidence: input.initialFields.activity_confidence,
    },
    app_window: appWindow,
    contradiction_refs: contradictions,
    evidence_refs: evidenceRefs,
    confidence_changes: confidenceChanges,
    repair_method: contradictions.length === 0
      ? "no_repair_needed"
      : shouldRepairObjects || shouldRepairActivity
        ? "deterministic_replacement"
        : "downgrade_only",
    verified_fields: verifiedFields,
    caveated_fields: caveatedFields,
  };
  repairedFields.voice_callout_candidates = buildVerifiedVoiceCalloutCandidates({
    repairedFields,
    repairArtifact: artifact,
  });
  storeRepairArtifact(artifact);
  return { repairedFields, repairArtifact: artifact };
}

const uniqueEvidenceRefs = (refs: EvidenceRef[]): EvidenceRef[] => {
  const seen = new Set<string>();
  const result: EvidenceRef[] = [];
  for (const ref of refs) {
    const key = JSON.stringify([ref.kind, ref.text, ref.field, ref.source_frame_id]);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(ref);
  }
  return result.slice(0, 30);
};

export function buildSceneMemoryTags(input: {
  appWindow: AppWindowClassification;
  objects: string[];
  activity?: string | null;
  verifiedFields: string[];
}): string[] {
  const verified = new Set(input.verifiedFields);
  return unique([
    verified.has("app_window") ? input.appWindow.app_name : null,
    ...(verified.has("objects") ? input.objects : []),
    verified.has("activity") ? input.activity ?? null : null,
  ]).filter((entry) => !/\bbrowser\s+tab\b|\bweb\s?page\b|\baddress\s+bar\b/i.test(entry) || input.appWindow.app_id === "browser");
}

export function buildVerifiedVoiceCalloutCandidates(input: {
  repairedFields: SceneFields;
  repairArtifact: FieldRepairArtifact;
}): VoiceCalloutCandidate[] {
  const appWindow = input.repairArtifact.app_window;
  if (appWindow.app_id === "unknown_app") {
    return [{
      text: "An application window is visible, but the exact app is unclear.",
      uses_verified_fields_only: true,
      confidence: Math.min(0.5, appWindow.confidence),
      caveats: input.repairArtifact.caveated_fields,
    }];
  }
  if (appWindow.app_id === "windows_task_manager") {
    return [{
      text: appWindow.active_tab_or_pane && appWindow.caveats?.length
        ? "Task Manager is open; the visible content looks consistent with Users or Performance information."
        : "Task Manager appears to be open, with visible resource or user-related information.",
      uses_verified_fields_only: true,
      confidence: appWindow.caveats?.length ? 0.72 : 0.78,
      ...(appWindow.caveats?.length ? { caveats: appWindow.caveats } : {}),
    }];
  }
  if (appWindow.app_id === "file_explorer") {
    return [{
      text: "File Explorer appears to be open, showing folder or file information.",
      uses_verified_fields_only: true,
      confidence: 0.74,
    }];
  }
  if (appWindow.app_id === "browser") {
    return [{
      text: "A web browser appears to be open on a webpage.",
      uses_verified_fields_only: true,
      confidence: 0.74,
    }];
  }
  return [{
    text: "Windows Calculator appears to be open.",
    uses_verified_fields_only: true,
    confidence: 0.76,
  }];
}

const evidenceFromObservationText = (text: string, sourceFrameId: string): EvidenceRef[] => {
  const terms = unique([
    ...Object.values(APP_TERMS).flat().map((entry) => entry.term),
    "File Explorer",
    "Task Manager",
    "Windows Calculator",
  ]);
  return terms.flatMap((term) => {
    const ref = evidenceForTerm(term, {
      evidence: [],
      fallbackText: text,
      sourceFrameId,
      score: 0.74,
    });
    return ref ? [ref] : [];
  });
};

const fieldsFromEvaluations = (evaluations: HelixLiveFieldEvaluation[], observationText: string): SceneFields => {
  const byField = new Map(evaluations.map((entry) => [entry.field_key, entry]));
  const scene = byField.get("scene") ?? byField.get("place") ?? null;
  const activity = byField.get("activity") ?? null;
  const objects = byField.get("objects") ?? byField.get("entities") ?? null;
  return {
    scene_summary: scene?.value ?? observationText,
    activity: activity?.value,
    objects: unique(String(objects?.value ?? "").split(/[,;|]/).map((entry) => entry.trim())),
    visible_text: [observationText],
    scene_summary_confidence: scene?.confidence ?? null ?? undefined,
    activity_confidence: activity?.confidence ?? null ?? undefined,
    objects_confidence: objects?.confidence ?? null ?? undefined,
  };
};

const repairedEvaluationFor = (
  evaluation: HelixLiveFieldEvaluation,
  repairedFields: SceneFields,
  artifact: FieldRepairArtifact,
): HelixLiveFieldEvaluation => {
  if (evaluation.field_key !== "scene" && evaluation.field_key !== "place" && evaluation.field_key !== "activity" && evaluation.field_key !== "objects" && evaluation.field_key !== "entities") {
    return evaluation;
  }
  let nextValue = evaluation.value;
  let nextConfidence = evaluation.confidence;
  let nextStatus = evaluation.status;
  const caveats = new Set(evaluation.missing_evidence);
  if (evaluation.field_key === "scene" || evaluation.field_key === "place") {
    nextValue = repairedFields.scene_summary ?? evaluation.value;
  } else if (evaluation.field_key === "activity") {
    nextValue = repairedFields.activity ?? evaluation.value;
    nextConfidence = repairedFields.activity_confidence ?? nextConfidence;
    nextStatus = artifact.contradiction_refs.some((entry) => entry.contradicted_field === "activity")
      ? artifact.caveated_fields.includes("activity") ? "tentative" : "supported"
      : evaluation.status;
  } else if (evaluation.field_key === "objects" || evaluation.field_key === "entities") {
    nextValue = (repairedFields.objects ?? []).join(", ") || evaluation.value;
    nextConfidence = repairedFields.objects_confidence ?? nextConfidence;
    nextStatus = artifact.contradiction_refs.some((entry) => entry.contradicted_field === "objects")
      ? artifact.repair_method === "downgrade_only" ? "uncertain" : "supported"
      : evaluation.status;
  }
  for (const caveat of repairedFields.caveats ?? []) caveats.add(caveat);
  return {
    ...evaluation,
    evaluation_id: evaluation.evaluation_id.replace(/:[a-f0-9]{8}$/, "") + `:repair:${hashShort([evaluation.evaluation_id, nextValue, nextConfidence], 8)}`,
    value: nextValue,
    confidence: clamp(nextConfidence),
    status: nextStatus,
    evidence_refs: unique([
      ...evaluation.evidence_refs,
      `field_repair:${hashShort([artifact.source_frame_id, artifact.contradiction_refs.map((entry) => entry.id)], 12)}`,
    ]).slice(-16),
    missing_evidence: Array.from(caveats).slice(0, 12),
  };
};

export function repairLiveFieldEvaluations(input: {
  frameId: string;
  observationText: string;
  evaluations: HelixLiveFieldEvaluation[];
  ocrEvidence?: EvidenceRef[];
  visualEvidence?: EvidenceRef[];
}): {
  evaluations: HelixLiveFieldEvaluation[];
  repairArtifact: FieldRepairArtifact;
} {
  const fallbackEvidence = evidenceFromObservationText(input.observationText, input.frameId);
  const output = repairSceneFields({
    frameId: input.frameId,
    initialFields: fieldsFromEvaluations(input.evaluations, input.observationText),
    ocrEvidence: [...fallbackEvidence, ...(input.ocrEvidence ?? [])],
    visualEvidence: input.visualEvidence ?? [],
  });
  return {
    evaluations: input.evaluations.map((evaluation) => repairedEvaluationFor(evaluation, output.repairedFields, output.repairArtifact)),
    repairArtifact: output.repairArtifact,
  };
}

export function storeRepairArtifact(artifact: FieldRepairArtifact): FieldRepairArtifact {
  repairArtifactsByFrame.set(artifact.source_frame_id, [
    ...(repairArtifactsByFrame.get(artifact.source_frame_id) ?? []),
    artifact,
  ].slice(-20));
  return artifact;
}

export function listFieldRepairArtifacts(input: { sourceFrameId?: string | null; limit?: number } = {}): FieldRepairArtifact[] {
  const limit = Math.max(0, Math.min(200, Math.trunc(input.limit ?? 80)));
  const entries = input.sourceFrameId
    ? repairArtifactsByFrame.get(input.sourceFrameId) ?? []
    : Array.from(repairArtifactsByFrame.values()).flat();
  return entries.slice(-limit);
}

export function resetFieldRepairArtifactsForTest(): void {
  repairArtifactsByFrame.clear();
}
