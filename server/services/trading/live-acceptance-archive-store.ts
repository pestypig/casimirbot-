import crypto from "node:crypto";
import {
  HELIX_LIVE_ACCEPTANCE_ARCHIVE_SCHEMA,
  helixLiveAcceptanceArchiveSchema,
  type HelixLiveAcceptanceArchive,
} from "@shared/trading/live-acceptance-archive";
import type { HelixLiveAcceptanceReadiness } from "@shared/trading/live-acceptance-readiness";
import type { Queryable } from "../helix-ask/realtime-room/room-store/types";
import { withSharedRealtimeRoomTransaction } from "../helix-ask/realtime-room/room-store/database";
import { PaperTradingError } from "./paper-trading-errors";
import {
  readRobinhoodLiveAcceptanceReadiness,
  readRobinhoodLiveAcceptanceReadinessWithClient,
} from "./live-acceptance-readiness";

type ArchiveRow = {
  archive_id: string;
  connection_id: string;
  room_id: string;
  control_id: string;
  evidence_hash: string;
  reconciled_filled_entry_count: number | string;
  reconciled_filled_exit_count: number | string;
  unresolved_live_exposure_count: number | string;
  status: "accepted";
  accepted_at: Date | string;
};

type CompletionCounts = {
  filled_entry_count: number | string;
  filled_exit_count: number | string;
  unresolved_count: number | string;
};

const COMPLETION_GATE_IDS = new Set([
  "agentic_account_selected",
  "owner_private_room_binding",
  "required_read_receipts_fresh",
  "provider_contract_fresh_pass",
  "tiny_entry_reconciled_filled",
  "risk_reducing_exit_reconciled_filled",
  "no_unresolved_live_exposure",
]);

const flagsEnabled = (): boolean =>
  process.env.ENABLE_ROBINHOOD_LIVE_EQUITY_EXECUTION === "1" ||
  process.env.ENABLE_ROBINHOOD_LIVE_SUPERVISOR === "1";

const project = (row: ArchiveRow): HelixLiveAcceptanceArchive =>
  helixLiveAcceptanceArchiveSchema.parse({
    schema: HELIX_LIVE_ACCEPTANCE_ARCHIVE_SCHEMA,
    ok: true,
    archive_id: row.archive_id,
    connection_id: row.connection_id,
    room_id: row.room_id,
    control_id: row.control_id,
    evidence_hash: row.evidence_hash,
    status: row.status,
    accepted_at: new Date(row.accepted_at).toISOString(),
    reconciled_filled_entry_count: Number(row.reconciled_filled_entry_count),
    reconciled_filled_exit_count: Number(row.reconciled_filled_exit_count),
    unresolved_live_exposure_count: Number(row.unresolved_live_exposure_count),
    live_flags_enabled: false,
    provider_order_tool_calls_made_by_archive: 0,
    credential_included: false,
    account_numbers_included: false,
    raw_provider_payload_included: false,
    answer_authority: false,
    assistant_answer: false,
    terminal_eligible: false,
  });

const buildEvidence = (readiness: HelixLiveAcceptanceReadiness) => ({
  schema: "helix.live_acceptance_archive_evidence.v1",
  connection_id: readiness.connection_id,
  room_id: readiness.room_id,
  read_acceptance_complete: readiness.read_acceptance_complete,
  acceptance_complete: readiness.acceptance_complete,
  completion_gates: readiness.gates
    .filter((gate) => COMPLETION_GATE_IDS.has(gate.gate_id))
    .map((gate) => ({
      gate_id: gate.gate_id,
      verdict: gate.verdict,
      reason_code: gate.reason_code,
      evidence_hashes: [...gate.evidence_hashes].sort(),
      observed_at: gate.observed_at,
    })),
  required_read_tools: [...readiness.required_read_tools].sort(),
  fresh_read_tools: [...readiness.fresh_read_tools].sort(),
  live_entry_count: readiness.live_entry_count,
  reconciled_filled_entry_count: readiness.reconciled_filled_entry_count,
  reconciled_filled_exit_count: readiness.reconciled_filled_exit_count,
  unresolved_live_exposure_count: readiness.unresolved_live_exposure_count,
  live_flags_enabled: false,
  provider_order_tool_calls_made_by_archive: 0,
  credential_included: false,
  account_numbers_included: false,
  raw_provider_payload_included: false,
  answer_authority: false,
  assistant_answer: false,
  terminal_eligible: false,
});

const evidenceHash = (evidence: ReturnType<typeof buildEvidence>): string =>
  `sha256:${crypto
    .createHash("sha256")
    .update(JSON.stringify(evidence))
    .digest("hex")}`;

const requireArchiveReady = (readiness: HelixLiveAcceptanceReadiness): void => {
  if (
    !readiness.read_acceptance_complete ||
    !readiness.acceptance_complete ||
    readiness.reconciled_filled_entry_count < 1 ||
    readiness.reconciled_filled_exit_count < 1 ||
    readiness.unresolved_live_exposure_count !== 0
  ) {
    throw new PaperTradingError(
      "paper_trading_unavailable",
      409,
      "Live acceptance cannot be archived until fresh read evidence, one reconciled-filled entry, one reconciled-filled exit, and zero unresolved exposure are recorded.",
    );
  }
};

const readCounts = async (
  client: Queryable,
  controlId: string,
): Promise<{ entry: number; exit: number; unresolved: number }> => {
  const { rows } = await client.query<CompletionCounts>(
    `SELECT
       (SELECT count(*) FROM helix_live_equity_executions e
        WHERE e.control_id = $1 AND e.state = 'reconciled_filled')
          AS filled_entry_count,
       (SELECT count(*) FROM helix_live_protective_exit_executions x
        WHERE x.control_id = $1 AND x.state = 'reconciled_filled')
          AS filled_exit_count,
       (SELECT count(*) FROM helix_live_equity_executions e
        LEFT JOIN helix_live_protective_exit_executions x
          ON x.entry_execution_id = e.execution_id
         AND x.state = 'reconciled_filled'
        WHERE e.control_id = $1 AND (
          e.state IN ('reserved','provider_call_started','submitted',
            'reconciliation_required','reconciled_open') OR
          (e.state = 'reconciled_filled' AND x.exit_execution_id IS NULL)
        )) AS unresolved_count;`,
    [controlId],
  );
  return {
    entry: Number(rows[0]?.filled_entry_count ?? 0),
    exit: Number(rows[0]?.filled_exit_count ?? 0),
    unresolved: Number(rows[0]?.unresolved_count ?? 0),
  };
};

export const archiveRobinhoodLiveAcceptance = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
  confirmationText: string;
  now?: Date;
}): Promise<HelixLiveAcceptanceArchive> => {
  const exactConfirmation = `ARCHIVE ROBINHOOD LIVE ACCEPTANCE ${input.connectionId} ${input.roomId}`;
  if (input.confirmationText !== exactConfirmation) {
    throw new PaperTradingError(
      "paper_trading_unavailable",
      400,
      "The exact live-acceptance archive confirmation is required.",
    );
  }
  if (flagsEnabled()) {
    throw new PaperTradingError(
      "paper_trading_unavailable",
      409,
      "Disable both Robinhood live execution flags before archiving acceptance.",
    );
  }
  const now = input.now ?? new Date();
  const readiness = await readRobinhoodLiveAcceptanceReadiness({
    ownerProfileId: input.ownerProfileId,
    connectionId: input.connectionId,
    roomId: input.roomId,
    now,
    deploymentEnabled: false,
    supervisorEnabled: false,
  });
  requireArchiveReady(readiness);
  return withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    if (flagsEnabled()) {
      throw new PaperTradingError(
        "paper_trading_unavailable",
        409,
        "Robinhood live execution flags changed while acceptance was being archived.",
      );
    }
    const { rows: controlRows } = await client.query<{ control_id: string }>(
      `SELECT control_id FROM helix_live_trading_controls
       WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
         AND status = 'active' LIMIT 1 FOR UPDATE;`,
      [input.ownerProfileId, input.connectionId, input.roomId],
    );
    const controlId = controlRows[0]?.control_id;
    if (!controlId) {
      throw new PaperTradingError(
        "paper_trading_unavailable",
        409,
        "The active live-trading control was not found.",
      );
    }
    const transactionReadiness =
      await readRobinhoodLiveAcceptanceReadinessWithClient({
        client,
        ownerProfileId: input.ownerProfileId,
        connectionId: input.connectionId,
        roomId: input.roomId,
        now,
        deploymentEnabled: false,
        supervisorEnabled: false,
      });
    requireArchiveReady(transactionReadiness);
    const counts = await readCounts(client, controlId);
    if (
      counts.entry !== transactionReadiness.reconciled_filled_entry_count ||
      counts.exit !== transactionReadiness.reconciled_filled_exit_count ||
      counts.unresolved !== 0
    ) {
      throw new PaperTradingError(
        "paper_trading_unavailable",
        409,
        "Live acceptance evidence changed before the archive transaction completed.",
      );
    }
    const evidence = buildEvidence(transactionReadiness);
    const hash = evidenceHash(evidence);
    const archiveId = `live_acceptance_archive:${crypto.randomUUID()}`;
    const { rows } = await client.query<ArchiveRow>(
      `INSERT INTO helix_live_acceptance_archives (
         archive_id, owner_profile_id, connection_id, room_id, control_id,
         evidence_hash, evidence_json, reconciled_filled_entry_count,
         reconciled_filled_exit_count, unresolved_live_exposure_count,
         status, accepted_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,0,'accepted',$10)
       ON CONFLICT (owner_profile_id, control_id, evidence_hash) DO NOTHING
       RETURNING archive_id, connection_id, room_id, control_id, evidence_hash,
         reconciled_filled_entry_count, reconciled_filled_exit_count,
         unresolved_live_exposure_count, status, accepted_at;`,
      [
        archiveId,
        input.ownerProfileId,
        input.connectionId,
        input.roomId,
        controlId,
        hash,
        JSON.stringify(evidence),
        counts.entry,
        counts.exit,
        now.toISOString(),
      ],
    );
    if (rows[0]) return project(rows[0]);
    const { rows: replayRows } = await client.query<ArchiveRow>(
      `SELECT archive_id, connection_id, room_id, control_id, evidence_hash,
              reconciled_filled_entry_count, reconciled_filled_exit_count,
              unresolved_live_exposure_count, status, accepted_at
       FROM helix_live_acceptance_archives
       WHERE owner_profile_id = $1 AND control_id = $2 AND evidence_hash = $3
       LIMIT 1;`,
      [input.ownerProfileId, controlId, hash],
    );
    if (!replayRows[0]) {
      throw new PaperTradingError(
        "paper_trading_unavailable",
        503,
        "The live-acceptance archive could not be committed.",
      );
    }
    return project(replayRows[0]);
  });
};

export const getLatestRobinhoodLiveAcceptanceArchive = async (input: {
  ownerProfileId: string;
  connectionId: string;
  roomId: string;
}): Promise<HelixLiveAcceptanceArchive | null> =>
  withSharedRealtimeRoomTransaction(async (client: Queryable) => {
    const { rows } = await client.query<ArchiveRow>(
      `SELECT archive_id, connection_id, room_id, control_id, evidence_hash,
              reconciled_filled_entry_count, reconciled_filled_exit_count,
              unresolved_live_exposure_count, status, accepted_at
       FROM helix_live_acceptance_archives
       WHERE owner_profile_id = $1 AND connection_id = $2 AND room_id = $3
       ORDER BY accepted_at DESC, archive_id DESC LIMIT 1;`,
      [input.ownerProfileId, input.connectionId, input.roomId],
    );
    return rows[0] ? project(rows[0]) : null;
  });
