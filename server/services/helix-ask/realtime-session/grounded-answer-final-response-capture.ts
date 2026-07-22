type RecordLike = Record<string, unknown>;

const DEFAULT_MAX_TERMINAL_CAPTURE_BYTES = 4 * 1024 * 1024;
const TURN_FINAL_HEADER = /(?:^|\r?\n)event:\s*turn_final\s*\r?\n/i;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const parseTerminalPayload = (captured: string, streaming: boolean): RecordLike | null => {
  if (!captured.trim()) return null;
  if (!streaming) {
    try {
      return readRecord(JSON.parse(captured));
    } catch {
      return null;
    }
  }
  const blocks = captured.split(/\r?\n\r?\n/);
  for (const block of blocks.reverse()) {
    if (!/(?:^|\r?\n)event:\s*turn_final\s*$/im.test(block)) continue;
    const data = block
      .split(/\r?\n/)
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) continue;
    try {
      return readRecord(JSON.parse(data));
    } catch {
      return null;
    }
  }
  return null;
};

export type RealtimeGroundedFinalResponseCaptureResult = {
  payload: RecordLike | null;
  failureCode: string | null;
  capturedBytes: number;
};

export const createRealtimeGroundedFinalResponseCapture = (input: {
  streaming: boolean;
  maxCaptureBytes?: number;
}) => {
  const maxCaptureBytes = input.maxCaptureBytes ?? DEFAULT_MAX_TERMINAL_CAPTURE_BYTES;
  const chunks: Buffer[] = [];
  let capturedBytes = 0;
  let overflowed = false;
  let collectingTerminal = !input.streaming;
  let searchTail = "";

  const append = (buffer: Buffer): void => {
    if (overflowed || buffer.length === 0) return;
    if (capturedBytes + buffer.length > maxCaptureBytes) {
      overflowed = true;
      return;
    }
    chunks.push(buffer);
    capturedBytes += buffer.length;
  };

  const capture = (chunk: unknown, encoding?: BufferEncoding): void => {
    if (chunk === undefined || chunk === null || overflowed) return;
    const buffer = Buffer.isBuffer(chunk)
      ? chunk
      : Buffer.from(String(chunk), encoding ?? "utf8");
    if (collectingTerminal) {
      append(buffer);
      return;
    }
    const combined = `${searchTail}${buffer.toString("utf8")}`;
    const header = TURN_FINAL_HEADER.exec(combined);
    if (!header) {
      searchTail = combined.slice(-256);
      return;
    }
    collectingTerminal = true;
    searchTail = "";
    append(Buffer.from(combined.slice(header.index), "utf8"));
  };

  const finish = (): RealtimeGroundedFinalResponseCaptureResult => {
    if (overflowed) {
      return {
        payload: null,
        failureCode: "realtime_feedback_turn_final_payload_too_large",
        capturedBytes,
      };
    }
    const payload = parseTerminalPayload(
      Buffer.concat(chunks).toString("utf8"),
      input.streaming,
    );
    return {
      payload,
      failureCode: payload ? null : "realtime_feedback_turn_final_payload_missing",
      capturedBytes,
    };
  };

  return { capture, finish };
};
