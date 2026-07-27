import type { Migration } from "./migration";

/**
 * Upgrade path for development databases that applied migration 034 before
 * bind-time consent identity became part of the authorization contract.
 * Existing rows intentionally remain NULL because their original consent
 * state cannot be reconstructed safely after the fact. Migration 037 revokes
 * any such row that is still active and releases its active-run binding slot.
 */
export const migration036: Migration = {
  id: "036_shared_live_room_binding_consent",
  description:
    "Add fail-closed bind-time consent identity to legacy run-room bindings",
  run: async (client) => {
    await client.query(`
      ALTER TABLE helix_agent_run_room_bindings
      ADD COLUMN IF NOT EXISTS consent_version_at_bind bigint;
    `);
    await client.query(`
      ALTER TABLE helix_agent_run_room_bindings
      ADD COLUMN IF NOT EXISTS consent_receipt_ref_at_bind text;
    `);
  },
};
