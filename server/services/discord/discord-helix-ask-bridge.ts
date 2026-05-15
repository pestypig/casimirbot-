export type DiscordHelixAskBridgeInput = {
  thread_id: string;
  session_id?: string | null;
  prompt: string;
  discord_session_id?: string | null;
  discord_interaction_id?: string | null;
  discord_user_id?: string | null;
};

export type DiscordHelixAskBridgeResult = {
  ok: boolean;
  answer: string;
  turn_id?: string | null;
  final_answer_source?: string | null;
  terminal_artifact_kind?: string | null;
  terminal_hash?: string | null;
  poison_audit_ok?: boolean | null;
  terminal_authority_ok?: boolean | null;
  error?: string | null;
};

export type DiscordHelixAskExecutor = (
  input: DiscordHelixAskBridgeInput,
) => Promise<DiscordHelixAskBridgeResult>;

let testExecutor: DiscordHelixAskExecutor | null = null;

const readRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readBoolean = (value: unknown): boolean | null =>
  typeof value === "boolean" ? value : null;

function resolveAskEndpoint(): string {
  const explicit = process.env.HELIX_DISCORD_ASK_ENDPOINT?.trim();
  if (explicit) return explicit;
  const port = process.env.PORT?.trim() || "5050";
  return `http://127.0.0.1:${port}/api/agi/ask/turn`;
}

export function setDiscordHelixAskExecutorForTests(executor: DiscordHelixAskExecutor | null): void {
  testExecutor = executor;
}

export async function runDiscordHelixAskTurn(input: DiscordHelixAskBridgeInput): Promise<DiscordHelixAskBridgeResult> {
  if (testExecutor) return testExecutor(input);
  const endpoint = resolveAskEndpoint();
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: input.prompt,
        text: input.prompt,
        mode: "read",
        thread_id: input.thread_id,
        sessionId: input.session_id ?? input.thread_id,
        source: "discord_interaction",
        discord_session_id: input.discord_session_id ?? null,
        discord_interaction_id: input.discord_interaction_id ?? null,
        discord_user_id: input.discord_user_id ?? null,
      }),
    });
    const body = (await response.json().catch(() => null)) as unknown;
    const record = readRecord(body) ?? {};
    const debug = readRecord(record.debug) ?? {};
    const terminal = readRecord(record.terminal_answer_authority) ?? readRecord(debug.terminal_answer_authority);
    const poison = readRecord(record.poison_audit) ?? readRecord(debug.poison_audit);
    const answer =
      readString(record.answer) ??
      readString(record.assistant_answer) ??
      readString(record.text) ??
      readString(record.selected_final_answer) ??
      "";
    return {
      ok: response.ok && Boolean(answer) && readBoolean(terminal?.server_authoritative) === true,
      answer: answer || "Helix Ask did not return terminal answer text.",
      turn_id: readString(record.turn_id),
      final_answer_source:
        readString(record.final_answer_source) ??
        readString(debug.final_answer_source) ??
        readString(terminal?.final_answer_source),
      terminal_artifact_kind:
        readString(record.terminal_artifact_kind) ??
        readString(debug.terminal_artifact_kind) ??
        readString(terminal?.terminal_artifact_kind),
      terminal_hash: readString(terminal?.terminal_text_hash),
      poison_audit_ok: readBoolean(poison?.ok),
      terminal_authority_ok: readBoolean(terminal?.server_authoritative),
      error: response.ok ? null : `helix_ask_http_${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      answer: "Helix Ask could not be reached for this Discord interaction.",
      error: error instanceof Error ? error.message : "helix_ask_unreachable",
    };
  }
}
