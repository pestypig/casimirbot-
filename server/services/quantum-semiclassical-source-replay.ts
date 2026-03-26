import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { QuantumSemiclassicalSourceReplay, type TQuantumSemiclassicalSourceReplay } from "@shared/quantum-semiclassical-comparison";

const sourceReplayEntrySchema = z.object({
  profile_id: z.string().min(1),
  title: z.string().min(1),
  microtubule_transport_length_m: z.number().positive(),
  microtubule_diffusion_coefficient_m2_s: z.number().positive(),
  subharmonic_lock_ratio: z.number().nonnegative(),
  time_crystal_signature_pass: z.boolean(),
  source_refs: z.array(z.string().min(1)).min(1),
  notes: z.array(z.string()).min(1),
});

const sourceReplayManifestSchema = z.object({
  schema_version: z.literal("quantum_semiclassical_source_replay/1"),
  profiles: z.array(sourceReplayEntrySchema).min(1),
});

type SourceReplayEntry = z.infer<typeof sourceReplayEntrySchema>;

let cachedProfiles: Map<string, TQuantumSemiclassicalSourceReplay> | null = null;

const buildTauMeasurementProxy = (entry: SourceReplayEntry): number =>
  (entry.microtubule_transport_length_m * entry.microtubule_transport_length_m) /
  (4 * entry.microtubule_diffusion_coefficient_m2_s);

function loadProfiles(): Map<string, TQuantumSemiclassicalSourceReplay> {
  if (cachedProfiles) return cachedProfiles;

  const manifestPath = path.join(process.cwd(), "configs", "quantum-semiclassical-source-replay.v1.json");
  const raw = fs.readFileSync(manifestPath, "utf8");
  const manifest = sourceReplayManifestSchema.parse(JSON.parse(raw));
  const profiles = new Map<string, TQuantumSemiclassicalSourceReplay>();

  for (const entry of manifest.profiles) {
    const profile = QuantumSemiclassicalSourceReplay.parse({
      profile_id: entry.profile_id,
      title: entry.title,
      measurement_timescale_kind: "microtubule_transport_lifetime_proxy",
      tau_measurement_proxy_s: buildTauMeasurementProxy(entry),
      microtubule_transport_length_m: entry.microtubule_transport_length_m,
      microtubule_diffusion_coefficient_m2_s: entry.microtubule_diffusion_coefficient_m2_s,
      subharmonic_lock_ratio: entry.subharmonic_lock_ratio,
      time_crystal_signature_pass: entry.time_crystal_signature_pass,
      source_refs: entry.source_refs,
      notes: entry.notes,
    });
    profiles.set(profile.profile_id, profile);
  }

  cachedProfiles = profiles;
  return profiles;
}

export function resolveQuantumSemiclassicalSourceReplay(
  profileId: string | null | undefined,
): TQuantumSemiclassicalSourceReplay | null {
  if (!profileId) return null;
  return loadProfiles().get(profileId) ?? null;
}
