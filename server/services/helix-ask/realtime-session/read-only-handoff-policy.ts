type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.map(readString).filter((entry): entry is string => Boolean(entry))
    : [];

const isRealtimeReadOnlyHandoff = (body: RecordLike): boolean => {
  const routeMetadata = readRecord(body.routeMetadata ?? body.route_metadata);
  const sourceTargetIntent = readRecord(
    routeMetadata?.source_target_intent ?? routeMetadata?.sourceTargetIntent,
  );
  const workerAdmission = readRecord(
    routeMetadata?.realtimeWorkerAdmission ?? routeMetadata?.realtime_worker_admission,
  );
  const dispatch = readRecord(workerAdmission?.dispatch);
  const forbiddenCapabilities = readStringArray(
    routeMetadata?.forbiddenCapabilities ?? routeMetadata?.forbidden_capabilities,
  );
  return (
    readString(routeMetadata?.source) === "realtime_stage_play" &&
    readString(routeMetadata?.invocationKind ?? routeMetadata?.invocation_kind) ===
      "stage_play_realtime_transcript_handoff" &&
    sourceTargetIntent?.admitted_readonly_handoff === true &&
    dispatch?.read_only === true &&
    dispatch?.workstation_action_execution_allowed === false &&
    forbiddenCapabilities.includes("workstation_action_execution")
  );
};

export const filterRealtimeReadOnlyHandoffGatewayRequests = (
  body: RecordLike,
  requests: RecordLike[],
): RecordLike[] => {
  if (!isRealtimeReadOnlyHandoff(body)) return requests;
  return requests.filter((request) => readString(request.mode) !== "act");
};
