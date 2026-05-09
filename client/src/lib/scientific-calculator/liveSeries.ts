export type PrimeSeriesState = {
  nextCandidate: number;
  latestPrime: number | null;
  primeCount: number;
  lastPrime: number | null;
  seq: number;
};

export type PrimeSeriesTick = {
  state: PrimeSeriesState;
  event_type: "prime_candidate_checked" | "prime_found";
  payload: {
    candidate: number;
    is_prime: boolean;
    latest_prime?: number;
    prime_count: number;
    gap?: number;
  };
  trace: {
    calculator_trace_id: string;
    algorithm: "trial_division";
    deterministic: true;
  };
};

export function isPrimeTrialDivision(value: number): boolean {
  if (!Number.isInteger(value) || value < 2) return false;
  if (value === 2) return true;
  if (value % 2 === 0) return false;
  const max = Math.floor(Math.sqrt(value));
  for (let divisor = 3; divisor <= max; divisor += 2) {
    if (value % divisor === 0) return false;
  }
  return true;
}

export function createPrimeSeriesState(input?: { start?: number }): PrimeSeriesState {
  const start = typeof input?.start === "number" && Number.isFinite(input.start)
    ? Math.max(2, Math.floor(input.start))
    : 2;
  return {
    nextCandidate: start,
    latestPrime: null,
    primeCount: 0,
    lastPrime: null,
    seq: 0,
  };
}

export function nextPrimeSeriesTick(state: PrimeSeriesState): PrimeSeriesTick {
  const candidate = state.nextCandidate;
  const isPrime = isPrimeTrialDivision(candidate);
  const latestPrime = isPrime ? candidate : state.latestPrime;
  const gap = isPrime && state.lastPrime !== null ? candidate - state.lastPrime : undefined;
  const nextState: PrimeSeriesState = {
    nextCandidate: candidate + 1,
    latestPrime,
    lastPrime: isPrime ? candidate : state.lastPrime,
    primeCount: state.primeCount + (isPrime ? 1 : 0),
    seq: state.seq + 1,
  };
  return {
    state: nextState,
    event_type: isPrime ? "prime_found" : "prime_candidate_checked",
    payload: {
      candidate,
      is_prime: isPrime,
      latest_prime: latestPrime ?? undefined,
      prime_count: nextState.primeCount,
      gap,
    },
    trace: {
      calculator_trace_id: `scicalc-prime:${nextState.seq}:${candidate}`,
      algorithm: "trial_division",
      deterministic: true,
    },
  };
}
