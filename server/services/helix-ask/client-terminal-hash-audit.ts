import type { HelixTerminalAuthority } from "@shared/helix-turn-poison-guard";
import { hashHelixTerminalText } from "./turn-terminal-authority";

export type ClientTerminalHashAudit = {
  schema: "helix.client_terminal_hash_audit.v1";
  server_terminal_hash: string;
  client_visible_terminal_hash: string | null;
  client_server_terminal_match: boolean | null;
  suppressed_stream_terminal_count: number;
};

export function auditClientTerminalHash(input: {
  authority: HelixTerminalAuthority;
  clientVisibleText?: string | null;
  suppressedStreamTerminalCount?: number;
}): ClientTerminalHashAudit {
  const clientHash = input.clientVisibleText ? hashHelixTerminalText(input.clientVisibleText) : null;
  return {
    schema: "helix.client_terminal_hash_audit.v1",
    server_terminal_hash: input.authority.terminal_text_hash,
    client_visible_terminal_hash: clientHash,
    client_server_terminal_match: clientHash ? clientHash === input.authority.terminal_text_hash : null,
    suppressed_stream_terminal_count: input.suppressedStreamTerminalCount ?? 0,
  };
}
