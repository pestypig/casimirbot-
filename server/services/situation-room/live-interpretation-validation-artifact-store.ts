import type { HelixLiveInterpretationValidationArtifact } from "@shared/helix-live-interpretation-validation-artifact";

const artifactsByRun = new Map<string, HelixLiveInterpretationValidationArtifact[]>();

export function recordLiveInterpretationValidationArtifact(
  artifact: HelixLiveInterpretationValidationArtifact,
): HelixLiveInterpretationValidationArtifact {
  artifactsByRun.set(artifact.interpretation_run_id, [
    ...(artifactsByRun.get(artifact.interpretation_run_id) ?? [])
      .filter((entry: HelixLiveInterpretationValidationArtifact) => entry.validation_artifact_id !== artifact.validation_artifact_id),
    artifact,
  ].slice(-1500));
  return artifact;
}

export function listLiveInterpretationValidationArtifacts(input: {
  interpretationRunId?: string | null;
  workerRunId?: string | null;
  artifactType?: string | null;
  limit?: number;
} = {}): HelixLiveInterpretationValidationArtifact[] {
  const limit = Math.max(0, Math.min(1500, Math.trunc(input.limit ?? 400)));
  return (Array.from(artifactsByRun.values()).flat() as HelixLiveInterpretationValidationArtifact[])
    .filter((entry: HelixLiveInterpretationValidationArtifact) => !input.interpretationRunId || entry.interpretation_run_id === input.interpretationRunId)
    .filter((entry: HelixLiveInterpretationValidationArtifact) => !input.workerRunId || entry.interpretation_worker_run_id === input.workerRunId)
    .filter((entry: HelixLiveInterpretationValidationArtifact) => !input.artifactType || entry.artifact_type === input.artifactType)
    .slice(-limit);
}

export function resetLiveInterpretationValidationArtifactsForTest(): void {
  artifactsByRun.clear();
}
