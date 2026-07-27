import type { Migration } from "./migration";

const VALID_ACTIVE_CONSENT_IDENTITY = `
  consent_version_at_bind IS NOT NULL
  AND consent_version_at_bind >= 0
  AND (
    (
      consent_version_at_bind = 0
      AND consent_receipt_ref_at_bind IS NULL
    )
    OR
    (
      consent_version_at_bind > 0
      AND consent_receipt_ref_at_bind IS NOT NULL
      AND consent_receipt_ref_at_bind <> ''
    )
  )
`;

/**
 * Migration 036 deliberately did not invent consent identity for legacy rows.
 * Revoke those unreconstructable active grants so they fail closed without
 * occupying the run's active-binding slot forever, then enforce the invariant
 * for every future active row.
 */
export const migration037: Migration = {
  id: "037_shared_live_room_binding_consent_enforcement",
  description:
    "Revoke legacy run-room grants without consent identity and enforce active binding validity",
  run: async (client) => {
    await client.query(`
      UPDATE helix_agent_run_room_bindings
      SET status = 'revoked',
          version = version + 1,
          updated_at = now(),
          revoked_at = COALESCE(revoked_at, now()),
          revoke_reason = 'legacy_binding_missing_consent_identity'
      WHERE status = 'active'
        AND NOT (${VALID_ACTIVE_CONSENT_IDENTITY});
    `);
    await client.query(`
      ALTER TABLE helix_agent_run_room_bindings
      ADD CONSTRAINT helix_agent_run_room_bindings_active_consent_identity_ck
      CHECK (
        status <> 'active'
        OR (${VALID_ACTIVE_CONSENT_IDENTITY})
      );
    `);
  },
};
