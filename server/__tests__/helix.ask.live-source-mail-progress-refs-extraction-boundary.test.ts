import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  collectMailLoopProgressRefs,
  isMailLoopProgressRef,
} from "../services/helix-ask/live-source/mail-progress-refs";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/live-source/mail-progress-refs.ts");

describe("Helix Ask live-source mail progress refs extraction boundary", () => {
  it("keeps mail-loop progress ref collection out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/live-source/mail-progress-refs");
    expect(routeSource).not.toContain("STAGE_PLAY_MAIL_LOOP_PROGRESS_REF_RE");
    expect(routeSource).not.toMatch(/const\s+isMailLoopProgressRef\s*=\s*\(/);
    expect(routeSource).not.toMatch(/const\s+collectMailLoopProgressRefs\s*=\s*\(/);
    expect(serviceSource).toMatch(/export\s+const\s+isMailLoopProgressRef\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+collectMailLoopProgressRefs\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../../../routes/agi.plan");
    expect(serviceSource).not.toContain("../../routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves accepted progress ref prefixes", () => {
    expect(isMailLoopProgressRef("stage_play_processed_mail_packet:abc")).toBe(true);
    expect(isMailLoopProgressRef("stage_play_live_source_mail_decision:abc")).toBe(true);
    expect(isMailLoopProgressRef("stage_play_live_source_narrative_state:abc")).toBe(true);
    expect(isMailLoopProgressRef("stage_play_live_source_mail_wake_result:abc")).toBe(true);
    expect(isMailLoopProgressRef("stage_play_live_source_voice_delivery_receipt:abc")).toBe(true);
    expect(isMailLoopProgressRef("helix_interim_voice_callout_receipt:abc")).toBe(true);
    expect(isMailLoopProgressRef("dottie_voice_receipt:abc")).toBe(true);
    expect(isMailLoopProgressRef("voice_receipt:abc")).toBe(true);
    expect(isMailLoopProgressRef("stage_play_live_source_mail:abc")).toBe(false);
  });

  it("preserves recursive progress ref collection and dedupe order", () => {
    const nested: Record<string, unknown> = {
      packetId: "stage_play_processed_mail_packet:1",
      text: "see stage_play_live_source_mail_decision:2 and stage_play_processed_mail_packet:1",
      child: {
        receipt_id: "voice_receipt:3",
      },
    };
    nested.self = nested;

    expect(collectMailLoopProgressRefs(nested)).toEqual([
      "stage_play_processed_mail_packet:1",
      "stage_play_live_source_mail_decision:2",
      "voice_receipt:3",
    ]);
  });

  it("preserves recursive fallback discovery for direct record refs", () => {
    expect(collectMailLoopProgressRefs({
      packetId: "",
      packet_id: "stage_play_processed_mail_packet:snake",
    })).toEqual(["stage_play_processed_mail_packet:snake"]);

    expect(collectMailLoopProgressRefs({
      packetId: null,
      packet_id: "stage_play_processed_mail_packet:snake",
    })).toEqual(["stage_play_processed_mail_packet:snake"]);
  });
});
