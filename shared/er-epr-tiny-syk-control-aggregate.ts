export type TinySykControlAggregate = {
  controlLeakageMax: number;
  leakageCount: number;
  missingRequiredControls: string[];
  passed: boolean;
};

export function aggregateTinySykControls(args: {
  scores: Record<string, number | undefined>;
  requiredControls: string[];
  leakageThreshold: number;
}): TinySykControlAggregate {
  const missingRequiredControls = args.requiredControls.filter((control) => args.scores[control] === undefined);
  const values = Object.values(args.scores).filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const controlLeakageMax = Math.max(0, ...values);
  const leakageCount = values.filter((value) => value > args.leakageThreshold).length;
  return {
    controlLeakageMax,
    leakageCount,
    missingRequiredControls,
    passed: missingRequiredControls.length === 0 && leakageCount === 0,
  };
}
