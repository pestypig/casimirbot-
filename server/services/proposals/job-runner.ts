import type { Job } from "@shared/jobs";
import type { EssenceProposal } from "@shared/proposals";
import { onJobCreated } from "../jobs/engine";
import { handleProposalJobEvaluated, handleProposalJobProgress } from "./engine";
import { getProposalByJobId, listProposalsByStatus } from "../../db/proposals";

const jobQueue: string[] = [];
const queuedJobs = new Set<string>();
const idleWaiters = new Set<() => void>();

let draining = false;
let started = false;
let unsubscribe: (() => void) | null = null;
let shutdownRequested = false;

const PROGRESS_PLAN: Array<{ progress: number; phase: string }> = [
  { progress: 0.15, phase: "queueing" },
  { progress: 0.4, phase: "analysis" },
  { progress: 0.7, phase: "applying" },
  { progress: 0.95, phase: "running-evals" },
];

const MIN_DELAY_MS = 30;
const MAX_DELAY_MS = 90;

export function startProposalJobRunner(): void {
  if (started || process.env.ENABLE_PROPOSAL_JOB_RUNNER === "0") {
    return;
  }
  started = true;
  shutdownRequested = false;

  unsubscribe = onJobCreated((job: Job) => {
    if (job.source !== "essence:proposal") {
      return;
    }
    enqueueJob(job.id);
  });

  void enqueueExistingProposalJobs();
}

function enqueueJob(jobId?: string | null): void {
  if (!jobId || queuedJobs.has(jobId) || shutdownRequested) {
    return;
  }
  queuedJobs.add(jobId);
  jobQueue.push(jobId);
  scheduleDrain();
}

function scheduleDrain(): void {
  if (draining || shutdownRequested) {
    return;
  }
  const run = () => {
    void drainQueue();
  };
  if (typeof setImmediate === "function") {
    setImmediate(run);
  } else {
    setTimeout(run, 0);
  }
}

async function drainQueue(): Promise<void> {
  if (draining || shutdownRequested) {
    notifyIdle();
    return;
  }
  draining = true;
  try {
    while (!shutdownRequested && jobQueue.length) {
      const jobId = jobQueue.shift();
      if (!jobId) {
        continue;
      }
      queuedJobs.delete(jobId);
      try {
        await runProposalJob(jobId);
      } catch (err) {
        console.error(`[proposal-job-runner] job ${jobId} failed`, err);
      }
    }
  } finally {
    draining = false;
    if (!shutdownRequested && jobQueue.length) {
      scheduleDrain();
      return;
    }
    notifyIdle();
  }
}

async function runProposalJob(jobId: string): Promise<void> {
  const summary = await buildCompletionSummary(jobId);
  for (const step of PROGRESS_PLAN) {
    if (shutdownRequested) {
      return;
    }
    await handleProposalJobProgress(jobId, step.progress, step.phase);
    await delay(nextDelayMs());
  }
  if (shutdownRequested) {
    return;
  }
  await handleProposalJobEvaluated(jobId, { ok: true, safetyScore: 1, summary });
}

async function buildCompletionSummary(jobId: string): Promise<string> {
  try {
    const proposal = await getProposalByJobId(jobId);
    if (!proposal) {
      return `Simulated proposal job ${jobId}`;
    }
    return `Applied ${proposal.kind} patch "${proposal.title}" ${describeTarget(proposal)}`;
  } catch (err) {
    console.error(`[proposal-job-runner] summary lookup failed for ${jobId}`, err);
    return `Simulated proposal job ${jobId}`;
  }
}

function describeTarget(proposal: EssenceProposal): string {
  const target = proposal.target;
  switch (target.type) {
    case "panel":
      return `to panel ${target.panelId}`;
    case "panel-seed":
      return `to ${target.componentPath}`;
    case "backend-file":
      return `touching ${target.path}`;
    case "backend-multi":
      return `across ${target.paths.slice(0, 3).join(", ")}`;
    default:
      return "in environment";
  }
}

async function enqueueExistingProposalJobs(): Promise<void> {
  try {
    const backlog = await listProposalsByStatus(["building"], 200);
    for (const proposal of backlog) {
      enqueueJob(proposal.jobId);
    }
  } catch (err) {
    console.error("[proposal-job-runner] failed to scan backlog", err);
  }
}

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const nextDelayMs = (): number => MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));

function notifyIdle(): void {
  if (draining || jobQueue.length) {
    return;
  }
  idleWaiters.forEach((resolve) => resolve());
  idleWaiters.clear();
}

export function __waitForProposalJobRunner(): Promise<void> {
  if (!draining && jobQueue.length === 0) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    idleWaiters.add(resolve);
  });
}

export function __resetProposalJobRunnerForTest(): void {
  shutdownRequested = true;
  jobQueue.length = 0;
  queuedJobs.clear();
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
  started = false;
  notifyIdle();
}
