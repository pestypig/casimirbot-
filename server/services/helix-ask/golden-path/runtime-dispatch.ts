import { readRecord, type HelixAskGoldenPathRuntimeDecision, type RecordLike } from "./core";
import {
  createHelixAskGoldenPathRuntimeDependencies,
  type HelixAskGoldenPathRuntimeDependencies,
} from "./runtime-dependencies";
import { buildHelixAskGoldenPathRuntimeContractPayload } from "./runtime-contract-payload";
import { orderedDispatchModules } from "./runtime-modules";

export const dispatchHelixAskGoldenPathRuntime = (args: {
  body: RecordLike;
  deps?: Partial<HelixAskGoldenPathRuntimeDependencies>;
  now?: Date;
  allowContractFallback?: boolean;
}): HelixAskGoldenPathRuntimeDecision => {
  const body = readRecord(args.body) ?? {};
  const deps = createHelixAskGoldenPathRuntimeDependencies({
    ...args.deps,
    ...(args.now ? { now: () => args.now as Date } : {}),
  });

  for (const dispatchModule of orderedDispatchModules) {
    if (!dispatchModule.isRequested(body)) continue;
    return {
      handled: true,
      payload: dispatchModule.buildPayload({ body, deps }),
    };
  }

  if (!args.allowContractFallback) return { handled: false, reason: "not_requested" };

  return {
    handled: true,
    payload: buildHelixAskGoldenPathRuntimeContractPayload({ body, deps }),
  };
};
