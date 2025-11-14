import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { EssenceProposal } from "@shared/proposals";
import { upsertProposal, getProposalById } from "../server/db/proposals";
import { resetDbClient } from "../server/db/client";
import { handleApproveProposal } from "../server/services/proposals/engine";
import {
  startProposalJobRunner,
  __waitForProposalJobRunner,
  __resetProposalJobRunnerForTest,
} from "../server/services/proposals/job-runner";

const NOW = new Date().toISOString();

const buildProposal = (id: string): EssenceProposal => ({
  id,
  kind: "panel",
  status: "new",
  source: "essence:proposal",
  title: "Promote Fuel Gauge panel",
  summary: "Surface the FuelGauge component inside Helix Desktop",
  explanation: "Provides drive telemetry parity with console layout review.",
  target: { type: "panel-seed", componentPath: "client/src/components/FuelGauge.tsx" },
  patchKind: "ui-config",
  patch: JSON.stringify({ panelId: "fuel-gauge", width: 480 }),
  rewardTokens: 250,
  ownerId: "persona:demo",
  safetyStatus: "unknown",
  safetyReport: null,
  jobId: null,
  evalRunId: null,
  metadata: { panelId: "fuel-gauge", dataSources: ["client/src/store/useFuelGauge.ts"] },
  createdAt: NOW,
  updatedAt: NOW,
  createdForDay: NOW.slice(0, 10),
});

describe("proposal job runner", () => {
  beforeEach(async () => {
    process.env.ENABLE_PROPOSAL_JOB_RUNNER = "1";
    __resetProposalJobRunnerForTest();
    await resetDbClient();
  });

  afterEach(async () => {
    await __waitForProposalJobRunner();
    __resetProposalJobRunnerForTest();
    await resetDbClient();
  });

  it("moves approved proposals to applied once the runner completes", async () => {
    const seeded = buildProposal("proposal-runner-basic");
    await upsertProposal(seeded);

    startProposalJobRunner();

    const stored = await getProposalById(seeded.id);
    expect(stored).not.toBeNull();

    await handleApproveProposal(stored!, "persona:demo");

    await __waitForProposalJobRunner();
    const applied = await getProposalById(seeded.id);
    expect(applied?.status).toBe("applied");
    expect(applied?.safetyStatus).toBe("passed");
    expect(applied?.safetyScore).toBe(1);
  });
});
