export type ProfileLiveSourceFamily =
  | "minecraft"
  | "discord_voice"
  | "calculator_stream"
  | "physics_simulation"
  | "browser_audio";

export type ProfileLiveSourceStatus = "active" | "stale" | "error";

export type ProfileLiveSource = {
  profile_id: string;
  source_family: ProfileLiveSourceFamily;
  room_id: string;
  source_id: string;
  world_id?: string | null;
  last_seen_at: string;
  status: ProfileLiveSourceStatus;
};

export type ProfileSourceResolution = {
  resolved: boolean;
  profile_id: string;
  source_id?: string;
  room_id?: string;
  world_id?: string | null;
  reason:
    | "profile_source_match"
    | "world_match"
    | "latest_active_source"
    | "missing_source"
    | "ambiguous_source";
  candidates: ProfileLiveSource[];
};

const profileSources = new Map<string, ProfileLiveSource>();

const normalize = (value?: string | null): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const sourceKey = (source: {
  profile_id: string;
  source_family: ProfileLiveSourceFamily;
  room_id: string;
  source_id: string;
  world_id?: string | null;
}): string =>
  [
    source.profile_id,
    source.source_family,
    source.room_id,
    source.source_id,
    source.world_id ?? "",
  ].join(":");

export function recordProfileLiveSource(input: {
  profile_id: string;
  source_family: ProfileLiveSourceFamily;
  room_id: string;
  source_id: string;
  world_id?: string | null;
  status?: ProfileLiveSourceStatus;
  last_seen_at?: string;
}): ProfileLiveSource | null {
  const profileId = normalize(input.profile_id);
  const roomId = normalize(input.room_id);
  const sourceId = normalize(input.source_id);
  if (!profileId || !roomId || !sourceId) return null;
  const source: ProfileLiveSource = {
    profile_id: profileId,
    source_family: input.source_family,
    room_id: roomId,
    source_id: sourceId,
    world_id: normalize(input.world_id),
    status: input.status ?? "active",
    last_seen_at: input.last_seen_at ?? new Date().toISOString(),
  };
  profileSources.set(sourceKey(source), source);
  return source;
}

export function listProfileLiveSources(profileId?: string | null): ProfileLiveSource[] {
  const normalizedProfile = normalize(profileId);
  return Array.from(profileSources.values())
    .filter((source: ProfileLiveSource) => !normalizedProfile || source.profile_id === normalizedProfile)
    .sort((a: ProfileLiveSource, b: ProfileLiveSource) => b.last_seen_at.localeCompare(a.last_seen_at));
}

export function resolveProfileMinecraftSource(input: {
  profile_id: string;
  world_id?: string | null;
  room_id?: string | null;
  source_id?: string | null;
}): ProfileSourceResolution {
  const profileId = normalize(input.profile_id) ?? "";
  const worldId = normalize(input.world_id);
  const roomId = normalize(input.room_id);
  const sourceId = normalize(input.source_id);
  const candidates = listProfileLiveSources(profileId).filter(
    (source: ProfileLiveSource) => source.source_family === "minecraft" && source.status === "active",
  );
  if (candidates.length === 0) {
    return { resolved: false, profile_id: profileId, reason: "missing_source", candidates: [] };
  }

  const exact = candidates.find(
    (source: ProfileLiveSource) =>
      (!roomId || source.room_id === roomId) &&
      (!sourceId || source.source_id === sourceId) &&
      (!worldId || source.world_id === worldId),
  );
  if (exact && (roomId || sourceId || worldId)) {
    return {
      resolved: true,
      profile_id: profileId,
      source_id: exact.source_id,
      room_id: exact.room_id,
      world_id: exact.world_id,
      reason: sourceId || roomId ? "profile_source_match" : "world_match",
      candidates: [exact],
    };
  }

  if (candidates.length === 1) {
    const [latest] = candidates;
    return {
      resolved: true,
      profile_id: profileId,
      source_id: latest.source_id,
      room_id: latest.room_id,
      world_id: latest.world_id,
      reason: "latest_active_source",
      candidates,
    };
  }

  return { resolved: false, profile_id: profileId, reason: "ambiguous_source", candidates };
}

export function resetProfileLiveSourcesForTest(): void {
  profileSources.clear();
}
