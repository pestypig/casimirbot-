import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  cleanupAskTurnOpenDocSearchTopic,
  createAskTurnLatestDocIntentReaders,
  extractAskTurnDocPathArgs,
  isAskTurnTopicQualifiedLatestDocIntent,
  normalizeAskTurnLatestDocTopicText,
  resolveAskTurnCreateThenOpenDocTopicArg,
  resolveAskTurnLatestDocTopicArg,
} from "../services/helix-ask/doc-args";

const repoRoot = process.cwd();
const routePath = join(repoRoot, "server/routes/agi.plan.ts");
const servicePath = join(repoRoot, "server/services/helix-ask/doc-args.ts");

describe("Helix Ask doc args extraction boundary", () => {
  it("keeps doc path argument extraction out of agi.plan.ts", () => {
    const routeSource = readFileSync(routePath, "utf8");
    const serviceSource = readFileSync(servicePath, "utf8");

    expect(routeSource).toContain("../services/helix-ask/doc-args");
    expect(routeSource).not.toMatch(/const\s+extractAskTurnDocPathArgs\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+normalizeAskTurnLatestDocTopicText\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnLatestDocTopicArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnTopicQualifiedLatestDocIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+cleanupAskTurnOpenDocSearchTopic\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnCreateThenOpenDocTopicArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnOpenLatestDocIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnStrictLatestDocAcquisitionIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnRecentDocAcquisitionQueryArg\s*=/);
    expect(routeSource).toContain("createAskTurnLatestDocIntentReaders({");
    expect(serviceSource).toMatch(/export\s+const\s+extractAskTurnDocPathArgs\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+normalizeAskTurnLatestDocTopicText\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnLatestDocTopicArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnTopicQualifiedLatestDocIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+cleanupAskTurnOpenDocSearchTopic\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnCreateThenOpenDocTopicArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+createAskTurnLatestDocIntentReaders\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves doc path extraction behavior", () => {
    expect(
      extractAskTurnDocPathArgs("Read docs/research/nhm2-current-status-whitepaper-2026-05-02.md, then ./notes/a.txt and docs/research/nhm2-current-status-whitepaper-2026-05-02.md"),
    ).toEqual(["docs/research/nhm2-current-status-whitepaper-2026-05-02.md", "./notes/a.txt"]);
    expect(extractAskTurnDocPathArgs("no explicit path here")).toEqual([]);
  });

  it("preserves latest-doc topic and acquisition prompt readers", () => {
    const readers = createAskTurnLatestDocIntentReaders({
      isStructuredDocsViewerPrompt: (prompt) => /\bDocument\s+path\s*:/i.test(prompt),
    });

    expect(normalizeAskTurnLatestDocTopicText("latest NH-M2 white paper and tell me")).toBe("NHM2 whitepaper");
    expect(resolveAskTurnLatestDocTopicArg("open the latest doc about NHM2 white paper")).toBe("NHM2 NHM2 whitepaper");
    expect(resolveAskTurnLatestDocTopicArg("latest NHM2 status doc")).toBe("NHM2 status");
    expect(isAskTurnTopicQualifiedLatestDocIntent("open the latest doc about NHM2")).toBe(true);
    expect(cleanupAskTurnOpenDocSearchTopic("the recent document that talks about NHM2 white paper, then tell me")).toBe(
      "NHM2 whitepaper",
    );
    expect(readers.isAskTurnOpenLatestDocIntent("open the latest doc about NHM2")).toBe(true);
    expect(readers.isAskTurnOpenLatestDocIntent("Document path: docs/a.md\nLocate query: NHM2")).toBe(false);
    expect(readers.isAskTurnStrictLatestDocAcquisitionIntent("open latest NHM2 doc")).toBe(true);
    expect(readers.isAskTurnStrictLatestDocAcquisitionIntent("open the latest doc about NHM2")).toBe(false);
    expect(readers.resolveAskTurnRecentDocAcquisitionQueryArg("find me the recent document that talks about Casimir tiles")).toBe(
      "Casimir tiles",
    );
    expect(resolveAskTurnCreateThenOpenDocTopicArg("create note called Field Notes, then open latest doc about NHM2")).toBe(
      "NHM2",
    );
  });
});
