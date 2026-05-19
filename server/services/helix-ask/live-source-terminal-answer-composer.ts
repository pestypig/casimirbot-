import type { HelixAskSourceTargetIntent } from "@shared/helix-ask-source-target-intent";
import type { HelixLiveFieldEvaluation } from "@shared/helix-live-field-evaluation";
import type { HelixLiveInterpretationHypothesis } from "@shared/helix-live-interpretation-hypothesis";
import type { HelixLiveProbeResult } from "@shared/helix-live-probe-result";
import type { HelixLiveProcedureEpoch } from "@shared/helix-live-procedure-epoch";
import type { HelixLiveSituationRun } from "@shared/helix-live-situation-run";
import type { HelixLiveSourceIdentity } from "@shared/helix-live-source-identity";
import type { HelixLiveSourceTerminalAuthority } from "@shared/helix-turn-poison-guard";
import type { HelixObservationJournalEntry } from "@shared/helix-observation-journal";

const compact = (value: unknown): string =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";

const bulletLines = (values: string[]): string =>
  values.length > 0 ? values.map((entry: string) => `- ${entry}`).join("\n") : "- none";

export function composeLiveSourceTerminalAnswer(input: {
  threadId: string;
  turnId: string;
  sourceTargetIntent?: HelixAskSourceTargetIntent | Record<string, unknown> | null;
  situationRun?: HelixLiveSituationRun | null;
  sourceIdentity?: HelixLiveSourceIdentity | null;
  procedureEpoch?: HelixLiveProcedureEpoch | null;
  observations?: HelixObservationJournalEntry[];
  fieldEvaluations?: HelixLiveFieldEvaluation[];
  interpretations?: HelixLiveInterpretationHypothesis[];
  probeResults?: HelixLiveProbeResult[];
  arbitrationCandidate?: { candidate_id?: string | null } | null;
  createdAt?: string;
}) {
  const run = input.situationRun ?? null;
  const identity = input.sourceIdentity ?? null;
  const latestObservation = (input.observations ?? []).at(-1) ?? null;
  const evaluations: HelixLiveFieldEvaluation[] = input.fieldEvaluations ?? [];
  const interpretations: HelixLiveInterpretationHypothesis[] = input.interpretations ?? [];
  const probeResults: HelixLiveProbeResult[] = input.probeResults ?? [];
  const createdAt = input.createdAt ?? new Date().toISOString();

  const missing: string[] = [
    !run ? "active SituationRun" : null,
    !identity ? "source identity" : null,
    !latestObservation ? "fresh visual observation" : null,
    evaluations.length === 0 ? "field evaluation for scene/activity" : null,
  ].filter((entry: string | null): entry is string => Boolean(entry));

  const terminalArtifactKind = missing.length > 0 ? "request_user_input" : "live_visual_answer";
  const terminalItemId = `live_source_terminal:${input.turnId}`;
  const selectedEvidenceRefs = Array.from(new Set([
    ...(run?.selected_evidence_refs ?? []),
    ...(latestObservation ? [latestObservation.observation_id, ...latestObservation.evidence_refs] : []),
    ...evaluations.flatMap((entry: HelixLiveFieldEvaluation) => [entry.evaluation_id, ...entry.evidence_refs]),
  ])).slice(-32);

  const authority: HelixLiveSourceTerminalAuthority = {
    schema: "helix.live_source_terminal_authority.v1",
    thread_id: input.threadId,
    turn_id: input.turnId,
    situation_run_id: run?.situation_run_id ?? "missing_situation_run",
    source_binding_id: run?.source_binding_id ?? identity?.source_binding_id ?? "missing_source_binding",
    source_identity_ref: run?.primary_source_identity_ref ?? (identity ? `live_source_identity:${identity.thread_id}:${identity.source_id}:epoch:${identity.latest_epoch}` : "missing_source_identity"),
    source_epoch: run?.current_epoch ?? identity?.latest_epoch ?? 0,
    terminal_item_id: terminalItemId,
    terminal_artifact_kind: terminalArtifactKind,
    selected_evidence_refs: selectedEvidenceRefs,
    selected_field_evaluation_refs: evaluations.map((entry: HelixLiveFieldEvaluation) => entry.evaluation_id),
    selected_interpretation_refs: interpretations.map((entry: HelixLiveInterpretationHypothesis) => entry.hypothesis_id),
    selected_probe_result_refs: probeResults.map((entry: HelixLiveProbeResult) => entry.probe_result_id),
    arbitration_candidate_ref: input.arbitrationCandidate?.candidate_id ?? null,
    authority_path: "terminal_presenter_from_selected_live_evidence",
    server_authoritative: true,
    assistant_answer: false,
    created_at: createdAt,
  };

  if (missing.length > 0) {
    return {
      terminal_artifact_kind: terminalArtifactKind,
      selected_final_answer: [
        "I have a bound visual source, but the latest SituationRun does not have enough fresh evidence to answer that yet.",
        "",
        "Needed:",
        bulletLines(missing),
      ].join("\n"),
      selected_evidence_refs: selectedEvidenceRefs,
      source_binding_id: authority.source_binding_id,
      live_source_terminal_authority: authority,
      assistant_answer: true as const,
    };
  }

  const observed = [
    compact(latestObservation?.text),
    ...evaluations.slice(0, 4).map((entry: HelixLiveFieldEvaluation) => `${entry.field_key}: ${compact(entry.value)}`),
  ].filter((entry: string): entry is string => Boolean(entry));
  const confidence = evaluations.length > 0
    ? Math.round((evaluations.reduce((sum: number, entry: HelixLiveFieldEvaluation) => sum + entry.confidence, 0) / evaluations.length) * 100)
    : 0;
  const limits = Array.from(new Set(evaluations.flatMap((entry: HelixLiveFieldEvaluation) => entry.missing_evidence)))
    .filter((entry: string): entry is string => Boolean(entry));
  const nextChecks = Array.from(new Set(evaluations.map((entry: HelixLiveFieldEvaluation) => compact(entry.next_check)).filter(Boolean)))
    .filter((entry: string): entry is string => Boolean(entry));

  return {
    terminal_artifact_kind: terminalArtifactKind,
    selected_final_answer: [
      "Observed:",
      bulletLines(observed),
      "",
      "Confidence:",
      `- ${confidence}% from current field evaluations`,
      "",
      "Evidence:",
      bulletLines(selectedEvidenceRefs.slice(0, 8)),
      "",
      "Limits:",
      bulletLines(limits),
      "",
      "Next check:",
      bulletLines(nextChecks.slice(0, 2)),
    ].join("\n"),
    selected_evidence_refs: selectedEvidenceRefs,
    source_binding_id: authority.source_binding_id,
    live_source_terminal_authority: authority,
    assistant_answer: true as const,
  };
}
