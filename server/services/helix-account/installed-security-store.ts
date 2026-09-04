import crypto from "node:crypto";
import type { Pool } from "pg";
import type { HelixInstalledSecurityStatus } from
  "@shared/desktop-auth0-step-up";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";

type DeviceRow = {
  device_id: string;
  label: string;
  platform: string;
  status: string;
  recovery_generation: number;
  registered_at: Date | string | null;
  last_seen_at: Date | string | null;
  revoked_at: Date | string | null;
};

type FullHarnessTrustRow = {
  device_id: string;
  full_harness_trusted: boolean;
  full_harness_trust_revision: number;
  full_harness_trusted_at: Date | string | null;
  full_harness_trust_revoked_at: Date | string | null;
  full_harness_trusted_by_session_id: string | null;
  trusted_session_active?: boolean;
};

export type InstalledDeviceFullHarnessTrust = Readonly<{
  schema: "helix.installed_device_full_harness_trust.v1";
  trusted: boolean;
  device_ref: string;
  policy_revision: number;
  trusted_at: string | null;
  revoked_at: string | null;
  delegated_account_session_id: string | null;
  authority_limited_to_tunnel_transport: true;
  environment_authority_granted: false;
  trading_authority_granted: false;
  answer_authority: false;
  terminal_eligible: false;
}>;

type SessionRow = {
  session_id: string;
  status: string;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string | null;
};

type SecurityEventRow = {
  event_id: string;
  event_type: string;
  payload: unknown;
  created_at: Date | string;
};

export type InstalledSecuritySession = Readonly<{
  sessionId: string;
  profileId: string;
}>;

export class InstalledSecurityStoreError extends Error {
  constructor(
    readonly status: number,
    readonly code:
      | "session_required"
      | "device_not_registered"
      | "device_not_revoked"
      | "session_not_found"
      | "current_session_revoke_forbidden",
    message: string,
  ) {
    super(message);
    this.name = "InstalledSecurityStoreError";
  }
}

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const nullableIso = (value: Date | string | null): string | null =>
  value === null ? null : iso(value);

const stableRef = (prefix: string, value: string): string =>
  `${prefix}:sha256:${crypto.createHash("sha256").update(value).digest("hex").slice(0, 32)}`;

export const installedDeviceRef = (deviceId: string): string =>
  stableRef("device", deviceId);

export const installedSessionRef = (sessionId: string): string =>
  stableRef("session", sessionId);

export class InstalledSecurityStore {
  constructor(
    private readonly dependencies: Readonly<{
      pool?: Pool;
      now?: () => Date;
      randomId?: () => string;
      persist?: () => Promise<void>;
    }> = {},
  ) {}

  private async pool(): Promise<Pool> {
    if (this.dependencies.pool) return this.dependencies.pool;
    await ensureDatabase();
    return getPool();
  }

  private now(): Date {
    return (this.dependencies.now ?? (() => new Date()))();
  }

  private async requireSession(session: InstalledSecuritySession): Promise<void> {
    const { rows } = await (await this.pool()).query<{ present: boolean }>(
      `
        SELECT true AS present
        FROM helix_account_sessions s
        JOIN helix_accounts a ON a.profile_id = s.profile_id
        WHERE s.session_id = $1
          AND s.profile_id = $2
          AND s.status = 'active'
          AND (s.expires_at IS NULL OR s.expires_at > $3)
          AND a.deleted_at IS NULL
        LIMIT 1;
      `,
      [session.sessionId, session.profileId, this.now().toISOString()],
    );
    if (rows[0]?.present !== true) {
      throw new InstalledSecurityStoreError(
        401,
        "session_required",
        "An active profile session is required.",
      );
    }
  }

  async registerDevice(input: {
    session: InstalledSecuritySession;
    deviceId: string;
    label?: string;
  }): Promise<void> {
    await this.requireSession(input.session);
    const now = this.now().toISOString();
    await (await this.pool()).query(
      `
        INSERT INTO helix_installed_devices (
          profile_id, device_id, label, platform, status,
          recovery_generation, registered_at, last_seen_at,
          revoked_at, created_at, updated_at
        )
        VALUES ($1, $2, $3, 'windows', 'active', 0, $4, $4, NULL, $4, $4)
        ON CONFLICT (profile_id, device_id) DO UPDATE SET
          label = EXCLUDED.label,
          full_harness_trusted = CASE
            WHEN helix_installed_devices.status = 'active'
              THEN helix_installed_devices.full_harness_trusted
            ELSE false
          END,
          full_harness_trust_revision = CASE
            WHEN helix_installed_devices.status = 'active'
              THEN helix_installed_devices.full_harness_trust_revision
            ELSE helix_installed_devices.full_harness_trust_revision + 1
          END,
          full_harness_trusted_by_session_id = CASE
            WHEN helix_installed_devices.status = 'active'
              THEN helix_installed_devices.full_harness_trusted_by_session_id
            ELSE NULL
          END,
          full_harness_trust_revoked_at = CASE
            WHEN helix_installed_devices.status = 'active'
              THEN helix_installed_devices.full_harness_trust_revoked_at
            ELSE EXCLUDED.updated_at
          END,
          status = 'active',
          registered_at = COALESCE(helix_installed_devices.registered_at, EXCLUDED.registered_at),
          last_seen_at = EXCLUDED.last_seen_at,
          revoked_at = NULL,
          updated_at = EXCLUDED.updated_at;
      `,
      [input.session.profileId, input.deviceId, input.label ?? "This Windows device", now],
    );
    await this.recordEvent(input.session, "installed_device_registered", {
      device_ref: installedDeviceRef(input.deviceId),
    });
  }

  async recoverDevice(input: {
    session: InstalledSecuritySession;
    deviceId: string;
  }): Promise<void> {
    await this.requireSession(input.session);
    const result = await (await this.pool()).query(
      `
        UPDATE helix_installed_devices
        SET status = 'active',
            recovery_generation = recovery_generation + 1,
            full_harness_trusted = false,
            full_harness_trust_revision = full_harness_trust_revision + 1,
            full_harness_trusted_by_session_id = NULL,
            full_harness_trust_revoked_at = $3,
            last_seen_at = $3,
            revoked_at = NULL,
            updated_at = $3
        WHERE profile_id = $1
          AND device_id = $2
          AND status IN ('revoked', 'recovery_required');
      `,
      [input.session.profileId, input.deviceId, this.now().toISOString()],
    );
    if (result.rowCount !== 1) {
      throw new InstalledSecurityStoreError(
        409,
        "device_not_revoked",
        "The installed device is not eligible for recovery.",
      );
    }
    await this.recordEvent(input.session, "installed_device_recovered", {
      device_ref: installedDeviceRef(input.deviceId),
    });
  }

  async revokeDevice(input: {
    session: InstalledSecuritySession;
    deviceId: string;
  }): Promise<void> {
    await this.requireSession(input.session);
    const now = this.now().toISOString();
    const result = await (await this.pool()).query(
      `
        UPDATE helix_installed_devices
        SET status = 'revoked',
            revoked_at = $3,
            full_harness_trusted = false,
            full_harness_trust_revision = full_harness_trust_revision + 1,
            full_harness_trusted_by_session_id = NULL,
            full_harness_trust_revoked_at = $3,
            updated_at = $3
        WHERE profile_id = $1 AND device_id = $2 AND status = 'active';
      `,
      [input.session.profileId, input.deviceId, now],
    );
    if (result.rowCount !== 1) {
      throw new InstalledSecurityStoreError(
        404,
        "device_not_registered",
        "The installed device is not active.",
      );
    }
    await this.recordEvent(input.session, "installed_device_revoked", {
      device_ref: installedDeviceRef(input.deviceId),
    });
  }

  async revokeSession(input: {
    session: InstalledSecuritySession;
    targetSessionRef: string;
  }): Promise<void> {
    await this.requireSession(input.session);
    const { rows } = await (await this.pool()).query<SessionRow>(
      `SELECT session_id, status, created_at, updated_at, expires_at
       FROM helix_account_sessions WHERE profile_id = $1;`,
      [input.session.profileId],
    );
    const target = rows.find((row) =>
      installedSessionRef(row.session_id) === input.targetSessionRef,
    );
    if (!target) {
      throw new InstalledSecurityStoreError(
        404,
        "session_not_found",
        "The profile session was not found.",
      );
    }
    if (target.session_id === input.session.sessionId) {
      throw new InstalledSecurityStoreError(
        409,
        "current_session_revoke_forbidden",
        "Use the ordinary sign-out control for the current session.",
      );
    }
    await (await this.pool()).query(
      `UPDATE helix_account_sessions
       SET status = 'signed_out', updated_at = $2
       WHERE session_id = $1 AND profile_id = $3;`,
      [target.session_id, this.now().toISOString(), input.session.profileId],
    );
    await this.recordEvent(input.session, "installed_session_revoked", {
      session_ref: input.targetSessionRef,
    });
  }

  async setFullHarnessTrust(input: {
    session: InstalledSecuritySession;
    deviceId: string;
    trusted: boolean;
  }): Promise<InstalledDeviceFullHarnessTrust> {
    await this.requireSession(input.session);
    const now = this.now().toISOString();
    const result = await (await this.pool()).query<FullHarnessTrustRow>(
      `
        UPDATE helix_installed_devices
        SET full_harness_trusted = $3,
            full_harness_trust_revision = full_harness_trust_revision + 1,
            full_harness_trusted_at = CASE WHEN $3 THEN $4 ELSE full_harness_trusted_at END,
            full_harness_trust_revoked_at = CASE WHEN $3 THEN NULL ELSE $4 END,
            full_harness_trusted_by_session_id = CASE WHEN $3 THEN $5 ELSE NULL END,
            last_seen_at = $4,
            updated_at = $4
        WHERE profile_id = $1 AND device_id = $2 AND status = 'active'
        RETURNING device_id, full_harness_trusted,
          full_harness_trust_revision, full_harness_trusted_at,
          full_harness_trust_revoked_at, full_harness_trusted_by_session_id;
      `,
      [
        input.session.profileId,
        input.deviceId,
        input.trusted,
        now,
        input.session.sessionId,
      ],
    );
    const row = result.rows[0];
    if (!row) {
      throw new InstalledSecurityStoreError(
        404,
        "device_not_registered",
        "The installed device is not active.",
      );
    }
    await this.recordEvent(
      input.session,
      input.trusted
        ? "full_harness_device_trust_granted"
        : "full_harness_device_trust_revoked",
      {
        device_ref: installedDeviceRef(input.deviceId),
        policy_revision: Number(row.full_harness_trust_revision),
      },
    );
    return this.projectFullHarnessTrust(row, true);
  }

  async inspectFullHarnessTrust(input: {
    profileId: string;
    deviceId: string;
  }): Promise<InstalledDeviceFullHarnessTrust> {
    const { rows } = await (await this.pool()).query<FullHarnessTrustRow>(
      `
        SELECT d.device_id, d.full_harness_trusted,
          d.full_harness_trust_revision, d.full_harness_trusted_at,
          d.full_harness_trust_revoked_at,
          d.full_harness_trusted_by_session_id,
          COALESCE(
            s.status = 'active' AND (s.expires_at IS NULL OR s.expires_at > $3),
            false
          ) AS trusted_session_active
        FROM helix_installed_devices d
        JOIN helix_accounts a ON a.profile_id = d.profile_id
        LEFT JOIN helix_account_sessions s
          ON s.session_id = d.full_harness_trusted_by_session_id
          AND s.profile_id = d.profile_id
        WHERE d.profile_id = $1
          AND d.device_id = $2
          AND d.status = 'active'
          AND a.account_type = 'developer'
          AND a.deleted_at IS NULL
        LIMIT 1;
      `,
      [input.profileId, input.deviceId, this.now().toISOString()],
    );
    const row = rows[0];
    if (!row) {
      return {
        schema: "helix.installed_device_full_harness_trust.v1",
        trusted: false,
        device_ref: installedDeviceRef(input.deviceId),
        policy_revision: 0,
        trusted_at: null,
        revoked_at: null,
        delegated_account_session_id: null,
        authority_limited_to_tunnel_transport: true,
        environment_authority_granted: false,
        trading_authority_granted: false,
        answer_authority: false,
        terminal_eligible: false,
      };
    }
    return this.projectFullHarnessTrust(row, row.trusted_session_active === true);
  }

  private projectFullHarnessTrust(
    row: FullHarnessTrustRow,
    trustedSessionActive: boolean,
  ): InstalledDeviceFullHarnessTrust {
    const trusted = row.full_harness_trusted === true && trustedSessionActive;
    return {
      schema: "helix.installed_device_full_harness_trust.v1",
      trusted,
      device_ref: installedDeviceRef(row.device_id),
      policy_revision: Number(row.full_harness_trust_revision),
      trusted_at: nullableIso(row.full_harness_trusted_at),
      revoked_at: nullableIso(row.full_harness_trust_revoked_at),
      delegated_account_session_id: trusted
        ? row.full_harness_trusted_by_session_id
        : null,
      authority_limited_to_tunnel_transport: true,
      environment_authority_granted: false,
      trading_authority_granted: false,
      answer_authority: false,
      terminal_eligible: false,
    };
  }

  async status(input: {
    session: InstalledSecuritySession;
    deviceId: string;
    auth0Configured: boolean;
    maximumAgeSeconds: number;
  }): Promise<HelixInstalledSecurityStatus> {
    await this.requireSession(input.session);
    const pool = await this.pool();
    const [deviceResult, sessionResult, eventResult] = await Promise.all([
      pool.query<DeviceRow>(
        `SELECT device_id, label, platform, status, recovery_generation,
                registered_at, last_seen_at, revoked_at
         FROM helix_installed_devices
         WHERE profile_id = $1 AND device_id = $2 LIMIT 1;`,
        [input.session.profileId, input.deviceId],
      ),
      pool.query<SessionRow>(
        `SELECT session_id, status, created_at, updated_at, expires_at
         FROM helix_account_sessions
         WHERE profile_id = $1
         ORDER BY updated_at DESC
         LIMIT 50;`,
        [input.session.profileId],
      ),
      pool.query<SecurityEventRow>(
        `SELECT event_id, event_type, payload, created_at
         FROM helix_account_events
         WHERE profile_id = $1
           AND event_type IN (
             'installed_device_registered',
             'installed_device_recovered',
             'installed_device_revoked',
             'installed_session_revoked'
           )
         ORDER BY created_at DESC
         LIMIT 25;`,
        [input.session.profileId],
      ),
    ]);
    const device = deviceResult.rows[0];
    return {
      schema: "helix.installed_security_status.v1",
      ok: true,
      generated_at: this.now().toISOString(),
      profile_ref: input.session.profileId,
      current_session_ref: installedSessionRef(input.session.sessionId),
      mfa: {
        provider: "auth0",
        configured: input.auth0Configured,
        fresh_step_up_available: input.auth0Configured,
        required_acr: "http://schemas.openid.net/pape/policies/2007/06/multi-factor",
        maximum_age_seconds: input.maximumAgeSeconds,
        factor_detail_included: false,
      },
      current_device: device ? {
        device_ref: installedDeviceRef(device.device_id),
        label: device.label,
        platform: "windows",
        status: device.status === "active" || device.status === "revoked" ||
          device.status === "recovery_required"
          ? device.status
          : "recovery_required",
        registered_at: nullableIso(device.registered_at),
        last_seen_at: nullableIso(device.last_seen_at),
        revoked_at: nullableIso(device.revoked_at),
        recovery_generation: Number(device.recovery_generation),
      } : {
        device_ref: installedDeviceRef(input.deviceId),
        label: "This Windows device",
        platform: "windows",
        status: "unregistered",
        registered_at: null,
        last_seen_at: null,
        revoked_at: null,
        recovery_generation: 0,
      },
      sessions: sessionResult.rows.map((row) => ({
        session_ref: installedSessionRef(row.session_id),
        status: row.status === "active" ? "active" : "signed_out",
        current: row.session_id === input.session.sessionId,
        created_at: iso(row.created_at),
        updated_at: iso(row.updated_at),
        expires_at: nullableIso(row.expires_at),
      })),
      recent_events: eventResult.rows.flatMap((row) => {
        const eventType = row.event_type === "installed_device_registered" ||
          row.event_type === "installed_device_recovered" ||
          row.event_type === "installed_device_revoked" ||
          row.event_type === "installed_session_revoked"
          ? row.event_type
          : null;
        const payload = row.payload && typeof row.payload === "object" &&
          !Array.isArray(row.payload)
          ? row.payload as Record<string, unknown>
          : {};
        const targetRef = typeof payload.device_ref === "string"
          ? payload.device_ref
          : typeof payload.session_ref === "string"
            ? payload.session_ref
            : null;
        return eventType && targetRef ? [{
          event_ref: stableRef("security_event", row.event_id),
          event_type: eventType,
          target_ref: targetRef,
          created_at: iso(row.created_at),
        }] : [];
      }),
      agent_authority: {
        may_inspect_sanitized_status: true,
        may_start_step_up: false,
        may_complete_mfa: false,
        may_receive_usable_receipt: false,
        may_register_or_recover_device: false,
        may_revoke_session: false,
      },
      usable_receipt_included: false,
      identity_token_included: false,
      access_token_included: false,
      factor_detail_included: false,
    };
  }

  private async recordEvent(
    session: InstalledSecuritySession,
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const randomId = this.dependencies.randomId ?? crypto.randomUUID;
    await (await this.pool()).query(
      `INSERT INTO helix_account_events (
         event_id, profile_id, session_id, event_type, payload, created_at
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6);`,
      [
        `acct_evt_${randomId()}`,
        session.profileId,
        session.sessionId,
        eventType,
        JSON.stringify({
          schema: "helix.installed_security_event.v1",
          ...payload,
          usable_receipt_included: false,
          identity_token_included: false,
          factor_detail_included: false,
        }),
        this.now().toISOString(),
      ],
    );
    await (this.dependencies.persist ?? persistLocalDatabaseSnapshotIfEnabled)();
  }
}

export const installedSecurityStore = new InstalledSecurityStore();
