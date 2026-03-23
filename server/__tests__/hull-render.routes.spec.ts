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

  beforeEach(() => {
    delete process.env.MIS_RENDER_SERVICE_FRAME_URL;
    delete process.env.MIS_RENDER_SERVICE_URL;
    delete process.env.MIS_RENDER_BACKEND;
    delete process.env.MIS_RENDER_PROXY_STRICT;
    delete process.env.MIS_RENDER_REQUIRE_INTEGRAL_SIGNAL;
    delete process.env.MIS_RENDER_REQUIRED_PROVENANCE_SOURCE_PREFIX;
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
