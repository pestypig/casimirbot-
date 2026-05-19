import crypto from "node:crypto";
import {
  HELIX_LIVE_INTERPRETATION_HYPOTHESIS_SCHEMA,
  type HelixLiveInterpretationHypothesis,
} from "@shared/helix-live-interpretation-hypothesis";
import type { HelixLiveInterpretationRun } from "@shared/helix-live-interpretation-run";
import type { HelixLiveInterpretationWorker } from "@shared/helix-live-interpretation-worker";
import type { HelixLiveInterpretationWorkerRun } from "@shared/helix-live-interpretation-worker-run";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

const lower = (value: unknown): string => String(value ?? "").toLowerCase();

const clamp = (value: number): number => Math.max(0, Math.min(1, value));

const isTaskManagerSummary = (text: string): boolean =>
  /\btask\s+manager\b|\bperformance\s+tab\b|\bcpu\b[\s\S]{0,80}\bmemory\b|\bgpu\b[\s\S]{0,80}\bperformance\b/.test(text);

const taskManagerObjectTerms = (): string =>
  [
    "Windows Task Manager",
    "Performance tab",
    "CPU panel",
    "Memory panel",
    "Disk panel",
    "Ethernet panel",
    "GPU panels",
    "system metrics",
  ].join(", ");

const inferActivity = (text: string): string => {
  const normalized = lower(text);
  if (isTaskManagerSummary(normalized)) {
    return "The user may be inspecting Windows Task Manager performance metrics.";
  }
  if (/\b(?:file explorer|folder|directory|files?)\b/.test(normalized)) {
    return "The user may be browsing, reviewing, or organizing visible workstation files.";
  }
  if (/\b(?:document|pdf|paper|page)\b/.test(normalized)) return "The user may be reading or reviewing a document.";
  if (/\b(?:browser|tab|website)\b/.test(normalized)) return "The user may be inspecting a browser tab.";
  if (/\b(?:inventory|chest|hotbar|crafting)\b/.test(normalized)) return "The user may be inspecting game inventory or items.";
  return "The user appears to be inspecting the current visible state; intent is not directly stated.";
};

const inferObjects = (text: string): string => {
  const normalized = lower(text);
  const objects: string[] = [];
  if (isTaskManagerSummary(normalized)) {
    return `Visible objects include ${taskManagerObjectTerms()}.`;
  }
  if (/\bfile explorer\b/.test(normalized)) objects.push("file explorer window");
  if (/\bfolder|directory\b/.test(normalized)) objects.push("folder view");
  if (/\b(?:files?|filenames?)\b/.test(normalized)) objects.push("visible file entries");
  if (/\b(?:document|pdf|paper|page)\b/.test(normalized)) objects.push("document content");
  if (/\b(?:browser|tab|website)\b/.test(normalized)) objects.push("browser tab");
  if (/\b(?:inventory|chest|hotbar|crafting)\b/.test(normalized)) objects.push("game inventory/items");
  return objects.length > 0
    ? `Visible objects include ${objects.join(", ")}.`
    : "Visible objects are limited to the compact scene summary.";
};

const contradicts = (previous: string, next: string): boolean => {
  const left = lower(previous);
  const right = lower(next);
  const pairs = [
    ["file explorer", "browser"],
    ["folder", "browser"],
    ["file explorer", "inventory"],
    ["folder", "inventory"],
    ["document", "inventory"],
    ["inventory", "file explorer"],
    ["chest", "file explorer"],
  ];
  return pairs.some(([a, b]) => left.includes(a) && right.includes(b));
};

const reinforces = (previous: string, next: string): boolean => {
  const previousTokens = new Set(lower(previous).split(/[^a-z0-9]+/).filter((entry) => entry.length > 4));
  const nextTokens = lower(next).split(/[^a-z0-9]+/).filter((entry) => entry.length > 4);
  return nextTokens.some((token) => previousTokens.has(token));
};

export function runInterpretationReasoning(input: {
  interpretationRun: HelixLiveInterpretationRun;
  worker: HelixLiveInterpretationWorker;
  workerRun: HelixLiveInterpretationWorkerRun;
  observation: HelixObservationJournalEntry;
  previousHypotheses: HelixLiveInterpretationHypothesis[];
  now: string;
}): HelixLiveInterpretationHypothesis {
  const text = input.observation.text.trim();
  const baseConfidence = input.observation.confidence ?? 0.66;
  let claim = text;
  let confidence = baseConfidence;
  let missingEvidence: string[] = [];
  let uncertainty: string[] = [];
  let predictedSignals: string[] = [];
  let recommendedNextCheck = "Compare the next observation against this hypothesis.";
  let recommendedCandidate: HelixLiveInterpretationHypothesis["recommended_candidate"] = "silent_update";

  if (input.worker.lens === "scene_neutral") {
    claim = `Visible scene: ${text}`;
    recommendedCandidate = "none";
  } else if (input.worker.lens === "activity") {
    claim = inferActivity(text);
    confidence = clamp(baseConfidence - 0.12);
    missingEvidence = ["No audio/user steering corroboration."];
    uncertainty = ["User intent is inferred from visible state only."];
  } else if (input.worker.lens === "objects") {
    claim = inferObjects(text);
    recommendedCandidate = "none";
  } else if (input.worker.lens === "uncertainty") {
    claim = "User intent, selected item identity, and next action are not fully known from this source alone.";
    confidence = 0.5;
    missingEvidence = ["No transcript/user steering evidence.", "No explicit selection/action confirmation."];
    uncertainty = ["This is a bounded interpretation, not an answer."];
  } else if (input.worker.lens === "verifier_lane") {
    claim = "The next frame should be checked for selection, navigation, opened-file, or content changes.";
    confidence = 0.62;
    predictedSignals = ["selected_file_change", "window_title_change", "opened_document_change"];
    recommendedNextCheck = "Capture the next frame and compare visible selection/window state.";
  } else if (input.worker.lens === "workstation_affordance_lane") {
    claim = "If the user asks about visible files or documents, a docs/file inspection capability may become relevant.";
    confidence = 0.58;
    missingEvidence = ["No user request for a side-effect action."];
    recommendedCandidate = "plan_contract_candidate";
    recommendedNextCheck = "Wait for explicit user request before proposing any workstation action.";
  } else if (input.worker.lens === "risk_lane") {
    claim = /\b(?:danger|damage|health|lava|fire|hostile|fall)\b/i.test(text)
      ? "There may be a risk state in the current source evidence."
      : "No urgent risk is confirmed from this observation.";
    confidence = /\b(?:danger|damage|health|lava|fire|hostile|fall)\b/i.test(text) ? 0.76 : 0.42;
    recommendedCandidate = confidence > 0.7 ? "ask_handoff_candidate" : "silent_update";
  } else if (input.worker.lens === "protocol_lane") {
    claim = "No protocol lane is asserted without a configured procedure context.";
    confidence = 0.35;
    uncertainty = ["No active protocol objective was supplied."];
  } else {
    claim = "No user notice is warranted; keep this as a silent interpretation update.";
    confidence = 0.64;
    recommendedCandidate = "silent_update";
  }

  const previousForLens = input.previousHypotheses
    .filter((entry) => entry.lens === input.worker.lens)
    .slice(-1)[0] ?? null;
  const supports = previousForLens && reinforces(previousForLens.claim, claim) ? [previousForLens.hypothesis_id] : [];
  const contradictionRefs = previousForLens && contradicts(previousForLens.claim, claim) ? [previousForLens.hypothesis_id] : [];
  const status: HelixLiveInterpretationHypothesis["status"] =
    contradictionRefs.length > 0
      ? "contradicted"
      : supports.length > 0
        ? "reinforced"
        : previousForLens
          ? "unchanged"
          : "new";

  return {
    schema: HELIX_LIVE_INTERPRETATION_HYPOTHESIS_SCHEMA,
    hypothesis_id: `live_interpretation_hypothesis:${hashShort([
      input.interpretationRun.interpretation_run_id,
      input.worker.lens,
      input.observation.observation_id,
      claim,
    ])}`,
    interpretation_worker_run_id: input.workerRun.interpretation_worker_run_id,
    interpretation_run_id: input.interpretationRun.interpretation_run_id,
    situation_run_id: input.interpretationRun.situation_run_id,
    source_epoch: input.workerRun.source_epoch,
    lens: input.worker.lens,
    claim,
    confidence,
    evidence_refs: Array.from(new Set([
      input.observation.observation_id,
      ...input.observation.evidence_refs,
    ])).slice(-16),
    missing_evidence: missingEvidence,
    uncertainty,
    supports,
    contradicts: contradictionRefs,
    supersedes: contradictionRefs.length > 0 ? contradictionRefs : [],
    predicted_signals: predictedSignals,
    recommended_next_check: recommendedNextCheck,
    recommended_candidate: recommendedCandidate,
    status,
    expires_at: new Date(Date.parse(input.now) + 60_000).toISOString(),
    assistant_answer: false,
    raw_content_included: false,
    role: "validation",
  };
}
