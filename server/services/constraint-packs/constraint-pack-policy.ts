import type {
  ConstraintPack,
  ConstraintPackConstraint,
  ConstraintPackConstraintOverride,
  ConstraintPackOverride,
} from "../../../shared/schema.js";

export type ConstraintPackOverrideResolution = {
  pack: ConstraintPack;
  warnings: string[];
};

const mergeConstraintOverrides = (
  constraints: ConstraintPackConstraint[],
  overrides?: ConstraintPackConstraintOverride[],
  warnings?: string[],
  label = "constraint",
): ConstraintPackConstraint[] => {
  if (!overrides || overrides.length === 0) return constraints;
  const overrideMap = new Map(
    overrides.map((override) => [override.id, override]),
  );
  const merged = constraints.map((constraint) => {
    const override = overrideMap.get(constraint.id);
    if (!override) return constraint;
    return {
      ...constraint,
      ...override,
      id: constraint.id,
      metric: constraint.metric,
    };
  });
  if (warnings) {
    for (const override of overrides) {
      if (!constraints.some((constraint) => constraint.id === override.id)) {
        warnings.push(`unknown_${label}:${override.id}`);
      }
    }
  }
  return merged;
};

export const applyConstraintPackOverrides = (
  pack: ConstraintPack,
  overrides: ConstraintPackOverride[],
): ConstraintPackOverrideResolution => {
  if (!overrides.length) {
    return { pack, warnings: [] };
  }
  let next: ConstraintPack = {
    ...pack,
    policy: { ...pack.policy },
    certificate: { ...pack.certificate },
    constraints: pack.constraints.map((constraint) => ({ ...constraint })),
    proxies: pack.proxies?.map((constraint) => ({ ...constraint })),
  };
  const warnings: string[] = [];

  for (const override of overrides) {
    if (override.policy) {
      next.policy = { ...next.policy, ...override.policy };
    }
    if (override.certificate) {
      next.certificate = { ...next.certificate, ...override.certificate };
    }
    if (override.constraints) {
      next.constraints = mergeConstraintOverrides(
        next.constraints,
        override.constraints,
        warnings,
        "constraint",
      );
    }
    if (override.proxies) {
      if (next.proxies) {
        next.proxies = mergeConstraintOverrides(
          next.proxies,
          override.proxies,
          warnings,
          "proxy",
        );
      } else {
        warnings.push("proxy_overrides_ignored");
      }
    }
  }

  return { pack: next, warnings };
};
