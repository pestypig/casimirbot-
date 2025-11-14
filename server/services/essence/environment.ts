import type {
  TEssenceEnvironment,
  TEssenceEnvironmentOverrides,
  TEssenceTemplate,
} from "@shared/essence-schema";
import { ensureDatabase, getPool } from "../../db/client";

type TemplateRow = {
  template_id: string;
  template_version: number;
  os_version: string;
  schema_version: number;
  default_desktop_layout: unknown;
  default_panels: unknown;
  default_theme: unknown;
  metadata: unknown;
  created_at: string;
  updated_at: string;
};

type EnvironmentRow = {
  owner_id: string;
  template_id: string;
  template_version: number;
  user_overrides: unknown;
  created_at: string;
  updated_at: string;
};

const DEFAULT_TEMPLATE_ID = process.env.ESSENCE_DEFAULT_TEMPLATE_ID?.trim() || "helix-os-default";
const DEFAULT_TEMPLATE_VERSION = parseTemplateVersion(process.env.ESSENCE_DEFAULT_TEMPLATE_VERSION);

export type EssenceEnvironmentContext = {
  template: TEssenceTemplate;
  environment: TEssenceEnvironment;
};

const EMPTY_OVERRIDES: TEssenceEnvironmentOverrides = Object.freeze({
  layout: null,
  theme: null,
  widgets: null,
});

function parseTemplateVersion(value: string | undefined | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function coercePanelList(payload: unknown): string[] {
  if (!Array.isArray(payload)) {
    return [];
  }
  const collected: string[] = [];
  for (const entry of payload) {
    if (typeof entry === "string") {
      const trimmed = entry.trim();
      if (trimmed) {
        collected.push(trimmed);
      }
      continue;
    }
    if (entry && typeof entry === "object") {
      const record = entry as Record<string, unknown>;
      const candidate =
        typeof record.panelId === "string"
          ? record.panelId
          : typeof record.id === "string"
            ? record.id
            : null;
      if (candidate) {
        const trimmed = candidate.trim();
        if (trimmed) {
          collected.push(trimmed);
        }
      }
    }
  }
  return collected;
}

function coerceRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  return payload as Record<string, unknown>;
}

function coerceOverrides(payload: unknown): TEssenceEnvironmentOverrides {
  if (!payload || typeof payload !== "object") {
    return {};
  }
  const record = payload as Record<string, unknown>;
  return {
    layout: record.layout,
    theme: record.theme,
    widgets: record.widgets,
  };
}

function deserializeTemplate(row: TemplateRow): TEssenceTemplate {
  return {
    id: row.template_id,
    templateVersion: row.template_version,
    osVersion: row.os_version,
    schemaVersion: row.schema_version,
    defaultDesktopLayout: row.default_desktop_layout ?? {},
    defaultPanels: coercePanelList(row.default_panels),
    defaultTheme: row.default_theme ?? {},
    metadata: coerceRecord(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deserializeEnvironment(row: EnvironmentRow): TEssenceEnvironment {
  return {
    ownerId: row.owner_id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    userOverrides: coerceOverrides(row.user_overrides),
    createdAt: row.created_at,
    lastUpdatedAt: row.updated_at,
  };
}

export async function getEssenceTemplate(
  templateId: string,
  templateVersion?: number | null,
): Promise<TEssenceTemplate | null> {
  await ensureDatabase();
  if (!templateId) {
    return null;
  }
  const pool = getPool();
  const params: Array<string | number> = [templateId];
  let query = `
    SELECT template_id, template_version, os_version, schema_version,
           default_desktop_layout, default_panels, default_theme, metadata,
           created_at, updated_at
    FROM essence_templates
    WHERE template_id = $1
  `;
  if (typeof templateVersion === "number" && Number.isFinite(templateVersion)) {
    params.push(templateVersion);
    query += ` AND template_version = $2 LIMIT 1`;
  } else {
    query += ` ORDER BY template_version DESC LIMIT 1`;
  }
  const { rows } = await pool.query<TemplateRow>(query, params);
  if (!rows.length) {
    return null;
  }
  return deserializeTemplate(rows[0]);
}

export async function getEssenceEnvironment(ownerId: string): Promise<TEssenceEnvironment | null> {
  if (!ownerId) {
    return null;
  }
  await ensureDatabase();
  const pool = getPool();
  const { rows } = await pool.query<EnvironmentRow>(
    `
      SELECT owner_id, template_id, template_version, user_overrides, created_at, updated_at
      FROM essence_environments
      WHERE owner_id = $1
      LIMIT 1;
    `,
    [ownerId],
  );
  if (!rows.length) {
    return null;
  }
  return deserializeEnvironment(rows[0]);
}

export async function upsertEssenceEnvironment(
  ownerId: string,
  templateId: string,
  templateVersion: number,
  overrides?: TEssenceEnvironmentOverrides | null,
): Promise<TEssenceEnvironment> {
  if (!ownerId || !templateId) {
    throw new Error("essence_environment_owner_and_template_required");
  }
  await ensureDatabase();
  const pool = getPool();
  const payload = overrides ?? EMPTY_OVERRIDES;
  const { rows } = await pool.query<EnvironmentRow>(
    `
      INSERT INTO essence_environments (owner_id, template_id, template_version, user_overrides)
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (owner_id)
      DO UPDATE SET
        template_id = excluded.template_id,
        template_version = excluded.template_version,
        user_overrides = excluded.user_overrides,
        updated_at = now()
      RETURNING owner_id, template_id, template_version, user_overrides, created_at, updated_at;
    `,
    [ownerId, templateId, templateVersion, JSON.stringify(payload ?? {})],
  );
  if (!rows.length) {
    throw new Error("essence_environment_upsert_failed");
  }
  return deserializeEnvironment(rows[0]);
}

export async function ensureEssenceEnvironment(ownerId: string): Promise<EssenceEnvironmentContext | null> {
  if (!ownerId) {
    return null;
  }
  const existing = await getEssenceEnvironment(ownerId);
  if (existing) {
    let template =
      (await getEssenceTemplate(existing.templateId, existing.templateVersion)) ??
      (await getEssenceTemplate(existing.templateId));

    if (!template) {
      template =
        (await getEssenceTemplate(DEFAULT_TEMPLATE_ID, DEFAULT_TEMPLATE_VERSION)) ??
        (await getEssenceTemplate(DEFAULT_TEMPLATE_ID));
      if (!template) {
        return null;
      }
      const reassigned = await upsertEssenceEnvironment(
        ownerId,
        template.id,
        template.templateVersion,
        existing.userOverrides,
      );
      return { template, environment: reassigned };
    }

    if (template.templateVersion !== existing.templateVersion || template.id !== existing.templateId) {
      const synced = await upsertEssenceEnvironment(
        ownerId,
        template.id,
        template.templateVersion,
        existing.userOverrides,
      );
      return { template, environment: synced };
    }
    return { template, environment: existing };
  }

  const fallbackTemplate =
    (await getEssenceTemplate(DEFAULT_TEMPLATE_ID, DEFAULT_TEMPLATE_VERSION)) ??
    (await getEssenceTemplate(DEFAULT_TEMPLATE_ID));

  if (!fallbackTemplate) {
    return null;
  }

  const environment = await upsertEssenceEnvironment(
    ownerId,
    fallbackTemplate.id,
    fallbackTemplate.templateVersion,
    EMPTY_OVERRIDES,
  );
  return { template: fallbackTemplate, environment };
}
