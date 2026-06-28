import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  artifactHasSatisfyingStagePlayProcessedMailPacket,
  isStagePlayLiveSourceMailReadObservationArtifact,
  latestStagePlayProcessedMailPacketRecordFromArtifacts,
  readAskTurnLiveEnvironmentObservationRecord,
  readStagePlayProcessedMailPacketRecommendedNext,
  readStagePlayProcessedMailPacketRecordsFromArtifact,
  stagePlayProcessedMailPacketAllowsDirectCheckpointSummary,
  stagePlayProcessedMailPacketHasSatisfyingContent,
  stagePlayProcessedMailPacketRequiresDecision,
} from "../services/helix-ask/live-source/mail-observation-readers";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/live-source/mail-observation-readers.ts");

describe("Helix Ask live-source mail observation reader extraction boundary", () => {
  it("keeps processed mail observation readers out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/live-source/mail-observation-readers");
    expect(routeSource).not.toMatch(/const\s+readAskTurnLiveEnvironmentObservationRecord\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+readStagePlayProcessedMailPacketRecordsFromArtifact\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+stagePlayProcessedMailPacketHasSatisfyingContent\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+artifactHasSatisfyingStagePlayProcessedMailPacket\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+latestStagePlayProcessedMailPacketRecordFromArtifacts\s*=\s*\(/);
    expect(routeSource).not.toContain("STAGE_PLAY_PROCESSED_MAIL_RECOMMENDATIONS_REQUIRING_DECISION");
    expect(serviceSource).toMatch(/export\s+const\s+readAskTurnLiveEnvironmentObservationRecord\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+readStagePlayProcessedMailPacketRecordsFromArtifact\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+stagePlayProcessedMailPacketRequiresDecision\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+artifactHasSatisfyingStagePlayProcessedMailPacket\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+latestStagePlayProcessedMailPacketRecordFromArtifacts\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves nested live-environment observation unwrapping", () => {
    expect(readAskTurnLiveEnvironmentObservationRecord({
      kind: "live_environment_tool_observation",
      payload: {
        observation: {
          observation: {
            schemaVersion: "stage_play_processed_live_source_mail_read_result/v1",
            readId: "read:1",
          },
        },
      },
    })).toEqual({
      schemaVersion: "stage_play_processed_live_source_mail_read_result/v1",
      readId: "read:1",
    });

    expect(readAskTurnLiveEnvironmentObservationRecord({
      kind: "tool_observation",
      payload: { observation: { readId: "ignored" } },
    })).toBeNull();
  });

  it("preserves processed packet extraction and mail-read artifact detection", () => {
    const artifact = {
      kind: "live_environment_tool_observation",
      payload: {
        ok: true,
        tool_name: "live_env.read_processed_live_source_mail",
        observation: {
          packets: [
            { packetId: "stage_play_processed_mail_packet:1", observedFacts: ["light changed"] },
            { packetId: "other:2", observedFacts: ["ignored"] },
          ],
        },
      },
    };

    expect(isStagePlayLiveSourceMailReadObservationArtifact(artifact)).toBe(true);
    expect(readStagePlayProcessedMailPacketRecordsFromArtifact(artifact)).toEqual([
      { packetId: "stage_play_processed_mail_packet:1", observedFacts: ["light changed"] },
    ]);

    expect(isStagePlayLiveSourceMailReadObservationArtifact({
      kind: "live_environment_tool_observation",
      payload: {
        ok: false,
        tool_name: "live_env.read_processed_live_source_mail",
        observation: {},
      },
    })).toBe(false);
  });

  it("preserves processed packet content and recommendation decisions", () => {
    const directPacket = { changedFacts: ["door opened"], recommendedNext: "record_observation" };
    const decisionPacket = { recommended_next: "request_more_evidence" };

    expect(stagePlayProcessedMailPacketHasSatisfyingContent(directPacket)).toBe(true);
    expect(readStagePlayProcessedMailPacketRecommendedNext(decisionPacket)).toBe("request_more_evidence");
    expect(stagePlayProcessedMailPacketRequiresDecision(decisionPacket)).toBe(true);
    expect(stagePlayProcessedMailPacketAllowsDirectCheckpointSummary(decisionPacket)).toBe(false);
    expect(stagePlayProcessedMailPacketAllowsDirectCheckpointSummary(directPacket)).toBe(true);
  });

  it("preserves artifact-level packet satisfaction and latest packet lookup", () => {
    const first = {
      kind: "stage_play_processed_mail_packet",
      payload: { packetId: "stage_play_processed_mail_packet:first" },
    };
    const second = {
      kind: "live_environment_tool_observation",
      payload: {
        observation: {
          packets: [
            { packetId: "stage_play_processed_mail_packet:second", inferredFacts: ["movement"] },
          ],
        },
      },
    };

    expect(artifactHasSatisfyingStagePlayProcessedMailPacket(first)).toBe(false);
    expect(artifactHasSatisfyingStagePlayProcessedMailPacket(second)).toBe(true);
    expect(latestStagePlayProcessedMailPacketRecordFromArtifacts([first, second])).toEqual({
      packetId: "stage_play_processed_mail_packet:second",
      inferredFacts: ["movement"],
    });
  });
});
