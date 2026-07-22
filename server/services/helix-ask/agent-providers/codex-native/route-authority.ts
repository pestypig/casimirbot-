type RecordLike = Record<string, unknown>;

const readRecord = (value: unknown): RecordLike | null =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordLike : null;

const readString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() ? value.trim() : null;

export const isLegacyRealtimeTransportSourceTargetIntent = (
  intent: RecordLike | null,
  body: RecordLike,
): boolean => {
  if (!intent) return false;
  if (
    readString(intent.target_source) !== "operator_text" ||
    readString(intent.target_kind) !== "realtime_transcript"
  ) return false;
  const routeMetadata = readRecord(body.route_metadata) ?? readRecord(body.routeMetadata);
  return (
    readString(intent.source) === "stage_play_realtime_handoff" ||
    readString(routeMetadata?.source) === "realtime_stage_play" ||
    readString(routeMetadata?.invocationKind) === "stage_play_realtime_transcript_handoff"
  );
};

export const readCodexSemanticSourceTargetIntent = (body: RecordLike): RecordLike | null => {
  const candidates = [
    readRecord(body.source_target_intent),
    readRecord(body.sourceTargetIntent),
    readRecord(readRecord(body.route_metadata)?.source_target_intent),
    readRecord(readRecord(body.routeMetadata)?.source_target_intent),
  ];
  return candidates.find(
    (intent: RecordLike | null) =>
      intent && !isLegacyRealtimeTransportSourceTargetIntent(intent, body),
  ) ?? null;
};

const ROUTE_AUTHORITY_KEYS = [
  "source_target_intent",
  "committed_ask_route",
  "capability_itinerary",
  "tool_call_admission_decision",
  "route_product_contract",
  "canonical_goal_frame",
  "route_evidence_authority",
] as const;

export const projectCodexRequestRouteAuthority = (body: RecordLike): RecordLike =>
  Object.fromEntries(ROUTE_AUTHORITY_KEYS.flatMap((key: typeof ROUTE_AUTHORITY_KEYS[number]) => {
    const value = readRecord(body[key]);
    return value ? [[key, value]] : [];
  }));
