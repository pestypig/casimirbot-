import { z } from "zod";

const vec3Schema = z.tuple([z.number(), z.number(), z.number()]);

export const demonstrationFrameSchema = z.object({
  ts: z.number().nonnegative(),
  pose: vec3Schema,
  joints: z.array(z.number()).min(1),
  grip: z.number().min(0).max(1).optional(),
});
export type DemonstrationFrame = z.infer<typeof demonstrationFrameSchema>;

export const demonstrationIngestSchema = z.object({
  demoId: z.string().min(1),
  traceId: z.string().optional(),
  seed: z.string().optional(),
  frames: z.array(demonstrationFrameSchema).min(2),
  limits: z
    .object({
      maxJointAbs: z.number().positive().default(Math.PI),
      maxStepNorm: z.number().positive().default(1.2),
      maxJointDelta: z.number().positive().default(0.8),
    })
    .optional(),
});
export type DemonstrationIngestInput = z.infer<typeof demonstrationIngestSchema>;

export type PrimitiveKind = "reach" | "grasp" | "transport" | "place";

export type PrimitiveSegment = {
  id: string;
  kind: PrimitiveKind;
  startTs: number;
  endTs: number;
  frameRange: [number, number];
  avgStepNorm: number;
  avgJointDelta: number;
};

export type PrimitiveDagNode = {
  id: string;
  primitiveRef: string;
  kind: PrimitiveKind;
  condition: string;
};

export type PrimitiveDagEdge = {
  from: string;
  to: string;
  condition: string;
};

export type RetargetResult = {
  demoId: string;
  traceId: string;
  replaySeed: string;
  kinematicValidity: {
    ok: boolean;
    violations: string[];
  };
  primitives: PrimitiveSegment[];
  dag: {
    nodes: PrimitiveDagNode[];
    edges: PrimitiveDagEdge[];
  };
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const norm3 = (vector: [number, number, number]): number => {
  const [x, y, z] = vector;
  return Math.sqrt(x * x + y * y + z * z);
};

const poseDeltaNorm = (a: DemonstrationFrame, b: DemonstrationFrame): number =>
  norm3([b.pose[0] - a.pose[0], b.pose[1] - a.pose[1], b.pose[2] - a.pose[2]]);

const avgAbsJointDelta = (a: DemonstrationFrame, b: DemonstrationFrame): number => {
  const count = Math.min(a.joints.length, b.joints.length);
  if (count === 0) return 0;
  let sum = 0;
  for (let i = 0; i < count; i += 1) {
    sum += Math.abs((b.joints[i] ?? 0) - (a.joints[i] ?? 0));
  }
  return sum / count;
};

const classifyPrimitiveKind = (args: {
  avgStepNorm: number;
  avgJointDelta: number;
  gripStart: number;
  gripEnd: number;
}): PrimitiveKind => {
  const gripChange = args.gripEnd - args.gripStart;
  if (gripChange > 0.2 && args.avgStepNorm < 0.25) return "grasp";
  if (gripChange < -0.2 && args.avgStepNorm < 0.25) return "place";
  if (args.avgStepNorm > 0.45 && args.avgJointDelta > 0.22) return "transport";
  return "reach";
};

const buildPrimitiveSegments = (frames: DemonstrationFrame[]): PrimitiveSegment[] => {
  const segments: PrimitiveSegment[] = [];
  let start = 0;
  for (let i = 1; i < frames.length; i += 1) {
    const gap = frames[i].ts - frames[i - 1].ts;
    if (gap > 750 && i - start >= 2) {
      const slice = frames.slice(start, i);
      segments.push(segmentFromSlice(slice, start, i - 1, segments.length + 1));
      start = i;
    }
  }
  if (frames.length - start >= 2) {
    const slice = frames.slice(start);
    segments.push(segmentFromSlice(slice, start, frames.length - 1, segments.length + 1));
  }
  if (segments.length === 0 && frames.length >= 2) {
    segments.push(segmentFromSlice(frames, 0, frames.length - 1, 1));
  }
  return segments;
};

const segmentFromSlice = (
  slice: DemonstrationFrame[],
  fromIndex: number,
  toIndex: number,
  index: number,
): PrimitiveSegment => {
  const pairs = Math.max(1, slice.length - 1);
  let stepSum = 0;
  let jointDeltaSum = 0;
  for (let i = 1; i < slice.length; i += 1) {
    stepSum += poseDeltaNorm(slice[i - 1], slice[i]);
    jointDeltaSum += avgAbsJointDelta(slice[i - 1], slice[i]);
  }
  const avgStepNorm = stepSum / pairs;
  const avgJointDelta = jointDeltaSum / pairs;
  const gripStart = clamp(slice[0].grip ?? 0, 0, 1);
  const gripEnd = clamp(slice[slice.length - 1].grip ?? 0, 0, 1);
  return {
    id: `primitive-${index}`,
    kind: classifyPrimitiveKind({ avgStepNorm, avgJointDelta, gripStart, gripEnd }),
    startTs: slice[0].ts,
    endTs: slice[slice.length - 1].ts,
    frameRange: [fromIndex, toIndex],
    avgStepNorm,
    avgJointDelta,
  };
};

const checkKinematicValidity = (
  frames: DemonstrationFrame[],
  limits: Required<NonNullable<DemonstrationIngestInput["limits"]>>,
): { ok: boolean; violations: string[] } => {
  const violations: string[] = [];
  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    if (frame.joints.some((joint) => Math.abs(joint) > limits.maxJointAbs)) {
      violations.push(`joint_abs_limit@frame_${i}`);
    }
    if (i > 0) {
      const prev = frames[i - 1];
      const step = poseDeltaNorm(prev, frame);
      if (step > limits.maxStepNorm) {
        violations.push(`step_norm_limit@frame_${i}`);
      }
      const jointDelta = avgAbsJointDelta(prev, frame);
      if (jointDelta > limits.maxJointDelta) {
        violations.push(`joint_delta_limit@frame_${i}`);
      }
    }
  }
  return {
    ok: violations.length === 0,
    violations,
  };
};

const buildDag = (segments: PrimitiveSegment[]): { nodes: PrimitiveDagNode[]; edges: PrimitiveDagEdge[] } => {
  const nodes: PrimitiveDagNode[] = segments.map((segment) => ({
    id: `node-${segment.id}`,
    primitiveRef: segment.id,
    kind: segment.kind,
    condition: segment.kind === "grasp" ? "target_aligned" : "trajectory_valid",
  }));
  const edges: PrimitiveDagEdge[] = [];
  for (let i = 1; i < nodes.length; i += 1) {
    edges.push({
      from: nodes[i - 1].id,
      to: nodes[i].id,
      condition: "previous_complete",
    });
  }
  return { nodes, edges };
};

export const retargetDemonstrationToPrimitiveDag = (
  input: DemonstrationIngestInput,
): RetargetResult => {
  const parsed = demonstrationIngestSchema.parse(input);
  const limits = {
    maxJointAbs: parsed.limits?.maxJointAbs ?? Math.PI,
    maxStepNorm: parsed.limits?.maxStepNorm ?? 1.2,
    maxJointDelta: parsed.limits?.maxJointDelta ?? 0.8,
  };

  const primitives = buildPrimitiveSegments(parsed.frames);
  const dag = buildDag(primitives);
  const kinematicValidity = checkKinematicValidity(parsed.frames, limits);
  const traceId = parsed.traceId ?? `demo:${parsed.demoId}`;
  const replaySeed = parsed.seed ?? `${parsed.demoId}:${parsed.frames.length}`;

  return {
    demoId: parsed.demoId,
    traceId,
    replaySeed,
    kinematicValidity,
    primitives,
    dag,
  };
};
