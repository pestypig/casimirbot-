import { describe, expect, it } from "vitest";
import {
  HUD_SURFACE_SCHEMA,
  composeHudSurface,
  hudSurfaceIdentityHash,
  type HudSurfaceCompositionInput,
} from "../helix-hud-surface";

function fixture(overrides: Partial<HudSurfaceCompositionInput> = {}): HudSurfaceCompositionInput {
  const base: HudSurfaceCompositionInput = {
    atMs: 100,
    binding: {
      schema: HUD_SURFACE_SCHEMA,
      profileId: "motorcycle-awareness",
      runId: "run-001",
      sourceId: "synthetic-road",
      producerEpoch: "epoch-a",
      sourceKind: "simulator",
      locatorRef: "fixture:synthetic-road-v1",
      permission: "not_required",
      retention: "none",
    },
    frame: {
      schema: HUD_SURFACE_SCHEMA,
      frameId: "frame-1",
      sourceId: "synthetic-road",
      producerEpoch: "epoch-a",
      sequence: 1,
      capturedAtMs: 100,
      freshnessDeadlineMs: 200,
      width: 1280,
      height: 720,
      colorSpace: "srgb",
      alphaMode: "opaque",
      provenanceRef: "fixture:synthetic-road-v1:1",
      contentClass: "synthetic_fixture",
    },
    scene: {
      schema: HUD_SURFACE_SCHEMA,
      sceneId: "scene-1",
      profileId: "motorcycle-awareness",
      producerEpoch: "epoch-a",
      revision: 1,
      authoredAtMs: 100,
      freshnessDeadlineMs: 200,
      normalizedViewport: "unit_rect_top_left_v1",
      primitives: [{
        primitiveId: "profile-layer",
        kind: "profile_surface",
        xNorm: 0,
        yNorm: 0,
        widthNorm: 1,
        heightNorm: 1,
        rotationDeg: 0,
        opacity: 1,
        styleToken: "motorcycle-eight-sector-v1",
        semanticRef: "cue-set:none",
      }],
    },
    viewport: {
      schema: HUD_SURFACE_SCHEMA,
      viewportId: "normalized-preview",
      mode: "hud_over_source",
      outputTarget: "workstation_preview",
      outputWidth: 1280,
      outputHeight: 720,
      devicePixelRatio: 1,
      crop: { xNorm: 0, yNorm: 0, widthNorm: 1, heightNorm: 1 },
      transformRef: "identity:unit-rect-v1",
    },
    controls: { manualBlank: false, emergencyStop: false },
  };
  return { ...base, ...overrides };
}

describe("HUD surface composition", () => {
  it("deterministically composes a synthetic source below a normalized HUD scene", () => {
    const input = fixture();
    const first = composeHudSurface(input);
    const second = composeHudSurface(input);

    expect(first).toEqual(second);
    expect(first).toMatchObject({
      status: "rendered",
      reason: "none",
      sourceVisible: true,
      hudVisible: true,
      visibleLayers: ["source", "hud"],
      pixelsOnlyAuthority: true,
      programInputAuthority: false,
    });
    expect(first.causalHash).toBe(hudSurfaceIdentityHash({
      atMs: first.atMs,
      profileId: first.profileId,
      runId: first.runId,
      sourceBindingHash: first.sourceBindingHash,
      sourceFrameHash: first.sourceFrameHash,
      hudSceneHash: first.hudSceneHash,
      viewportHash: first.viewportHash,
      transformRef: first.transformRef,
      outputTarget: first.outputTarget,
      mode: first.mode,
      sourceVisible: first.sourceVisible,
      hudVisible: first.hudVisible,
      visibleLayers: first.visibleLayers,
      status: first.status,
      reason: first.reason,
      pixelsOnlyAuthority: true,
      programInputAuthority: false,
    }));
  });

  it("renders alpha-only HUD output without requiring an underlay", () => {
    const input = fixture({
      frame: null,
      viewport: { ...fixture().viewport, mode: "hud_only_alpha", outputTarget: "clean_feed" },
    });
    expect(composeHudSurface(input)).toMatchObject({
      status: "rendered",
      reason: "source_not_required",
      sourceVisible: false,
      hudVisible: true,
      outputTarget: "clean_feed",
    });
  });

  it.each([
    ["missing", fixture({ frame: null }), "source_missing"],
    ["stale", fixture({ atMs: 201 }), "source_stale"],
    ["epoch mismatch", fixture({ frame: { ...fixture().frame!, producerEpoch: "epoch-b" } }), "source_identity_mismatch"],
    ["permission revoked", fixture({ binding: { ...fixture().binding, permission: "revoked" } }), "source_permission_denied"],
  ] as const)("fails closed when a required source is %s", (_label, input, reason) => {
    expect(composeHudSurface(input)).toMatchObject({
      status: "blanked",
      reason,
      sourceVisible: false,
      hudVisible: false,
    });
  });

  it("removes only the HUD layer for manual blanking over a fresh source", () => {
    expect(composeHudSurface(fixture({ controls: { manualBlank: true, emergencyStop: false } }))).toMatchObject({
      status: "degraded",
      reason: "manual_blank",
      sourceVisible: true,
      hudVisible: false,
      visibleLayers: ["source"],
    });
  });

  it("releases all visual layers for emergency stop", () => {
    expect(composeHudSurface(fixture({ controls: { manualBlank: false, emergencyStop: true } }))).toMatchObject({
      status: "blanked",
      reason: "emergency_stop",
      sourceVisible: false,
      hudVisible: false,
      visibleLayers: [],
    });
  });

  it("binds output dimensions, crop, and device-pixel ratio into viewport identity", () => {
    const baseline = composeHudSurface(fixture());
    const resized = composeHudSurface(fixture({
      viewport: {
        ...fixture().viewport,
        outputWidth: 1920,
        outputHeight: 1080,
        devicePixelRatio: 2,
        crop: { xNorm: 0.1, yNorm: 0.1, widthNorm: 0.8, heightNorm: 0.8 },
      },
    }));

    expect(resized.viewportHash).not.toBe(baseline.viewportHash);
    expect(resized.causalHash).not.toBe(baseline.causalHash);
  });
});
