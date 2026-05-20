import type {
  HelixEnvironmentSourceManifest,
  HelixEnvironmentSnapshotSection,
  HelixEnvironmentManifestProbeType,
  HelixEnvironmentSourceModality,
} from "@shared/helix-environment-source-manifest";

const manifestsBySource = new Map<string, HelixEnvironmentSourceManifest>();

export function registerEnvironmentSourceManifest(
  manifest: HelixEnvironmentSourceManifest,
): HelixEnvironmentSourceManifest {
  if (manifest.assistant_answer !== false) throw new Error("environment source manifest cannot be an assistant answer");
  if (manifest.raw_content_included !== false) throw new Error("environment source manifest cannot include raw content");
  if (manifest.execution_policy.may_execute_live_actions !== false) {
    throw new Error("environment source manifest may not enable live execution");
  }
  if (manifest.execution_policy.may_perform_read_only_probes !== true) {
    throw new Error("environment source manifest must declare read-only probe support policy");
  }
  manifestsBySource.set(manifest.source_id, manifest);
  return manifest;
}

export function getEnvironmentSourceManifest(sourceId: string): HelixEnvironmentSourceManifest | null {
  return manifestsBySource.get(sourceId) ?? null;
}

export function listEnvironmentSourceManifests(input?: {
  roomId?: string | null;
  domainAdapterPrefix?: string | null;
}): HelixEnvironmentSourceManifest[] {
  return Array.from(manifestsBySource.values()).filter((manifest) => {
    if (input?.roomId && manifest.room_id !== input.roomId) return false;
    if (input?.domainAdapterPrefix && !manifest.domain_adapter.startsWith(input.domainAdapterPrefix)) return false;
    return true;
  });
}

export function sourceSupportsEnvironmentModality(
  manifest: HelixEnvironmentSourceManifest | null,
  modality: HelixEnvironmentSourceModality,
): boolean {
  return Boolean(manifest?.modalities.includes(modality));
}

export function sourceSupportsSnapshotSections(
  manifest: HelixEnvironmentSourceManifest | null,
  sections: HelixEnvironmentSnapshotSection[],
): boolean {
  if (!manifest) return false;
  return sections.every((section) => manifest.supported_snapshot_sections.includes(section));
}

export function sourceSupportsProbeTypes(
  manifest: HelixEnvironmentSourceManifest | null,
  probeTypes: HelixEnvironmentManifestProbeType[],
): boolean {
  if (!manifest) return false;
  return probeTypes.every((probeType) => manifest.supported_probe_types.includes(probeType));
}

export function resetEnvironmentSourceRegistryForTest(): void {
  manifestsBySource.clear();
}
