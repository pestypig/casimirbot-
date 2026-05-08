import path from "node:path";
import {
  NHM2_EQUATION_VISUALIZER_OUTPUTS_ARTIFACT_ID,
  NHM2_EQUATION_VISUALIZER_SCHEMA_VERSION,
  type Nhm2EquationVisualizerManifest,
} from "../shared/contracts/nhm2-equation-visualizer.v1.js";
import { ensureDir, writeJson } from "./figures/figure-manifest.js";
import {
  DEFAULT_EQUATION_MAP_PATH,
  DEFAULT_VISUALIZER_PRESETS_PATH,
  equationMapRef,
  loadEquationMap,
  loadVisualizerPresets,
} from "./equations/load-equation-map.js";
import { resolveEquationNode } from "./equations/equation-node-resolver.js";
import { sampleEquationNode } from "./equations/equation-sampler.js";
import {
  manifestOutputFromResult,
  writeEquationVisualizerArtifact,
  writeEquationVisualizerManifest,
} from "./equations/equation-artifact-writer.js";

const DATE_STAMP = new Date().toISOString().slice(0, 10);
const DEFAULT_OUT = path.join("artifacts", "research", "full-solve", "rendered", "equation-visualizer", DATE_STAMP);

interface CliArgs {
  map: string;
  presets: string;
  out: string;
  runId: string;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  ensureDir(args.out);
  const map = loadEquationMap(args.map);
  const presetFile = loadVisualizerPresets(args.presets);
  const outputs = [];

  for (const preset of presetFile.presets) {
    const resolved = resolveEquationNode(map, preset);
    const sample = sampleEquationNode(resolved);
    const result = await writeEquationVisualizerArtifact(args.out, resolved, sample);
    outputs.push(manifestOutputFromResult(result, preset));
  }

  const manifest: Nhm2EquationVisualizerManifest = {
    artifactId: NHM2_EQUATION_VISUALIZER_OUTPUTS_ARTIFACT_ID,
    schemaVersion: NHM2_EQUATION_VISUALIZER_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    runId: args.runId,
    equationMap: equationMapRef(args.map),
    outputs,
  };
  writeEquationVisualizerManifest(args.out, manifest);
  writeJson(path.join(args.out, "render-summary.json"), {
    ok: true,
    runId: args.runId,
    outputs: outputs.map((output) => output.id),
  });
  console.log(JSON.stringify({ ok: true, out: args.out, outputs: outputs.length, manifest: path.join(args.out, "manifest.json") }, null, 2));
}

function parseArgs(argv: string[]): CliArgs {
  const get = (name: string, fallback: string) => {
    const i = argv.indexOf(`--${name}`);
    return i >= 0 ? argv[i + 1] : fallback;
  };
  const runId = get("run-id", `nhm2-equation-visualizer-${DATE_STAMP}`);
  return {
    map: get("map", DEFAULT_EQUATION_MAP_PATH),
    presets: get("presets", DEFAULT_VISUALIZER_PRESETS_PATH),
    out: get("out", DEFAULT_OUT),
    runId,
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
