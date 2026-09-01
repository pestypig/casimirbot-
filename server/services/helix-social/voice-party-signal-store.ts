import crypto from "node:crypto";
import type {
  HelixVoicePartyMediaSignal,
  HelixVoicePartyMediaSignalKind,
} from "@shared/helix-friends-voice-party";
import { HELIX_VOICE_PARTY_MEDIA_SIGNAL_SCHEMA } from
  "@shared/helix-friends-voice-party";
import { ensureDatabase, getPool } from "../../db/client";
import { HelixVoicePartyDomainError } from "./voice-party-store";

const SIGNAL_TTL_MS = 2 * 60_000;
const MAX_SIGNALS_PER_PARTY = 96;

type SignalRow = {
  signal_id: string;
  party_id: string;
  negotiation_id: string;
  sender_participant_id: string;
  target_participant_id: string;
  kind: HelixVoicePartyMediaSignalKind;
  description: RTCSessionDescriptionInit | string | null;
  candidate: RTCIceCandidateInit | string | null;
  created_at: Date | string;
  expires_at: Date | string;
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const json = <T>(value: T | string | null): T | null => {
  if (value === null) return null;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const project = (row: SignalRow): HelixVoicePartyMediaSignal => ({
  schema: HELIX_VOICE_PARTY_MEDIA_SIGNAL_SCHEMA,
  signal_id: row.signal_id,
  party_id: row.party_id,
  negotiation_id: row.negotiation_id,
  sender_participant_id: row.sender_participant_id,
  target_participant_id: row.target_participant_id,
  kind: row.kind,
  description: json<RTCSessionDescriptionInit>(row.description),
  candidate: json<RTCIceCandidateInit>(row.candidate),
  created_at: iso(row.created_at),
  expires_at: iso(row.expires_at),
});

export const publishHelixVoicePartyMediaSignal = async (input: {
  partyId: string;
  negotiationId: string;
  senderParticipantId: string;
  targetParticipantId: string;
  kind: HelixVoicePartyMediaSignalKind;
  description: RTCSessionDescriptionInit | null;
  candidate: RTCIceCandidateInit | null;
  nowMs?: number;
}): Promise<HelixVoicePartyMediaSignal> => {
  await ensureDatabase();
  const nowMs = input.nowMs ?? Date.now();
  await getPool().query(`
    DELETE FROM helix_voice_party_media_signals
    WHERE party_id = $1 AND expires_at <= $2;
  `, [input.partyId, new Date(nowMs)]);
  const result = await getPool().query<SignalRow>(`
    INSERT INTO helix_voice_party_media_signals (
      signal_id, party_id, negotiation_id, sender_participant_id,
      target_participant_id, kind, description, candidate, created_at, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)
    RETURNING *;
  `, [
    crypto.randomUUID(),
    input.partyId,
    input.negotiationId,
    input.senderParticipantId,
    input.targetParticipantId,
    input.kind,
    input.description ? JSON.stringify(input.description) : null,
    input.candidate ? JSON.stringify(input.candidate) : null,
    new Date(nowMs),
    new Date(nowMs + SIGNAL_TTL_MS),
  ]);
  const overflow = await getPool().query<{ signal_id: string }>(`
    SELECT signal_id FROM helix_voice_party_media_signals
    WHERE party_id = $1
    ORDER BY created_at DESC, signal_id DESC
    OFFSET $2;
  `, [input.partyId, MAX_SIGNALS_PER_PARTY]);
  if (overflow.rows.length > 0) {
    await getPool().query(`
      DELETE FROM helix_voice_party_media_signals
      WHERE signal_id = ANY($1::text[]);
    `, [overflow.rows.map((row) => row.signal_id)]);
  }
  return project(result.rows[0]!);
};

export const listHelixVoicePartyMediaSignals = async (input: {
  partyId: string;
  targetParticipantId: string;
  afterSignalId?: string | null;
  nowMs?: number;
}): Promise<HelixVoicePartyMediaSignal[]> => {
  await ensureDatabase();
  const now = new Date(input.nowMs ?? Date.now());
  await getPool().query(`
    DELETE FROM helix_voice_party_media_signals
    WHERE party_id = $1 AND expires_at <= $2;
  `, [input.partyId, now]);
  let cursor: { created_at: Date | string; signal_id: string } | null = null;
  if (input.afterSignalId) {
    const cursorResult = await getPool().query<{
      created_at: Date | string;
      signal_id: string;
    }>(`
      SELECT created_at, signal_id FROM helix_voice_party_media_signals
      WHERE party_id = $1 AND target_participant_id = $2 AND signal_id = $3;
    `, [input.partyId, input.targetParticipantId, input.afterSignalId]);
    cursor = cursorResult.rows[0] ?? null;
    if (!cursor) {
      throw new HelixVoicePartyDomainError(
        "voice_party_signal_cursor_expired",
        409,
        "Voice party signaling cursor expired; restart negotiation from current party state.",
      );
    }
  }
  const result = await getPool().query<SignalRow>(`
    SELECT * FROM helix_voice_party_media_signals
    WHERE party_id = $1 AND target_participant_id = $2 AND expires_at > $3
      AND ($4::timestamptz IS NULL OR created_at > $4 OR (created_at = $4 AND signal_id > $5))
    ORDER BY created_at ASC, signal_id ASC LIMIT $6;
  `, [
    input.partyId,
    input.targetParticipantId,
    now,
    cursor?.created_at ?? null,
    cursor?.signal_id ?? "",
    MAX_SIGNALS_PER_PARTY,
  ]);
  return result.rows.map(project);
};
