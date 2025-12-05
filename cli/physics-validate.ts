#!/usr/bin/env -S tsx

import fs from "node:fs/promises";
import { runPhysicsValidation } from "../tools/physicsValidation";

function parseArgs(): { jsonPath?: string; rawJson?: string } {
  const args = process.argv.slice(2);
  let jsonPath: string | undefined;
  let rawJson: string | undefined;

  for (let i = 0; i < args.length; i += 1) {
    const token = args[i];
    if (token === "--json" && args[i + 1]) {
      jsonPath = args[i + 1];
      i += 1;
    } else if (token === "--params" && args[i + 1]) {
      rawJson = args[i + 1];
      i += 1;
    }
  }

  return { jsonPath, rawJson };
}

async function loadParams(jsonPath?: string, rawJson?: string) {
  if (jsonPath) {
    const src = await fs.readFile(jsonPath, "utf8");
    return JSON.parse(src);
  }
  if (rawJson) {
    return JSON.parse(rawJson);
  }
  return {};
}

function fmt(n: unknown): string {
  if (typeof n !== "number" || !Number.isFinite(n)) return String(n);
  if (Math.abs(n) >= 1e4 || Math.abs(n) < 1e-3) {
    return n.toExponential(4);
  }
  return n.toFixed(4);
}

async function main() {
  const { jsonPath, rawJson } = parseArgs();
  const params = await loadParams(jsonPath, rawJson);

  const { snapshot, citations } = await runPhysicsValidation(params);

  console.log("=== Energy Pipeline Snapshot ===");
  if (Object.keys(params).length) {
    console.log("Input params:", JSON.stringify(params, null, 2));
  } else {
    console.log("(Using pipeline defaults)");
  }
  console.log("");

  const lines: [string, string][] = [
    ["U_static (Casimir energy)", fmt(snapshot.U_static)],
    ["TS_ratio", fmt(snapshot.TS_ratio)],
    ["gamma_geo^3", fmt(snapshot.gamma_geo_cubed)],
    ["d_eff (VdB thickness)", fmt(snapshot.d_eff)],
    ["gamma_VdB", fmt(snapshot.gamma_VdB)],
    ["M_exotic", fmt(snapshot.M_exotic)],
    ["thetaCal", fmt(snapshot.thetaCal)],
    ["T00 (energy density)", fmt(snapshot.T00)],
  ];

  const labelWidth = Math.max(...lines.map(([label]) => label.length));
  for (const [label, value] of lines) {
    if (value === "undefined") continue;
    console.log(label.padEnd(labelWidth + 2), value);
  }

  console.log("\n--- Citation hints (for answers) ---");
  for (const [key, paths] of Object.entries(citations)) {
    console.log(`${key}:`);
    for (const p of paths) {
      console.log(`  - ${p}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
