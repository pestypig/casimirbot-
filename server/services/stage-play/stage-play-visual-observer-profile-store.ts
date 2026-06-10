import crypto from "node:crypto";
import {
  STAGE_PLAY_VISUAL_OBSERVER_PROFILE_SCHEMA,
  type StagePlayVisualObserverProfileDomainV1,
  type StagePlayVisualObserverProfileOutputModeV1,
  type StagePlayVisualObserverProfileStatusV1,
  type StagePlayVisualObserverProfileV1,
} from "@shared/contracts/stage-play-visual-observer-profile.v1";

const profilesById = new Map<string, StagePlayVisualObserverProfileV1>();

const hashShort = (value: unknown, size = 18): string =>
  crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, size);

export const stagePlayVisualObserverPromptHash = (prompt: string): string =>
  crypto.createHash("sha256").update(prompt, "utf8").digest("hex").slice(0, 18);

const uniqueStrings = (values: Array<string | null | undefined>): string[] =>
  Array.from(new Set(values.map((value) => String(value ?? "").trim()).filter(Boolean)));

const normalizeDomain = (value: unknown): StagePlayVisualObserverProfileDomainV1 => {
  if (
    value === "minecraft_gameplay" ||
    value === "science" ||
    value === "browser_workflow" ||
    value === "video_scene" ||
    value === "desktop_app" ||
    value === "document" ||
    value === "custom"
  ) {
    return value;
  }
  return "custom";
};

const normalizeOutputMode = (value: unknown): StagePlayVisualObserverProfileOutputModeV1 => {
  if (value === "prose" || value === "semi_structured_json" || value === "json_schema") return value;
  return "semi_structured_json";
};

const normalizeStatus = (value: unknown): StagePlayVisualObserverProfileStatusV1 => {
  if (value === "active" || value === "paused" || value === "archived") return value;
  return "active";
};

const minecraftGameplayObserverPrompt = [
  "You are observing Minecraft gameplay.",
  "",
  "Return a compact evidence summary focused on:",
  "- player location/context: indoors, outdoors, cave, base, corridor, doorway",
  "- hotbar: selected slot, visible tools/weapons/food/blocks",
  "- HUD: health, hunger, armor, XP, damage/fire/low-health cues, if visible",
  "- crosshair target: block, door, mob, item, UI element, if visible",
  "- visible mobs: hostile/passive, approximate position, threat level",
  "- inventory/UI state: chest, crafting, furnace, pause/menu, chat",
  "- lighting/time/weather if visible",
  "- changed_since_last_frame",
  "- likely_next_10_seconds",
  "",
  "Keep uncertainty explicit.",
  "Do not invent unseen details.",
  "Return semi-structured JSON:",
  "{",
  '  "scene": "...",',
  '  "hud": "...",',
  '  "hotbar": "...",',
  '  "selected_item": "...",',
  '  "visible_entities": [],',
  '  "current_action": "...",',
  '  "changed_since_last_frame": [],',
  '  "risk_cues": [],',
  '  "opportunity_cues": [],',
  '  "next_10s_prediction": "...",',
  '  "confidence": 0.0',
  "}",
].join("\n");

const solarSdoAia193ObserverPrompt = [
  "You are observing real NASA/SDO AIA solar imagery in the 193 angstrom passband.",
  "",
  "Use this shade to classify solar activity through coronal-hole placement, active-region structure, and solar-atmosphere morphology.",
  "AIA 193 A primarily shows Fe XII coronal plasma near 1.5 MK and can show very hot Fe XXIV emission during strong flares.",
  "",
  "Focus on:",
  "- coronal holes: dark, broad, persistent low-emission regions; note polar/equatorial placement, boundaries, extension toward disk center, and whether they could be confused with filaments or limb darkening",
  "- active regions and sunspot proxies: bright compact loop systems, loop footpoints, moss, plage-like EUV brightening, magnetic complexity proxies, and whether true umbra/penumbra classification needs HMI continuum or magnetogram support",
  "- solar activity cues: flares, saturated pixels, compact brightenings, jets, post-eruption arcades, EUV waves, coronal dimming, CME launch signatures, and new/emerging bright loops",
  "- corona and atmosphere features: loop arcades, fan loops, transequatorial loops, streamers near the limb, polar plumes, bright points, filaments/prominences seen as dark absorption, and off-limb emission",
  "- wavelength-specific uncertainty: do not over-claim visible-light sunspot classes from AIA 193 alone; say when another wavelength is needed",
  "",
  "Return semi-structured JSON:",
  "{",
  '  "wavelength_angstrom": 193,',
  '  "passband": "SDO AIA 193",',
  '  "solar_disk_orientation": "...",',
  '  "coronal_holes": [],',
  '  "active_regions": [],',
  '  "sunspot_proxy_assessment": "...",',
  '  "activity_cues": [],',
  '  "atmospheric_features": [],',
  '  "flare_or_cme_cues": [],',
  '  "classification": "...",',
  '  "uncertainty_notes": [],',
  '  "confidence": 0.0',
  "}",
].join("\n");

const defaultPromptFor = (title: string): string =>
  `Summarize this permission-bound live frame as compact evidence for ${title}. Focus on visible scene, activity, objects, UI context, changes, and uncertainty.`;

const defaultProfiles = (): StagePlayVisualObserverProfileV1[] => {
  const createdAt = "2026-06-01T00:00:00.000Z";
  const seed = (input: {
    id: string;
    title: string;
    domain: StagePlayVisualObserverProfileDomainV1;
    subjectCategory?: string | null;
    subject?: string | null;
    prompt?: string;
    outputMode?: StagePlayVisualObserverProfileOutputModeV1;
    fields?: string[];
    requiredFields?: string[];
  }): StagePlayVisualObserverProfileV1 => {
    const prompt = input.prompt ?? defaultPromptFor(input.title);
    return {
      artifactId: "stage_play_visual_observer_profile",
      schemaVersion: STAGE_PLAY_VISUAL_OBSERVER_PROFILE_SCHEMA,
      profileId: `stage_play_visual_observer_profile:${input.id}`,
      title: input.title,
      domain: input.domain,
      subjectCategory: input.subjectCategory ?? null,
      subject: input.subject ?? null,
      sourceIds: [],
      prompt,
      outputMode: input.outputMode ?? "semi_structured_json",
      expectedSchema: input.fields
        ? {
            fields: input.fields,
            requiredFields: input.requiredFields ?? [],
          }
        : null,
      cadenceHintMs: null,
      status: "active",
      linkedInterpreterProfileId: null,
      linkedWatchJobPolicyId: null,
      linkedNoteId: null,
      promptHash: stagePlayVisualObserverPromptHash(prompt),
      createdAt,
      updatedAt: createdAt,
      assistant_answer: false,
      terminal_eligible: false,
      context_role: "tool_policy",
    };
  };
  return [
    seed({ id: "generic:v1", title: "Generic Visual Observer", domain: "custom", outputMode: "prose" }),
    seed({
      id: "minecraft-gameplay:v1",
      title: "Minecraft Gameplay Observer",
      domain: "minecraft_gameplay",
      subjectCategory: "Gaming",
      subject: "Minecraft gameplay",
      prompt: minecraftGameplayObserverPrompt,
      fields: [
        "scene",
        "hud",
        "hotbar",
        "selected_item",
        "visible_entities",
        "current_action",
        "changed_since_last_frame",
        "risk_cues",
        "opportunity_cues",
        "next_10s_prediction",
        "confidence",
      ],
      requiredFields: ["scene", "current_action", "changed_since_last_frame", "risk_cues", "next_10s_prediction"],
    }),
    seed({
      id: "solar-sdo-aia-193:v1",
      title: "SDO AIA 193 Solar Activity Observer",
      domain: "science",
      subjectCategory: "Science",
      subject: "Solar activity / SDO AIA 193 angstrom",
      prompt: solarSdoAia193ObserverPrompt,
      fields: [
        "wavelength_angstrom",
        "passband",
        "solar_disk_orientation",
        "coronal_holes",
        "active_regions",
        "sunspot_proxy_assessment",
        "activity_cues",
        "atmospheric_features",
        "flare_or_cme_cues",
        "classification",
        "uncertainty_notes",
        "confidence",
      ],
      requiredFields: [
        "wavelength_angstrom",
        "passband",
        "coronal_holes",
        "active_regions",
        "sunspot_proxy_assessment",
        "activity_cues",
        "uncertainty_notes",
        "confidence",
      ],
    }),
    seed({ id: "browser-workflow:v1", title: "Browser Workflow Observer", domain: "browser_workflow" }),
    seed({ id: "video-scene:v1", title: "Video Scene Observer", domain: "video_scene" }),
    seed({ id: "document-slide:v1", title: "Document/Slide Observer", domain: "document" }),
    seed({ id: "debug-ui:v1", title: "Debug UI Observer", domain: "desktop_app" }),
  ];
};

export function ensureDefaultStagePlayVisualObserverProfiles(): StagePlayVisualObserverProfileV1[] {
  for (const profile of defaultProfiles()) {
    if (!profilesById.has(profile.profileId)) profilesById.set(profile.profileId, profile);
  }
  return Array.from(profilesById.values()).filter((profile) => profile.status === "active");
}

export function recordStagePlayVisualObserverProfile(input: {
  title?: string | null;
  domain?: StagePlayVisualObserverProfileDomainV1 | string | null;
  subjectCategory?: string | null;
  subject?: string | null;
  sourceIds?: string[];
  prompt: string;
  outputMode?: StagePlayVisualObserverProfileOutputModeV1 | string | null;
  expectedSchema?: StagePlayVisualObserverProfileV1["expectedSchema"];
  cadenceHintMs?: number | null;
  status?: StagePlayVisualObserverProfileStatusV1 | string | null;
  linkedInterpreterProfileId?: string | null;
  linkedWatchJobPolicyId?: string | null;
  linkedNoteId?: string | null;
  now?: string;
}): StagePlayVisualObserverProfileV1 {
  ensureDefaultStagePlayVisualObserverProfiles();
  const now = input.now ?? new Date().toISOString();
  const title = input.title?.trim() || "Custom Visual Observer";
  const prompt = input.prompt.trim();
  const profile: StagePlayVisualObserverProfileV1 = {
    artifactId: "stage_play_visual_observer_profile",
    schemaVersion: STAGE_PLAY_VISUAL_OBSERVER_PROFILE_SCHEMA,
    profileId: `stage_play_visual_observer_profile:${hashShort([title, input.domain ?? null, prompt, now])}`,
    title,
    domain: normalizeDomain(input.domain),
    subjectCategory: input.subjectCategory ?? null,
    subject: input.subject ?? null,
    sourceIds: uniqueStrings(input.sourceIds ?? []),
    prompt,
    outputMode: normalizeOutputMode(input.outputMode),
    expectedSchema: input.expectedSchema ?? null,
    cadenceHintMs: typeof input.cadenceHintMs === "number" && Number.isFinite(input.cadenceHintMs)
      ? Math.max(250, Math.round(input.cadenceHintMs))
      : null,
    status: normalizeStatus(input.status),
    linkedInterpreterProfileId: input.linkedInterpreterProfileId ?? null,
    linkedWatchJobPolicyId: input.linkedWatchJobPolicyId ?? null,
    linkedNoteId: input.linkedNoteId ?? null,
    promptHash: stagePlayVisualObserverPromptHash(prompt),
    createdAt: now,
    updatedAt: now,
    assistant_answer: false,
    terminal_eligible: false,
    context_role: "tool_policy",
  };
  profilesById.set(profile.profileId, profile);
  return profile;
}

export function getStagePlayVisualObserverProfile(profileId: string): StagePlayVisualObserverProfileV1 | null {
  ensureDefaultStagePlayVisualObserverProfiles();
  return profilesById.get(profileId) ?? null;
}

export function listStagePlayVisualObserverProfiles(input: {
  sourceId?: string | null;
  domain?: StagePlayVisualObserverProfileDomainV1 | string | null;
  status?: StagePlayVisualObserverProfileStatusV1 | string | null;
  includePresets?: boolean;
  limit?: number;
} = {}): StagePlayVisualObserverProfileV1[] {
  ensureDefaultStagePlayVisualObserverProfiles();
  const limit = Math.max(1, Math.min(input.limit ?? 100, 250));
  const domain = input.domain ? normalizeDomain(input.domain) : null;
  const status = input.status ? normalizeStatus(input.status) : null;
  return Array.from(profilesById.values())
    .filter((profile) => !domain || profile.domain === domain)
    .filter((profile) => !status || profile.status === status)
    .filter((profile) =>
      !input.sourceId ||
      profile.sourceIds.includes(input.sourceId) ||
      (input.includePresets === true && profile.sourceIds.length === 0)
    )
    .filter((profile) => input.includePresets !== false || profile.sourceIds.length > 0)
    .sort((left, right) => left.updatedAt.localeCompare(right.updatedAt))
    .slice(-limit);
}

export function getActiveStagePlayVisualObserverProfileForSource(input: {
  sourceId?: string | null;
  profileId?: string | null;
  domain?: StagePlayVisualObserverProfileDomainV1 | string | null;
}): StagePlayVisualObserverProfileV1 | null {
  ensureDefaultStagePlayVisualObserverProfiles();
  if (input.profileId) {
    const profile = getStagePlayVisualObserverProfile(input.profileId);
    if (profile && profile.status === "active") return profile;
  }
  if (input.sourceId) {
    const scoped = listStagePlayVisualObserverProfiles({
      sourceId: input.sourceId,
      status: "active",
      limit: 25,
    }).at(-1);
    if (scoped) return scoped;
  }
  if (input.domain) {
    return listStagePlayVisualObserverProfiles({
      domain: input.domain,
      status: "active",
      includePresets: true,
      limit: 25,
    }).find((profile) => profile.sourceIds.length === 0) ?? null;
  }
  return null;
}

export function applyStagePlayVisualObserverProfile(input: {
  profileId: string;
  sourceIds: string[];
  status?: StagePlayVisualObserverProfileStatusV1 | string | null;
  now?: string;
}): StagePlayVisualObserverProfileV1 | null {
  ensureDefaultStagePlayVisualObserverProfiles();
  const existing = getStagePlayVisualObserverProfile(input.profileId);
  if (!existing) return null;
  const now = input.now ?? new Date().toISOString();
  const sourceIds = uniqueStrings(input.sourceIds);
  for (const profile of profilesById.values()) {
    if (profile.profileId === existing.profileId || profile.status !== "active") continue;
    if (!profile.sourceIds.some((sourceId) => sourceIds.includes(sourceId))) continue;
    profilesById.set(profile.profileId, {
      ...profile,
      sourceIds: profile.sourceIds.filter((sourceId) => !sourceIds.includes(sourceId)),
      updatedAt: now,
    });
  }
  const updated: StagePlayVisualObserverProfileV1 = {
    ...existing,
    sourceIds: uniqueStrings([...existing.sourceIds, ...sourceIds]),
    status: normalizeStatus(input.status),
    updatedAt: now,
  };
  profilesById.set(updated.profileId, updated);
  return updated;
}

export function resetStagePlayVisualObserverProfileStoreForTest(): void {
  profilesById.clear();
}
