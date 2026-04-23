import { describe, expect, it } from "vitest";
import type { DocManifestEntry } from "@/lib/docs/docManifest";
import { findRandomPaperForTopic, parsePaperReadCommand } from "@/lib/docs/paperReadCommand";

function makeEntry(id: string, title: string, relativePath: string): DocManifestEntry {
  return {
    id,
    route: `/${relativePath}`,
    relativePath,
    folderChain: ["docs"],
    folderLabel: "docs",
    title,
    searchText: `${title} ${relativePath}`.toLowerCase(),
    loader: async () => "",
  };
}

describe("parsePaperReadCommand", () => {
  it("parses natural language paper read prompts", () => {
    const parsed = parsePaperReadCommand("Find a paper about NHM2 and open it and read it to me.");
    expect(parsed).toEqual({ topic: "NHM2" });
  });

  it("parses polite conversational phrasing used in ask pill", () => {
    const parsed = parsePaperReadCommand(
      "can you read a paper about NHM2 and open it and read it to me.",
    );
    expect(parsed).toEqual({ topic: "NHM2" });
  });

  it("parses read-aloud doc phrasing", () => {
    const parsed = parsePaperReadCommand("Ok can you read aloud a doc about the sun?");
    expect(parsed).toEqual({ topic: "sun" });
  });

  it("parses direct doc read phrasing", () => {
    const parsed = parsePaperReadCommand("ok read me a doc about the sun");
    expect(parsed).toEqual({ topic: "sun" });
  });

  it("parses spoken filler + punctuation breaks from voice transcripts", () => {
    const parsed = parsePaperReadCommand("uh open up a panel. about the sun, and read it");
    expect(parsed).toEqual({ topic: "sun" });
  });

  it("parses stuttered spoken prompt variants", () => {
    const parsed = parsePaperReadCommand(
      "can you, um, read read me a doc about about needle hull and, like, read it out loud",
    );
    expect(parsed).toEqual({ topic: "needle hull" });
  });

  it("returns null when the request is not a read-aloud paper command", () => {
    expect(parsePaperReadCommand("Open docs about NHM2")).toBeNull();
  });
});

describe("findRandomPaperForTopic", () => {
  const entries: DocManifestEntry[] = [
    makeEntry("a", "Warp Nhm2 Mission Time Estimator", "docs/warp-nhm2-mission-time-estimator.md"),
    makeEntry("b", "Warp Nhm2 Cruise Envelope", "docs/warp-nhm2-cruise-envelope.md"),
    makeEntry("c", "Helix Ask Flow", "docs/helix-ask-flow.md"),
  ];

  it("prefers entries that match the topic tokens", () => {
    const picked = findRandomPaperForTopic("NHM2 mission", {
      entries,
      random: () => 0,
    });
    expect(picked?.id).toBe("a");
  });

  it("can randomize among top matches", () => {
    const picked = findRandomPaperForTopic("nhm2", {
      entries,
      random: () => 0.99,
    });
    expect(["a", "b"]).toContain(picked?.id);
  });
});
