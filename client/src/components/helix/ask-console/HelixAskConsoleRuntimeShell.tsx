import React, { Suspense } from "react";
import { HelixLoadingMark } from "@/components/common/HelixLoadingMark";
import type { HelixAskMinimalRuntimeShellProps } from "./HelixAskMinimalRuntimeShell";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";
import { buildHelixAskConsoleRuntimeBridgeProps } from "./HelixAskConsoleRuntimeShellProps";
import { AgentRunObserverBindingSurface } from
  "./agent-run-observer/AgentRunObserverBindingSurface";
import { HelixOperatorActivityPanel } from "./HelixOperatorActivityPanel";
import { BoundAgentActiveChatPromptDisplay } from "./BoundAgentPromptDisplay";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";

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
    <div className="flex shrink-0 justify-end gap-3 py-1 text-xs">
      <Sheet>
        <SheetTrigger className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800">Activity & setup</SheetTrigger>
        <SheetContent className="overflow-y-auto border-slate-700 bg-slate-950 text-slate-100 sm:max-w-lg">
          <SheetTitle className="text-slate-100">Activity & setup</SheetTitle>
          <SheetDescription>Optional diagnostics and connection setup. Close this drawer to return to chat.</SheetDescription>
          <HelixOperatorActivityPanel />
          <details className="mt-4 rounded-lg border border-slate-700 p-3">
            <summary className="cursor-pointer text-sm">External agent setup</summary>
            <AgentRunObserverBindingSurface className="mt-3" contextId={props.contextId} />
          </details>
        </SheetContent>
      </Sheet>
    </div>
  );
  if (runtimeImplementation === "minimal_runtime_shell") {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
        <Suspense fallback={<HelixLoadingMark title="Loading Helix Ask" compact />}>
          <HelixAskMinimalRuntimeShell {...props} {...minimalRuntime} />
        </Suspense>
        </div>
        {observer}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1">
      <Suspense fallback={<HelixLoadingMark title="Loading Helix Ask" compact />}>
        <HelixAskLegacyRuntimeBridge {...buildHelixAskConsoleRuntimeBridgeProps(props)} />
      </Suspense>
      </div>
      <div className="shrink-0"><BoundAgentActiveChatPromptDisplay /></div>
      {observer}
    </div>
  );
}
