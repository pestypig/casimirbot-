import crypto from "node:crypto";
import {
  HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE,
  HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_ID,
  helixBrokerageMarketObserverReceiptSchema,
  type HelixBrokerageMarketObserverReceipt,
} from "@shared/trading/brokerage-market-observer";
import type { HelixPaperProcessObservationReceipt } from
  "@shared/trading/paper-contract";
import type { HelixTradingRiskPolicy } from "@shared/trading/risk-contract";
import { assertRobinhoodPrivateRoomReadCapability } from
  "../brokerage/robinhood-connection-store";
import {
  getPaperTradingAccountById,
  type PaperTradingAccountProjection,
} from "./paper-trading-store";
import { processPaperQuoteObservation } from "./paper-execution-store";
import { PaperTradingError } from "./paper-trading-errors";
import {
  readPaperQuoteEvidenceRecord,
  type PaperQuoteEvidence,
} from "./paper-market-evidence";

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, canonicalize(entry)]),
    );
  }
  return value;
};

const digest = (value: unknown): string =>
  `sha256:${crypto.createHash("sha256")
    .update(JSON.stringify(canonicalize(value))).digest("hex")}`;

export const HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_HASH = digest(
  HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE,
);

type ObserverAccount = Pick<
  PaperTradingAccountProjection,
  | "account_id"
  | "owner_profile_id"
  | "connection_id"
  | "room_id"
  | "kill_switch_active"
  | "policy"
>;

type ObserverDependencies = {
  readAccount: (input: {
    ownerProfileId: string;
    accountId: string;
  }) => Promise<ObserverAccount>;
  processObservation: (input: {
    ownerProfileId: string;
    accountId: string;
    observationId: string;
    symbol: string;
    now?: Date;
  }) => Promise<HelixPaperProcessObservationReceipt>;
  readAdmission: (input: {
    ownerProfileId: string;
    connectionId: string;
    roomId: string;
    capabilityId: string;
  }) => Promise<{
    producerEpochRef: string;
    environmentBindingId: string;
  }>;
  readQuoteEvidence: (input: {
    ownerProfileId: string;
    connectionId: string;
    roomId: string;
    observationId: string;
    symbol: string;
    now: Date;
    policy: HelixTradingRiskPolicy;
  }) => Promise<PaperQuoteEvidence>;
};

export const readBrokerageObserverAccount = async (
  input: { ownerProfileId: string; accountId: string },
  readById: typeof getPaperTradingAccountById = getPaperTradingAccountById,
): Promise<ObserverAccount> => {
  const account = await readById(input);
  if (!account) {
    throw new PaperTradingError(
      "paper_account_not_found",
      404,
      "The brokerage observer paper account was not found.",
    );
  }
  return account;
};

const defaultDependencies: ObserverDependencies = {
  readAccount: readBrokerageObserverAccount,
  processObservation: processPaperQuoteObservation,
  readAdmission: assertRobinhoodPrivateRoomReadCapability,
  readQuoteEvidence: async (input) => readPaperQuoteEvidenceRecord({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    observationId: input.observationId,
    symbol: input.symbol,
  }),
};

const assertExactAccountIdentity = (input: {
  account: ObserverAccount;
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  paperAccountId: string;
}): void => {
  if (
    input.account.account_id !== input.paperAccountId ||
    input.account.owner_profile_id !== input.ownerProfileId ||
    input.account.connection_id !== input.connectionId ||
    input.account.room_id !== input.roomId
  ) {
    throw new PaperTradingError(
      "paper_trading_unavailable",
      409,
      "The brokerage observer identity does not match the paper account.",
    );
  }
};

const deriveEventTypes = (input: {
  paperReceipt: HelixPaperProcessObservationReceipt;
  killSwitchActiveBefore: boolean;
  killSwitchActiveAfter: boolean;
}): HelixBrokerageMarketObserverReceipt["event_types"] => {
  const events = new Set<HelixBrokerageMarketObserverReceipt["event_types"][number]>();
  if (input.paperReceipt.filled_order_ids.length > 0) {
    events.add("paper_order_filled");
    events.add("paper_position_opened");
  }
  if (input.paperReceipt.marked_position_ids.length > 0) {
    events.add("paper_position_marked");
  }
  if (input.paperReceipt.stop_exit_order_ids.length > 0) {
    events.add("paper_stop_triggered");
    events.add("paper_position_closed");
  }
  if (!input.killSwitchActiveBefore && input.killSwitchActiveAfter) {
    events.add("risk_kill_switch_activated");
  }
  return [...events].sort();
};

export const runBrokerageMarketObserverCycle = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  paperAccountId: string;
  monitorLeaseId: string;
  observationId: string;
  symbol: string;
  now?: Date;
}, dependencies: ObserverDependencies = defaultDependencies):
Promise<HelixBrokerageMarketObserverReceipt> => {
  const symbol = input.symbol.toUpperCase();
  const before = await dependencies.readAccount({
    ownerProfileId: input.ownerProfileId,
    accountId: input.paperAccountId,
  });
  assertExactAccountIdentity({
    account: before,
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    paperAccountId: input.paperAccountId,
  });
  const now = input.now ?? new Date();
  const [admission, quoteEvidence] = await Promise.all([
    dependencies.readAdmission({
      ownerProfileId: input.ownerProfileId,
      connectionId: input.connectionId,
      roomId: input.roomId,
      capabilityId: "brokerage.robinhood.market_data.read",
    }),
    dependencies.readQuoteEvidence({
      ownerProfileId: input.ownerProfileId,
      connectionId: input.connectionId,
      roomId: input.roomId,
      observationId: input.observationId,
      symbol,
      now,
      policy: before.policy,
    }),
  ]);
  if (admission.producerEpochRef !== quoteEvidence.producerEpochRef) {
    throw new PaperTradingError(
      "paper_source_observation_invalid",
      409,
      "The brokerage observer source epoch is no longer current.",
    );
  }
  const paperReceipt = await dependencies.processObservation({
    ownerProfileId: input.ownerProfileId,
    accountId: input.paperAccountId,
    observationId: input.observationId,
    symbol,
    now,
  });
  const after = await dependencies.readAccount({
    ownerProfileId: input.ownerProfileId,
    accountId: input.paperAccountId,
  });
  assertExactAccountIdentity({
    account: after,
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    paperAccountId: input.paperAccountId,
  });
  const eventTypes = deriveEventTypes({
    paperReceipt,
    killSwitchActiveBefore: before.kill_switch_active,
    killSwitchActiveAfter: after.kill_switch_active,
  });
  const killSwitchChanged =
    !before.kill_switch_active && after.kill_switch_active;
  const cycleHash = digest({
    profile_id: HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_ID,
    profile_artifact_hash: HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_HASH,
    monitor_lease_id: input.monitorLeaseId,
    owner_profile_id: input.ownerProfileId,
    connection_id: input.connectionId,
    room_id: input.roomId,
    environment_binding_id: admission.environmentBindingId,
    paper_account_id: input.paperAccountId,
    producer_epoch_ref: admission.producerEpochRef,
    source_observation_id: input.observationId,
    source_output_hash: quoteEvidence.outputHash,
  });
  return helixBrokerageMarketObserverReceiptSchema.parse({
    schema: "helix.brokerage_market_observer.v1",
    ok: true,
    observer_cycle_id: `brokerage_observer_cycle:${cycleHash.slice("sha256:".length)}`,
    profile_id: HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_ID,
    profile_artifact_hash: HELIX_BROKERAGE_MARKET_OBSERVER_PROFILE_HASH,
    reaction_requirement: "monitor_only",
    monitor_lease_id: input.monitorLeaseId,
    owner_profile_id: input.ownerProfileId,
    connection_id: input.connectionId,
    room_id: input.roomId,
    environment_binding_id: admission.environmentBindingId,
    paper_account_id: input.paperAccountId,
    producer_epoch_ref: admission.producerEpochRef,
    source_observation_id: input.observationId,
    source_output_hash: quoteEvidence.outputHash,
    source_observed_at: quoteEvidence.observedAt,
    observation_revision: Date.parse(quoteEvidence.observedAt),
    symbol,
    event_types: eventTypes,
    disposition: killSwitchChanged
      ? "risk_control_changed"
      : eventTypes.length > 0
        ? "paper_state_changed"
        : "no_material_paper_change",
    semantic_wake_eligible: eventTypes.length > 0,
    paper_receipt: paperReceipt,
    kill_switch_active_before: before.kill_switch_active,
    kill_switch_active_after: after.kill_switch_active,
    simulated: true,
    provider_mutation_attempted: false,
    live_order_execution_enabled: false,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });
};
