import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { buildRepoAtlasFromSources, isDirectExecution as isBuildDirectExecution } from "../scripts/repo-atlas-build";
import {
  isDirectExecution as isQueryDirectExecution,
  loadAtlas,
  resolveIdentifier,
  traceIdentifier,
  whyIdentifier,
} from "../scripts/repo-atlas-query";

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
    expect(atlas.snapshot.repoGraphBuiltAt).toBe(0);
    expect(atlas.snapshot.treeDagWalkLoaded).toBe(false);
    expect(atlas.nodes.map((node) => node.id)).toEqual([
      "file:docs/one.md",
      "index:doc:one",
      "gate:G4_QI_margin",
      "value:boundComputed_Jm3",
      "value:boundUsed_Jm3",
      "value:lhs_Jm3",
      "value:marginRatioRaw",
      "value:rhoSource",
    ]);
    expect(atlas.edges.map((edge) => `${edge.source}->${edge.target}`)).toEqual([
      "value:boundComputed_Jm3->value:boundUsed_Jm3",
      "value:boundUsed_Jm3->value:marginRatioRaw",
      "value:lhs_Jm3->value:boundComputed_Jm3",
      "value:marginRatioRaw->gate:G4_QI_margin",
      "value:rhoSource->value:lhs_Jm3",
      "index:doc:one->file:docs/one.md",
    ]);
  });

  it("extracts stage hints and ingests tree DAG walk edges", () => {
    const atlas = buildRepoAtlasFromSources({
      generatedAt: "2026-01-01T00:00:00.000Z",
      commitHash: "abc123",
      repoIndex: [
        {
          id: "artifact:sample",
          kind: "artifact",
          title: "Sample",
          summary: "Tracks lhs_Jm3 from rhoSource for reporting",
          body: "",
          tags: [],
          source: { path: "artifacts/sample.json" },
          tokens: [],
          embedding: null,
        },
      ],
      repoGraph: {
        builtAt: 123,
        nodes: [],
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
      treeDagWalk: {
        visited: [
          {
            id: "lhs_Jm3",
            depth: 1,
            via: {
              source: "rhoSource",
              target: "lhs_Jm3",
              edgeType: "derives",
              note: "QI sample stage",
            },
          },
        ],
      },
    });

    expect(atlas.snapshot.treeDagWalkLoaded).toBe(true);
    expect(atlas.nodes.find((node) => node.id === "index:artifact:sample")?.stageHints).toEqual([
      "S0_source",
      "S1_qi_sample",
    ]);
    expect(atlas.nodes.find((node) => node.id === "tree:rhoSource")?.stageHints).toEqual(["S0_source", "S1_qi_sample"]);
    expect(atlas.nodes.find((node) => node.id === "tree:lhs_Jm3")?.stageHints).toEqual(["S0_source", "S1_qi_sample"]);
    expect(atlas.edges.some((edge) => edge.source === "tree:rhoSource" && edge.target === "tree:lhs_Jm3")).toBe(true);
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

  it("prefers exact identifier matches over substring matches", () => {
    const node = resolveIdentifier(
      {
        version: "repo-atlas/1",
        snapshot: {
          generatedAt: "2026-01-01T00:00:00.000Z",
          commitHash: "abc123",
        },
        nodes: [
          { id: "graph:scripts/warp.ts::isMetricRhoSource", kind: "symbol", label: "isMetricRhoSource" },
          { id: "value:rhoSource", kind: "value", label: "rhoSource" },
        ],
        edges: [],
      },
      "rhoSource",
    );

    expect(node?.id).toBe("value:rhoSource");
  });

  it("direct execution guard handles Windows-style argv paths", () => {
    const buildPath = path.resolve(process.cwd(), "scripts", "repo-atlas-build.ts");
    const queryPath = path.resolve(process.cwd(), "scripts", "repo-atlas-query.ts");
    const buildUrl = pathToFileURL(buildPath).href;
    const queryUrl = pathToFileURL(queryPath).href;

    expect(isBuildDirectExecution(buildUrl, buildPath)).toBe(true);
    expect(isQueryDirectExecution(queryUrl, queryPath)).toBe(true);
    expect(isBuildDirectExecution(buildUrl, queryPath)).toBe(false);
    expect(isQueryDirectExecution(queryUrl, buildPath)).toBe(false);
  });
});
