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

const stringText = (value: unknown, fallback: string): string =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

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

  if (input.event.event_type === "equation_evaluated") {
    const expression = typeof payload.expression === "string" ? payload.expression : "unknown equation";
    const equationContext = stringText(payload.equation_context, "No equation use-context was supplied.");
    const resultText = typeof payload.result_text === "string" && payload.result_text.trim()
      ? payload.result_text
      : typeof payload.error === "string" && payload.error.trim()
        ? payload.error
        : "No result text emitted.";
    const ok = payload.ok !== false;
    const variable = stringText(payload.variable, "no target variable detected");
    const normalized = stringText(payload.normalized_expression, expression);
    const interpretation = ok
      ? `With ${variable}, the current solve returns ${resultText}. In context: ${equationContext}`
      : `The calculator could not produce a usable value for ${expression}. In context: ${equationContext}`;
    const bigPicture = `This live equation is being used as a compact source of changing calculator evidence, not as an assistant answer. Context: ${equationContext}`;
    setLine("current_equation", expression, 0.94);
    setLine("latest_result", resultText, ok ? 0.88 : 0.58);
    setLine("variables", `${variable}; normalized=${normalized}`.slice(0, 180), ok ? 0.78 : 0.58);
    setLine("interpretation", interpretation.slice(0, 220), ok ? 0.76 : 0.58);
    setLine("big_picture", bigPicture.slice(0, 220), 0.72);
    setLine("last_test", ok ? resultText : `Blocked: ${resultText}`, ok ? 0.86 : 0.62);
    setLine("computation", `${expression} -> ${resultText}`.slice(0, 180), ok ? 0.82 : 0.58);
    setLine("next_check", ok ? "Wait for the next equation tick or variable schedule." : "Review calculator capability route before continuing.", 0.68);
    summary = ok ? `Equation source evaluated: ${resultText}. ${equationContext}` : `Equation source blocked: ${resultText}`;
  } else if (input.event.kind === "calculator_series" || environment.preset === "calculator_prime_stream") {
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
