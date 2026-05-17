import {
  HELIX_TERMINAL_TURN_STATE_SCHEMA,
  type HelixTerminalTurnState,
} from "@shared/helix-terminal-turn-state";

const terminalStateByTurn = new Map<string, HelixTerminalTurnState>();

export function recordTerminalTurnState(input: Omit<HelixTerminalTurnState, "schema" | "server_authoritative" | "assistant_answer" | "raw_content_included" | "created_at"> & {
  created_at?: string;
}): HelixTerminalTurnState {
  const key = `${input.thread_id}:${input.turn_id}`;
  if (terminalStateByTurn.has(key)) throw new Error("terminal_turn_state_already_exists");
  const state: HelixTerminalTurnState = {
    schema: HELIX_TERMINAL_TURN_STATE_SCHEMA,
    thread_id: input.thread_id,
    turn_id: input.turn_id,
    terminal_item_id: input.terminal_item_id,
    terminal_kind: input.terminal_kind,
    server_authoritative: true,
    assistant_answer: false,
    raw_content_included: false,
    created_at: input.created_at ?? new Date().toISOString(),
  };
  terminalStateByTurn.set(key, state);
  return state;
}

export function getTerminalTurnState(threadId: string, turnId: string): HelixTerminalTurnState | null {
  return terminalStateByTurn.get(`${threadId}:${turnId}`) ?? null;
}

export function resetTerminalTurnStatesForTest(): void {
  terminalStateByTurn.clear();
}
