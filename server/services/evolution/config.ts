import { evolutionConfigSchema, type EvolutionConfig } from "@shared/evolution-schema";

export type EvolutionConfigLoadResult =
  | { ok: true; config: EvolutionConfig }
  | { ok: false; code: "EVOLUTION_CONFIG_INVALID"; message: string; details?: unknown };

export const DEFAULT_EVOLUTION_CONFIG: EvolutionConfig = evolutionConfigSchema.parse({ version: 1 });

export function loadEvolutionConfig(raw?: unknown): EvolutionConfigLoadResult {
  if (raw === undefined || raw === null) {
    return { ok: true, config: DEFAULT_EVOLUTION_CONFIG };
  }
  const parsed = evolutionConfigSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      code: "EVOLUTION_CONFIG_INVALID",
      message: "Evolution config failed schema validation",
      details: parsed.error.flatten(),
    };
  }
  return { ok: true, config: parsed.data };
}
