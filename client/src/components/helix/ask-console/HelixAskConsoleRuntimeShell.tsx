import React, { Suspense } from "react";
import { HelixLoadingMark } from "@/components/common/HelixLoadingMark";
import {
  HelixAskMinimalRuntimeShell,
  type HelixAskMinimalRuntimeShellProps,
} from "./HelixAskMinimalRuntimeShell";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";
import { buildHelixAskConsoleRuntimeBridgeProps } from "./HelixAskConsoleRuntimeShellProps";

const HelixAskLegacyRuntimeBridge = React.lazy(async () => {
  const module = await import("./HelixAskLegacyRuntimeBridge");
  return { default: module.HelixAskLegacyRuntimeBridge };
});

export type HelixAskConsoleRuntimeImplementation = "legacy_bridge" | "minimal_runtime_shell";

export type HelixAskConsoleRuntimeShellProps = HelixAskConsoleProps & {
  runtimeImplementation?: HelixAskConsoleRuntimeImplementation;
  minimalRuntime?: Pick<
    HelixAskMinimalRuntimeShellProps,
    "controlActions" | "onSubmitPlan" | "runTurn" | "visibleSurface"
  >;
};

export function HelixAskConsoleRuntimeShell({
  runtimeImplementation = "legacy_bridge",
  minimalRuntime,
  ...props
}: HelixAskConsoleRuntimeShellProps) {
  if (runtimeImplementation === "minimal_runtime_shell") {
    return <HelixAskMinimalRuntimeShell {...props} {...minimalRuntime} />;
  }

  return (
    <Suspense fallback={<HelixLoadingMark title="Loading Helix Ask" compact />}>
      <HelixAskLegacyRuntimeBridge {...buildHelixAskConsoleRuntimeBridgeProps(props)} />
    </Suspense>
  );
}
