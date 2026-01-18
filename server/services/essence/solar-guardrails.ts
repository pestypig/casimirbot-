import fs from "node:fs";
import path from "node:path";
import {
  SolarGuardrailConfig,
  evaluateSolarGuardrails,
  type SolarGuardrailInputs,
  type TSolarGuardrailConfig,
  type TSolarGuardrailReport,
} from "@shared/solar-guardrails";

const DEFAULT_GUARDRAIL_VERSION =
  process.env.SOLAR_GUARDRAIL_VERSION ?? "v1";

const guardrailCache = new Map<string, TSolarGuardrailConfig>();

export const solarGuardrailConfigPath = (
  version = DEFAULT_GUARDRAIL_VERSION,
): string =>
  process.env.SOLAR_GUARDRAIL_PATH ??
  path.resolve(process.cwd(), "configs", `solar-guardrails.${version}.json`);

export function loadSolarGuardrailConfig(
  version = DEFAULT_GUARDRAIL_VERSION,
): TSolarGuardrailConfig {
  const cached = guardrailCache.get(version);
  if (cached) return cached;
  const file = solarGuardrailConfigPath(version);
  const raw = fs.readFileSync(file, "utf8");
  const parsed = SolarGuardrailConfig.parse(JSON.parse(raw));
  guardrailCache.set(version, parsed);
  return parsed;
}

export function runSolarGuardrails(
  inputs: SolarGuardrailInputs | null | undefined,
  opts?: { configVersion?: string; generatedAtIso?: string },
): TSolarGuardrailReport {
  const version = opts?.configVersion ?? DEFAULT_GUARDRAIL_VERSION;
  const config = loadSolarGuardrailConfig(version);
  return evaluateSolarGuardrails(inputs, config, opts?.generatedAtIso);
}
