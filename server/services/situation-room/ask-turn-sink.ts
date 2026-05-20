export type AskTurnRequest = {
  request_id: string;
  thread_id: string;
  reason:
    | "direct_address"
    | "manual_user_request"
    | "policy_approved_interjection";
  evidence_refs: string[];
  created_at: string;
};

export type AskTurnSink = {
  createAskTurn: (request: AskTurnRequest) => void;
};

export function createRecordingAskTurnSink(): {
  sink: AskTurnSink;
  requests: AskTurnRequest[];
} {
  const requests: AskTurnRequest[] = [];
  return {
    requests,
    sink: {
      createAskTurn: (request) => {
        requests.push(request);
      },
    },
  };
}

export const noopAskTurnSink: AskTurnSink = {
  createAskTurn: () => undefined,
};
