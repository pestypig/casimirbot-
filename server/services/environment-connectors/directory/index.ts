import {
  readSharedRealtimeRoomDatabase,
} from "../../helix-ask/realtime-room/room-store/database";
import {
  ensureBuiltinEnvironmentConnectorPackages,
} from "../pairing";

type DirectoryPackageRow = {
  package_version_id: string;
  publisher_id: string;
  package_id: string;
  package_version: string;
  content_hash: string;
  signature: unknown;
  host_compatibility: unknown;
  capability_descriptors: unknown;
  trust_classification: string;
  security_review_state: string;
  lifecycle_status: string;
  published_at: Date | string;
  withdrawn_at: Date | string | null;
};

const parseJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
};

const iso = (value: Date | string): string =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export type EnvironmentConnectorDirectoryPackage = {
  schema: "helix.environment_connector.directory_package.v1";
  package_version_id: string;
  publisher_id: string;
  package_id: string;
  package_version: string;
  content_hash: string;
  signature: unknown;
  host_compatibility: unknown;
  capability_descriptors: unknown;
  trust: {
    package_provenance: string;
    security_review: string;
    runtime_connection_health: "not_a_directory_claim";
    observation_quality: "not_a_directory_claim";
  };
  conformance: {
    contract_version: "v1";
    report_ref: "connectors/environment/conformance/golden-report.json";
  };
  lifecycle_status: string;
  published_at: string;
  withdrawn_at: string | null;
  private_installation_data_included: false;
  user_evidence_included: false;
  publisher_text_model_visible: false;
  answer_authority: false;
  assistant_answer: false;
  terminal_eligible: false;
  raw_content_included: false;
};

export const listPublicEnvironmentConnectorDirectory =
  async (): Promise<EnvironmentConnectorDirectoryPackage[]> => {
    const db = await readSharedRealtimeRoomDatabase();
    await ensureBuiltinEnvironmentConnectorPackages(db);
    const result = await db.query<DirectoryPackageRow>(
      `
        SELECT
          package_version_id,
          publisher_id,
          package_id,
          package_version,
          content_hash,
          signature,
          host_compatibility,
          capability_descriptors,
          trust_classification,
          security_review_state,
          lifecycle_status,
          published_at,
          withdrawn_at
        FROM helix_environment_connector_packages
        WHERE lifecycle_status IN ('active', 'deprecated', 'withdrawn', 'revoked')
        ORDER BY package_id, package_version;
      `,
    );
    return result.rows.map((row) => ({
      schema: "helix.environment_connector.directory_package.v1",
      package_version_id: row.package_version_id,
      publisher_id: row.publisher_id,
      package_id: row.package_id,
      package_version: row.package_version,
      content_hash: row.content_hash,
      signature: parseJson(row.signature),
      host_compatibility: parseJson(row.host_compatibility),
      capability_descriptors: parseJson(row.capability_descriptors),
      trust: {
        package_provenance: row.trust_classification,
        security_review: row.security_review_state,
        runtime_connection_health: "not_a_directory_claim",
        observation_quality: "not_a_directory_claim",
      },
      conformance: {
        contract_version: "v1",
        report_ref: "connectors/environment/conformance/golden-report.json",
      },
      lifecycle_status: row.lifecycle_status,
      published_at: iso(row.published_at),
      withdrawn_at: row.withdrawn_at ? iso(row.withdrawn_at) : null,
      private_installation_data_included: false,
      user_evidence_included: false,
      publisher_text_model_visible: false,
      answer_authority: false,
      assistant_answer: false,
      terminal_eligible: false,
      raw_content_included: false,
    }));
  };

