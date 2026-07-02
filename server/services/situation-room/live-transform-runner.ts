import {
  HELIX_LIVE_TRANSFORM_RESULT_SCHEMA,
  type LiveTransformResult,
} from "@shared/helix-live-transform";
import type {
  LivePipelineTransformSpec,
  LiveWorkstationPipeline,
} from "@shared/helix-live-workstation-pipeline";
import type { WorkstationLiveSourceEvent } from "@shared/helix-workstation-live-source";

const cleanText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
};

const textFromEvent = (event: WorkstationLiveSourceEvent): string => {
  const payload = event.payload ?? {};
  const text =
    cleanText(payload.summary) ??
    cleanText(payload.sentence) ??
    cleanText(payload.transcript) ??
    cleanText(payload.text) ??
    cleanText(payload.chunk) ??
    cleanText(payload.content);
  if (text) return text;
  if (event.kind === "physics_simulation") {
    return `sample ${event.seq}: residual=${String(payload.residual ?? "unknown")} result=${String(payload.result ?? "unknown")}`;
  }
  return `${event.event_type} event ${event.seq}`;
};

const clip = (value: string, max = 180): string => (value.length > max ? `${value.slice(0, max - 1)}...` : value);

const summarizeSentence = (text: string): string => {
  const sentence = text.split(/(?<=[.!?])\s+/)[0] ?? text;
  return clip(sentence, 160);
};

const confidenceText = (value: number): string => `${Math.round(value * 100)}%`;

type PrimeGapState = {
  latestPrime?: number;
  previousPrime?: number;
  lastGap?: number;
  largestGap?: number;
};

const primeGapStateByPipeline = new Map<string, PrimeGapState>();

const finiteNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const primeGapTrend = (gap: number | null, previousGap: number | undefined): string => {
  if (gap === null) return "Waiting for the next prime gap.";
  if (typeof previousGap !== "number") return "First observed gap for this derived output.";
  if (gap > previousGap) return `Gap increased from ${previousGap} to ${gap}.`;
  if (gap < previousGap) return `Gap decreased from ${previousGap} to ${gap}.`;
  return `Gap held steady at ${gap}.`;
};

function runTransformSpec(args: {
  pipeline: LiveWorkstationPipeline;
  transform: LivePipelineTransformSpec;
  event: WorkstationLiveSourceEvent;
  now: string;
}): LiveTransformResult {
  const sourceText = textFromEvent(args.event);
  const evidenceRefs = Array.from(new Set([
    ...args.event.evidence_refs,
    `live_source_event:${args.event.event_id}`,
    `pipeline:${args.pipeline.pipeline_id}`,
  ])).slice(-24);
  const base = {
    schema: HELIX_LIVE_TRANSFORM_RESULT_SCHEMA,
    transform_id: args.transform.transform_id,
    pipeline_id: args.pipeline.pipeline_id,
    source_event_ids: [args.event.event_id],
    window_id: args.event.window_id ?? null,
    kind: args.transform.kind,
    evidence_refs: evidenceRefs,
    ts: args.now,
  } as const;

  if (args.transform.kind === "sequence_gap_analyzer") {
    const payload = args.event.payload ?? {};
    const candidate = finiteNumber(payload.candidate);
    const observedLatestPrime = finiteNumber(payload.latest_prime);
    const emittedPrime =
      payload.is_prime === true
        ? candidate ?? observedLatestPrime
        : args.event.event_type === "prime_found"
          ? candidate ?? observedLatestPrime
          : null;
    const priorState = primeGapStateByPipeline.get(args.pipeline.pipeline_id) ?? {};
    const previousPrime =
      emittedPrime !== null
        ? (priorState.latestPrime !== emittedPrime ? priorState.latestPrime : undefined) ?? (
            finiteNumber(payload.gap) !== null ? emittedPrime - (finiteNumber(payload.gap) ?? 0) : priorState.previousPrime
          )
        : priorState.previousPrime;
    const computedGap =
      emittedPrime !== null && typeof previousPrime === "number" && emittedPrime !== previousPrime
        ? emittedPrime - previousPrime
        : emittedPrime !== null
          ? finiteNumber(payload.gap)
          : priorState.lastGap ?? finiteNumber(payload.gap);
    const safeGap = computedGap !== null && Number.isFinite(computedGap) && computedGap >= 0 ? computedGap : null;
    const largestGap = safeGap !== null
      ? Math.max(priorState.largestGap ?? safeGap, safeGap)
      : priorState.largestGap ?? null;
    const latestPrime = emittedPrime ?? observedLatestPrime ?? priorState.latestPrime ?? null;
    const nextState: PrimeGapState = {
      latestPrime: latestPrime ?? priorState.latestPrime,
      previousPrime: typeof previousPrime === "number" ? previousPrime : priorState.previousPrime,
      lastGap: safeGap ?? priorState.lastGap,
      largestGap: largestGap ?? priorState.largestGap,
    };
    if (emittedPrime !== null) {
      primeGapStateByPipeline.set(args.pipeline.pipeline_id, nextState);
    } else if (latestPrime !== null || safeGap !== null || largestGap !== null) {
      primeGapStateByPipeline.set(args.pipeline.pipeline_id, nextState);
    }
    const lastTest =
      payload.is_prime === true && candidate !== null
        ? `${candidate} is prime.`
        : payload.is_prime === false && candidate !== null
          ? `${candidate} is not prime.`
          : args.event.event_type === "prime_found" && latestPrime !== null
            ? `${latestPrime} is prime.`
            : `Observed ${args.event.event_type}.`;
    const nextCandidate = finiteNumber(payload.next_candidate);
    return {
      ...base,
      text: safeGap !== null && latestPrime !== null
        ? `Prime gap update: latest=${latestPrime}, previous=${previousPrime ?? "unknown"}, gap=${safeGap}.`
        : `Prime gap update pending: ${lastTest}`,
      lines: {
        current_candidate: candidate !== null ? String(candidate) : "Waiting for candidate.",
        latest_prime: latestPrime !== null ? String(latestPrime) : "No prime emitted yet.",
        previous_prime: typeof previousPrime === "number" ? String(previousPrime) : "Waiting for second prime.",
        gap: safeGap !== null ? String(safeGap) : "Waiting for next prime gap.",
        largest_gap: largestGap !== null ? String(largestGap) : "Waiting for observed gaps.",
        gap_trend: primeGapTrend(safeGap, priorState.lastGap),
        last_test: lastTest,
        next_check: nextCandidate !== null ? String(nextCandidate) : `event ${args.event.seq + 1}`,
      },
      model_invoked: false,
      deterministic: true,
      confidence: safeGap !== null ? 0.92 : 0.66,
    };
  }

  if (args.transform.kind === "philosophy_compare") {
    const framework = cleanText(args.transform.params.framework) ?? "moral";
    const summary = summarizeSentence(sourceText);
    const moralParallel = framework === "moral"
      ? "Treat this as a claim to observe directly before adding interpretation."
      : "Compare the statement against discipline, judgment, and what is under control.";
    return {
      ...base,
      text: `${framework} comparison: ${moralParallel}`,
      lines: {
        current_statement: `Observed statement: ${clip(summary, 100)}`,
        moral_parallel: moralParallel,
        tension: "No contradiction flagged in this compact window.",
        practical_reflection: "Keep the interpretation provisional until more source evidence arrives.",
        confidence: confidenceText(0.62),
        next_watch: "Watch for repeated claims, contradictions, or explicit practice guidance.",
      },
      model_invoked: false,
      deterministic: true,
      confidence: 0.62,
    };
  }

  if (args.transform.kind === "claim_evidence_extract") {
    const summary = summarizeSentence(sourceText);
    return {
      ...base,
      text: `Claim candidate: ${summary}`,
      lines: {
        claim: summary,
        evidence: "Evidence not established beyond the current source segment.",
        open_question: "What evidence supports this claim?",
        confidence: confidenceText(0.58),
      },
      model_invoked: false,
      deterministic: true,
      confidence: 0.58,
    };
  }

  if (args.transform.kind === "contradiction_watch") {
    return {
      ...base,
      text: "No contradiction detected in this deterministic pass.",
      lines: {
        contradiction: "No contradiction detected in the latest compact window.",
      },
      model_invoked: false,
      deterministic: true,
      confidence: 0.55,
    };
  }

  if (args.transform.kind === "rolling_summary" || args.transform.kind === "methods_note_writer") {
    const payload = args.event.payload ?? {};
    const residual = payload.residual ?? payload.error ?? "unknown";
    const result = payload.result ?? payload.output ?? "unknown";
    const note = `Sample ${args.event.seq}: result=${String(result)}, residual=${String(residual)}.`;
    return {
      ...base,
      text: args.transform.kind === "methods_note_writer" ? `Methods note: ${note}` : note,
      lines: {
        latest_sample: `sample ${args.event.seq}`,
        residual: String(residual),
        stability_window: args.event.window_id ? `window ${args.event.window_id}` : "single sample",
        methods_note: note,
        anomaly: payload.anomaly === true ? "Anomaly flagged." : "No anomaly flagged.",
        next_check: `sample ${args.event.seq + 1}`,
      },
      model_invoked: false,
      deterministic: true,
      confidence: 0.72,
    };
  }

  const summary = summarizeSentence(sourceText);
  return {
    ...base,
    text: `Summary: ${summary}`,
    lines: {
      latest_sentence: `Observed sentence (${sourceText.length} chars).`,
      latest_summary: summary,
      note_status: "Summary chunk ready for note sink.",
      open_question: "No open question detected in this deterministic pass.",
      last_write: `Ready at ${args.now}`,
    },
    model_invoked: false,
    deterministic: true,
    confidence: 0.7,
  };
}

export function runLiveTransformsForSourceEvent(args: {
  pipeline: LiveWorkstationPipeline;
  event: WorkstationLiveSourceEvent;
  now?: string;
}): LiveTransformResult[] {
  if (args.pipeline.status !== "active") return [];
  const now = args.now ?? args.event.ts ?? new Date().toISOString();
  return args.pipeline.transforms.map((transform) =>
    runTransformSpec({
      pipeline: args.pipeline,
      transform,
      event: args.event,
      now,
    }),
  );
}

export function resetLiveTransformRunnerState(): void {
  primeGapStateByPipeline.clear();
}
