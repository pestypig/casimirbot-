import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  retargetDemonstrationToPrimitiveDag,
  demonstrationIngestSchema,
} from "./demonstration-retargeting.js";

const benchmarkThresholdSchema = z.object({
  maxStepNormDelta: z.number().positive(),
  maxJointDelta: z.number().positive(),
});

const benchmarkFixtureSchema = z.object({
  demo: demonstrationIngestSchema,
  thresholds: benchmarkThresholdSchema,
});

export type RoboticsBenchmarkReport = {
  benchmarkId: string;
  traceId: string;
  replaySeed: string;
  reproducible: boolean;
  firstFail: null | {
    id: string;
    severity: "HARD";
    status: "fail";
    value: number;
    limit: string;
    note: string;
  };
  deltas: Array<{ key: string; value: number; limit: number }>;
  primitivePath: string[];
};

export const loadPickPlaceFixture = (): z.infer<typeof benchmarkFixtureSchema> => {
  const fixturePath = path.resolve(process.cwd(), "tests/fixtures/robotics-pick-place.fixture.json");
  const raw = JSON.parse(readFileSync(fixturePath, "utf8"));
  return benchmarkFixtureSchema.parse(raw);
};

export const runPickPlaceBenchmark = (
  fixtureInput?: z.infer<typeof benchmarkFixtureSchema>,
): RoboticsBenchmarkReport => {
  const fixture = fixtureInput ?? loadPickPlaceFixture();

  const runA = retargetDemonstrationToPrimitiveDag(fixture.demo);
  const runB = retargetDemonstrationToPrimitiveDag(fixture.demo);

  const primitivePathA = runA.primitives.map((primitive) => primitive.id);
  const primitivePathB = runB.primitives.map((primitive) => primitive.id);
  const reproducible = JSON.stringify(primitivePathA) === JSON.stringify(primitivePathB);

  const maxStepNorm = runA.primitives.reduce(
    (max, primitive) => Math.max(max, primitive.avgStepNorm),
    0,
  );
  const maxJointDelta = runA.primitives.reduce(
    (max, primitive) => Math.max(max, primitive.avgJointDelta),
    0,
  );

  const deltas = [
    {
      key: "benchmark.max_step_norm",
      value: maxStepNorm,
      limit: fixture.thresholds.maxStepNormDelta,
    },
    {
      key: "benchmark.max_joint_delta",
      value: maxJointDelta,
      limit: fixture.thresholds.maxJointDelta,
    },
  ];

  const firstFailEntry = deltas.find((entry) => entry.value > entry.limit);
  const firstFail = firstFailEntry
    ? {
        id: firstFailEntry.key,
        severity: "HARD" as const,
        status: "fail" as const,
        value: firstFailEntry.value,
        limit: `<= ${firstFailEntry.limit}`,
        note: "benchmark-threshold-exceeded",
      }
    : null;

  return {
    benchmarkId: "observe-human-pick-and-place-constrained-reenactment",
    traceId: runA.traceId,
    replaySeed: runA.replaySeed,
    reproducible,
    firstFail,
    deltas,
    primitivePath: primitivePathA,
  };
};
