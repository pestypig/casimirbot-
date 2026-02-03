export type CircuitBreakerSnapshot = {
  name: string;
  open: boolean;
  failures: number;
  openedUntil: number;
  lastFailureAt?: number;
  lastError?: string;
  cooldownMs: number;
  failureThreshold: number;
};

export type CircuitBreakerOptions = {
  name: string;
  failureThreshold: number;
  cooldownMs: number;
};

export const createCircuitBreaker = (options: CircuitBreakerOptions) => {
  const state = {
    failures: 0,
    openedUntil: 0,
    lastFailureAt: undefined as number | undefined,
    lastError: undefined as string | undefined,
  };

  const reset = () => {
    state.failures = 0;
    state.openedUntil = 0;
    state.lastFailureAt = undefined;
    state.lastError = undefined;
  };

  const isOpen = (): boolean => {
    if (options.failureThreshold <= 0) return false;
    if (!state.openedUntil) return false;
    if (Date.now() < state.openedUntil) return true;
    reset();
    return false;
  };

  const recordFailure = (error?: unknown) => {
    if (options.failureThreshold <= 0) return;
    state.failures += 1;
    state.lastFailureAt = Date.now();
    if (error instanceof Error) {
      state.lastError = error.message.slice(0, 280);
    } else if (typeof error === "string") {
      state.lastError = error.slice(0, 280);
    } else if (error) {
      state.lastError = String(error).slice(0, 280);
    }
    if (state.failures >= options.failureThreshold) {
      state.openedUntil = Date.now() + Math.max(0, options.cooldownMs);
    }
  };

  const recordSuccess = () => {
    if (options.failureThreshold <= 0) return;
    reset();
  };

  const snapshot = (): CircuitBreakerSnapshot => ({
    name: options.name,
    open: isOpen(),
    failures: state.failures,
    openedUntil: state.openedUntil,
    lastFailureAt: state.lastFailureAt,
    lastError: state.lastError,
    cooldownMs: options.cooldownMs,
    failureThreshold: options.failureThreshold,
  });

  return {
    isOpen,
    recordFailure,
    recordSuccess,
    snapshot,
  };
};
