import type {
  LiveAnswerEnvironment,
  LiveAnswerEnvironmentDelta,
  LiveAnswerLineState,
} from "@shared/helix-live-answer-environment";
import type { LiveComputationEvent } from "@shared/helix-live-computation-event";
import type { WorkstationLiveSourceEvent } from "@shared/helix-workstation-live-source";
import { updateLiveAnswerEnvironment } from "./live-answer-environment-store";

const numberText = (value: unknown, fallback: string): string =>
  typeof value === "number" && Number.isFinite(value) ? String(value) : fallback;

export function reduceLiveAnswerEnvironmentFromSourceEvent(input: {
  environment: LiveAnswerEnvironment | null;
  event: WorkstationLiveSourceEvent;
  computationEvent?: LiveComputationEvent | null;
  now?: string;
}): { environment: LiveAnswerEnvironment; delta: LiveAnswerEnvironmentDelta } | null {
  const environment = input.environment;
  if (!environment || environment.status !== "active") return null;
  const payload = input.event.payload ?? {};
  const evidenceRefs = Array.from(new Set([
    ...input.event.evidence_refs,
    ...(input.computationEvent?.evidence_refs ?? []),
    `live_source_event:${input.event.event_id}`,
  ])).slice(-24);
  const sourceEventIds = [input.event.event_id];
  const lineValues: Parameters<typeof updateLiveAnswerEnvironment>[0]["line_values"] = {};
  const hasLine = (key: string) => environment.lines.some((line: LiveAnswerLineState) => line.key === key);
  const setLine = (key: string, value: string, confidence = 0.8) => {
    if (!hasLine(key)) return;
    lineValues[key] = {
      value,
      confidence,
      evidence_refs: evidenceRefs,
      source_event_ids: sourceEventIds,
      source: "deterministic_reducer",
      model_invoked: false,
      deterministic: true,
    };
  };

  let summary = `${input.event.event_type} observed.`;

  if (input.event.kind === "calculator_series" || environment.preset === "calculator_prime_stream") {
    const candidate = numberText(payload.candidate, "unknown");
    const isPrime = payload.is_prime === true;
    const latestPrime = numberText(payload.latest_prime, isPrime ? candidate : "none");
    const primeCount = numberText(payload.prime_count, "0");
    const gap = numberText(payload.gap, isPrime ? "first prime" : "unchanged");
    const nextCandidate =
      typeof payload.candidate === "number" && Number.isFinite(payload.candidate)
        ? String(payload.candidate + 1)
        : "waiting";

    setLine("current_candidate", candidate, 0.95);
    setLine("latest_prime", latestPrime, isPrime ? 0.96 : 0.82);
    setLine("prime_count", primeCount, 0.94);
    setLine("gap", gap, 0.82);
    setLine("last_test", `${candidate} is ${isPrime ? "" : "not "}prime.`, 0.96);
    setLine("stability_rate", `Checked ${input.event.seq} candidates; ${primeCount} primes found.`, 0.78);
    setLine("next_check", nextCandidate, 0.84);
    summary = isPrime
      ? `Prime ${latestPrime} found.`
      : `Checked ${candidate}; not prime.`;
  }

  if (input.event.kind === "physics_simulation" || environment.preset === "physics_stability_tracker") {
    const residual = numberText(payload.residual, "unknown");
    const tolerance = numberText(payload.tolerance, "unspecified");
    const anomaly = payload.anomaly === true || (
      typeof payload.residual === "number" &&
      typeof payload.tolerance === "number" &&
      payload.residual > payload.tolerance
    );
    setLine("current_parameters", JSON.stringify(payload.variables ?? payload.inputs ?? {}).slice(0, 120), 0.7);
    setLine("latest_result", JSON.stringify(payload.result ?? payload.output ?? payload).slice(0, 120), 0.75);
    setLine("residual", residual, 0.85);
    setLine("stability_window", JSON.stringify(payload.stability ?? null), 0.72);
    setLine("margin_of_accuracy", `tolerance ${tolerance}`, 0.75);
    setLine("anomaly", anomaly ? "Anomaly threshold exceeded." : "No anomaly above threshold.", anomaly ? 0.9 : 0.7);
    setLine("next_sample", `sample ${input.event.seq + 1}`, 0.72);
    summary = anomaly ? `Simulation anomaly detected at residual ${residual}.` : `Simulation sample ${input.event.seq} accepted.`;
  }

  if (Object.keys(lineValues).length === 0) return null;
  return updateLiveAnswerEnvironment({
    environment_id: environment.environment_id,
    reason: input.event.kind === "physics_simulation" || input.event.kind === "calculator_series" ? "computation_tick" : "source_event",
    line_values: lineValues,
    latest_summary: summary,
    evidence_refs: evidenceRefs,
    source_event_count: input.event.window_event_count ?? 1,
    window_id: input.event.window_id ?? null,
    window_count:
      input.event.trace && typeof input.event.trace.window_count === "number"
        ? input.event.trace.window_count
        : null,
    now: input.now ?? input.event.ts,
  });
}
