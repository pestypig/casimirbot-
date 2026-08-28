import { z } from "zod";

export const HELIX_LIVE_ACCEPTANCE_ARCHIVE_SCHEMA =
  "helix.live_acceptance_archive.v1" as const;

const identifier = z.string().trim().min(3).max(240);
const sha256 = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const timestamp = z.string().datetime({ offset: true });

export const helixLiveAcceptanceArchiveSchema = z.object({
  schema: z.literal(HELIX_LIVE_ACCEPTANCE_ARCHIVE_SCHEMA),
  ok: z.literal(true),
  archive_id: identifier,
  connection_id: identifier,
  room_id: identifier,
  control_id: identifier,
  evidence_hash: sha256,
  status: z.literal("accepted"),
  accepted_at: timestamp,
  reconciled_filled_entry_count: z.number().int().positive(),
  reconciled_filled_exit_count: z.number().int().positive(),
  unresolved_live_exposure_count: z.literal(0),
  live_flags_enabled: z.literal(false),
  provider_order_tool_calls_made_by_archive: z.literal(0),
  credential_included: z.literal(false),
  account_numbers_included: z.literal(false),
  raw_provider_payload_included: z.literal(false),
  answer_authority: z.literal(false),
  assistant_answer: z.literal(false),
  terminal_eligible: z.literal(false),
}).strict();

export type HelixLiveAcceptanceArchive = z.infer<
  typeof helixLiveAcceptanceArchiveSchema
>;

