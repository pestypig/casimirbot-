type ErrorReporter = {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
  flush?: (timeout?: number) => Promise<boolean>;
};

let reporter: ErrorReporter | null = null;

export const initErrorReporter = async (): Promise<void> => {
  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return;
  try {
    // @ts-expect-error optional dependency
    const mod = (await import("@sentry/node")) as unknown as {
      init: (options: Record<string, unknown>) => void;
      captureException: (error: unknown, context?: Record<string, unknown>) => void;
      flush?: (timeout?: number) => Promise<boolean>;
    };
    mod.init({
      dsn,
      environment: process.env.SENTRY_ENV ?? process.env.NODE_ENV ?? "development",
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
    });
    reporter = {
      captureException: mod.captureException,
      flush: mod.flush,
    };
  } catch (error) {
    console.warn("[observability] Sentry init skipped:", (error as Error).message);
  }
};

export const reportError = (error: unknown, context?: Record<string, unknown>): void => {
  if (!reporter) return;
  try {
    reporter.captureException(error, context);
  } catch {
    // Ignore reporting failures.
  }
};

export const flushErrorReporter = async (timeoutMs = 2000): Promise<void> => {
  if (!reporter?.flush) return;
  try {
    await reporter.flush(timeoutMs);
  } catch {
    // Ignore flush errors.
  }
};
