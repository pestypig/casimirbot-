import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildRepoAtlasFromSources } from "../scripts/repo-atlas-build";
import { loadAtlas, traceIdentifier, whyIdentifier } from "../scripts/repo-atlas-query";

const fixturePath = path.resolve(process.cwd(), "tests", "fixtures", "repo-atlas.fixture.json");

describe("repo atlas", () => {
  it("builds deterministic shape for fixed source payload", () => {
    const atlas = buildRepoAtlasFromSources({
      generatedAt: "2026-01-01T00:00:00.000Z",
      commitHash: "abc123",
      repoIndex: [
        {
          id: "doc:one",
          kind: "doc",
          title: "Doc One",
          summary: "",
          body: "",
          tags: ["doc"],
          source: { path: "docs/one.md" },
          tokens: [],
          embedding: null,
        },
      ],
      repoGraph: {
        builtAt: 0,
        nodes: [{ id: "docs/one.md", kind: "file", name: "one.md", path: "docs/one.md" }],
        edges: [],
      },
      codeLattice: {
        version: "code-lattice/0.1.0",
        generatedAt: "2026-01-01T00:00:00.000Z",
        repoRoot: ".",
        commit: "abc123",
        filesIndexed: 1,
        nodes: [],
        edges: [],
        envelopes: [],
        latticeVersion: 1,
      },
    });

    expect(atlas.version).toBe("repo-atlas/1");
    expect(atlas.snapshot.commitHash).toBe("abc123");
    expect(atlas.nodes.map((node) => node.id)).toEqual(["file:docs/one.md", "index:doc:one"]);
  });

  it("why returns producer and consumer paths when present", async () => {
    const atlas = await loadAtlas(fixturePath);
    const result = whyIdentifier(atlas, "symbol:consumer");
    expect(result).not.toBeNull();
    expect(result?.producers).toContainEqual(["symbol:consumer", "gate:test-a"]);
    expect(result?.consumers).toContainEqual(["symbol:consumer", "symbol:producer"]);
  });

  it("trace traversal is stable for fixture", async () => {
    const atlas = await loadAtlas(fixturePath);
    const result = traceIdentifier(atlas, "producer", "upstream");
    expect(result).not.toBeNull();
    expect(result?.paths).toEqual([
      ["symbol:producer", "symbol:consumer"],
      ["symbol:producer", "symbol:consumer", "gate:test-a"],
    ]);
  });
});
