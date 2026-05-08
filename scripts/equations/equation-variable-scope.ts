import fs from "node:fs";
import path from "node:path";
import type { Nhm2EquationVariable } from "../../shared/contracts/nhm2-equation-visualizer.v1.js";
import { sha256File } from "../figures/figure-manifest.js";

export interface Nhm2EquationScope {
  repoScope: Record<string, unknown>;
  userScope: Record<string, number>;
  sweepScope: Record<string, number>;
  constantsScope: Record<string, number>;
  derivedScope: Record<string, number>;
}

export function buildBaseScope(variables: Nhm2EquationVariable[]): Nhm2EquationScope {
  const constantsScope: Record<string, number> = {};
  const repoScope: Record<string, unknown> = {};
  for (const variable of variables) {
    if (variable.source === "constant" && typeof variable.defaultValue === "number") {
      constantsScope[variable.name] = variable.defaultValue;
    }
    if (variable.source === "repo_artifact") {
      repoScope[variable.name] = resolveRepoVariable(variable);
    }
  }
  return {
    repoScope,
    userScope: {},
    sweepScope: {},
    constantsScope,
    derivedScope: {},
  };
}

export function resolveScopeValue(scope: Nhm2EquationScope, variable: Nhm2EquationVariable): number | undefined {
  const name = variable.name;
  const candidates = [
    scope.sweepScope[name],
    scope.userScope[name],
    scope.repoScope[name],
    scope.constantsScope[name],
    scope.derivedScope[name],
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
  }
  if (typeof variable.defaultValue === "number") return variable.defaultValue;
  return undefined;
}

export function variableTrace(variables: Nhm2EquationVariable[]): Array<{
  name: string;
  source: string;
  units: string;
  range?: unknown;
  artifactHash?: string;
}> {
  return variables.map((variable) => {
    const artifactPath = variable.artifactBinding?.artifactPath;
    return {
      name: variable.name,
      source: variable.source,
      units: variable.units,
      range: variable.defaultRange,
      artifactHash: artifactPath && fs.existsSync(artifactPath) ? sha256File(artifactPath) : undefined,
    };
  });
}

export function sweepValues(variable: Nhm2EquationVariable, maxSamples: number): number[] {
  if (!variable.defaultRange) throw new Error(`sweep_variable_missing_range:${variable.name}`);
  const { min, max, steps, scale } = variable.defaultRange;
  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(steps)) throw new Error(`invalid_sweep_range:${variable.name}`);
  const count = Math.min(Math.max(1, Math.floor(steps)), maxSamples);
  if (scale === "log") {
    const logMin = Math.log10(min);
    const logMax = Math.log10(max);
    return Array.from({ length: count }, (_, i) => 10 ** (logMin + (i / Math.max(1, count - 1)) * (logMax - logMin)));
  }
  return Array.from({ length: count }, (_, i) => min + (i / Math.max(1, count - 1)) * (max - min));
}

export function resolveRepoVariable(variable: Nhm2EquationVariable): unknown {
  const binding = variable.artifactBinding;
  if (!binding?.artifactPath || !fs.existsSync(binding.artifactPath)) return undefined;
  if (binding.artifactPath.endsWith(".raw")) return undefined;
  const artifact = JSON.parse(fs.readFileSync(binding.artifactPath, "utf8"));
  const value = getPath(artifact, binding.fieldName ?? "");
  if (binding.fieldName === "layout.tileArea_mm2" && typeof value === "number") return value * 1e-6;
  return value;
}

export function getPath(value: unknown, dottedPath: string): unknown {
  if (!dottedPath) return value;
  return dottedPath.split(".").reduce((current: any, key) => current?.[key], value as any);
}

export function resolveArtifactPath(relativeOrAbsolutePath: string): string {
  return path.isAbsolute(relativeOrAbsolutePath) ? relativeOrAbsolutePath : path.join(process.cwd(), relativeOrAbsolutePath);
}
