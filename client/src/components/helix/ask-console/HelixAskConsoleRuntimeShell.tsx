import React, { Suspense } from "react";
import { HelixLoadingMark } from "@/components/common/HelixLoadingMark";
import type { HelixAskMinimalRuntimeShellProps } from "./HelixAskMinimalRuntimeShell";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";
import { buildHelixAskConsoleRuntimeBridgeProps } from "./HelixAskConsoleRuntimeShellProps";
import { AgentRunObserverBindingSurface } from
  "./agent-run-observer/AgentRunObserverBindingSurface";
import { HelixOperatorActivityPanel } from "./HelixOperatorActivityPanel";

const HelixAskLegacyRuntimeBridge = React.lazy(async () => {
  const module = await import("./HelixAskLegacyRuntimeBridge");
  return { default: module.HelixAskLegacyRuntimeBridge };
});

const HelixAskMinimalRuntimeShell = React.lazy(async () => {
  const module = await import("./HelixAskMinimalRuntimeShell");
  return { default: module.HelixAskMinimalRuntimeShell };
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
  const observer = (
    <>
      <AgentRunObserverBindingSurface
        className="mt-3"
        contextId={props.contextId}
      />
      <HelixOperatorActivityPanel />
    </>
  );
  if (runtimeImplementation === "minimal_runtime_shell") {
    return (
      <>
        <Suspense fallback={<HelixLoadingMark title="Loading Helix Ask" compact />}>
          <HelixAskMinimalRuntimeShell {...props} {...minimalRuntime} />
        </Suspense>
        {observer}
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<HelixLoadingMark title="Loading Helix Ask" compact />}>
        <HelixAskLegacyRuntimeBridge {...buildHelixAskConsoleRuntimeBridgeProps(props)} />
      </Suspense>
      {observer}
    </>
  );
}
