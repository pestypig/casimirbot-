import express from "express";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { hullRenderRouter } from "../routes/hull-render";

describe("hull-render router", () => {
  const prevFrame = process.env.MIS_RENDER_SERVICE_FRAME_URL;
  const prevBase = process.env.MIS_RENDER_SERVICE_URL;
  const prevBackend = process.env.MIS_RENDER_BACKEND;
  const prevStrict = process.env.MIS_RENDER_PROXY_STRICT;
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

  beforeEach(() => {
    delete process.env.MIS_RENDER_SERVICE_FRAME_URL;
    delete process.env.MIS_RENDER_SERVICE_URL;
    delete process.env.MIS_RENDER_BACKEND;
    delete process.env.MIS_RENDER_PROXY_STRICT;
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
  });

  afterEach(() => {
    if (prevFrame === undefined) delete process.env.MIS_RENDER_SERVICE_FRAME_URL;
    else process.env.MIS_RENDER_SERVICE_FRAME_URL = prevFrame;
    if (prevBase === undefined) delete process.env.MIS_RENDER_SERVICE_URL;
    else process.env.MIS_RENDER_SERVICE_URL = prevBase;
    if (prevBackend === undefined) delete process.env.MIS_RENDER_BACKEND;
    else process.env.MIS_RENDER_BACKEND = prevBackend;
    if (prevStrict === undefined) delete process.env.MIS_RENDER_PROXY_STRICT;
    else process.env.MIS_RENDER_PROXY_STRICT = prevStrict;
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

  it("returns deterministic local PNG frame when remote is not configured", async () => {
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

    expect(res.status).toBe(200);
    expect(res.body.version).toBe(1);
    expect(res.body.ok).toBe(true);
    expect(res.body.backend).toBe("local-deterministic");
    expect(res.body.imageMime).toBe("image/png");
    expect(typeof res.body.imageDataUrl).toBe("string");
    expect(res.body.imageDataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(res.body.width).toBe(640);
    expect(res.body.height).toBe(360);
    expect(typeof res.body.renderMs).toBe("number");
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
        diagnostics: { note: "optix_cuda_scaffold_render", consistency: "ok" },
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
        provenance: { source: "optix/cuda.scaffold", timestampMs: Date.now() },
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
      expect(status.body.backendMode).toBe("auto");
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
      expect(status.body.backendMode).toBe("auto");
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
    process.env.MIS_RENDER_SERVICE_URL = "http://127.0.0.1:1";
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
        diagnostics: { note: "optix_cuda_scaffold_render", consistency: "ok" },
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
        diagnostics: { note: "optix_cuda_scaffold_render", consistency: "ok" },
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
          source: "optix/cuda.scaffold",
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
        diagnostics: { note: "raytracingmis_unity_batch" },
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
