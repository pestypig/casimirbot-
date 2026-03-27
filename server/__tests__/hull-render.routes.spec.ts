import express from "express";
import { createHash } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hullRenderRouter } from "../routes/hull-render";
import { getGlobalPipelineState, setGlobalPipelineState } from "../energy-pipeline";
import {
  HULL_CANONICAL_GAMMA_OFFDIAGONAL_CHANNELS,
  HULL_CANONICAL_REQUIRED_CHANNELS_BASE,
  HULL_RENDER_CERTIFICATE_SCHEMA_VERSION,
  HULL_SCIENTIFIC_ATLAS_PANES,
  type HullScientificAtlasSidecarV1,
  type HullRenderCertificateV1,
} from "../../shared/hull-render-contract";

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
      a.localeCompare(b),
    );
    return `{${entries
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableStringify(entry)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

const buildValidRenderCertificate = (
  view:
    | "diagnostic-quad"
    | "paper-rho"
    | "transport-3p1"
    | "york-time-3p1"
    | "york-surface-3p1"
    | "shift-shell-3p1"
    | "full-atlas" = "diagnostic-quad",
): HullRenderCertificateV1 => {
  const channel_hashes: Record<string, string> = {};
  const requiredChannels = [
    ...HULL_CANONICAL_REQUIRED_CHANNELS_BASE,
    ...HULL_CANONICAL_GAMMA_OFFDIAGONAL_CHANNELS,
    "hull_sdf",
    "tile_support_mask",
    "region_class",
  ];
  for (const channelId of requiredChannels) {
    channel_hashes[channelId] = `h-${channelId}`;
  }
  const certificateBody = {
    certificate_schema_version: HULL_RENDER_CERTIFICATE_SCHEMA_VERSION,
    metric_ref_hash: null,
    channel_hashes,
    support_mask_hash: "h-support",
    chart: null,
    observer: "eulerian_n",
    theta_definition: "theta=-trK",
    kij_sign_convention: "K_ij=-1/2*L_n(gamma_ij)",
    unit_system: "SI",
    camera: { pose: "test_pose", proj: "test_proj" },
    render: {
      view,
      integrator: "christoffel-rk4",
      steps: 0,
      field_key:
        view === "york-time-3p1" || view === "york-surface-3p1"
          ? "theta"
          : view === "shift-shell-3p1"
            ? "beta_x"
          : null,
      slice_plane:
        view === "york-time-3p1" ||
        view === "york-surface-3p1" ||
        view === "shift-shell-3p1"
          ? "x-z-midplane"
          : null,
      normalization:
        view === "york-time-3p1" ||
        view === "york-surface-3p1" ||
        view === "shift-shell-3p1"
          ? "symmetric-about-zero"
          : null,
      surface_height: view === "york-surface-3p1" ? "theta" : null,
      support_overlay: view === "shift-shell-3p1" ? "hull_sdf+tile_support_mask" : null,
      vector_context: view === "shift-shell-3p1" ? "|beta|" : null,
    },
    diagnostics: {
      null_residual_max: 0,
      step_convergence: 1,
      bundle_spread: 0,
      constraint_rms: 0,
      support_coverage_pct: 100,
      theta_min:
        view === "york-time-3p1" || view === "york-surface-3p1" ? -1e-9 : null,
      theta_max:
        view === "york-time-3p1" || view === "york-surface-3p1" ? 1e-9 : null,
      theta_abs_max:
        view === "york-time-3p1" || view === "york-surface-3p1" ? 1e-9 : null,
      near_zero_theta:
        view === "york-time-3p1" || view === "york-surface-3p1" ? false : null,
      zero_contour_segments:
        view === "york-time-3p1" || view === "york-surface-3p1" ? 42 : null,
      display_gain:
        view === "york-time-3p1" || view === "york-surface-3p1" ? 1 : null,
      height_scale:
        view === "york-time-3p1" || view === "york-surface-3p1" ? 0.9 : null,
      sampling_choice:
        view === "york-time-3p1" || view === "york-surface-3p1"
          ? "x-z midplane"
          : null,
      peak_theta_cell:
        view === "york-time-3p1" || view === "york-surface-3p1"
          ? [24, 24, 24]
          : null,
      peak_theta_in_supported_region:
        view === "york-time-3p1" || view === "york-surface-3p1"
          ? true
          : null,
    },
    frame_hash: "h-frame",
    timestamp_ms: 1,
  };
  const certificate_hash = createHash("sha256")
    .update(stableStringify(certificateBody))
    .digest("hex");
  return {
    ...certificateBody,
    certificate_hash,
  };
};

const withRehashedCertificate = (
  certificate: HullRenderCertificateV1,
): HullRenderCertificateV1 => {
  const { certificate_hash: _ignored, ...certificateBody } = certificate;
  const nextHash = createHash("sha256")
    .update(stableStringify(certificateBody))
    .digest("hex");
  return {
    ...certificate,
    certificate_hash: nextHash,
  };
};

const buildValidScientificAtlasSidecar = (
  certificate: HullRenderCertificateV1,
): HullScientificAtlasSidecarV1 => {
  const paneIds = [...HULL_SCIENTIFIC_ATLAS_PANES];
  const paneChannelSets: HullScientificAtlasSidecarV1["pane_channel_sets"] = {
    hull: ["hull_sdf", "tile_support_mask", "region_class"],
    adm: [
      "alpha",
      "beta_x",
      "beta_y",
      "beta_z",
      "gamma_xx",
      "gamma_xy",
      "gamma_xz",
      "gamma_yy",
      "gamma_yz",
      "gamma_zz",
      "K_xx",
      "K_xy",
      "K_xz",
      "K_yy",
      "K_yz",
      "K_zz",
      "K_trace",
    ],
    derived: [
      "theta",
      "rho",
      "H_constraint",
      "M_constraint_x",
      "M_constraint_y",
      "M_constraint_z",
    ],
    causal: ["alpha", "beta_z", "hull_sdf", "tile_support_mask", "region_class"],
    optical: [
      "alpha",
      "beta_x",
      "beta_y",
      "beta_z",
      "gamma_xx",
      "gamma_xy",
      "gamma_xz",
      "gamma_yy",
      "gamma_yz",
      "gamma_zz",
      "theta",
      "rho",
    ],
  };
  const paneStatus: HullScientificAtlasSidecarV1["pane_status"] = {
    hull: "ok",
    adm: "ok",
    derived: "ok",
    causal: "ok",
    optical: "ok",
  };
  const paneMeta = {} as HullScientificAtlasSidecarV1["pane_meta"];
  for (const paneId of paneIds) {
    const channels = paneChannelSets[paneId];
    const channel_hashes: Record<string, string> = {};
    for (const channelId of channels) {
      channel_hashes[channelId] = `h-${channelId}`;
    }
    paneMeta[paneId] = {
      status: "ok",
      metric_ref_hash: certificate.metric_ref_hash,
      chart: certificate.chart,
      observer: certificate.observer,
      theta_definition: certificate.theta_definition,
      kij_sign_convention: certificate.kij_sign_convention,
      unit_system: certificate.unit_system,
      timestamp_ms: certificate.timestamp_ms,
      channels,
      channel_hashes,
      integrator:
        paneId === "optical"
          ? certificate.render.integrator
          : paneId === "causal"
            ? "metric-3+1-causal-proxy"
            : null,
      geodesic_mode:
        paneId === "optical" || paneId === "causal"
          ? "full-3+1-christoffel"
          : null,
    };
  }
  return {
    atlas_view: "full-atlas",
    certificate_schema_version: certificate.certificate_schema_version,
    certificate_hash: certificate.certificate_hash,
    metric_ref_hash: certificate.metric_ref_hash,
    pane_ids: paneIds,
    pane_status: paneStatus,
    pane_channel_sets: paneChannelSets,
    pane_meta: paneMeta,
    chart: certificate.chart,
    observer: certificate.observer,
    theta_definition: certificate.theta_definition,
    kij_sign_convention: certificate.kij_sign_convention,
    unit_system: certificate.unit_system,
    timestamp_ms: certificate.timestamp_ms,
  };
};

const buildResearchProxyFrame = (
  certificate: HullRenderCertificateV1,
  scientificAtlas?: HullScientificAtlasSidecarV1,
) => ({
  version: 1 as const,
  ok: true,
  backend: "proxy" as const,
  imageMime: "image/png" as const,
  imageDataUrl:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
  width: 640,
  height: 360,
  deterministicSeed: 1,
  renderMs: 1,
  diagnostics: {
    note: `optix_cuda_research_render_${certificate.render.view}`,
    consistency: "ok",
    geodesicMode: "full-3+1-christoffel",
    scientificTier: "research-grade" as const,
  },
  attachments: [
    {
      kind: "depth-linear-m-f32le" as const,
      width: 640,
      height: 360,
      encoding: "base64" as const,
      dataBase64: "AQEBAQ==",
    },
    {
      kind: "shell-mask-u8" as const,
      width: 640,
      height: 360,
      encoding: "base64" as const,
      dataBase64: "/////w==",
    },
  ],
  renderCertificate: certificate,
  scientificAtlas,
  provenance: {
    source: "optix/cuda.research",
    timestampMs: Date.now(),
    researchGrade: true,
    scientificTier: "research-grade" as const,
  },
});

describe("hull-render router", () => {
  const prevPipelineState = getGlobalPipelineState();
  const prevFrame = process.env.MIS_RENDER_SERVICE_FRAME_URL;
  const prevBase = process.env.MIS_RENDER_SERVICE_URL;
  const prevBackend = process.env.MIS_RENDER_BACKEND;
  const prevStrict = process.env.MIS_RENDER_PROXY_STRICT;
  const prevRequireScientificFrame =
    process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME;
  const prevRequireIntegral = process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL;
  const prevProvenancePrefix =
    process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX;
  const prevAllowConfiguredFallback =
    process.env.MIS_RENDER_ALLOW_CONFIGURED_FALLBACK;
  const prevAllowLegacyGenericEndpoint =
    process.env.MIS_RENDER_ALLOW_LEGACY_GENERIC_ENDPOINT;
  const prevOptixUrl = process.env.OPTIX_RENDER_SERVICE_URL;
  const prevOptixFrame = process.env.OPTIX_RENDER_SERVICE_FRAME_URL;
  const prevOptixStatus = process.env.OPTIX_RENDER_SERVICE_STATUS_URL;
  const prevUnityUrl = process.env.UNITY_RENDER_SERVICE_URL;
  const prevUnityFrame = process.env.UNITY_RENDER_SERVICE_FRAME_URL;
  const prevUnityStatus = process.env.UNITY_RENDER_SERVICE_STATUS_URL;
  const prevDisableDefaultEndpoint = process.env.MIS_RENDER_DISABLE_DEFAULT_ENDPOINT;
  const prevAutoStartOptix = process.env.MIS_RENDER_AUTOSTART_OPTIX;

  beforeEach(() => {
    setGlobalPipelineState({
      ...(getGlobalPipelineState() as any),
      congruentSolve: {
        pass: true,
        policyMarginPass: true,
        computedMarginPass: true,
        applicabilityPass: true,
        metricPass: true,
        semanticPass: true,
        strictMode: true,
        failReasons: [],
      },
    } as any);
    delete process.env.MIS_RENDER_SERVICE_FRAME_URL;
    delete process.env.MIS_RENDER_SERVICE_URL;
    delete process.env.MIS_RENDER_BACKEND;
    delete process.env.MIS_RENDER_PROXY_STRICT;
    delete process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME;
    delete process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL;
    delete process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX;
    delete process.env.MIS_RENDER_ALLOW_CONFIGURED_FALLBACK;
    delete process.env.MIS_RENDER_ALLOW_LEGACY_GENERIC_ENDPOINT;
    delete process.env.OPTIX_RENDER_SERVICE_URL;
    delete process.env.OPTIX_RENDER_SERVICE_FRAME_URL;
    delete process.env.OPTIX_RENDER_SERVICE_STATUS_URL;
    delete process.env.UNITY_RENDER_SERVICE_URL;
    delete process.env.UNITY_RENDER_SERVICE_FRAME_URL;
    delete process.env.UNITY_RENDER_SERVICE_STATUS_URL;
    process.env.MIS_RENDER_DISABLE_DEFAULT_ENDPOINT = "1";
    process.env.MIS_RENDER_AUTOSTART_OPTIX = "0";
  });

  afterEach(() => {
    setGlobalPipelineState(prevPipelineState);
    if (prevFrame === undefined) delete process.env.MIS_RENDER_SERVICE_FRAME_URL;
    else process.env.MIS_RENDER_SERVICE_FRAME_URL = prevFrame;
    if (prevBase === undefined) delete process.env.MIS_RENDER_SERVICE_URL;
    else process.env.MIS_RENDER_SERVICE_URL = prevBase;
    if (prevBackend === undefined) delete process.env.MIS_RENDER_BACKEND;
    else process.env.MIS_RENDER_BACKEND = prevBackend;
    if (prevStrict === undefined) delete process.env.MIS_RENDER_PROXY_STRICT;
    else process.env.MIS_RENDER_PROXY_STRICT = prevStrict;
    if (prevRequireScientificFrame === undefined) {
      delete process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME;
    } else {
      process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME = prevRequireScientificFrame;
    }
    if (prevRequireIntegral === undefined) delete process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL;
    else process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = prevRequireIntegral;
    if (prevProvenancePrefix === undefined) {
      delete process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX;
    } else {
      process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX = prevProvenancePrefix;
    }
    if (prevAllowConfiguredFallback === undefined) {
      delete process.env.MIS_RENDER_ALLOW_CONFIGURED_FALLBACK;
    } else {
      process.env.MIS_RENDER_ALLOW_CONFIGURED_FALLBACK = prevAllowConfiguredFallback;
    }
    if (prevAllowLegacyGenericEndpoint === undefined) {
      delete process.env.MIS_RENDER_ALLOW_LEGACY_GENERIC_ENDPOINT;
    } else {
      process.env.MIS_RENDER_ALLOW_LEGACY_GENERIC_ENDPOINT = prevAllowLegacyGenericEndpoint;
    }
    if (prevOptixUrl === undefined) delete process.env.OPTIX_RENDER_SERVICE_URL;
    else process.env.OPTIX_RENDER_SERVICE_URL = prevOptixUrl;
    if (prevOptixFrame === undefined) delete process.env.OPTIX_RENDER_SERVICE_FRAME_URL;
    else process.env.OPTIX_RENDER_SERVICE_FRAME_URL = prevOptixFrame;
    if (prevOptixStatus === undefined) delete process.env.OPTIX_RENDER_SERVICE_STATUS_URL;
    else process.env.OPTIX_RENDER_SERVICE_STATUS_URL = prevOptixStatus;
    if (prevUnityUrl === undefined) delete process.env.UNITY_RENDER_SERVICE_URL;
    else process.env.UNITY_RENDER_SERVICE_URL = prevUnityUrl;
    if (prevUnityFrame === undefined) delete process.env.UNITY_RENDER_SERVICE_FRAME_URL;
    else process.env.UNITY_RENDER_SERVICE_FRAME_URL = prevUnityFrame;
    if (prevUnityStatus === undefined) delete process.env.UNITY_RENDER_SERVICE_STATUS_URL;
    else process.env.UNITY_RENDER_SERVICE_STATUS_URL = prevUnityStatus;
    if (prevDisableDefaultEndpoint === undefined) {
      delete process.env.MIS_RENDER_DISABLE_DEFAULT_ENDPOINT;
    } else {
      process.env.MIS_RENDER_DISABLE_DEFAULT_ENDPOINT = prevDisableDefaultEndpoint;
    }
    if (prevAutoStartOptix === undefined) {
      delete process.env.MIS_RENDER_AUTOSTART_OPTIX;
    } else {
      process.env.MIS_RENDER_AUTOSTART_OPTIX = prevAutoStartOptix;
    }
  });

  it("fails closed when congruent NHM2 full-solve gate is requested but not passed", async () => {
    setGlobalPipelineState({
      ...(getGlobalPipelineState() as any),
      congruentSolve: null,
    } as any);
    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    const res = await request(app)
      .post("/api/helix/hull-render/frame")
      .send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireCongruentNhm2FullSolve: true,
        },
      });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe("nhm2_congruent_full_solve_required");
    expect(res.body.congruentSolve?.pass).toBe(false);
  });

  it("passes when congruent NHM2 full-solve gate is requested and current solve is PASS", async () => {
    setGlobalPipelineState({
      ...(getGlobalPipelineState() as any),
      congruentSolve: {
        pass: true,
        policyMarginPass: true,
        computedMarginPass: true,
        applicabilityPass: true,
        metricPass: true,
        semanticPass: true,
        strictMode: true,
        failReasons: [],
      },
    } as any);
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: buildValidRenderCertificate(),
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireIntegralSignal: true,
            requireCongruentNhm2FullSolve: true,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.backend).toBe("proxy");
      expect(String(res.body.provenance?.source ?? "")).toMatch(/^optix\/cuda/i);
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("reports status", async () => {
    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    const res = await request(app).get("/api/helix/hull-render/status");
    expect(res.status).toBe(200);
    expect(res.body.kind).toBe("hull-render-status");
    expect(res.body.backendHint).toBe("mis-path-tracing");
    expect(typeof res.body.remoteConfigured).toBe("boolean");
    expect(typeof res.body.scientificLaneReady).toBe("boolean");
    expect(typeof res.body.fallbackLaneActive).toBe("boolean");
    expect(typeof res.body.requireIntegralSignal).toBe("boolean");
  });

  it("accepts strict full-atlas when atlas sidecar is coherent", async () => {
    const certificate = buildValidRenderCertificate("full-atlas");
    const atlas = buildValidScientificAtlasSidecar(certificate);
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render_full_atlas",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: certificate,
        scientificAtlas: atlas,
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "full-atlas",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.backend).toBe("proxy");
      expect(res.body.scientificAtlas?.atlas_view).toBe("full-atlas");
      expect(res.body.scientificAtlas?.certificate_hash).toBe(certificate.certificate_hash);
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("accepts strict york-time-3p1 with certified theta metadata", async () => {
    const certificate = buildValidRenderCertificate("york-time-3p1");
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render_york_time_3p1",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: certificate,
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "york-time-3p1",
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.backend).toBe("proxy");
      expect(res.body.renderCertificate?.render?.view).toBe("york-time-3p1");
      expect(res.body.renderCertificate?.render?.field_key).toBe("theta");
      expect(res.body.renderCertificate?.render?.slice_plane).toBe("x-z-midplane");
      expect(res.body.renderCertificate?.render?.normalization).toBe("symmetric-about-zero");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("keeps full-atlas and york-time-3p1 identity fields aligned for the same snapshot payload", async () => {
    const fullAtlasCert = buildValidRenderCertificate("full-atlas");
    const yorkCert = buildValidRenderCertificate("york-time-3p1");
    const fullAtlasSidecar = buildValidScientificAtlasSidecar(fullAtlasCert);
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (req, res) => {
      const requestedView = String(req.body?.scienceLane?.renderView ?? "diagnostic-quad");
      const base = {
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: `optix_cuda_research_render_${requestedView}`,
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      };
      if (requestedView === "full-atlas") {
        return res.json({
          ...base,
          renderCertificate: fullAtlasCert,
          scientificAtlas: fullAtlasSidecar,
        });
      }
      return res.json({
        ...base,
        renderCertificate: yorkCert,
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const fullAtlasRes = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "full-atlas",
          },
        })
        .expect(200);

      const yorkRes = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "york-time-3p1",
          },
        })
        .expect(200);

      expect(fullAtlasRes.body.renderCertificate?.metric_ref_hash).toBe(
        yorkRes.body.renderCertificate?.metric_ref_hash,
      );
      expect(fullAtlasRes.body.renderCertificate?.chart).toBe(
        yorkRes.body.renderCertificate?.chart,
      );
      expect(fullAtlasRes.body.renderCertificate?.observer).toBe(
        yorkRes.body.renderCertificate?.observer,
      );
      expect(fullAtlasRes.body.renderCertificate?.theta_definition).toBe(
        yorkRes.body.renderCertificate?.theta_definition,
      );
      expect(fullAtlasRes.body.renderCertificate?.kij_sign_convention).toBe(
        yorkRes.body.renderCertificate?.kij_sign_convention,
      );
      expect(fullAtlasRes.body.renderCertificate?.unit_system).toBe(
        yorkRes.body.renderCertificate?.unit_system,
      );
      expect(fullAtlasRes.body.renderCertificate?.timestamp_ms).toBe(
        yorkRes.body.renderCertificate?.timestamp_ms,
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-time-3p1 when remote reports missing theta channel", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.status(422).json({
        error: "scientific_york_theta_missing",
        message: "york-time-3p1 requires canonical theta channel in metric volume",
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "york-time-3p1",
          },
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain("scientific_york_theta_missing");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-time-3p1 when certificate field_key is not theta", async () => {
    const baseCertificate = buildValidRenderCertificate("york-time-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        field_key: "rho",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-time-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_field_key_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-time-3p1 when certificate slice_plane is not x-z-midplane", async () => {
    const baseCertificate = buildValidRenderCertificate("york-time-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        slice_plane: "x-y-midplane",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-time-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_slice_plane_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-time-3p1 when certificate normalization is not symmetric-about-zero", async () => {
    const baseCertificate = buildValidRenderCertificate("york-time-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        normalization: "positive-only",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-time-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_normalization_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-time-3p1 when York diagnostics are missing", async () => {
    const baseCertificate = buildValidRenderCertificate("york-time-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      diagnostics: {
        ...baseCertificate.diagnostics,
        theta_min: null,
        theta_max: null,
        theta_abs_max: null,
        zero_contour_segments: null,
        display_gain: null,
        height_scale: null,
        near_zero_theta: null,
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-time-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_diagnostics_missing",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-time-3p1 when sampling_choice is not x-z midplane", async () => {
    const baseCertificate = buildValidRenderCertificate("york-time-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      diagnostics: {
        ...baseCertificate.diagnostics,
        sampling_choice: "x-z max-|value| projection",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-time-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_sampling_choice_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("accepts strict york-surface-3p1 with certified theta metadata", async () => {
    const certificate = buildValidRenderCertificate("york-surface-3p1");
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-surface-3p1",
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.error).toBeUndefined();
      expect(res.body.renderCertificate?.render?.view).toBe("york-surface-3p1");
      expect(res.body.renderCertificate?.render?.field_key).toBe("theta");
      expect(res.body.renderCertificate?.render?.slice_plane).toBe("x-z-midplane");
      expect(res.body.renderCertificate?.render?.normalization).toBe(
        "symmetric-about-zero",
      );
      expect(res.body.renderCertificate?.render?.surface_height).toBe("theta");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-surface-3p1 when certificate field_key is not theta", async () => {
    const baseCertificate = buildValidRenderCertificate("york-surface-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        field_key: "rho",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-surface-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_surface_field_key_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-surface-3p1 when certificate slice_plane is not x-z-midplane", async () => {
    const baseCertificate = buildValidRenderCertificate("york-surface-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        slice_plane: "x-y-midplane",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-surface-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_surface_slice_plane_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-surface-3p1 when certificate normalization is not symmetric-about-zero", async () => {
    const baseCertificate = buildValidRenderCertificate("york-surface-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        normalization: "positive-only",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-surface-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_surface_normalization_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-surface-3p1 when York diagnostics are missing", async () => {
    const baseCertificate = buildValidRenderCertificate("york-surface-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      diagnostics: {
        ...baseCertificate.diagnostics,
        theta_min: null,
        theta_max: null,
        theta_abs_max: null,
        zero_contour_segments: null,
        display_gain: null,
        height_scale: null,
        near_zero_theta: null,
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-surface-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_surface_diagnostics_missing",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-surface-3p1 when sampling_choice is not x-z midplane", async () => {
    const baseCertificate = buildValidRenderCertificate("york-surface-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      diagnostics: {
        ...baseCertificate.diagnostics,
        sampling_choice: "x-z max-|value| projection",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-surface-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_surface_sampling_choice_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict york-surface-3p1 when certificate surface_height is not theta", async () => {
    const baseCertificate = buildValidRenderCertificate("york-surface-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        surface_height: "rho",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "york-surface-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_york_surface_height_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("accepts strict shift-shell-3p1 with certified beta_x shell metadata", async () => {
    const certificate = buildValidRenderCertificate("shift-shell-3p1");
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1, chart: "comoving_cartesian" },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          requireCanonicalTensorVolume: true,
          requireHullSupportChannels: true,
          renderView: "shift-shell-3p1",
        },
        metricVolumeRef: {
          kind: "gr-evolve-brick",
          url: "http://example.test/gr-brick",
          hash: certificate.metric_ref_hash,
          chart: certificate.chart,
          updatedAt: certificate.timestamp_ms,
        },
      });

      expect(res.status).toBe(200);
      expect(res.body.error).toBeUndefined();
      expect(res.body.renderCertificate?.render?.view).toBe("shift-shell-3p1");
      expect(res.body.renderCertificate?.render?.field_key).toBe("beta_x");
      expect(res.body.renderCertificate?.render?.slice_plane).toBe("x-z-midplane");
      expect(res.body.renderCertificate?.render?.normalization).toBe(
        "symmetric-about-zero",
      );
      expect(res.body.renderCertificate?.render?.support_overlay).toBe(
        "hull_sdf+tile_support_mask",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict shift-shell-3p1 when beta_x channel hash is missing", async () => {
    const baseCertificate = buildValidRenderCertificate("shift-shell-3p1");
    const nextChannelHashes = { ...baseCertificate.channel_hashes };
    delete nextChannelHashes.beta_x;
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      channel_hashes: nextChannelHashes,
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1, chart: "comoving_cartesian" },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          requireCanonicalTensorVolume: true,
          requireHullSupportChannels: true,
          renderView: "shift-shell-3p1",
        },
        metricVolumeRef: {
          kind: "gr-evolve-brick",
          url: "http://example.test/gr-brick",
          hash: certificate.metric_ref_hash,
          chart: certificate.chart,
          updatedAt: certificate.timestamp_ms,
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_missing_channel_hashes",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict shift-shell-3p1 when certificate field_key is not beta_x", async () => {
    const baseCertificate = buildValidRenderCertificate("shift-shell-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        field_key: "theta",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "shift-shell-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_shift_shell_field_key_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict shift-shell-3p1 when certificate slice_plane is not x-z-midplane", async () => {
    const baseCertificate = buildValidRenderCertificate("shift-shell-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        slice_plane: "x-y-midplane",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "shift-shell-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_shift_shell_slice_plane_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict shift-shell-3p1 when certificate normalization is not symmetric-about-zero", async () => {
    const baseCertificate = buildValidRenderCertificate("shift-shell-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        normalization: "positive-only",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "shift-shell-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_shift_shell_normalization_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict shift-shell-3p1 when support_overlay metadata drifts", async () => {
    const baseCertificate = buildValidRenderCertificate("shift-shell-3p1");
    const certificate = withRehashedCertificate({
      ...baseCertificate,
      render: {
        ...baseCertificate.render,
        support_overlay: "hull_sdf",
      },
    });
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json(buildResearchProxyFrame(certificate));
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app).post("/api/helix/hull-render/frame").send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        scienceLane: {
          requireScientificFrame: true,
          requireIntegralSignal: true,
          renderView: "shift-shell-3p1",
        },
      });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_render_certificate_shift_shell_support_overlay_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict full-atlas when atlas sidecar certificate is mismatched", async () => {
    const certificate = buildValidRenderCertificate("full-atlas");
    const atlas = buildValidScientificAtlasSidecar(certificate);
    atlas.certificate_hash = "atlas-hash-mismatch";
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render_full_atlas",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: certificate,
        scientificAtlas: atlas,
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "full-atlas",
          },
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain("scientific_atlas_certificate_mismatch");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict full-atlas when a required pane is missing", async () => {
    const certificate = buildValidRenderCertificate("full-atlas");
    const atlas = buildValidScientificAtlasSidecar(certificate);
    atlas.pane_ids = atlas.pane_ids.filter((paneId) => paneId !== "optical");
    atlas.pane_status.optical = "missing";
    delete (atlas.pane_meta as Record<string, unknown>).optical;
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render_full_atlas",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: certificate,
        scientificAtlas: atlas,
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "full-atlas",
          },
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain("scientific_atlas_pane_missing");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails strict full-atlas when pane channel hash is non-empty but mismatched", async () => {
    const certificate = buildValidRenderCertificate("full-atlas");
    const atlas = buildValidScientificAtlasSidecar(certificate);
    atlas.pane_meta.derived.channel_hashes.theta = "drifted-hash";
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render_full_atlas",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: certificate,
        scientificAtlas: atlas,
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireScientificFrame: true,
            requireIntegralSignal: true,
            renderView: "full-atlas",
          },
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain("scientific_atlas_channel_contract_missing");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails closed by default when remote scientific endpoint is not configured", async () => {
    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    const res = await request(app)
      .post("/api/helix/hull-render/frame")
      .send({
        version: 1,
        width: 640,
        height: 360,
        skyboxMode: "geodesic",
        solve: { beta: 0.03, alpha: 1, sigma: 6, R: 1.2 },
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("mis_proxy_unconfigured");
    expect(String(res.body.message ?? "")).toContain("scientific frame requested");
  });

  it("fails closed with strict proxy when remote endpoint is down", async () => {
    process.env.MIS_RENDER_SERVICE_FRAME_URL =
      "http://127.0.0.1:1/api/helix/hull-render/frame";
    process.env.MIS_RENDER_PROXY_STRICT = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    const res = await request(app)
      .post("/api/helix/hull-render/frame")
      .send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("mis_proxy_failed");
  });

  it("in auto mode, fails over endpoint order to OptiX when generic endpoint is stale", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.get("/api/helix/hull-render/status", (_req, res) => {
      res.json({
        kind: "hull-optix-service-status",
        runtime: {
          readyForUnity: true,
          readyForOptix: true,
          readyForScientificLane: true,
          allowSynthetic: false,
        },
      });
    });
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: buildValidRenderCertificate(),
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;

    process.env.MIS_RENDER_SERVICE_URL = "http://127.0.0.1:1";
    process.env.OPTIX_RENDER_SERVICE_URL = `http://127.0.0.1:${port}`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";
    process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX = "optix/cuda";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const status = await request(app).get("/api/helix/hull-render/status");
      expect(status.status).toBe(200);
      expect(status.body.backendMode).toBe("optix");
      expect(status.body.remoteEndpoint).toBe(
        `http://127.0.0.1:${port}/api/helix/hull-render/frame`,
      );
      expect(status.body.remoteStatus?.reachable).toBe(true);
      expect(status.body.scientificLaneReady).toBe(true);
      expect(status.body.fallbackLaneActive).toBe(false);

      const frame = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: { requireIntegralSignal: true },
        });
      expect(frame.status).toBe(200);
      expect(frame.body.backend).toBe("proxy");
      expect(String(frame.body.provenance?.source ?? "")).toMatch(/^optix\/cuda/i);
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("does not silently fall back to legacy generic endpoint in optix mode", async () => {
    const generic = express();
    generic.use(express.json({ limit: "2mb" }));
    generic.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: { note: "legacy_generic_service" },
        provenance: { source: "casimirbot.remote.mis.proxy", timestampMs: Date.now() },
      });
    });
    const genericServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = generic.listen(0, "127.0.0.1", () => resolve(server));
    });
    const genericAddress = genericServer.address();
    const genericPort =
      typeof genericAddress === "object" && genericAddress ? genericAddress.port : 0;

    process.env.MIS_RENDER_BACKEND = "optix";
    process.env.OPTIX_RENDER_SERVICE_URL = "http://127.0.0.1:1";
    process.env.MIS_RENDER_SERVICE_URL = `http://127.0.0.1:${genericPort}`;

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const status = await request(app).get("/api/helix/hull-render/status");
      expect(status.status).toBe(200);
      expect(status.body.backendMode).toBe("optix");
      expect(Array.isArray(status.body.endpointCandidates)).toBe(true);
      expect(status.body.endpointCandidates).toHaveLength(1);
      expect(status.body.endpointCandidates[0]?.backend).toBe("optix");

      const frame = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        });
      expect(frame.status).toBe(502);
      expect(frame.body.error).toBe("mis_proxy_failed");
    } finally {
      await new Promise<void>((resolve, reject) => {
        genericServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("can opt-in to legacy generic endpoint fallback in optix mode", async () => {
    const generic = express();
    generic.use(express.json({ limit: "2mb" }));
    generic.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: { note: "legacy_generic_service" },
        provenance: { source: "casimirbot.remote.mis.proxy", timestampMs: Date.now() },
      });
    });
    const genericServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = generic.listen(0, "127.0.0.1", () => resolve(server));
    });
    const genericAddress = genericServer.address();
    const genericPort =
      typeof genericAddress === "object" && genericAddress ? genericAddress.port : 0;

    process.env.MIS_RENDER_BACKEND = "optix";
    process.env.OPTIX_RENDER_SERVICE_URL = "http://127.0.0.1:1";
    process.env.MIS_RENDER_SERVICE_URL = `http://127.0.0.1:${genericPort}`;
    process.env.MIS_RENDER_ALLOW_LEGACY_GENERIC_ENDPOINT = "1";
    process.env.MIS_RENDER_PROXY_STRICT = "0";
    process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME = "0";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const status = await request(app).get("/api/helix/hull-render/status");
      expect(status.status).toBe(200);
      expect(status.body.backendMode).toBe("optix");
      expect(status.body.allowLegacyGenericEndpoint).toBe(true);
      expect(Array.isArray(status.body.endpointCandidates)).toBe(true);
      expect(status.body.endpointCandidates).toHaveLength(2);
      expect(status.body.endpointCandidates[1]?.backend).toBe("generic");

      const frame = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        });
      expect(frame.status).toBe(200);
      expect(frame.body.backend).toBe("proxy");
    } finally {
      await new Promise<void>((resolve, reject) => {
        genericServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("in auto mode, does not drop to legacy generic when canonical backend is configured", async () => {
    const generic = express();
    generic.use(express.json({ limit: "2mb" }));
    generic.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: { note: "legacy_generic_service" },
        provenance: { source: "casimirbot.remote.mis.proxy", timestampMs: Date.now() },
      });
    });
    const genericServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = generic.listen(0, "127.0.0.1", () => resolve(server));
    });
    const genericAddress = genericServer.address();
    const genericPort =
      typeof genericAddress === "object" && genericAddress ? genericAddress.port : 0;

    process.env.OPTIX_RENDER_SERVICE_URL = "http://127.0.0.1:1";
    process.env.MIS_RENDER_SERVICE_URL = `http://127.0.0.1:${genericPort}`;

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const status = await request(app).get("/api/helix/hull-render/status");
      expect(status.status).toBe(200);
      expect(status.body.backendMode).toBe("optix");
      expect(Array.isArray(status.body.endpointCandidates)).toBe(true);
      expect(status.body.endpointCandidates).toHaveLength(1);
      expect(status.body.endpointCandidates[0]?.backend).toBe("optix");

      const frame = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        });
      expect(frame.status).toBe(502);
      expect(frame.body.error).toBe("mis_proxy_failed");
    } finally {
      await new Promise<void>((resolve, reject) => {
        genericServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("does not silently fall back to local deterministic when a configured remote endpoint fails", async () => {
    process.env.MIS_RENDER_SERVICE_URL = "http://127.0.0.1:1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    const res = await request(app)
      .post("/api/helix/hull-render/frame")
      .send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("mis_proxy_failed");
  });

  it("fails closed in strict mode when no remote endpoint is configured", async () => {
    process.env.MIS_RENDER_PROXY_STRICT = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    const res = await request(app)
      .post("/api/helix/hull-render/frame")
      .send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
      });

    expect(res.status).toBe(502);
    expect(res.body.error).toBe("mis_proxy_unconfigured");
  });

  it("can opt-in to configured-endpoint local fallback via env override", async () => {
    process.env.MIS_RENDER_BACKEND = "auto";
    process.env.MIS_RENDER_SERVICE_URL = "http://127.0.0.1:1";
    process.env.MIS_RENDER_PROXY_STRICT = "0";
    process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME = "0";
    process.env.MIS_RENDER_ALLOW_CONFIGURED_FALLBACK = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    const res = await request(app)
      .post("/api/helix/hull-render/frame")
      .send({
        version: 1,
        width: 640,
        height: 360,
        solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
      });

    expect(res.status).toBe(200);
    expect(res.body.backend).toBe("local-deterministic");
  });

  it("fails closed when strict proxy receives non-scientific remote frame", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "local-deterministic",
        imageMime: "image/png",
        imageDataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: { note: "synthetic_fallback_for_service_debug" },
        provenance: { source: "raytracingmis.synthetic.fallback", timestampMs: Date.now() },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain("remote_mis_non_scientific_response");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails closed when strict scientific lane provenance prefix mismatches", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        provenance: {
          source: "raytracingmis.unity.batch",
          timestampMs: Date.now(),
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";
    process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX = "optix/cuda";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: { requireIntegralSignal: true },
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_provenance_source_prefix_mismatch",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("passes strict scientific lane when provenance prefix matches and attachments are present", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "research-grade",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        renderCertificate: buildValidRenderCertificate(),
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";
    process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX = "optix/cuda";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: { requireIntegralSignal: true },
        });

      expect(res.status).toBe(200);
      expect(res.body.version).toBe(1);
      expect(res.body.ok).toBe(true);
      expect(res.body.backend).toBe("proxy");
      expect(String(res.body.provenance?.source ?? "")).toMatch(/^optix\/cuda/i);
      expect(Array.isArray(res.body.attachments)).toBe(true);
      expect(res.body.attachments.length).toBe(2);
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails closed when scientific frame is requested but remote frame is scaffold tier", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "raytracingmis_unity_batch",
          consistency: "ok",
          geodesicMode: "full-3+1-christoffel",
          scientificTier: "scaffold",
        },
        attachments: [
          {
            kind: "depth-linear-m-f32le",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "AQEBAQ==",
          },
          {
            kind: "shell-mask-u8",
            width: 640,
            height: 360,
            encoding: "base64",
            dataBase64: "/////w==",
          },
        ],
        provenance: {
          source: "optix/cuda.batch",
          timestampMs: Date.now(),
          researchGrade: false,
          scientificTier: "scaffold",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: {
            requireIntegralSignal: true,
            requireScientificFrame: true,
          },
        });

      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_non_research_grade_frame",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("fails closed when strict scientific lane is missing integral attachments", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "optix_cuda_research_render",
          geodesicMode: "full-3+1-christoffel",
          consistency: "ok",
          scientificTier: "research-grade",
        },
        provenance: {
          source: "optix/cuda.research",
          timestampMs: Date.now(),
          researchGrade: true,
          scientificTier: "research-grade",
        },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "1";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
          scienceLane: { requireIntegralSignal: true },
        });
      expect(res.status).toBe(502);
      expect(res.body.error).toBe("mis_proxy_failed");
      expect(String(res.body.message ?? "")).toContain(
        "remote_mis_missing_integral_signal_attachments",
      );
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  it("allows strict proxy frames without integral attachments when env gate is disabled", async () => {
    const remote = express();
    remote.use(express.json({ limit: "2mb" }));
    remote.post("/api/helix/hull-render/frame", (_req, res) => {
      res.json({
        version: 1,
        ok: true,
        backend: "proxy",
        imageMime: "image/png",
        imageDataUrl:
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO6f5VQAAAAASUVORK5CYII=",
        width: 640,
        height: 360,
        deterministicSeed: 1,
        renderMs: 1,
        diagnostics: {
          note: "raytracingmis_unity_batch",
          consistency: "ok",
        },
        renderCertificate: buildValidRenderCertificate(),
        provenance: { source: "raytracingmis.unity.batch", timestampMs: Date.now() },
      });
    });
    const remoteServer = await new Promise<import("node:http").Server>((resolve) => {
      const server = remote.listen(0, "127.0.0.1", () => resolve(server));
    });
    const remoteAddress = remoteServer.address();
    const port =
      typeof remoteAddress === "object" && remoteAddress ? remoteAddress.port : 0;
    process.env.MIS_RENDER_SERVICE_FRAME_URL = `http://127.0.0.1:${port}/api/helix/hull-render/frame`;
    process.env.MIS_RENDER_PROXY_STRICT = "1";
    process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL = "0";
    process.env.MIS_RENDER_REQUIRE_SCIENTIFIC_FRAME = "0";

    const app = express();
    app.use(express.json({ limit: "2mb" }));
    app.use("/api/helix/hull-render", hullRenderRouter);

    try {
      const res = await request(app)
        .post("/api/helix/hull-render/frame")
        .send({
          version: 1,
          width: 640,
          height: 360,
          solve: { beta: 0.02, alpha: 1, sigma: 6, R: 1.1 },
        });
      expect(res.status).toBe(200);
      expect(res.body.version).toBe(1);
      expect(res.body.ok).toBe(true);
      expect(res.body.backend).toBe("proxy");
    } finally {
      await new Promise<void>((resolve, reject) => {
        remoteServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });
});
