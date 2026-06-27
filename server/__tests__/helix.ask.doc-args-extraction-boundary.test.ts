import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  cleanupAskTurnOpenDocSearchTopic,
  createAskTurnDocSummaryIntentReaders,
  createAskTurnLatestDocIntentReaders,
  extractAskTurnDocPathArgs,
  isAskTurnActiveDocConceptExplanationIntent,
  isAskTurnActiveDocLocationPrompt,
  isAskTurnActiveDocNumericExtractionIntent,
  isAskTurnActiveDocUsefulnessIntent,
  isAskTurnDocOpenBestIntent,
  isAskTurnDocSummaryDetailRequested,
  isAskTurnReadAloudRequested,
  isAskTurnDocsPanelOpenIntent,
  isAskTurnExplicitDocLocationPrompt,
  isAskTurnExplicitDocumentAcquisitionIntent,
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
    expect(routeSource).not.toMatch(/const\s+isAskTurnReadAloudRequested\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnExplicitDocumentAcquisitionIntent\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocOpenBestIntent\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnExplicitDocLocationPrompt\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnActiveDocLocationPrompt\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocSummaryDetailRequested\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnActiveDocUsefulnessIntent\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnActiveDocConceptExplanationIntent\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnActiveDocNumericExtractionIntent\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnCompoundDocAnswerIntent\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocAboutSummaryPrompt\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocsSummaryRequest\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocsViewerCapabilityTopicLabelPrompt\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocsOpenAndSummarizeIntent\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+isAskTurnDocsTopicSummaryPrompt\s*=\s*\(transcript/);
    expect(routeSource).not.toMatch(/const\s+shouldAskTurnSearchDocsBeforeSummary\s*=\s*\(transcript/);
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
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnReadAloudRequested\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnExplicitDocumentAcquisitionIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnDocOpenBestIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnExplicitDocLocationPrompt\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnActiveDocLocationPrompt\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnDocSummaryDetailRequested\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnActiveDocUsefulnessIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnActiveDocConceptExplanationIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+isAskTurnActiveDocNumericExtractionIntent\s*=/);
    expect(serviceSource).toMatch(/export\s+const\s+createAskTurnDocSummaryIntentReaders\s*=/);
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
    expect(isAskTurnReadAloudRequested("Read this document aloud.")).toBe(true);
    expect(isAskTurnReadAloudRequested("Narrate it to me.")).toBe(true);
    expect(isAskTurnReadAloudRequested("Summarize this document silently.")).toBe(false);
    expect(isAskTurnExplicitDocumentAcquisitionIntent("Open the NHM2 white paper in the docs viewer.")).toBe(true);
    expect(isAskTurnExplicitDocumentAcquisitionIntent("Open the docs viewer.")).toBe(false);
    expect(isAskTurnDocOpenBestIntent("Find and open the best matching NHM2 document.")).toBe(true);
    expect(isAskTurnDocOpenBestIntent("Summarize the current document.")).toBe(false);
    expect(isAskTurnExplicitDocLocationPrompt("Where in docs/research/nhm2-current-status-whitepaper-2026-05-02.md does it discuss tile force?")).toBe(true);
    expect(isAskTurnExplicitDocLocationPrompt("Summarize docs/research/nhm2-current-status-whitepaper-2026-05-02.md")).toBe(false);
    expect(isAskTurnActiveDocLocationPrompt("Where in this document does it mention Casimir tiles?")).toBe(true);
    expect(isAskTurnActiveDocLocationPrompt("Summarize this document in 3 bullets.")).toBe(false);
    expect(isAskTurnDocSummaryDetailRequested("Summarize this document with citations and exact claims.")).toBe(true);
    expect(isAskTurnActiveDocUsefulnessIntent("What is this document useful for?")).toBe(true);
    expect(isAskTurnActiveDocConceptExplanationIntent("Explain what Casimir tiles means in this document.")).toBe(true);
    expect(isAskTurnActiveDocNumericExtractionIntent("Find the key numeric value in this document.")).toBe(true);
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

  it("preserves doc summary prompt readers", () => {
    const latestReaders = createAskTurnLatestDocIntentReaders({
      isStructuredDocsViewerPrompt: (prompt) => /\bDocument\s+path\s*:/i.test(prompt),
    });
    const summaryReaders = createAskTurnDocSummaryIntentReaders({
      isAskTurnNoWorkspaceBackgroundScope: (prompt) => /\bbackground\s+only\b/i.test(prompt),
      resolveAskTurnOpenDocSearchQueryArg: latestReaders.resolveAskTurnOpenDocSearchQueryArg,
    });

    expect(summaryReaders.isAskTurnCompoundDocAnswerIntent("open the doc about Casimir tiles and summarize it")).toBe(true);
    expect(summaryReaders.isAskTurnDocAboutSummaryPrompt("What is this document about?")).toBe(true);
    expect(summaryReaders.isAskTurnDocsViewerCapabilityTopicLabelPrompt("Docs viewer: dynamic actions coverage")).toBe(true);
    expect(summaryReaders.isAskTurnDocsSummaryRequest("Summarize this document")).toBe(true);
    expect(summaryReaders.isAskTurnDocsSummaryRequest("Summarize this document background only")).toBe(false);
    expect(summaryReaders.isAskTurnDocsOpenAndSummarizeIntent("find and open the best NHM2 whitepaper and summarize it")).toBe(true);
    expect(summaryReaders.isAskTurnDocsTopicSummaryPrompt("summarize the NHM2 whitepaper docs")).toBe(true);
    expect(summaryReaders.shouldAskTurnSearchDocsBeforeSummary("summarize the NHM2 whitepaper docs")).toBe(true);
    expect(summaryReaders.shouldAskTurnSearchDocsBeforeSummary("summarize this document")).toBe(false);
  });
});
