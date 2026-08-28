import crypto from "node:crypto";
import {
  readSharedRealtimeRoomDatabase,
  withSharedRealtimeRoomTransaction,
} from "../helix-ask/realtime-room/room-store/database";
import type { Queryable } from
  "../helix-ask/realtime-room/room-store/types";
import type { HelixBrokerageObservation } from
  "@shared/helix-brokerage-environment";
import {
  HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_DEGRADED_REASONS,
  HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA,
  helixBrokerageReactiveLiveShadowControlSchema,
  helixBrokerageReactiveLiveShadowPollReceiptSchema,
  helixBrokerageReactiveLiveShadowProjectionSchema,
  helixBrokerageReactiveLiveShadowStartSchema,
  type HelixBrokerageReactiveLiveShadowPollReceipt,
  type HelixBrokerageReactiveLiveShadowProjection,
  type HelixBrokerageReactiveLiveShadowStart,
} from "@shared/trading/brokerage-reactive-live-shadow";
import {
  HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
  helixBrokerageReactiveMarketObservationSchema,
  helixBrokerageReactiveStrategyManifestSchema,
  type HelixBrokerageReactiveMarketObservation,
  type HelixBrokerageReactiveStrategyManifest,
} from "@shared/trading/brokerage-reactive-simulation";
import {
  helixBrokerageReactiveControllerProjectionSchema,
  type HelixBrokerageReactiveControllerProjection,
} from "@shared/trading/brokerage-reactive-controller";
import { executeRobinhoodPrivateRoomRead } from
  "../brokerage/robinhood-read-adapter";
import { PaperTradingError } from "./paper-trading-errors";
import {
  processBrokerageReactiveControllerObservation,
  readBrokerageReactiveController,
  tripBrokerageReactiveControllerSource,
} from "./brokerage-reactive-controller-store";

type ShadowRow = {
  shadow_session_id: string;
  request_hash: string;
  projection_json: unknown;
  earnings_observation_id: string | null;
  in_flight_token: string | null;
  in_flight_started_at: string | Date | null;
};

type ClaimedPoll = {
  projection: HelixBrokerageReactiveLiveShadowProjection;
  pollSequence: number;
  token: string;
  earningsObservationId: string | null;
  readStartedAt: string;
};

type LatencyKey =
  | "poll_duration"
  | "provider_to_arrival"
  | "arrival_to_decision"
  | "end_to_end";

const parseJson = <T>(value: unknown): T => {
  if (typeof value === "string") return JSON.parse(value) as T;
  return value as T;
};

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]));
  }
  return value;
};

const sha256 = (value: unknown): string => `sha256:${crypto.createHash("sha256")
  .update(JSON.stringify(canonicalize(value))).digest("hex")}`;

const project = (row: ShadowRow): HelixBrokerageReactiveLiveShadowProjection =>
  helixBrokerageReactiveLiveShadowProjectionSchema.parse(
    parseJson(row.projection_json),
  );

const emptyLatency = () => ({
  samples: 0,
  minimum_ms: null,
  maximum_ms: null,
  mean_ms: null,
});

const addLatency = (
  projection: HelixBrokerageReactiveLiveShadowProjection,
  key: LatencyKey,
  value: number | null,
): HelixBrokerageReactiveLiveShadowProjection => {
  if (value === null) return projection;
  const current = projection[key];
  const samples = current.samples + 1;
  return {
    ...projection,
    [key]: {
      samples,
      minimum_ms: current.minimum_ms === null
        ? value : Math.min(current.minimum_ms, value),
      maximum_ms: current.maximum_ms === null
        ? value : Math.max(current.maximum_ms, value),
      mean_ms: Math.round(
        ((current.mean_ms ?? 0) * current.samples + value) / samples,
      ),
    },
  };
};

const requireShadow = async (
  db: Queryable,
  shadowSessionId: string,
  lock: boolean,
): Promise<ShadowRow> => {
  const result = await db.query<ShadowRow>(
    `SELECT shadow_session_id, request_hash, projection_json,
            earnings_observation_id, in_flight_token, in_flight_started_at
       FROM helix_brokerage_reactive_shadow_sessions
      WHERE shadow_session_id=$1 LIMIT 1${lock ? " FOR UPDATE" : ""};`,
    [shadowSessionId],
  );
  if (!result.rows[0]) {
    throw new PaperTradingError(
      "reactive_shadow_not_found", 404,
      "The brokerage live-input shadow session was not found.",
    );
  }
  return result.rows[0];
};

const assertAccess = (
  projection: HelixBrokerageReactiveLiveShadowProjection,
  input: { ownerProfileId: string; connectionId: string; roomId: string },
): void => {
  if (projection.owner_profile_id !== input.ownerProfileId ||
      projection.connection_id !== input.connectionId ||
      projection.room_id !== input.roomId) {
    throw new PaperTradingError(
      "reactive_controller_identity_mismatch", 403,
      "The live-input shadow identity does not match the signed-in route.",
    );
  }
};

const saveProjection = async (
  db: Queryable,
  projection: HelixBrokerageReactiveLiveShadowProjection,
  inFlightToken: string | null,
  inFlightStartedAt: string | null,
): Promise<void> => {
  await db.query(
    `UPDATE helix_brokerage_reactive_shadow_sessions
        SET status=$2, terminal_reason=$3, polls_attempted=$4,
            polls_succeeded=$5, consecutive_failures=$6,
            next_poll_at=$7, in_flight_token=$8,
            in_flight_started_at=$9, projection_json=$10::jsonb,
            updated_at=$11, terminal_at=$12
      WHERE shadow_session_id=$1;`,
    [projection.shadow_session_id, projection.status,
      projection.terminal_reason, projection.polls_attempted,
      projection.polls_succeeded, projection.consecutive_failures,
      projection.next_poll_at, inFlightToken, inFlightStartedAt,
      JSON.stringify(projection), projection.updated_at,
      projection.terminal_at],
  );
};

const terminalize = (
  projection: HelixBrokerageReactiveLiveShadowProjection,
  status: "completed" | "stopped" | "source_failed" | "controller_terminal",
  reason: HelixBrokerageReactiveLiveShadowProjection["terminal_reason"],
  now: string,
): HelixBrokerageReactiveLiveShadowProjection =>
  helixBrokerageReactiveLiveShadowProjectionSchema.parse({
    ...projection,
    status,
    terminal_reason: reason,
    poll_in_flight: false,
    updated_at: now,
    terminal_at: now,
  });

const normalizedKey = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]/gu, "");

const collectRecords = (
  value: unknown,
  output: Record<string, unknown>[],
  depth = 0,
): void => {
  if (depth > 7 || !value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    for (const entry of value) collectRecords(entry, output, depth + 1);
    return;
  }
  const record = value as Record<string, unknown>;
  output.push(record);
  for (const entry of Object.values(record)) {
    collectRecords(entry, output, depth + 1);
  }
};

const direct = (
  record: Record<string, unknown>,
  keys: ReadonlySet<string>,
): unknown => {
  for (const [key, value] of Object.entries(record)) {
    if (keys.has(normalizedKey(key))) return value;
  }
  return null;
};

const scalar = (value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return direct(value as Record<string, unknown>, new Set([
    "price", "amount", "value", "timestamp", "time", "at",
  ]));
};

const decimalToMicros = (value: unknown): number | null => {
  const source = typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : typeof value === "string"
      ? value.trim().replace(/^\$/u, "").replace(/,/gu, "") : "";
  const match = /^(\d{1,7})(?:\.(\d{0,6}))?$/u.exec(source);
  if (!match) return null;
  const result = Number(match[1]) * 1_000_000 +
    Number((match[2] ?? "").padEnd(6, "0"));
  return Number.isSafeInteger(result) && result > 0 ? result : null;
};

const timestampFrom = (value: unknown): string | null => {
  const candidate = scalar(value);
  if (typeof candidate !== "string" && typeof candidate !== "number") {
    return null;
  }
  const parsed = typeof candidate === "number" && candidate < 10_000_000_000
    ? candidate * 1_000 : Date.parse(String(candidate));
  const millis = typeof parsed === "number" ? parsed : Number.NaN;
  return Number.isFinite(millis) ? new Date(millis).toISOString() : null;
};

const marketSessionFrom = (value: unknown):
"regular" | "pre" | "post" | "closed" | null => {
  if (typeof value !== "string") return null;
  const key = normalizedKey(value);
  if (["regular", "regularhours", "regulartrading", "marketopen", "open"]
    .includes(key)) return "regular";
  if (["pre", "premarket", "prehours"].includes(key)) return "pre";
  if (["post", "postmarket", "afterhours", "extendedhours"]
    .includes(key)) return "post";
  if (["closed", "marketclosed"].includes(key)) return "closed";
  return null;
};

const SYMBOL_KEYS = new Set(["symbol", "ticker", "stocksymbol"]);
const BID_KEYS = new Set(["bid", "bidprice", "bestbid", "bestbidprice"]);
const ASK_KEYS = new Set(["ask", "askprice", "bestask", "bestaskprice"]);
const LAST_KEYS = new Set([
  "last", "lastprice", "lasttradeprice", "mark", "markprice",
]);
const PRIOR_CLOSE_KEYS = new Set([
  "priorclose", "previousclose", "previouscloseprice", "priorcloseprice",
]);
const SESSION_KEYS = new Set([
  "marketsession", "tradingsession", "markethours", "marketstate",
]);
const TIME_KEYS = new Set([
  "providerobservedat", "observedat", "updatedat", "asof",
  "lasttradeat", "timestamp",
]);

export const normalizeRobinhoodQuoteForReactiveShadow = (input: {
  source: HelixBrokerageObservation;
  projection: HelixBrokerageReactiveLiveShadowProjection;
  pollSequence: number;
  readCompletedAt: string;
  processingAt: string;
}): {
  observation: HelixBrokerageReactiveMarketObservation;
  providerTimeBasis: "provider_payload" | "arrival_proxy";
} => {
  if (input.source.upstream_tool !== "get_equity_quotes" ||
      input.source.capability_id !== "brokerage.robinhood.market_data.read" ||
      input.source.connection_id !== input.projection.connection_id ||
      input.source.room_id !== input.projection.room_id ||
      input.source.producer_epoch_ref !== input.projection.producer_epoch_ref) {
    throw new PaperTradingError(
      "reactive_shadow_source_identity_invalid", 409,
      "The Robinhood quote source does not match the active shadow identity.",
    );
  }
  const records: Record<string, unknown>[] = [];
  collectRecords(input.source.data, records);
  const target = input.projection.symbol;
  const record = records.find((candidate) => {
    const value = direct(candidate, SYMBOL_KEYS);
    return typeof value === "string" && value.toUpperCase() === target;
  });
  if (!record) {
    throw new PaperTradingError(
      "reactive_shadow_quote_invalid", 409,
      "The Robinhood quote result does not contain the shadow symbol.",
    );
  }
  const bid = decimalToMicros(scalar(direct(record, BID_KEYS)));
  const ask = decimalToMicros(scalar(direct(record, ASK_KEYS)));
  const last = decimalToMicros(scalar(direct(record, LAST_KEYS)));
  const priorClose = decimalToMicros(scalar(direct(record, PRIOR_CLOSE_KEYS)));
  const marketSession = marketSessionFrom(direct(record, SESSION_KEYS));
  if (bid === null || ask === null || last === null || priorClose === null ||
      marketSession === null || ask < bid) {
    throw new PaperTradingError(
      "reactive_shadow_quote_invalid", 409,
      "The live quote lacks an explicit valid bid, ask, last, prior close, or market session.",
    );
  }
  const providerTime = timestampFrom(direct(record, TIME_KEYS));
  const basis = providerTime ? "provider_payload" : "arrival_proxy";
  const eventTime = providerTime ?? input.readCompletedAt;
  if (Date.parse(eventTime) > Date.parse(input.readCompletedAt)) {
    throw new PaperTradingError(
      "reactive_shadow_clock_invalid", 409,
      "The provider quote time is later than local arrival time.",
    );
  }
  return {
    providerTimeBasis: basis,
    observation: helixBrokerageReactiveMarketObservationSchema.parse({
      schema: HELIX_BROKERAGE_REACTIVE_SIMULATION_SCHEMA,
      observation_id: input.source.observation_id,
      observation_revision: 0,
      sequence: input.pollSequence,
      owner_profile_id: input.projection.owner_profile_id,
      room_id: input.projection.room_id,
      environment_binding_id: input.projection.environment_binding_id,
      connection_id: input.projection.connection_id,
      paper_account_id: input.projection.paper_account_id,
      producer_epoch_ref: input.source.producer_epoch_ref,
      symbol: target,
      bid_micros: bid,
      ask_micros: ask,
      last_micros: last,
      prior_close_micros: priorClose,
      market_session: marketSession,
      event_time: eventTime,
      provider_observed_at: eventTime,
      arrived_at: input.readCompletedAt,
      processed_at: input.processingAt,
      source_output_hash: input.source.output_hash,
      authoritative_snapshot: true,
      retention_gap_after_sequence: null,
      source_read_only: true,
      simulation_input_only: true,
      provider_mutation_attempted: false,
      live_order_execution_enabled: false,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    }),
  };
};

const readControllerRow = async (
  db: Queryable,
  controllerRunId: string,
  lock: boolean,
): Promise<{
  projection: HelixBrokerageReactiveControllerProjection;
  manifest: HelixBrokerageReactiveStrategyManifest;
}> => {
  const result = await db.query<{
    projection_json: unknown;
    manifest_json: unknown;
  }>(
    `SELECT projection_json, manifest_json
       FROM helix_brokerage_reactive_controller_runs
      WHERE controller_run_id=$1 LIMIT 1${lock ? " FOR UPDATE" : ""};`,
    [controllerRunId],
  );
  if (!result.rows[0]) {
    throw new PaperTradingError(
      "reactive_controller_not_found", 404,
      "The finite reactive controller was not found.",
    );
  }
  return {
    projection: helixBrokerageReactiveControllerProjectionSchema.parse(
      parseJson(result.rows[0].projection_json),
    ),
    manifest: helixBrokerageReactiveStrategyManifestSchema.parse(
      parseJson(result.rows[0].manifest_json),
    ),
  };
};

export const startBrokerageReactiveLiveShadow = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  controllerRunId: string;
  request: unknown;
  now?: Date;
}): Promise<HelixBrokerageReactiveLiveShadowProjection> => {
  const request = helixBrokerageReactiveLiveShadowStartSchema.parse(
    input.request,
  ) as HelixBrokerageReactiveLiveShadowStart;
  const now = (input.now ?? new Date()).toISOString();
  const requestHash = sha256(request);
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const controller = await readControllerRow(db, input.controllerRunId, true);
    const run = controller.projection;
    const manifest = controller.manifest;
    if (run.owner_profile_id !== input.ownerProfileId ||
        run.connection_id !== input.connectionId ||
        run.room_id !== input.roomId || run.status !== "active") {
      throw new PaperTradingError(
        "reactive_controller_not_active", 409,
        "R3 requires the exact active owner-private R2 controller.",
      );
    }
    if (!manifest.allowed_symbols.includes(request.symbol) ||
        request.poll_interval_ms < manifest.observation_schedule.minimum_interval_ms ||
        request.poll_interval_ms > manifest.observation_schedule.maximum_interval_ms ||
        request.maximum_polls !== run.maximum_cycles - run.processed_cycles ||
        Date.parse(request.session_expires_at) > Date.parse(run.lease_expires_at) ||
        Date.parse(request.session_expires_at) > Date.parse(run.controller_deadline_at) ||
        Date.parse(request.session_expires_at) <= Date.parse(now)) {
      throw new PaperTradingError(
        "reactive_shadow_contract_invalid", 409,
        "The finite shadow session must match the manifest, remaining cycle budget, polling bounds, and controller lease.",
      );
    }
    const prior = await db.query<ShadowRow>(
      `SELECT shadow_session_id, request_hash, projection_json,
              earnings_observation_id, in_flight_token, in_flight_started_at
         FROM helix_brokerage_reactive_shadow_sessions
        WHERE owner_profile_id=$1 AND client_shadow_session_id=$2
        LIMIT 1 FOR UPDATE;`,
      [input.ownerProfileId, request.client_shadow_session_id],
    );
    if (prior.rows[0]) {
      if (prior.rows[0].request_hash !== requestHash) {
        throw new PaperTradingError(
          "reactive_controller_replay_conflict", 409,
          "The shadow client identity was reused with different inputs.",
        );
      }
      return project(prior.rows[0]);
    }
    const shadowSessionId = `brokerage_shadow:${crypto.randomUUID()}`;
    const projection = helixBrokerageReactiveLiveShadowProjectionSchema.parse({
      schema: HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA,
      shadow_session_id: shadowSessionId,
      client_shadow_session_id: request.client_shadow_session_id,
      controller_run_id: run.controller_run_id,
      controller_profile_id: run.controller_profile_id,
      owner_profile_id: run.owner_profile_id,
      connection_id: run.connection_id,
      room_id: run.room_id,
      environment_binding_id: run.environment_binding_id,
      paper_account_id: run.paper_account_id,
      producer_epoch_ref: run.producer_epoch_ref,
      strategy_manifest_id: run.strategy_manifest_id,
      strategy_artifact_hash: run.strategy_artifact_hash,
      symbol: request.symbol,
      status: "active",
      terminal_reason: null,
      poll_interval_ms: request.poll_interval_ms,
      maximum_polls: request.maximum_polls,
      polls_attempted: 0,
      polls_succeeded: 0,
      consecutive_failures: 0,
      maximum_consecutive_failures: request.maximum_consecutive_failures,
      regular_session_observations: 0,
      degraded_timing_observations: 0,
      last_observation_id: null,
      last_source_output_hash: null,
      last_error_code: null,
      poll_in_flight: false,
      next_poll_at: now,
      session_expires_at: request.session_expires_at,
      started_at: now,
      updated_at: now,
      terminal_at: null,
      poll_duration: emptyLatency(),
      provider_to_arrival: emptyLatency(),
      arrival_to_decision: emptyLatency(),
      end_to_end: emptyLatency(),
      bounded_polling: true,
      private_model_loop_present: false,
      owner_private_source: true,
      source_read_only: true,
      simulated: true,
      provider_order_tool_calls_made: 0,
      provider_mutation_attempted: false,
      live_order_execution_enabled: false,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    await db.query(
      `INSERT INTO helix_brokerage_reactive_shadow_sessions(
         shadow_session_id, client_shadow_session_id, controller_run_id,
         owner_profile_id, connection_id, room_id, symbol, status,
         terminal_reason, polls_attempted, polls_succeeded,
         consecutive_failures, maximum_polls, maximum_consecutive_failures,
         poll_interval_ms, next_poll_at, session_expires_at,
         in_flight_token, in_flight_started_at, earnings_observation_id,
         request_hash, projection_json, created_at, updated_at, terminal_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,'active',NULL,0,0,0,$8,$9,$10,
         $11,$12,NULL,NULL,$13,$14,$15::jsonb,$11,$11,NULL);`,
      [shadowSessionId, request.client_shadow_session_id, run.controller_run_id,
        run.owner_profile_id, run.connection_id, run.room_id, request.symbol,
        request.maximum_polls, request.maximum_consecutive_failures,
        request.poll_interval_ms, now, request.session_expires_at,
        request.earnings_observation_id, requestHash,
        JSON.stringify(projection)],
    );
    return projection;
  });
};

export const readBrokerageReactiveLiveShadow = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  shadowSessionId: string;
}): Promise<HelixBrokerageReactiveLiveShadowProjection> => {
  const db = await readSharedRealtimeRoomDatabase();
  const projection = project(await requireShadow(db, input.shadowSessionId, false));
  assertAccess(projection, input);
  return projection;
};

const claimPoll = async (input: {
  shadowSessionId: string;
  now: string;
}): Promise<ClaimedPoll | null> => withSharedRealtimeRoomTransaction(
  async (db: Queryable) => {
    const row = await requireShadow(db, input.shadowSessionId, true);
    let projection = project(row);
    if (projection.status !== "active" || row.in_flight_token) return null;
    if (Date.parse(input.now) >= Date.parse(projection.session_expires_at)) {
      projection = terminalize(
        projection, "completed", "session_expired", input.now,
      );
      await saveProjection(db, projection, null, null);
      return null;
    }
    if (Date.parse(input.now) < Date.parse(projection.next_poll_at)) return null;
    const controller = await readControllerRow(
      db, projection.controller_run_id, true,
    );
    if (controller.projection.status !== "active") {
      projection = terminalize(
        projection, "controller_terminal", "controller_terminal", input.now,
      );
      await saveProjection(db, projection, null, null);
      return null;
    }
    const pollSequence = projection.polls_attempted + 1;
    const token = `shadow_poll:${crypto.randomUUID()}`;
    projection = helixBrokerageReactiveLiveShadowProjectionSchema.parse({
      ...projection,
      polls_attempted: pollSequence,
      poll_in_flight: true,
      next_poll_at: new Date(
        Date.parse(input.now) + projection.poll_interval_ms,
      ).toISOString(),
      updated_at: input.now,
    });
    await db.query(
      `INSERT INTO helix_brokerage_reactive_shadow_polls(
         shadow_session_id, poll_sequence, in_flight_token, disposition,
         source_observation_id, source_output_hash, error_code, receipt_json,
         read_started_at, read_completed_at, processing_completed_at,
         created_at
       ) VALUES ($1,$2,$3,'in_flight',NULL,NULL,NULL,NULL,$4,NULL,NULL,$4);`,
      [projection.shadow_session_id, pollSequence, token, input.now],
    );
    await saveProjection(db, projection, token, input.now);
    return {
      projection,
      pollSequence,
      token,
      earningsObservationId: row.earnings_observation_id,
      readStartedAt: input.now,
    };
  },
);

type LiveShadowDependencies = {
  executeRead: typeof executeRobinhoodPrivateRoomRead;
  processController: typeof processBrokerageReactiveControllerObservation;
  tripController: typeof tripBrokerageReactiveControllerSource;
  clock: () => Date;
};

const defaultDependencies: LiveShadowDependencies = {
  executeRead: executeRobinhoodPrivateRoomRead,
  processController: processBrokerageReactiveControllerObservation,
  tripController: tripBrokerageReactiveControllerSource,
  clock: () => new Date(),
};

const boundedLatency = (later: string, earlier: string): number => {
  const value = Date.parse(later) - Date.parse(earlier);
  return Math.max(0, Math.min(300_000, Math.round(value)));
};

const settlePoll = async (input: {
  claimed: ClaimedPoll;
  disposition: HelixBrokerageReactiveLiveShadowPollReceipt["disposition"];
  source: HelixBrokerageObservation | null;
  observation: HelixBrokerageReactiveMarketObservation | null;
  controllerReceipt: HelixBrokerageReactiveLiveShadowPollReceipt[
    "controller_receipt"
  ];
  controllerRun: HelixBrokerageReactiveControllerProjection | null;
  errorCode: string | null;
  providerTimeBasis: "provider_payload" | "arrival_proxy";
  readCompletedAt: string;
  processingCompletedAt: string;
  dependencies: LiveShadowDependencies;
}): Promise<HelixBrokerageReactiveLiveShadowPollReceipt> => {
  const pollDuration = boundedLatency(
    input.readCompletedAt, input.claimed.readStartedAt,
  );
  const arrivalToDecision = boundedLatency(
    input.processingCompletedAt, input.readCompletedAt,
  );
  const providerTime = input.observation?.provider_observed_at ?? null;
  const providerToArrival = input.providerTimeBasis === "provider_payload" &&
      providerTime
    ? boundedLatency(input.readCompletedAt, providerTime) : null;
  const endToEnd = input.providerTimeBasis === "provider_payload" && providerTime
    ? boundedLatency(input.processingCompletedAt, providerTime) : null;
  const degraded = input.providerTimeBasis === "arrival_proxy"
    ? [...HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_DEGRADED_REASONS]
    : [];
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const row = await requireShadow(
      db, input.claimed.projection.shadow_session_id, true,
    );
    if (row.in_flight_token !== input.claimed.token) {
      throw new PaperTradingError(
        "reactive_controller_replay_conflict", 409,
        "The shadow poll claim is no longer current.",
      );
    }
    let projection = project(row);
    const succeeded = input.disposition === "processed";
    projection = helixBrokerageReactiveLiveShadowProjectionSchema.parse({
      ...projection,
      polls_succeeded: projection.polls_succeeded + (succeeded ? 1 : 0),
      consecutive_failures: succeeded ? 0 : projection.consecutive_failures + 1,
      regular_session_observations:
        projection.regular_session_observations +
        (input.observation?.market_session === "regular" ? 1 : 0),
      degraded_timing_observations:
        projection.degraded_timing_observations + (degraded.length ? 1 : 0),
      last_observation_id: input.source?.observation_id ??
        projection.last_observation_id,
      last_source_output_hash: input.source?.output_hash ??
        projection.last_source_output_hash,
      last_error_code: input.errorCode,
      poll_in_flight: false,
      updated_at: input.processingCompletedAt,
    });
    projection = addLatency(projection, "poll_duration", pollDuration);
    projection = addLatency(
      projection, "provider_to_arrival", providerToArrival,
    );
    projection = addLatency(
      projection, "arrival_to_decision", arrivalToDecision,
    );
    projection = addLatency(projection, "end_to_end", endToEnd);
    const controllerTerminal = input.controllerRun?.status !== undefined &&
      input.controllerRun.status !== "active";
    if (controllerTerminal) {
      projection = terminalize(
        projection, "controller_terminal", "controller_terminal",
        input.processingCompletedAt,
      );
    } else if (projection.consecutive_failures >=
        projection.maximum_consecutive_failures) {
      projection = terminalize(
        projection, "source_failed", "source_failure_budget_exhausted",
        input.processingCompletedAt,
      );
    } else if (projection.polls_attempted === projection.maximum_polls) {
      projection = terminalize(
        projection, succeeded ? "completed" : "source_failed",
        succeeded ? "maximum_polls_exhausted" :
          "source_failure_budget_exhausted",
        input.processingCompletedAt,
      );
    }
    const receipt = helixBrokerageReactiveLiveShadowPollReceiptSchema.parse({
      schema: HELIX_BROKERAGE_REACTIVE_LIVE_SHADOW_SCHEMA,
      operation: "brokerage.reactive_live_shadow.poll",
      shadow_session: projection,
      poll_sequence: input.claimed.pollSequence,
      disposition: input.disposition,
      source_observation_id: input.source?.observation_id ?? null,
      source_output_hash: input.source?.output_hash ?? null,
      normalized_observation: input.observation,
      controller_receipt: input.controllerReceipt,
      controller_run: input.controllerRun,
      error_code: input.errorCode,
      read_started_at: input.claimed.readStartedAt,
      read_completed_at: input.readCompletedAt,
      processing_completed_at: input.processingCompletedAt,
      provider_time_basis: input.providerTimeBasis,
      poll_duration_ms: pollDuration,
      provider_to_arrival_ms: providerToArrival,
      arrival_to_decision_ms: arrivalToDecision,
      end_to_end_ms: endToEnd,
      degraded_timing_reasons: degraded,
      owner_private_source: true,
      source_read_only: true,
      simulated: true,
      provider_order_tool_calls_made: 0,
      provider_mutation_attempted: false,
      live_order_execution_enabled: false,
      credential_included: false,
      account_numbers_included: false,
      raw_provider_payload_included: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
    });
    await db.query(
      `UPDATE helix_brokerage_reactive_shadow_polls
          SET disposition=$4, source_observation_id=$5,
              source_output_hash=$6, error_code=$7, receipt_json=$8::jsonb,
              read_completed_at=$9, processing_completed_at=$10
        WHERE shadow_session_id=$1 AND poll_sequence=$2
          AND in_flight_token=$3;`,
      [projection.shadow_session_id, input.claimed.pollSequence,
        input.claimed.token, input.disposition,
        input.source?.observation_id ?? null, input.source?.output_hash ?? null,
        input.errorCode, JSON.stringify(receipt), input.readCompletedAt,
        input.processingCompletedAt],
    );
    await saveProjection(db, projection, null, null);
    return receipt;
  });
};

const errorCode = (error: unknown, fallback: string): string => {
  if (error && typeof error === "object" && "code" in error &&
      typeof (error as { code?: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  return fallback;
};

export const runBrokerageReactiveLiveShadowPoll = async (
  input: { shadowSessionId: string; now?: Date },
  dependencies: LiveShadowDependencies = defaultDependencies,
): Promise<HelixBrokerageReactiveLiveShadowPollReceipt | null> => {
  const readStart = (input.now ?? dependencies.clock()).toISOString();
  const claimed = await claimPoll({
    shadowSessionId: input.shadowSessionId,
    now: readStart,
  });
  if (!claimed) return null;
  let source: HelixBrokerageObservation;
  try {
    source = await dependencies.executeRead({
      ownerProfileId: claimed.projection.owner_profile_id,
      connectionId: claimed.projection.connection_id,
      roomId: claimed.projection.room_id,
      toolName: "get_equity_quotes",
      arguments: { symbols: [claimed.projection.symbol] },
      now: new Date(readStart),
    });
  } catch (error) {
    const completedAt = dependencies.clock().toISOString();
    const receipt = await settlePoll({
      claimed,
      disposition: "source_failed",
      source: null,
      observation: null,
      controllerReceipt: null,
      controllerRun: null,
      errorCode: errorCode(error, "reactive_shadow_source_failed"),
      providerTimeBasis: "arrival_proxy",
      readCompletedAt: completedAt,
      processingCompletedAt: completedAt,
      dependencies,
    });
    if (receipt.shadow_session.status === "source_failed") {
      await dependencies.tripController({
        ownerProfileId: claimed.projection.owner_profile_id,
        connectionId: claimed.projection.connection_id,
        roomId: claimed.projection.room_id,
        controllerRunId: claimed.projection.controller_run_id,
        reason: "source_poll_failed",
        detail: "The finite live-input shadow exhausted its source failure budget.",
        now: new Date(completedAt),
      });
    }
    return receipt;
  }
  const readCompletedAt = dependencies.clock().toISOString();
  let normalized: ReturnType<typeof normalizeRobinhoodQuoteForReactiveShadow>;
  try {
    const processingAt = dependencies.clock().toISOString();
    normalized = normalizeRobinhoodQuoteForReactiveShadow({
      source,
      projection: claimed.projection,
      pollSequence: claimed.pollSequence,
      readCompletedAt,
      processingAt,
    });
  } catch (error) {
    const processingCompletedAt = dependencies.clock().toISOString();
    const receipt = await settlePoll({
      claimed,
      disposition: "normalization_failed",
      source,
      observation: null,
      controllerReceipt: null,
      controllerRun: null,
      errorCode: errorCode(error, "reactive_shadow_quote_invalid"),
      providerTimeBasis: "arrival_proxy",
      readCompletedAt,
      processingCompletedAt,
      dependencies,
    });
    if (receipt.shadow_session.status === "source_failed") {
      await dependencies.tripController({
        ownerProfileId: claimed.projection.owner_profile_id,
        connectionId: claimed.projection.connection_id,
        roomId: claimed.projection.room_id,
        controllerRunId: claimed.projection.controller_run_id,
        reason: "source_contract_invalid",
        detail: "The finite live-input shadow exhausted its quote-contract failure budget.",
        now: new Date(processingCompletedAt),
      });
    }
    return receipt;
  }
  try {
    const controllerReceipt = await dependencies.processController({
      ownerProfileId: claimed.projection.owner_profile_id,
      connectionId: claimed.projection.connection_id,
      roomId: claimed.projection.room_id,
      controllerRunId: claimed.projection.controller_run_id,
      request: {
        observation: normalized.observation,
        earnings_observation_id: claimed.earningsObservationId,
      },
      now: new Date(normalized.observation.processed_at),
    });
    const processingCompletedAt = dependencies.clock().toISOString();
    return settlePoll({
      claimed,
      disposition: "processed",
      source,
      observation: normalized.observation,
      controllerReceipt,
      controllerRun: controllerReceipt.controller_run,
      errorCode: null,
      providerTimeBasis: normalized.providerTimeBasis,
      readCompletedAt,
      processingCompletedAt,
      dependencies,
    });
  } catch (error) {
    const processingCompletedAt = dependencies.clock().toISOString();
    const controllerRun = await readBrokerageReactiveController({
      ownerProfileId: claimed.projection.owner_profile_id,
      connectionId: claimed.projection.connection_id,
      roomId: claimed.projection.room_id,
      controllerRunId: claimed.projection.controller_run_id,
    }).catch(() => null);
    return settlePoll({
      claimed,
      disposition: "controller_rejected",
      source,
      observation: normalized.observation,
      controllerReceipt: null,
      controllerRun,
      errorCode: errorCode(error, "reactive_shadow_controller_rejected"),
      providerTimeBasis: normalized.providerTimeBasis,
      readCompletedAt,
      processingCompletedAt,
      dependencies,
    });
  }
};

export const controlBrokerageReactiveLiveShadow = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  shadowSessionId: string;
  control: unknown;
  now?: Date;
}): Promise<HelixBrokerageReactiveLiveShadowProjection> => {
  helixBrokerageReactiveLiveShadowControlSchema.parse(input.control);
  const now = (input.now ?? new Date()).toISOString();
  return withSharedRealtimeRoomTransaction(async (db: Queryable) => {
    const row = await requireShadow(db, input.shadowSessionId, true);
    let projection = project(row);
    assertAccess(projection, input);
    if (projection.status !== "active") return projection;
    if (row.in_flight_token) {
      throw new PaperTradingError(
        "reactive_controller_effect_unresolved", 409,
        "Wait for the current read-only poll to settle before stopping the shadow session.",
      );
    }
    projection = terminalize(projection, "stopped", "manual_stop", now);
    await saveProjection(db, projection, null, null);
    return projection;
  });
};

export const recoverInterruptedBrokerageReactiveLiveShadowPolls = async (
  input: { now?: Date; maximumSessions?: number } = {},
): Promise<number> => {
  const now = (input.now ?? new Date()).toISOString();
  const db = await readSharedRealtimeRoomDatabase();
  const rows = await db.query<ShadowRow>(
    `SELECT shadow_session_id, request_hash, projection_json,
            earnings_observation_id, in_flight_token, in_flight_started_at
      FROM helix_brokerage_reactive_shadow_sessions
      WHERE status='active' AND in_flight_token IS NOT NULL
      ORDER BY in_flight_started_at ASC
      LIMIT $1;`,
    [input.maximumSessions ?? 4],
  );
  let recovered = 0;
  for (const row of rows.rows) {
    const projection = project(row);
    if (!row.in_flight_token || !row.in_flight_started_at) continue;
    const recoveryAgeMs = Date.parse(now) -
      Date.parse(new Date(row.in_flight_started_at).toISOString());
    if (recoveryAgeMs < Math.max(projection.poll_interval_ms * 2, 30_000)) {
      continue;
    }
    const receipt = await settlePoll({
      claimed: {
        projection,
        pollSequence: projection.polls_attempted,
        token: row.in_flight_token,
        earningsObservationId: row.earnings_observation_id,
        readStartedAt: new Date(row.in_flight_started_at).toISOString(),
      },
      disposition: "source_failed",
      source: null,
      observation: null,
      controllerReceipt: null,
      controllerRun: null,
      errorCode: "reactive_shadow_poll_interrupted",
      providerTimeBasis: "arrival_proxy",
      readCompletedAt: now,
      processingCompletedAt: now,
      dependencies: defaultDependencies,
    });
    if (receipt.shadow_session.status === "source_failed") {
      await tripBrokerageReactiveControllerSource({
        ownerProfileId: projection.owner_profile_id,
        connectionId: projection.connection_id,
        roomId: projection.room_id,
        controllerRunId: projection.controller_run_id,
        reason: "source_poll_failed",
        detail: "The recovered shadow session exhausted its source failure budget.",
        now: new Date(now),
      });
    }
    recovered += 1;
  }
  return recovered;
};

export const runBrokerageReactiveLiveShadowSchedulerCycle = async (input: {
  now?: Date;
  maximumSessions?: number;
} = {}): Promise<{
  checked: number;
  processed: number;
  failed: number;
  interrupted_polls_recovered: number;
}> => {
  const now = input.now ?? new Date();
  const interruptedPollsRecovered =
    await recoverInterruptedBrokerageReactiveLiveShadowPolls({
      now,
      maximumSessions: input.maximumSessions,
    });
  const db = await readSharedRealtimeRoomDatabase();
  const rows = await db.query<{ shadow_session_id: string }>(
    `SELECT shadow_session_id
       FROM helix_brokerage_reactive_shadow_sessions
      WHERE status='active' AND in_flight_token IS NULL
        AND next_poll_at <= $1
      ORDER BY next_poll_at ASC
      LIMIT $2;`,
    [now.toISOString(), input.maximumSessions ?? 4],
  );
  let processed = 0;
  let failed = 0;
  for (const row of rows.rows) {
    try {
      const receipt = await runBrokerageReactiveLiveShadowPoll({
        shadowSessionId: row.shadow_session_id,
      });
      if (receipt) {
        if (receipt.disposition === "processed") processed += 1;
        else failed += 1;
      }
    } catch (error) {
      failed += 1;
      console.warn(
        "[brokerage-reactive-live-shadow] poll failed",
        error instanceof Error ? error.name : "unknown",
      );
    }
  }
  return {
    checked: rows.rows.length,
    processed,
    failed,
    interrupted_polls_recovered: interruptedPollsRecovered,
  };
};

const SHADOW_SCHEDULER_INTERVAL_MS = 1_000;
let schedulerTimer: NodeJS.Timeout | null = null;
let schedulerRunning = false;

export const startBrokerageReactiveLiveShadowScheduler = (): (() => void) => {
  if (schedulerTimer) return () => undefined;
  const tick = (): void => {
    if (schedulerRunning) return;
    schedulerRunning = true;
    void runBrokerageReactiveLiveShadowSchedulerCycle()
      .catch((error: unknown) => {
        console.warn(
          "[brokerage-reactive-live-shadow] scheduler cycle failed",
          error instanceof Error ? error.name : "unknown",
        );
      })
      .finally(() => { schedulerRunning = false; });
  };
  schedulerTimer = setInterval(tick, SHADOW_SCHEDULER_INTERVAL_MS);
  schedulerTimer.unref?.();
  return () => {
    if (schedulerTimer) clearInterval(schedulerTimer);
    schedulerTimer = null;
  };
};
