import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";

const ideology = JSON.parse(readFileSync("docs/ethos/ideology.json", "utf-8"));
const telemetryPath = "docs/ethos/ideology-telemetry-schema.json";

describe("ideology DAG evidence", () => {
  it("has doc + code evidence for every node", () => {
    const nodes = ideology.nodes ?? [];
    expect(nodes.length).toBeGreaterThan(0);
    for (const node of nodes) {
      const evidence = Array.isArray(node.evidence) ? node.evidence : [];
      const types = new Set(evidence.map((entry: any) => entry?.type));
      expect(types.has("doc")).toBe(true);
      expect(types.has("code")).toBe(true);
    }
  });

  it("includes telemetry schema evidence for every node", () => {
    const nodes = ideology.nodes ?? [];
    for (const node of nodes) {
      const evidence = Array.isArray(node.evidence) ? node.evidence : [];
      const hasTelemetry = evidence.some(
        (entry: any) => entry?.type === "telemetry" && entry?.path === telemetryPath,
      );
      expect(hasTelemetry).toBe(true);
    }
  });
});
