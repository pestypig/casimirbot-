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

  it("tracks dependencies for child nodes", () => {
    const nodes = ideology.nodes ?? [];
    const parentMap = new Map<string, Set<string>>();
    for (const node of nodes) {
      for (const child of node.children ?? []) {
        if (!parentMap.has(child)) parentMap.set(child, new Set());
        parentMap.get(child)?.add(node.id);
      }
      for (const link of node.links ?? []) {
        const rel = typeof link?.rel === "string" ? link.rel.toLowerCase() : "";
        const target = link?.to;
        if (!target) continue;
        if (rel === "parent") {
          if (!parentMap.has(node.id)) parentMap.set(node.id, new Set());
          parentMap.get(node.id)?.add(target);
        }
        if (rel === "child") {
          if (!parentMap.has(target)) parentMap.set(target, new Set());
          parentMap.get(target)?.add(node.id);
        }
      }
    }

    for (const node of nodes) {
      if (node.id === ideology.rootId) continue;
      const parents = parentMap.get(node.id);
      if (!parents || parents.size === 0) continue;
      const deps = Array.isArray(node.dependencies) ? node.dependencies : [];
      expect(deps.length).toBeGreaterThan(0);
      for (const parent of parents) {
        expect(deps).toContain(parent);
      }
    }
  });
});
