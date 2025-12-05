import { Router } from "express";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";

const router = Router();

const defaultStatusPath = path.resolve(process.cwd(), "external", "audiocraft", "checkpoints", "train_status.json");
const statusPath = process.env.TRAIN_STATUS_PATH ? path.resolve(process.env.TRAIN_STATUS_PATH) : defaultStatusPath;
const defaultPython = process.env.TRAIN_PYTHON ?? "python";
const projectRoot = process.cwd();

type JobState = "pending" | "running" | "done" | "error";
type JobType = "dataset" | "train";

type JobInfo = {
  id: string;
  type: JobType;
  state: JobState;
  message: string;
  progress?: { current: number; total: number };
  datasetStats?: Record<string, unknown>;
  logs: string[];
  startedAt: number;
  endedAt?: number;
};

const jobs = new Map<string, JobInfo>();

router.get("/api/train/status", (req, res) => {
  try {
    if (!fs.existsSync(statusPath)) {
      return res.status(404).json({ error: "status_not_found" });
    }
    const raw = fs.readFileSync(statusPath, "utf-8");
    const parsed = JSON.parse(raw);
    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ error: "status_read_failed", message: String(error) });
  }
});

router.post("/api/train/status/reset", (req, res) => {
  try {
    if (fs.existsSync(statusPath)) {
      fs.unlinkSync(statusPath);
    }
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "reset_failed", message: String(error) });
  }
});

const runScript = (scriptPath: string, env: Record<string, string> = {}) => {
  return spawn(defaultPython, [scriptPath], {
    cwd: projectRoot,
    env: { ...process.env, ...env },
    stdio: "ignore",
    detached: true,
  });
};

router.post("/api/train/dataset", (req, res) => {
  try {
    const script = path.resolve(projectRoot, "external", "audiocraft", "scripts", "prepare_knowledge_audio.py");
    const jobId = randomUUID();
    const job: JobInfo = {
      id: jobId,
      type: "dataset",
      state: "running",
      message: "Building dataset",
      logs: [],
      startedAt: Date.now(),
      progress: { current: 0, total: 0 },
    };
    jobs.set(jobId, job);

    const child = runScript(script, {
      KNOWLEDGE_SOURCE_DIR: process.env.KNOWLEDGE_SOURCE_DIR ?? "data/knowledge_audio_source",
      KNOWLEDGE_AUDIO_DIR: process.env.KNOWLEDGE_AUDIO_DIR ?? "external/audiocraft/data/knowledge_audio",
    });
    child.stdout?.on("data", (chunk) => {
      const line = chunk.toString();
      job.logs.push(line);
      if (line.startsWith("PROGRESS")) {
        const parts = line.trim().split(/\s+/);
        const [, cur, total] = parts;
        job.progress = { current: Number(cur), total: Number(total) };
        job.message = `Processing ${cur}/${total}`;
      }
      if (line.startsWith("STATS")) {
        try {
            const payload = line.slice("STATS".length).trim();
            job.datasetStats = JSON.parse(payload);
        } catch {
          // ignore parse errors
        }
      }
    });
    child.stderr?.on("data", (chunk) => {
      job.logs.push("[ERR] " + chunk.toString());
    });
    child.on("exit", (code) => {
      job.state = code === 0 ? "done" : "error";
      job.message = code === 0 ? "Dataset build complete" : `Dataset build failed (exit ${code})`;
      job.endedAt = Date.now();
    });

    return res.json({ ok: true, started: true, jobId });
  } catch (error) {
    return res.status(500).json({ error: "dataset_start_failed", message: String(error) });
  }
});

router.post("/api/train/start", (req, res) => {
  try {
    const script = path.resolve(projectRoot, "external", "audiocraft", "scripts", "train_spectral_adapter.py");
    const jobId = randomUUID();
    const job: JobInfo = {
      id: jobId,
      type: "train",
      state: "running",
      message: "Training started",
      logs: [],
      startedAt: Date.now(),
      progress: undefined,
    };
    jobs.set(jobId, job);

    const child = runScript(script, {
      TRAIN_STATUS_PATH: statusPath,
      KNOWLEDGE_AUDIO_DIR: process.env.KNOWLEDGE_AUDIO_DIR ?? "external/audiocraft/data/knowledge_audio",
    });
    child.stdout?.on("data", (chunk) => {
      const line = chunk.toString();
      job.logs.push(line);
      if (line.startsWith("PROGRESS")) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const [, cur, total] = parts;
          job.progress = { current: Number(cur), total: Number(total) };
          job.message = `Step ${cur}/${total}`;
        }
      }
      if (line.toLowerCase().includes("loss")) {
        job.message = line.trim();
      }
    });
    child.stderr?.on("data", (chunk) => {
      job.logs.push("[ERR] " + chunk.toString());
    });
    child.on("exit", (code) => {
      job.state = code === 0 ? "done" : "error";
      job.message = code === 0 ? "Training complete" : `Training failed (exit ${code})`;
      job.endedAt = Date.now();
    });

    return res.json({ ok: true, started: true, jobId });
  } catch (error) {
    return res.status(500).json({ error: "train_start_failed", message: String(error) });
  }
});

router.get("/api/train/job/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) {
    return res.status(404).json({ error: "job_not_found" });
  }
  return res.json(job);
});

export const trainStatusRouter = router;
