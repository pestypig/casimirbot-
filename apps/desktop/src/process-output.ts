type DiagnosticOutputStream = {
  destroyed?: boolean;
  writable?: boolean;
  on: (event: "error", listener: (error: Error) => void) => unknown;
  write: (chunk: string) => unknown;
};

const guardedStreams = new WeakSet<object>();

/**
 * Electron GUI launches do not guarantee that inherited stdout/stderr pipes
 * remain open. Diagnostic output must never become a main-process failure.
 */
export const installProcessOutputGuards = (
  streams: ReadonlyArray<DiagnosticOutputStream | undefined> = [
    process.stdout,
    process.stderr,
  ],
): void => {
  for (const stream of streams) {
    if (!stream || guardedStreams.has(stream)) continue;
    guardedStreams.add(stream);
    stream.on("error", () => {
      // The durable desktop startup journal is the source of truth. A closed
      // or otherwise unusable inherited process stream is non-fatal.
    });
  }
};

export const writeProcessDiagnostic = (
  stream: DiagnosticOutputStream | undefined,
  message: string,
): void => {
  if (!stream || stream.destroyed || stream.writable === false) return;
  try {
    stream.write(`${message}\n`);
  } catch {
    // Some Windows pipe failures surface synchronously rather than by an
    // "error" event. Diagnostics remain best-effort in both cases.
  }
};
