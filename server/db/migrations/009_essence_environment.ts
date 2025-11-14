import type { Migration } from "./migration";

export const migration009: Migration = {
  id: "009_essence_environment",
  description: "Add Essence template and environment tables",
  run: async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_templates (
        template_id text NOT NULL,
        template_version integer NOT NULL,
        os_version text NOT NULL,
        schema_version integer NOT NULL,
        default_desktop_layout jsonb NOT NULL DEFAULT '{}'::jsonb,
        default_panels jsonb NOT NULL DEFAULT '[]'::jsonb,
        default_theme jsonb NOT NULL DEFAULT '{}'::jsonb,
        metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (template_id, template_version)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS essence_environments (
        owner_id text PRIMARY KEY,
        template_id text NOT NULL,
        template_version integer NOT NULL,
        user_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT essence_environments_template_fk
          FOREIGN KEY (template_id, template_version)
          REFERENCES essence_templates(template_id, template_version)
          ON DELETE RESTRICT
          ON UPDATE CASCADE
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS essence_environments_template_idx
      ON essence_environments (template_id);
    `);
  },
};
