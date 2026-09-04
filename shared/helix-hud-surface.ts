import { z } from "zod";

export const HUD_SURFACE_SCHEMA = "helix.hud_surface.v1" as const;

export const HudCompositionModeSchema = z.enum([
  "hud_only_alpha",
  "hud_on_black",
  "hud_over_source",
  "source_only",
]);

export const HudSurfaceOutputTargetSchema = z.enum(["workstation_preview", "clean_feed"]);

export const SurfaceSourceBindingSchema = z.object({
  schema: z.literal(HUD_SURFACE_SCHEMA),
  profileId: z.string().min(1),
  runId: z.string().min(1),
  sourceId: z.string().min(1),
  producerEpoch: z.string().min(1),
  sourceKind: z.enum(["none", "tab", "program", "camera", "simulator", "replay"]),
  locatorRef: z.string().min(1),
  permission: z.enum(["not_required", "granted", "denied", "revoked"]),
  retention: z.enum(["none", "session", "evidence_opt_in"]),
});

export const SurfaceFrameSchema = z.object({
  schema: z.literal(HUD_SURFACE_SCHEMA),
  frameId: z.string().min(1),
  sourceId: z.string().min(1),
  producerEpoch: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  capturedAtMs: z.number().int().nonnegative(),
  freshnessDeadlineMs: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  colorSpace: z.enum(["srgb", "display_p3", "unknown"]),
  alphaMode: z.enum(["opaque", "premultiplied", "straight", "unknown"]),
  provenanceRef: z.string().min(1),
  contentClass: z.enum(["untouched_source", "synthetic_fixture", "non_authoritative_projection"]),
});

export const HudPrimitiveSchema = z.object({
  primitiveId: z.string().min(1),
  kind: z.enum(["bar", "icon", "text", "profile_surface"]),
  xNorm: z.number().finite().min(0).max(1),
  yNorm: z.number().finite().min(0).max(1),
  widthNorm: z.number().finite().positive().max(1),
  heightNorm: z.number().finite().positive().max(1),
  rotationDeg: z.number().finite(),
  opacity: z.number().finite().min(0).max(1),
  styleToken: z.string().min(1),
  semanticRef: z.string().min(1),
});

export const HudSceneSchema = z.object({
  schema: z.literal(HUD_SURFACE_SCHEMA),
  sceneId: z.string().min(1),
  profileId: z.string().min(1),
  producerEpoch: z.string().min(1),
  revision: z.number().int().nonnegative(),
  authoredAtMs: z.number().int().nonnegative(),
  freshnessDeadlineMs: z.number().int().nonnegative(),
  normalizedViewport: z.literal("unit_rect_top_left_v1"),
  primitives: z.array(HudPrimitiveSchema),
});

export const ProjectionViewportSchema = z.object({
  schema: z.literal(HUD_SURFACE_SCHEMA),
  viewportId: z.string().min(1),
  mode: HudCompositionModeSchema,
  outputTarget: HudSurfaceOutputTargetSchema,
  outputWidth: z.number().int().positive(),
  outputHeight: z.number().int().positive(),
  devicePixelRatio: z.number().finite().positive().max(4),
  crop: z.object({
    xNorm: z.number().finite().min(0).max(1),
    yNorm: z.number().finite().min(0).max(1),
    widthNorm: z.number().finite().positive().max(1),
    heightNorm: z.number().finite().positive().max(1),
  }),
  transformRef: z.string().min(1),
});

export const HudSurfaceControlsSchema = z.object({
  manualBlank: z.boolean(),
  emergencyStop: z.boolean(),
});

export const HudSurfaceCompositionInputSchema = z.object({
  atMs: z.number().int().nonnegative(),
  binding: SurfaceSourceBindingSchema,
  frame: SurfaceFrameSchema.nullable(),
  scene: HudSceneSchema,
  viewport: ProjectionViewportSchema,
  controls: HudSurfaceControlsSchema,
});

export const HudSurfaceRenderReceiptSchema = z.object({
  schema: z.literal(HUD_SURFACE_SCHEMA),
  receiptId: z.string().min(1),
  atMs: z.number().int().nonnegative(),
  profileId: z.string().min(1),
  runId: z.string().min(1),
  sourceBindingHash: z.string().min(1),
  sourceFrameHash: z.string().nullable(),
  hudSceneHash: z.string().min(1),
  viewportHash: z.string().min(1),
  transformRef: z.string().min(1),
  outputTarget: HudSurfaceOutputTargetSchema,
  mode: HudCompositionModeSchema,
  sourceVisible: z.boolean(),
  hudVisible: z.boolean(),
  visibleLayers: z.array(z.enum(["source", "hud"])).max(2),
  status: z.enum(["rendered", "degraded", "blanked"]),
  reason: z.enum([
    "none",
    "manual_blank",
    "emergency_stop",
    "source_not_required",
    "source_missing",
    "source_stale",
    "source_identity_mismatch",
    "source_permission_denied",
    "scene_stale",
    "scene_identity_mismatch",
  ]),
  pixelsOnlyAuthority: z.literal(true),
  programInputAuthority: z.literal(false),
  causalHash: z.string().min(1),
  hashAlgorithm: z.literal("fnv1a32_fixture_identity"),
});

export type HudCompositionMode = z.infer<typeof HudCompositionModeSchema>;
export type SurfaceSourceBinding = z.infer<typeof SurfaceSourceBindingSchema>;
export type SurfaceFrame = z.infer<typeof SurfaceFrameSchema>;
export type HudScene = z.infer<typeof HudSceneSchema>;
export type ProjectionViewport = z.infer<typeof ProjectionViewportSchema>;
export type HudSurfaceCompositionInput = z.infer<typeof HudSurfaceCompositionInputSchema>;
export type HudSurfaceRenderReceipt = z.infer<typeof HudSurfaceRenderReceiptSchema>;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableJson(record[key])}`).join(",")}}`;
}

export function hudSurfaceIdentityHash(value: unknown): string {
  const input = stableJson(value);
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

const sourceRequired = (mode: HudCompositionMode) => mode === "hud_over_source" || mode === "source_only";

export function composeHudSurface(rawInput: HudSurfaceCompositionInput): HudSurfaceRenderReceipt {
  const input = HudSurfaceCompositionInputSchema.parse(rawInput);
  const { atMs, binding, frame, scene, viewport, controls } = input;
  const sourceBindingHash = hudSurfaceIdentityHash(binding);
  const sourceFrameHash = frame ? hudSurfaceIdentityHash(frame) : null;
  const hudSceneHash = hudSurfaceIdentityHash(scene);
  const viewportHash = hudSurfaceIdentityHash(viewport);

  let sourceVisible = false;
  let hudVisible = viewport.mode !== "source_only";
  let status: HudSurfaceRenderReceipt["status"] = "rendered";
  let reason: HudSurfaceRenderReceipt["reason"] = sourceRequired(viewport.mode) ? "none" : "source_not_required";

  if (sourceRequired(viewport.mode)) {
    if (binding.permission === "denied" || binding.permission === "revoked") {
      status = "blanked";
      reason = "source_permission_denied";
    } else if (!frame) {
      status = "blanked";
      reason = "source_missing";
    } else if (frame.sourceId !== binding.sourceId || frame.producerEpoch !== binding.producerEpoch) {
      status = "blanked";
      reason = "source_identity_mismatch";
    } else if (atMs > frame.freshnessDeadlineMs) {
      status = "blanked";
      reason = "source_stale";
    } else {
      sourceVisible = true;
    }
  }

  if (status !== "blanked" && (scene.profileId !== binding.profileId || scene.producerEpoch !== binding.producerEpoch)) {
    hudVisible = false;
    status = sourceVisible ? "degraded" : "blanked";
    reason = "scene_identity_mismatch";
  } else if (status !== "blanked" && atMs > scene.freshnessDeadlineMs) {
    hudVisible = false;
    status = sourceVisible ? "degraded" : "blanked";
    reason = "scene_stale";
  }

  if (viewport.mode === "source_only") hudVisible = false;
  if (controls.manualBlank) {
    hudVisible = false;
    status = sourceVisible ? "degraded" : "blanked";
    reason = "manual_blank";
  }
  if (controls.emergencyStop) {
    sourceVisible = false;
    hudVisible = false;
    status = "blanked";
    reason = "emergency_stop";
  }

  if (status === "blanked") {
    sourceVisible = false;
    hudVisible = false;
  }

  const visibleLayers: Array<"source" | "hud"> = [];
  if (sourceVisible) visibleLayers.push("source");
  if (hudVisible) visibleLayers.push("hud");

  const receiptBody = {
    atMs,
    profileId: binding.profileId,
    runId: binding.runId,
    sourceBindingHash,
    sourceFrameHash,
    hudSceneHash,
    viewportHash,
    transformRef: viewport.transformRef,
    outputTarget: viewport.outputTarget,
    mode: viewport.mode,
    sourceVisible,
    hudVisible,
    visibleLayers,
    status,
    reason,
    pixelsOnlyAuthority: true as const,
    programInputAuthority: false as const,
  };
  const causalHash = hudSurfaceIdentityHash(receiptBody);

  return HudSurfaceRenderReceiptSchema.parse({
    schema: HUD_SURFACE_SCHEMA,
    receiptId: `hud-render:${atMs}:${causalHash.slice(-8)}`,
    ...receiptBody,
    causalHash,
    hashAlgorithm: "fnv1a32_fixture_identity",
  });
}
