import express from "express";
import request from "supertest";
import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";

const spawnMock = vi.fn();

vi.mock("node:child_process", () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

import { trainStatusRouter } from "../server/routes/train-status";

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(trainStatusRouter);
  return app;
};

const makeChild = () => {
  const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter };
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  return child;
};

describe("train-status routes", () => {
  beforeEach(() => {
    spawnMock.mockReset();
  });

  it("starts dataset job with voice_dataset mode metadata", async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const app = buildApp();
    const started = await request(app).post("/api/train/dataset").send({ mode: "voice_dataset" });
    expect(started.status).toBe(200);
    const jobId = started.body.jobId as string;

    child.stdout.emit("data", Buffer.from('STATS {"mode":"voice_dataset","manifestPath":"/tmp/manifest.json"}\n'));
    const job = await request(app).get(`/api/train/job/${jobId}`);

    expect(job.status).toBe(200);
    expect(job.body.metadata?.datasetMode).toBe("voice_dataset");
    expect(job.body.metadata?.mode).toBe("voice_dataset");
    expect(job.body.metadata?.manifestPath).toBe("/tmp/manifest.json");
  });

  it("records artifact refs for tts_voice_train jobs", async () => {
    const child = makeChild();
    spawnMock.mockReturnValue(child);

    const app = buildApp();
    const started = await request(app).post("/api/train/start").send({ jobType: "tts_voice_train" });
    const spawnArgs = spawnMock.mock.calls[0];
    expect(spawnArgs[2]?.env?.TRAIN_JOB_TYPE).toBe("tts_voice_train");
    expect(started.status).toBe(200);
    const jobId = started.body.jobId as string;

    child.stdout.emit("data", Buffer.from("ARTIFACT checkpoints/tts-voice.pt\n"));
    const job = await request(app).get(`/api/train/job/${jobId}`);

    expect(job.status).toBe(200);
    expect(job.body.type).toBe("tts_voice_train");
    expect(job.body.artifactRefs).toContain("checkpoints/tts-voice.pt");
  });
});
