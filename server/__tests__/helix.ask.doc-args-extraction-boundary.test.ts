import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  cleanupAskTurnOpenDocSearchTopic,
  createAskTurnLatestDocIntentReaders,
  extractAskTurnDocPathArgs,
  isAskTurnDocsPanelOpenIntent,
  isAskTurnTopicQualifiedLatestDocIntent,
  normalizeAskTurnLatestDocTopicText,
  resolveAskTurnCreateThenOpenDocTopicArg,
  resolveAskTurnDocPathArg,
  resolveAskTurnLatestDocTopicArg,
  resolveAskTurnTitleLikeOpenDocQueryArg,
  resolveAskTurnTopicDocQueryArg,
  tokenizeAskTurnDocTopic,
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
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnDocPathArg\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+normalizeAskTurnLatestDocTopicText\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnLatestDocTopicArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnTopicQualifiedLatestDocIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+cleanupAskTurnOpenDocSearchTopic\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnCreateThenOpenDocTopicArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnOpenLatestDocIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnStrictLatestDocAcquisitionIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnRecentDocAcquisitionQueryArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+tokenizeAskTurnDocTopic\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnTopicDocQueryArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocsPanelOpenIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnTitleLikeOpenDocQueryArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnOpenResultDocQueryArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+resolveAskTurnOpenDocSearchQueryArg\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnTopicDocAcquisitionIntent\s*=/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnOpenDocSearchIntent\s*=/);
    expect(routeSource).toContain("createAskTurnLatestDocIntentReaders({");
    expect(serviceSource).toMatch(/export\s+const\s+extractAskTurnDocPathArgs\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnDocPathArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+tokenizeAskTurnDocTopic\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+normalizeAskTurnLatestDocTopicText\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnLatestDocTopicArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnTopicQualifiedLatestDocIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+cleanupAskTurnOpenDocSearchTopic\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnCreateThenOpenDocTopicArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnTopicDocQueryArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnDocsPanelOpenIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnTitleLikeOpenDocQueryArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+resolveAskTurnOpenResultDocQueryArg\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+createAskTurnLatestDocIntentReaders\s*=/);
    expect(serviceSource).not.toContain("server/routes/agi.plan");
    expect(serviceSource).not.toContain("../routes/agi.plan");
  });

  it("preserves doc path extraction behavior", () => {
    expect(
      extractAskTurnDocPathArgs("Read docs/research/nhm2-current-status-whitepaper-2026-05-02.md, then ./notes/a.txt and docs/research/nhm2-current-status-whitepaper-2026-05-02.md"),
    ).toEqual(["docs/research/nhm2-current-status-whitepaper-2026-05-02.md", "./notes/a.txt"]);
    expect(extractAskTurnDocPathArgs("no explicit path here")).toEqual([]);
    expect(resolveAskTurnDocPathArg("Read docs/research/nhm2-current-status-whitepaper-2026-05-02.md, then ./notes/a.txt")).toBe(
      "docs/research/nhm2-current-status-whitepaper-2026-05-02.md",
    );
    expect(resolveAskTurnDocPathArg("Open the NHM2 deeper reformulation decision memo")).toBe(
      "/docs/research/nhm2-deeper-reformulation-decision-memo-2026-04-02.md",
    );
    expect(resolveAskTurnDocPathArg("no explicit path here")).toBeNull();
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

  it("preserves open-doc search query readers", () => {
    const readers = createAskTurnLatestDocIntentReaders({
      isStructuredDocsViewerPrompt: (prompt) => /\bDocument\s+path\s*:/i.test(prompt),
    });

    expect(tokenizeAskTurnDocTopic("Latest NHM2 white paper report")).toEqual(["nhm2", "white", "report"]);
    expect(isAskTurnDocsPanelOpenIntent("open the docs viewer")).toBe(true);
    expect(isAskTurnDocsPanelOpenIntent("open the docs about NHM2")).toBe(false);
    expect(resolveAskTurnTopicDocQueryArg("open the doc about Casimir tile load bearing")).toBe("Casimir tile load bearing");
    expect(resolveAskTurnTitleLikeOpenDocQueryArg("open the NHM2 deeper reformulation decision memo")).toBe(
      "NHM2 deeper reformulation decision memo",
    );
    expect(readers.resolveAskTurnOpenDocSearchQueryArg("show the latest result about Casimir tile load bearing")).toBe(
      "Casimir tile load bearing",
    );
    expect(readers.resolveAskTurnOpenDocSearchQueryArg("NHM2 deeper reformulation decision memo")).toBe(
      "NHM2 deeper reformulation decision memo",
    );
    expect(readers.isAskTurnTopicDocAcquisitionIntent("find a doc about Casimir tiles")).toBe(true);
    expect(readers.isAskTurnOpenDocSearchIntent("open the docs viewer")).toBe(false);
  });
});
