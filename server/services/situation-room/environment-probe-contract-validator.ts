import {
  HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA,
  HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA,
  type HelixEnvironmentProbeResult,
} from "@shared/helix-environment-probe";
import { policyForEnvironmentSensorScope } from "@shared/helix-environment-sensor-scope";
import { auditEnvironmentSourceContract, type EnvironmentSourceContractAudit } from "./environment-source-contract-validator";

export function auditEnvironmentProbeContract(input: {
  subject: unknown;
  now?: string;
}): EnvironmentSourceContractAudit {
  const audit = auditEnvironmentSourceContract({ subject: input.subject, now: input.now });
  const record = input.subject && typeof input.subject === "object" && !Array.isArray(input.subject)
    ? input.subject as Record<string, unknown>
    : null;
  if (!record) return audit;
  const issues = [...audit.issues];
  const issue = (code: string, summary: string, severity: "info" | "warn" | "error" = "error") => {
    issues.push({ code, summary, severity });
  };
  if (record.schema === HELIX_ENVIRONMENT_PROBE_REQUEST_SCHEMA) {
    const constraints = record.constraints && typeof record.constraints === "object" && !Array.isArray(record.constraints)
      ? record.constraints as Record<string, unknown>
      : null;
    if (constraints?.read_only !== true) issue("probe_not_read_only", "Probe requests must be read-only.");
    if (constraints?.side_effects_allowed !== false) issue("side_effects_allowed", "Probe requests must forbid side effects.");
  }
  if (record.schema === HELIX_ENVIRONMENT_PROBE_RESULT_SCHEMA) {
    const result = record as unknown as HelixEnvironmentProbeResult;
    if (result.side_effects_performed !== false) issue("side_effects_performed", "Probe results must not report side effects.");
    if (Array.isArray(result.commands_executed) && result.commands_executed.length > 0) {
      issue("commands_executed", "Probe results cannot execute commands.");
    }
    if (result.world_mutation_performed !== false) issue("world_mutation_performed", "Probe results cannot mutate the world.");
    const policy = policyForEnvironmentSensorScope(result.sensor_scope);
    if (policy.requires_caveat && result.requires_caveat !== true) {
      issue("sensor_scope_caveat_missing", "Privileged or sensor-only probe results require a caveat.");
    }
  }
  const severity: EnvironmentSourceContractAudit["severity"] = issues.some((entry) => entry.severity === "error")
    ? "error"
    : issues.some((entry) => entry.severity === "warn")
      ? "warn"
      : "info";
  return {
    ...audit,
    ok: !issues.some((entry) => entry.severity === "error"),
    severity,
    issues,
  };
}
